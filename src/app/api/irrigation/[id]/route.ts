import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
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

const updateIrrigationSchema = z.object({
  endDate: z.coerce.date().optional(),
  durationMin: z.coerce.number().int().positive().optional(),
  volumeLiters: z.coerce.number().positive().optional(),
  flowRate: z.coerce.number().positive().optional(),
  efficiency: z.coerce.number().min(0).max(100).optional(),
  automated: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ═══════════════════════════════════════════════════════════════
// HELPER: Load irrigation or throw
// ═══════════════════════════════════════════════════════════════

async function getIrrigationOrThrow(irrigationId: string) {
  const irrigation = await prisma.irrigation.findUnique({
    where: { id: irrigationId },
    include: {
      zone: {
        select: {
          id: true,
          name: true,
          areaHa: true,
          field: {
            select: { id: true, name: true, farmId: true },
          },
        },
      },
    },
  });

  if (!irrigation) {
    throw new NotFoundError("Irrigation event", irrigationId);
  }

  return irrigation;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/irrigation/[id]
// ═══════════════════════════════════════════════════════════════
// Returns full details of a single irrigation event, including
// its zone, field association, and all flow metrics.
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "GET /api/irrigation/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const irrigation = await getIrrigationOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(
      session.user.id,
      irrigation.zone.field.farmId
    );
    if (!hasAccess) {
      throw new AppError("You do not have access to this irrigation event", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    requestLogger.info("Irrigation event retrieved", {
      userId: session.user.id,
      irrigationId: irrigation.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: irrigation,
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

    requestLogger.error("Failed to retrieve irrigation event", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve irrigation event")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/irrigation/[id]
// ═══════════════════════════════════════════════════════════════
// Updates an irrigation event. Commonly used to record the end
// time, final volume, or efficiency measurement after an
// irrigation cycle completes.
// ═══════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "PATCH /api/irrigation/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const existingIrrigation = await getIrrigationOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(
      userId,
      existingIrrigation.zone.field.farmId
    );
    if (!hasAccess) {
      throw new AppError("You do not have access to this irrigation event", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = updateIrrigationSchema.safeParse(body);
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

    // ── Validate end date vs start date ──────────────────────
    if (data.endDate && data.endDate < existingIrrigation.startDate) {
      throw new AppError("End date cannot be before start date", {
        code: "INVALID_DATE_RANGE",
        statusCode: 400,
      });
    }

    // ── Build update data ────────────────────────────────────
    const updateData: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const currentValue = (existingIrrigation as Record<string, unknown>)[key];
        if (currentValue !== value) {
          oldValues[key] = currentValue;
          newValues[key] = value;
          updateData[key] = value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: existingIrrigation,
          message: "No changes to apply",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // ── Update irrigation ────────────────────────────────────
    const updatedIrrigation = await prisma.$transaction(async (tx) => {
      const irrigation = await tx.irrigation.update({
        where: { id: params.id },
        data: updateData,
      });

      if (Object.keys(newValues).length > 0) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "update",
            resource: "irrigation",
            resourceId: params.id,
            oldValues: JSON.stringify(oldValues),
            newValues: JSON.stringify(newValues),
          },
        });
      }

      return irrigation;
    });

    requestLogger.info("Irrigation event updated", {
      userId,
      irrigationId: updatedIrrigation.id,
      updatedFields: Object.keys(newValues),
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedIrrigation,
        message: "Irrigation event updated successfully",
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

    requestLogger.error("Failed to update irrigation event", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to update irrigation event")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/irrigation/[id]
// ═══════════════════════════════════════════════════════════════
// Deletes an irrigation event. Typically restricted to ongoing
// or incorrectly recorded events. Historical irrigation data
// should be retained for analytics.
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "DELETE /api/irrigation/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const irrigation = await getIrrigationOrThrow(params.id);

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(
      userId,
      irrigation.zone.field.farmId
    );
    if (!hasAccess) {
      throw new AppError("You do not have access to this irrigation event", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Delete irrigation ────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      await tx.irrigation.delete({ where: { id: params.id } });

      await tx.auditLog.create({
        data: {
          userId,
          action: "delete",
          resource: "irrigation",
          resourceId: params.id,
          oldValues: JSON.stringify({
            zoneId: irrigation.zoneId,
            type: irrigation.type,
            volumeLiters: irrigation.volumeLiters,
            startDate: irrigation.startDate,
          }),
        },
      });
    });

    requestLogger.info("Irrigation event deleted", {
      userId,
      irrigationId: params.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Irrigation event deleted successfully",
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

    requestLogger.error("Failed to delete irrigation event", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to delete irrigation event")),
      { status: 500 }
    );
  }
}
