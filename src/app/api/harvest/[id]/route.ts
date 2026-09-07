import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { createHarvestRecordSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

const updateHarvestSchema = z.object({
  endDate: z.coerce.date().optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const recordFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("harvestedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  cropId: z.string().optional(),
  fieldId: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════
// HELPER: Load harvest or throw
// ═══════════════════════════════════════════════════════════════

async function getHarvestOrThrow(harvestId: string) {
  const harvest = await prisma.harvest.findUnique({
    where: { id: harvestId },
    include: {
      farm: { select: { id: true, name: true } },
      records: {
        include: {
          crop: { select: { id: true, name: true } },
          field: { select: { id: true, name: true } },
          produce: true,
        },
        orderBy: { harvestedAt: "desc" },
      },
      _count: { select: { records: true } },
    },
  });

  if (!harvest) {
    throw new NotFoundError("Harvest", harvestId);
  }

  return harvest;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/harvest/[id]
// ═══════════════════════════════════════════════════════════════
// Returns a full harvest season with all its records, linked
// crops/fields, and produce details. Computes summary stats
// (total yield, labor cost, quality distribution).
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "GET /api/harvest/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const harvest = await getHarvestOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(session.user.id, harvest.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this harvest", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Compute summary stats ────────────────────────────────
    const recordStats = await prisma.harvestRecord.aggregate({
      where: { harvestId: params.id },
      _sum: {
        yieldKg: true,
        laborHours: true,
        laborCost: true,
      },
      _avg: {
        moistureContent: true,
      },
    });

    // Quality distribution
    const qualityDistribution = await prisma.harvestRecord.groupBy({
      by: ["qualityGrade"],
      where: {
        harvestId: params.id,
        qualityGrade: { not: null },
      },
      _count: true,
      _sum: { yieldKg: true },
    });

    requestLogger.info("Harvest retrieved", {
      userId: session.user.id,
      harvestId: harvest.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...harvest,
          summary: {
            totalRecords: harvest._count.records,
            totalYieldKg: recordStats._sum.yieldKg ?? 0,
            totalLaborHours: recordStats._sum.laborHours ?? 0,
            totalLaborCost: recordStats._sum.laborCost ?? 0,
            avgMoistureContent: recordStats._avg.moistureContent ?? 0,
            qualityDistribution: qualityDistribution.map((q) => ({
              grade: q.qualityGrade,
              count: q._count,
              totalYieldKg: q._sum.yieldKg ?? 0,
            })),
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to retrieve harvest", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve harvest")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/harvest/[id]
// ═══════════════════════════════════════════════════════════════
// Updates a harvest season. Typically used to record the end
// date or add notes once the season is complete.
// ═══════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "PATCH /api/harvest/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const existingHarvest = await getHarvestOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, existingHarvest.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this harvest", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = updateHarvestSchema.safeParse(body);
    if (!validated.success) {
      const fieldErrors: Record<string, string[]> = {};
      validated.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      });

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: fieldErrors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const data = validated.data;

    // ── Validate end date ────────────────────────────────────
    if (data.endDate && data.endDate < existingHarvest.startDate) {
      throw new AppError("End date cannot be before start date", {
        code: "INVALID_DATE_RANGE",
        statusCode: 400,
      });
    }

    // ── Build update data ────────────────────────────────────
    const updateData: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (data.endDate) {
      oldValues.endDate = existingHarvest.endDate;
      newValues.endDate = data.endDate;
      updateData.endDate = data.endDate;
    }

    if (data.notes !== undefined) {
      oldValues.notes = existingHarvest.notes;
      newValues.notes = data.notes;
      updateData.notes = data.notes;
    }

    if (data.metadata !== undefined) {
      oldValues.metadata = existingHarvest.metadata;
      newValues.metadata = data.metadata;
      updateData.metadata = data.metadata;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: existingHarvest,
          message: "No changes to apply",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // ── Update harvest ───────────────────────────────────────
    const updatedHarvest = await prisma.$transaction(async (tx) => {
      const harvest = await tx.harvest.update({
        where: { id: params.id },
        data: updateData,
      });

      if (Object.keys(newValues).length > 0) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "update",
            resource: "harvest",
            resourceId: params.id,
            oldValues: JSON.stringify(oldValues),
            newValues: JSON.stringify(newValues),
          },
        });
      }

      return harvest;
    });

    requestLogger.info("Harvest updated", {
      userId,
      harvestId: updatedHarvest.id,
      updatedFields: Object.keys(newValues),
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedHarvest,
        message: "Harvest updated successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to update harvest", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to update harvest")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/harvest/[id]
// ═══════════════════════════════════════════════════════════════
// Deletes a harvest season. Harvests with existing records
// cannot be deleted — records must be removed first to
// preserve data integrity.
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "DELETE /api/harvest/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const harvest = await getHarvestOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, harvest.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this harvest", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Check for existing records ───────────────────────────
    const recordCount = await prisma.harvestRecord.count({
      where: { harvestId: params.id },
    });

    if (recordCount > 0) {
      throw new AppError(
        "Cannot delete harvest with existing records. Remove records first.",
        {
          code: "HARVEST_HAS_RECORDS",
          statusCode: 409,
        }
      );
    }

    // ── Delete harvest ───────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      await tx.harvest.delete({ where: { id: params.id } });

      await tx.auditLog.create({
        data: {
          userId,
          action: "delete",
          resource: "harvest",
          resourceId: params.id,
          oldValues: JSON.stringify({
            farmId: harvest.farmId,
            season: harvest.season,
            year: harvest.year,
          }),
        },
      });
    });

    requestLogger.info("Harvest deleted", {
      userId,
      harvestId: params.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Harvest deleted successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to delete harvest", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to delete harvest")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/harvest/[id]/records
// ═══════════════════════════════════════════════════════════════
// Records a new harvest record (individual crop yield) for a
// harvest season. Validates that the crop and field belong to
// the same farm, records yield, quality grade, moisture, and
// labor metrics.
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({
    route: "POST /api/harvest/[id]/records",
  });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const harvest = await getHarvestOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, harvest.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this harvest", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = createHarvestRecordSchema.safeParse({
      ...body,
      harvestId: params.id,
    });

    if (!validated.success) {
      const fieldErrors: Record<string, string[]> = {};
      validated.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      });

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: fieldErrors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const data = validated.data;

    // ── Verify crop belongs to same farm ─────────────────────
    const crop = await prisma.crop.findUnique({
      where: { id: data.cropId },
      select: { id: true, farmId: true, name: true },
    });

    if (!crop || crop.farmId !== harvest.farmId) {
      throw new AppError("Crop not found or does not belong to this farm", {
        code: "INVALID_CROP",
        statusCode: 400,
      });
    }

    // ── Verify field belongs to same farm ────────────────────
    const field = await prisma.farmField.findUnique({
      where: { id: data.fieldId },
      select: { id: true, farmId: true },
    });

    if (!field || field.farmId !== harvest.farmId) {
      throw new AppError("Field not found or does not belong to this farm", {
        code: "INVALID_FIELD",
        statusCode: 400,
      });
    }

    // ── Create harvest record ────────────────────────────────
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.harvestRecord.create({
        data: {
          harvestId: params.id,
          cropId: data.cropId,
          fieldId: data.fieldId,
          yieldKg: data.yieldKg,
          qualityGrade: data.qualityGrade,
          moistureContent: data.moistureContent,
          laborHours: data.laborHours,
          laborCost: data.laborCost,
          notes: data.notes,
          metadata: data.metadata,
        },
      });

      // Update crop status to HARVESTED
      await tx.crop.updateMany({
        where: {
          id: data.cropId,
          status: { not: "HARVESTED" },
        },
        data: {
          status: "HARVESTED",
          actualHarvest: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "harvest_record",
          resourceId: newRecord.id,
          newValues: JSON.stringify({
            harvestId: params.id,
            cropId: data.cropId,
            yieldKg: newRecord.yieldKg,
            qualityGrade: newRecord.qualityGrade,
          }),
        },
      });

      return newRecord;
    });

    requestLogger.info("Harvest record created", {
      userId,
      recordId: record.id,
      harvestId: params.id,
      cropName: crop.name,
      yieldKg: record.yieldKg,
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
        message: "Harvest record created successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to create harvest record", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to create harvest record")),
      { status: 500 }
    );
  }
}
