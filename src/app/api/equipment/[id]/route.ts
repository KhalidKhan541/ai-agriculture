import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const updateEquipmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "REPAIR_NEEDED", "OUT_OF_SERVICE", "RETIRED"]).optional(),
  hoursUsed: z.coerce.number().min(0).optional(),
  currentValue: z.coerce.number().min(0).optional(),
  lastInspection: z.coerce.date().optional(),
  nextInspection: z.coerce.date().optional(),
  assignedOperator: z.string().optional(),
  description: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const logHoursSchema = z.object({
  hours: z.coerce.number().positive(),
  fieldId: z.string().optional(),
  operation: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") ?? [];

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true, status: true } },
        ...(include.includes("maintenance") && {
          maintenanceRecords: {
            orderBy: { performedAt: "desc" },
            take: 20,
          },
        }),
        ...(include.includes("orders") && {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, status: true, createdAt: true, totalCost: true },
          },
        }),
      },
    });

    if (!equipment) throw new AppError("Equipment not found", { code: "NOT_FOUND", statusCode: 404 });

    const maintenanceCount = await prisma.maintenanceRecord.count({
      where: { equipmentId: id },
    });

    const upcomingMaintenance = await prisma.maintenanceRecord.findMany({
      where: { equipmentId: id, nextServiceAt: { gte: new Date() } },
      orderBy: { nextServiceAt: "asc" },
      take: 5,
    });

    const totalMaintenanceCost = await prisma.maintenanceRecord.aggregate({
      where: { equipmentId: id },
      _sum: { cost: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...equipment,
        maintenanceSummary: {
          totalRecords: maintenanceCount,
          totalCost: totalMaintenanceCost._sum.cost ?? 0,
          upcomingMaintenance,
        },
      },
      timestamp: new Date().toISOString(),
    });
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "log-hours") {
      const validated = logHoursSchema.parse(body);
      const existing = await prisma.equipment.findUnique({ where: { id } });
      if (!existing) throw new AppError("Equipment not found", { code: "NOT_FOUND", statusCode: 404 });

      const updated = await prisma.equipment.update({
        where: { id },
        data: { hoursUsed: { increment: validated.hours }, status: "IN_USE" },
        include: { farm: { select: { id: true, name: true } } },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id, action: "log_hours", resource: "equipment", resourceId: id,
          metadata: JSON.stringify({ hours: validated.hours, operation: validated.operation }),
        },
      });

      return NextResponse.json({ success: true, data: updated, message: "Hours logged", timestamp: new Date().toISOString() });
    }

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) throw new AppError("Equipment not found", { code: "NOT_FOUND", statusCode: 404 });

    const validated = updateEquipmentSchema.parse(body);
    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.status) updateData.status = validated.status;
    if (validated.hoursUsed !== undefined) updateData.hoursUsed = validated.hoursUsed;
    if (validated.currentValue !== undefined) updateData.currentValue = validated.currentValue;
    if (validated.lastInspection) updateData.lastInspection = validated.lastInspection;
    if (validated.nextInspection) updateData.nextInspection = validated.nextInspection;
    if (validated.assignedOperator !== undefined) updateData.assignedOperator = validated.assignedOperator;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.metadata) updateData.metadata = JSON.stringify(validated.metadata);

    const updated = await prisma.equipment.update({
      where: { id }, data: updateData,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    if (!["SUPER_ADMIN", "PLATFORM_ADMIN", "FARM_OWNER"].includes(session.user.role)) {
      throw new AppError("Insufficient permissions", { code: "FORBIDDEN", statusCode: 403 });
    }

    const { id } = params;
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
