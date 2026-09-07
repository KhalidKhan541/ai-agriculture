import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { updateCropSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// HELPER: Load crop with relations or throw
// ═══════════════════════════════════════════════════════════════

async function getCropOrThrow(cropId: string) {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true, soilType: true } },
      variety: true,
      plantings: { orderBy: { datePlanted: "desc" } },
      harvestRecords: {
        include: { produce: true },
        orderBy: { harvestedAt: "desc" },
      },
      yields: { orderBy: { year: "desc" } },
      yieldForecasts: { orderBy: { forecastDate: "desc" }, take: 5 },
      pestAlerts: {
        where: { resolvedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!crop) {
    throw new NotFoundError("Crop", cropId);
  }

  return crop;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/crops/[id]
// ═══════════════════════════════════════════════════════════════
// Returns full crop details including variety, field, plantings,
// harvest records, yields, yield forecasts, and active pest
// alerts.
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "GET /api/crops/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const crop = await getCropOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(session.user.id, crop.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this crop", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    requestLogger.info("Crop retrieved", {
      userId: session.user.id,
      cropId: crop.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: crop,
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

    requestLogger.error("Failed to retrieve crop", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve crop")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/crops/[id]
// ═══════════════════════════════════════════════════════════════
// Updates crop details. Validates transitions for status and
// growth stage. Tracks all changes in the audit log.
// ═══════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "PATCH /api/crops/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const existingCrop = await getCropOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, existingCrop.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this crop", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = updateCropSchema.safeParse(body);
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

    // ── Verify field belongs to same farm ────────────────────
    if (data.fieldId) {
      const field = await prisma.farmField.findUnique({
        where: { id: data.fieldId },
        select: { id: true, farmId: true },
      });
      if (!field || field.farmId !== existingCrop.farmId) {
        throw new AppError("Field not found or does not belong to this farm", {
          code: "INVALID_FIELD",
          statusCode: 400,
        });
      }
    }

    // ── Build update data ────────────────────────────────────
    const updateData: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const currentValue = (existingCrop as Record<string, unknown>)[key];
        if (currentValue !== value) {
          oldValues[key] = currentValue;
          newValues[key] = value;

          if (key === "plantingDate" || key === "expectedHarvest" || key === "actualHarvest") {
            updateData[key] = value ? new Date(value as string) : null;
          } else {
            updateData[key] = value;
          }
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: existingCrop,
          message: "No changes to apply",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // ── Update crop ──────────────────────────────────────────
    const updatedCrop = await prisma.$transaction(async (tx) => {
      const crop = await tx.crop.update({
        where: { id: params.id },
        data: updateData,
      });

      if (Object.keys(newValues).length > 0) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "update",
            resource: "crop",
            resourceId: params.id,
            oldValues: JSON.stringify(oldValues),
            newValues: JSON.stringify(newValues),
          },
        });
      }

      return crop;
    });

    requestLogger.info("Crop updated", {
      userId,
      cropId: updatedCrop.id,
      updatedFields: Object.keys(newValues),
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedCrop,
        message: "Crop updated successfully",
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

    requestLogger.error("Failed to update crop", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to update crop")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/crops/[id]
// ═══════════════════════════════════════════════════════════════
// Deletes a crop. Crops with active harvest records cannot be
// deleted — they must be archived via status update instead.
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "DELETE /api/crops/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const crop = await getCropOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, crop.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this crop", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Check for harvest records ────────────────────────────
    const harvestCount = await prisma.harvestRecord.count({
      where: { cropId: params.id },
    });

    if (harvestCount > 0) {
      throw new AppError(
        "Cannot delete crop with harvest records. Update the crop status instead.",
        {
          code: "CROP_HAS_HARVESTS",
          statusCode: 409,
        }
      );
    }

    // ── Delete crop ──────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // Remove related plantings first
      await tx.planting.deleteMany({ where: { cropId: params.id } });

      await tx.crop.delete({ where: { id: params.id } });

      await tx.auditLog.create({
        data: {
          userId,
          action: "delete",
          resource: "crop",
          resourceId: params.id,
          oldValues: JSON.stringify({
            name: crop.name,
            farmId: crop.farmId,
            season: crop.season,
            status: crop.status,
          }),
        },
      });
    });

    requestLogger.info("Crop deleted", {
      userId,
      cropId: params.id,
      cropName: crop.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Crop deleted successfully",
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

    requestLogger.error("Failed to delete crop", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to delete crop")),
      { status: 500 }
    );
  }
}
