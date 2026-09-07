import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult, buildSearchFilter } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const droneQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  farmId: z.string().optional(),
  status: z.enum(["available", "in_flight", "charging", "maintenance", "offline"]).optional(),
});

const createDroneSchema = z.object({
  farmId: z.string().min(1),
  name: z.string().min(2).max(100),
  model: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  maxFlightTimeMinutes: z.coerce.number().int().positive().optional(),
  maxRangeKm: z.coerce.number().positive().optional(),
  sensors: z.array(z.string()).optional(),
  registrationNumber: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createFlightSchema = z.object({
  droneId: z.string().min(1),
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  pilotName: z.string().max(100).optional(),
  plannedStartTime: z.coerce.date(),
  altitude: z.coerce.number().min(10).max(500).default(50),
  speed: z.coerce.number().min(5).max(30).default(15),
  pattern: z.enum(["grid", "crosshatch", "circular", "perimeter", "custom"]).default("grid"),
  scanType: z.enum(["full_field", "zone_scan", "targeted", "corridor"]).default("full_field"),
  imageMode: z.enum(["rgb", "multispectral", "thermal", "ndvi", "all"]).default("rgb"),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateFlightSchema = z.object({
  status: z.enum(["active", "paused", "completed", "aborted", "failed"]).optional(),
  endTime: z.coerce.date().optional(),
  actualDistanceKm: z.coerce.number().min(0).optional(),
  actualDurationMin: z.coerce.number().int().min(0).optional(),
  imagesCaptured: z.coerce.number().int().min(0).optional(),
  areaCoveredHa: z.coerce.number().min(0).optional(),
  batteryUsed: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "flights") {
      const farmId = searchParams.get("farmId");
      const status = searchParams.get("status");
      const limit = parseInt(searchParams.get("limit") ?? "20");

      const where: Record<string, unknown> = {};
      if (farmId) where.farmId = farmId;
      if (status) where.status = status;

      const flights = await prisma.droneFlight.findMany({
        where,
        orderBy: { startTime: "desc" },
        take: limit,
        include: {
          drone: { select: { id: true, name: true, model: true } },
          farm: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ success: true, data: flights, count: flights.length, timestamp: new Date().toISOString() });
    }

    if (action === "summary") {
      const farmId = searchParams.get("farmId");
      const where: Record<string, unknown> = {};
      if (farmId) where.farmId = farmId;

      const [totalDrones, activeFlights, totalFlights] = await Promise.all([
        prisma.drone.count({ where }),
        prisma.droneFlight.count({ where: { ...where, status: "active" } }),
        prisma.droneFlight.count({ where: { farmId: farmId ?? undefined } }),
      ]);

      const flightStats = await prisma.droneFlight.aggregate({
        where: { farmId: farmId ?? undefined, status: "completed" },
        _sum: { actualDistanceKm: true, areaCoveredHa: true },
        _count: true,
      });

      return NextResponse.json({
        success: true,
        data: {
          totalDrones, activeFlights, totalFlights,
          totalDistance: flightStats._sum.actualDistanceKm ?? 0,
          totalAreaCovered: flightStats._sum.areaCoveredHa ?? 0,
          completedFlights: flightStats._count,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const query = droneQuerySchema.parse({
      page: searchParams.get("page"), limit: searchParams.get("limit"),
      orderBy: searchParams.get("orderBy"), order: searchParams.get("order"),
      search: searchParams.get("search"), farmId: searchParams.get("farmId"),
      status: searchParams.get("status"),
    });

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: query.page, limit: query.limit, orderBy: query.orderBy, order: query.order,
    });

    const where: Record<string, unknown> = {};
    if (query.farmId) where.farmId = query.farmId;
    if (query.status) where.status = query.status;

    const searchFilter = buildSearchFilter(query.search, ["name", "model", "serialNumber"]);
    if (searchFilter) Object.assign(where, searchFilter);

    const [drones, total] = await Promise.all([
      prisma.drone.findMany({ where, orderBy, skip, take, include: { farm: { select: { id: true, name: true } } } }),
      prisma.drone.count({ where }),
    ]);

    return NextResponse.json({ success: true, ...createPaginatedResult(drones, total, page, limit), timestamp: new Date().toISOString() });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "flight") {
      const validated = createFlightSchema.parse(body);
      const drone = await prisma.drone.findUnique({ where: { id: validated.droneId } });
      if (!drone) throw new AppError("Drone not found", { code: "NOT_FOUND", statusCode: 404 });
      if (drone.status === "in_flight") throw new AppError("Drone is already in flight", { code: "INVALID_STATE", statusCode: 409 });

      const flight = await prisma.droneFlight.create({
        data: {
          droneId: validated.droneId,
          farmId: validated.farmId,
          fieldId: validated.fieldId ?? null,
          pilotName: validated.pilotName ?? null,
          startTime: validated.plannedStartTime,
          altitude: validated.altitude,
          speed: validated.speed,
          pattern: validated.pattern,
          scanType: validated.scanType,
          imageMode: validated.imageMode,
          status: "planned",
          notes: validated.notes ?? null,
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
          createdById: session.user.id,
        },
        include: { drone: { select: { id: true, name: true } }, farm: { select: { id: true, name: true } } },
      });

      await prisma.drone.update({ where: { id: validated.droneId }, data: { status: "in_flight" } });

      return NextResponse.json({ success: true, data: flight, message: "Flight created", timestamp: new Date().toISOString() }, { status: 201 });
    }

    const validated = createDroneSchema.parse(body);
    const drone = await prisma.drone.create({
      data: {
        farmId: validated.farmId,
        name: validated.name,
        model: validated.model ?? null,
        manufacturer: validated.manufacturer ?? null,
        serialNumber: validated.serialNumber ?? null,
        maxFlightTimeMinutes: validated.maxFlightTimeMinutes ?? null,
        maxRangeKm: validated.maxRangeKm ?? null,
        sensors: validated.sensors ? JSON.stringify(validated.sensors) : null,
        registrationNumber: validated.registrationNumber ?? null,
        status: "available",
        batteryLevel: 100,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
      include: { farm: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: drone, message: "Drone registered", timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "update-flight") {
      const { flightId, ...updates } = body;
      if (!flightId) throw new AppError("flightId required", { code: "VALIDATION_ERROR", statusCode: 400 });

      const validated = updateFlightSchema.parse(updates);
      const flight = await prisma.droneFlight.findUnique({ where: { id: flightId } });
      if (!flight) throw new AppError("Flight not found", { code: "NOT_FOUND", statusCode: 404 });

      const updateData: Record<string, unknown> = {};
      if (validated.status) updateData.status = validated.status;
      if (validated.endTime) updateData.endTime = validated.endTime;
      if (validated.actualDistanceKm !== undefined) updateData.actualDistanceKm = validated.actualDistanceKm;
      if (validated.actualDurationMin !== undefined) updateData.actualDurationMin = validated.actualDurationMin;
      if (validated.imagesCaptured !== undefined) updateData.imagesCaptured = validated.imagesCaptured;
      if (validated.areaCoveredHa !== undefined) updateData.areaCoveredHa = validated.areaCoveredHa;
      if (validated.batteryUsed !== undefined) updateData.batteryUsed = validated.batteryUsed;
      if (validated.notes !== undefined) updateData.notes = validated.notes;

      if (validated.status === "completed" || validated.status === "aborted" || validated.status === "failed") {
        updateData.endTime = validated.endTime ?? new Date();
        await prisma.drone.update({ where: { id: flight.droneId }, data: { status: "available", batteryLevel: validated.batteryUsed ? 100 - validated.batteryUsed : undefined } });
      }

      const updated = await prisma.droneFlight.update({ where: { id: flightId }, data: updateData, include: { drone: { select: { id: true, name: true } } } });

      return NextResponse.json({ success: true, data: updated, message: "Flight updated", timestamp: new Date().toISOString() });
    }

    const { id, ...updates } = body;
    if (!id) throw new AppError("Drone ID required", { code: "VALIDATION_ERROR", statusCode: 400 });

    const existing = await prisma.drone.findUnique({ where: { id } });
    if (!existing) throw new AppError("Drone not found", { code: "NOT_FOUND", statusCode: 404 });

    const updated = await prisma.drone.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.status && { status: updates.status }),
        ...(updates.batteryLevel !== undefined && { batteryLevel: updates.batteryLevel }),
      },
      include: { farm: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: updated, message: "Drone updated", timestamp: new Date().toISOString() });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
