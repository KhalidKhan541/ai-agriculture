import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult, buildSearchFilter } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const equipmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  farmId: z.string().optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "REPAIR_NEEDED", "OUT_OF_SERVICE", "RETIRED"]).optional(),
  category: z.string().optional(),
});

const createEquipmentSchema = z.object({
  farmId: z.string().min(1),
  name: z.string().min(2).max(100),
  type: z.string().min(2).max(50),
  category: z.enum(["tractor", "harvester", "planter", "irrigation", "sprayer", "tillage", "transport", "storage", "processing", "drone", "sensor", "other"]),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().positive().optional(),
  currentValue: z.coerce.number().min(0).optional(),
  fuelType: z.enum(["diesel", "gasoline", "electric", "hybrid", "propane", "natural_gas"]).optional(),
  enginePower: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  workingWidth: z.coerce.number().positive().optional(),
  fuelCapacity: z.coerce.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().max(5000).optional(),
  warrantyExpiry: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateEquipmentSchema = createEquipmentSchema.partial().omit({ farmId: true }).extend({
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "REPAIR_NEEDED", "OUT_OF_SERVICE", "RETIRED"]).optional(),
  hoursUsed: z.coerce.number().min(0).optional(),
  lastInspection: z.coerce.date().optional(),
  nextInspection: z.coerce.date().optional(),
  assignedOperator: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "summary") {
      const where: Record<string, unknown> = {};
      if (searchParams.get("farmId")) where.farmId = searchParams.get("farmId");

      const [total, byStatus, byCategory] = await Promise.all([
        prisma.equipment.count({ where }),
        prisma.equipment.groupBy({ by: ["status"], where, _count: true }),
        prisma.equipment.groupBy({ by: ["category"], where, _count: true, _sum: { currentValue: true } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          total,
          byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
          byCategory: byCategory.map((item) => ({
            category: item.category,
            count: item._count,
            totalValue: item._sum.currentValue ?? 0,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "maintenance-due") {
      const daysAhead = parseInt(searchParams.get("daysAhead") ?? "30");
      const cutoffDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      const where: Record<string, unknown> = { nextInspection: { lte: cutoffDate, gte: new Date() } };
      if (searchParams.get("farmId")) where.farmId = searchParams.get("farmId");

      const dueEquipment = await prisma.equipment.findMany({
        where,
        orderBy: { nextInspection: "asc" },
        include: { farm: { select: { id: true, name: true } } },
      });

      return NextResponse.json({
        success: true,
        data: dueEquipment.map((eq) => ({
          ...eq,
          daysUntilDue: Math.ceil(((eq.nextInspection?.getTime() ?? 0) - Date.now()) / 86400000),
        })),
        count: dueEquipment.length,
        timestamp: new Date().toISOString(),
      });
    }

    const query = equipmentQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      orderBy: searchParams.get("orderBy"),
      order: searchParams.get("order"),
      search: searchParams.get("search"),
      farmId: searchParams.get("farmId"),
      status: searchParams.get("status"),
      category: searchParams.get("category"),
    });

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: query.page, limit: query.limit, orderBy: query.orderBy, order: query.order,
    });

    const where: Record<string, unknown> = {};
    if (query.farmId) where.farmId = query.farmId;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    const searchFilter = buildSearchFilter(query.search, ["name", "type", "brand", "model", "serialNumber"]);
    if (searchFilter) Object.assign(where, searchFilter);

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({ where, orderBy, skip, take, include: { farm: { select: { id: true, name: true } } } }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json({ success: true, ...createPaginatedResult(equipment, total, page, limit), timestamp: new Date().toISOString() });
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
    const validated = createEquipmentSchema.parse(body);

    const farm = await prisma.farm.findUnique({ where: { id: validated.farmId } });
    if (!farm) throw new AppError("Farm not found", { code: "NOT_FOUND", statusCode: 404 });

    const equipment = await prisma.equipment.create({
      data: {
        farmId: validated.farmId,
        name: validated.name,
        type: validated.type,
        category: validated.category,
        brand: validated.brand ?? null,
        model: validated.model ?? null,
        serialNumber: validated.serialNumber ?? null,
        year: validated.year ?? null,
        purchaseDate: validated.purchaseDate ?? null,
        purchasePrice: validated.purchasePrice ?? null,
        currentValue: validated.currentValue ?? null,
        fuelType: validated.fuelType ?? null,
        enginePower: validated.enginePower ?? null,
        weight: validated.weight ?? null,
        workingWidth: validated.workingWidth ?? null,
        fuelCapacity: validated.fuelCapacity ?? null,
        imageUrl: validated.imageUrl ?? null,
        description: validated.description ?? null,
        warrantyExpiry: validated.warrantyExpiry ?? null,
        status: "AVAILABLE",
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
      include: { farm: { select: { id: true, name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id, action: "create", resource: "equipment",
        resourceId: equipment.id, metadata: JSON.stringify({ name: validated.name, category: validated.category }),
      },
    });

    return NextResponse.json({ success: true, data: equipment, message: "Equipment created", timestamp: new Date().toISOString() }, { status: 201 });
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
    if (!id) throw new AppError("Equipment ID is required", { code: "VALIDATION_ERROR", statusCode: 400 });

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) throw new AppError("Equipment not found", { code: "NOT_FOUND", statusCode: 404 });

    const validated = updateEquipmentSchema.parse(updates);
    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.status && { status: validated.status }),
        ...(validated.hoursUsed !== undefined && { hoursUsed: validated.hoursUsed }),
        ...(validated.lastInspection && { lastInspection: validated.lastInspection }),
        ...(validated.nextInspection && { nextInspection: validated.nextInspection }),
        ...(validated.assignedOperator !== undefined && { assignedOperator: validated.assignedOperator }),
        ...(validated.currentValue !== undefined && { currentValue: validated.currentValue }),
      },
      include: { farm: { select: { id: true, name: true } } },
    });

    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "update", resource: "equipment", resourceId: id, metadata: JSON.stringify({ changes: Object.keys(validated) }) },
    });

    return NextResponse.json({ success: true, data: updated, message: "Equipment updated", timestamp: new Date().toISOString() });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    if (!["SUPER_ADMIN", "PLATFORM_ADMIN", "FARM_OWNER"].includes(session.user.role)) {
      throw new AppError("Insufficient permissions", { code: "FORBIDDEN", statusCode: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new AppError("Equipment ID is required", { code: "VALIDATION_ERROR", statusCode: 400 });

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) throw new AppError("Equipment not found", { code: "NOT_FOUND", statusCode: 404 });

    await prisma.equipment.update({ where: { id }, data: { status: "RETIRED" } });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "delete", resource: "equipment", resourceId: id, metadata: JSON.stringify({ name: existing.name }) },
    });

    return NextResponse.json({ success: true, message: "Equipment retired", timestamp: new Date().toISOString() });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
