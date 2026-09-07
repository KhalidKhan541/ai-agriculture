import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { createSoilSampleSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// HELPER: Validate soil access
// ═══════════════════════════════════════════════════════════════

async function getSoilOrThrow(soilId: string) {
  const soil = await prisma.soil.findUnique({
    where: { id: soilId },
    include: {
      field: {
        select: { id: true, name: true, farmId: true },
      },
      samples: {
        orderBy: { sampleDate: "desc" },
      },
    },
  });

  if (!soil) {
    throw new NotFoundError("Soil record", soilId);
  }

  return soil;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/soil/[id]
// ═══════════════════════════════════════════════════════════════
// Returns a single soil profile with all its lab samples,
// field association, and historical sample data.
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "GET /api/soil/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const soil = await getSoilOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(
      session.user.id,
      soil.field.farmId
    );
    if (!hasAccess) {
      throw new AppError("You do not have access to this soil record", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    requestLogger.info("Soil record retrieved", {
      userId: session.user.id,
      soilId: soil.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: soil,
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

    requestLogger.error("Failed to retrieve soil record", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve soil record")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/soil/[id]
// ═══════════════════════════════════════════════════════════════
// Updates a soil profile. Typically used when new lab results
// arrive or when sensor data refines the soil readings. Logs
// all changes in the audit trail.
// ═══════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "PATCH /api/soil/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const existingSoil = await getSoilOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, existingSoil.field.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this soil record", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = createSoilSampleSchema.partial().safeParse(body);
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

    // ── Build update data ────────────────────────────────────
    const updateData: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    const allowedFields = [
      "ph", "organicMatter", "nitrogen", "phosphorus", "potassium",
      "calcium", "magnesium", "sulfur", "iron", "moisture",
      "temperature", "conductivity", "type", "metadata",
    ];

    for (const field of allowedFields) {
      const value = (data as Record<string, unknown>)[field];
      if (value !== undefined) {
        const currentValue = (existingSoil as Record<string, unknown>)[field];
        if (currentValue !== value) {
          oldValues[field] = currentValue;
          newValues[field] = value;
          updateData[field] = value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: existingSoil,
          message: "No changes to apply",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // ── Update soil ──────────────────────────────────────────
    const updatedSoil = await prisma.$transaction(async (tx) => {
      const soil = await tx.soil.update({
        where: { id: params.id },
        data: updateData,
      });

      if (Object.keys(newValues).length > 0) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "update",
            resource: "soil",
            resourceId: params.id,
            oldValues: JSON.stringify(oldValues),
            newValues: JSON.stringify(newValues),
          },
        });
      }

      return soil;
    });

    requestLogger.info("Soil record updated", {
      userId,
      soilId: updatedSoil.id,
      updatedFields: Object.keys(newValues),
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedSoil,
        message: "Soil record updated successfully",
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

    requestLogger.error("Failed to update soil record", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to update soil record")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/soil/[id]
// ═══════════════════════════════════════════════════════════════
// Deletes a soil profile. Soil records with lab samples cannot
// be deleted — the samples provide historical traceability.
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "DELETE /api/soil/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const soil = await getSoilOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, soil.field.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this soil record", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Check for linked samples ─────────────────────────────
    const sampleCount = await prisma.soilSample.count({
      where: { soilId: params.id },
    });

    if (sampleCount > 0) {
      throw new AppError(
        "Cannot delete soil record with linked lab samples",
        {
          code: "SOIL_HAS_SAMPLES",
          statusCode: 409,
        }
      );
    }

    // ── Delete soil ──────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      await tx.soil.delete({ where: { id: params.id } });

      await tx.auditLog.create({
        data: {
          userId,
          action: "delete",
          resource: "soil",
          resourceId: params.id,
          oldValues: JSON.stringify({
            fieldId: soil.fieldId,
            type: soil.type,
            ph: soil.ph,
          }),
        },
      });
    });

    requestLogger.info("Soil record deleted", {
      userId,
      soilId: params.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Soil record deleted successfully",
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

    requestLogger.error("Failed to delete soil record", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to delete soil record")),
      { status: 500 }
    );
  }
}
