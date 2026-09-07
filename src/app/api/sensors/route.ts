import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult, buildSearchFilter } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const sensorQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  farmId: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["active", "inactive", "low_battery", "error", "maintenance", "offline"]).optional(),
});

const createSensorSchema = z.object({
  farmId: z.string().min(1),
  name: z.string().min(2).max(100),
  type: z.enum(["temperature", "humidity", "soil_moisture", "soil_ph", "light", "rain", "wind", "co2", "solar_radiation"]),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  zoneId: z.string().optional(),
  fieldId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createReadingSchema = z.object({
  sensorId: z.string().min(1),
  value: z.coerce.number(),
  unit: z.string().min(1).max(20),
  timestamp: z.coerce.date().default(new Date()),
  quality: z.enum(["good", "uncertain", "bad"]).default("good"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  anomaly: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

const readingsQuerySchema = z.object({
  sensorId: z.string().optional(),
  farmId: z.string().optional(),
  fieldId: z.string().optional(),
  type: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  anomaly: z.coerce.boolean().optional(),
  aggregation: z.enum(["raw", "minute", "hourly", "daily"]).default("raw"),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "readings") {
      const query = readingsQuerySchema.parse({
        sensorId: searchParams.get("sensorId"), farmId: searchParams.get("farmId"),
        fieldId: searchParams.get("fieldId"), type: searchParams.get("type"),
        startDate: searchParams.get("startDate"), endDate: searchParams.get("endDate"),
        anomaly: searchParams.get("anomaly"), aggregation: searchParams.get("aggregation"),
        limit: searchParams.get("limit"),
      });

      const where: Record<string, unknown> = {};
      if (query.sensorId) where.sensorId = query.sensorId;
      if (query.farmId) where.farmId = query.farmId;
      if (query.fieldId) where.fieldId = query.fieldId;
      if (query.type) where.sensorType = query.type;
      if (query.anomaly !== undefined) where.anomaly = query.anomaly;
      if (query.startDate || query.endDate) {
        where.timestamp = {};
        if (query.startDate) (where.timestamp as Record<string, Date>).gte = query.startDate;
        if (query.endDate) (where.timestamp as Record<string, Date>).lte = query.endDate;
      }

      const readings = await prisma.sensorReading.findMany({
        where, orderBy: { timestamp: "desc" }, take: query.limit,
        include: { sensor: { select: { id: true, name: true, type: true } } },
      });

      return NextResponse.json({ success: true, data: readings, count: readings.length, timestamp: new Date().toISOString() });
    }

    if (action === "alerts") {
      const farmId = searchParams.get("farmId");
      const where: Record<string, unknown> = { anomaly: true };
      if (farmId) where.farmId = farmId;

      const anomalies = await prisma.sensorReading.findMany({
        where, orderBy: { timestamp: "desc" }, take: 50,
        include: { sensor: { select: { id: true, name: true, type: true } } },
      });

      return NextResponse.json({ success: true, data: anomalies, count: anomalies.length, timestamp: new Date().toISOString() });
    }

    if (action === "summary") {
      const farmId = searchParams.get("farmId");
      const where: Record<string, unknown> = {};
      if (farmId) where.farmId = farmId;

      const [total, byType, byStatus] = await Promise.all([
        prisma.sensor.count({ where }),
        prisma.sensor.groupBy({ by: ["type"], where, _count: true }),
        prisma.sensor.groupBy({ by: ["status"], where, _count: true }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          total,
          byType: byType.map((t) => ({ type: t.type, count: t._count })),
          byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const query = sensorQuerySchema.parse({
      page: searchParams.get("page"), limit: searchParams.get("limit"),
      orderBy: searchParams.get("orderBy"), order: searchParams.get("order"),
      search: searchParams.get("search"), farmId: searchParams.get("farmId"),
      type: searchParams.get("type"), status: searchParams.get("status"),
    });

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: query.page, limit: query.limit, orderBy: query.orderBy, order: query.order,
    });

    const where: Record<string, unknown> = {};
    if (query.farmId) where.farmId = query.farmId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const searchFilter = buildSearchFilter(query.search, ["name", "model", "serialNumber"]);
    if (searchFilter) Object.assign(where, searchFilter);

    const [sensors, total] = await Promise.all([
      prisma.sensor.findMany({ where, orderBy, skip, take, include: { farm: { select: { id: true, name: true } } } }),
      prisma.sensor.count({ where }),
    ]);

    return NextResponse.json({ success: true, ...createPaginatedResult(sensors, total, page, limit), timestamp: new Date().toISOString() });
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

    if (action === "reading") {
      const validated = createReadingSchema.parse(body);
      const sensor = await prisma.sensor.findUnique({ where: { id: validated.sensorId } });
      if (!sensor) throw new AppError("Sensor not found", { code: "NOT_FOUND", statusCode: 404 });

      const reading = await prisma.sensorReading.create({
        data: {
          sensorId: validated.sensorId,
          farmId: sensor.farmId,
          fieldId: sensor.fieldId ?? null,
          sensorType: sensor.type,
          value: validated.value,
          unit: validated.unit,
          timestamp: validated.timestamp,
          quality: validated.quality,
          latitude: validated.latitude ?? sensor.latitude ?? null,
          longitude: validated.longitude ?? sensor.longitude ?? null,
          anomaly: validated.anomaly,
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        },
      });

      await prisma.sensor.update({ where: { id: validated.sensorId }, data: { lastDataReceived: new Date(), totalDataPoints: { increment: 1 } } });

      return NextResponse.json({ success: true, data: reading, message: "Reading recorded", timestamp: new Date().toISOString() }, { status: 201 });
    }

    const validated = createSensorSchema.parse(body);
    const farm = await prisma.farm.findUnique({ where: { id: validated.farmId } });
    if (!farm) throw new AppError("Farm not found", { code: "NOT_FOUND", statusCode: 404 });

    const sensor = await prisma.sensor.create({
      data: {
        farmId: validated.farmId,
        name: validated.name,
        type: validated.type,
        model: validated.model ?? null,
        serialNumber: validated.serialNumber ?? null,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        zoneId: validated.zoneId ?? null,
        fieldId: validated.fieldId ?? null,
        status: "active",
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
      include: { farm: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: sensor, message: "Sensor registered", timestamp: new Date().toISOString() }, { status: 201 });
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
    const { id, ...updates } = body;
    if (!id) throw new AppError("Sensor ID required", { code: "VALIDATION_ERROR", statusCode: 400 });

    const existing = await prisma.sensor.findUnique({ where: { id } });
    if (!existing) throw new AppError("Sensor not found", { code: "NOT_FOUND", statusCode: 404 });

    const updated = await prisma.sensor.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.status && { status: updates.status }),
        ...(updates.latitude !== undefined && { latitude: updates.latitude }),
        ...(updates.longitude !== undefined && { longitude: updates.longitude }),
      },
      include: { farm: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: updated, message: "Sensor updated", timestamp: new Date().toISOString() });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
