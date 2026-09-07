import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["scheduled", "unscheduled", "inspection"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const createMaintenanceSchema = z.object({
  type: z.enum(["scheduled", "unscheduled", "inspection"]),
  description: z.string().min(1).max(5000),
  cost: z.coerce.number().min(0).optional(),
  performedBy: z.string().max(200).optional(),
  performedAt: z.coerce.date().default(new Date()),
  nextServiceAt: z.coerce.date().optional(),
  hoursAtService: z.coerce.number().min(0).optional(),
  partsReplaced: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateMaintenanceSchema = createMaintenanceSchema.partial();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { id } = params;
    const { searchParams } = new URL(request.url);

    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new AppError("Equipment not found", { code: "NOT_FOUND", statusCode: 404 });

    const query = maintenanceQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      type: searchParams.get("type"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
    });

    const { skip, take, page, limit } = getPaginationParams({ page: query.page, limit: query.limit });

    const where: Record<string, unknown> = { equipmentId: id };
    if (query.type) where.type = query.type;
    if (query.dateFrom || query.dateTo) {
      where.performedAt = {};
      if (query.dateFrom) (where.performedAt as Record<string, Date>).gte = query.dateFrom;
      if (query.dateTo) (where.performedAt as Record<string, Date>).lte = query.dateTo;
    }

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({ where, orderBy: { performedAt: "desc" }, skip, take }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    const costSummary = await prisma.maintenanceRecord.aggregate({
      where: { equipmentId: id },
      _sum: { cost: true },
      _count: true,
      _avg: { cost: true },
    });

    return NextResponse.json({
      success: true,
      ...createPaginatedResult(records, total, page, limit),
      summary: {
        totalRecords: costSummary._count,
        totalCost: costSummary._sum.cost ?? 0,
        averageCost: costSummary._avg.cost ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { id } = params;
    const body = await request.json();
    const validated = createMaintenanceSchema.parse(body);

    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new AppError("Equipment not found", { code: "NOT_FOUND", statusCode: 404 });

    const record = await prisma.maintenanceRecord.create({
      data: {
        equipmentId: id,
        type: validated.type,
        description: validated.description,
        cost: validated.cost ?? null,
        performedBy: validated.performedBy ?? null,
        performedAt: validated.performedAt,
        nextServiceAt: validated.nextServiceAt ?? null,
        hoursAtService: validated.hoursAtService ?? null,
        partsReplaced: validated.partsReplaced ?? null,
        notes: validated.notes ?? null,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
    });

    await prisma.equipment.update({
      where: { id },
      data: {
        lastInspection: validated.performedAt,
        ...(validated.nextServiceAt && { nextInspection: validated.nextServiceAt }),
        status: validated.type === "inspection" ? equipment.status : "MAINTENANCE",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id, action: "create", resource: "maintenance_record", resourceId: record.id,
        metadata: JSON.stringify({ equipmentId: id, type: validated.type, cost: validated.cost }),
      },
    });

    return NextResponse.json(
      { success: true, data: record, message: "Maintenance record created", timestamp: new Date().toISOString() },
      { status: 201 }
    );
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { id } = params;
    const body = await request.json();
    const { recordId, ...updates } = body;

    if (!recordId) throw new AppError("recordId is required", { code: "VALIDATION_ERROR", statusCode: 400 });

    const existing = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } });
    if (!existing) throw new AppError("Maintenance record not found", { code: "NOT_FOUND", statusCode: 404 });

    const validated = updateMaintenanceSchema.parse(updates);
    const updated = await prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        ...(validated.description && { description: validated.description }),
        ...(validated.cost !== undefined && { cost: validated.cost }),
        ...(validated.performedBy !== undefined && { performedBy: validated.performedBy }),
        ...(validated.nextServiceAt && { nextServiceAt: validated.nextServiceAt }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
    });

    return NextResponse.json({ success: true, data: updated, message: "Record updated", timestamp: new Date().toISOString() });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");
    if (!recordId) throw new AppError("recordId is required", { code: "VALIDATION_ERROR", statusCode: 400 });

    const existing = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } });
    if (!existing) throw new AppError("Record not found", { code: "NOT_FOUND", statusCode: 404 });

    await prisma.maintenanceRecord.delete({ where: { id: recordId } });

    return NextResponse.json({ success: true, message: "Record deleted", timestamp: new Date().toISOString() });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
