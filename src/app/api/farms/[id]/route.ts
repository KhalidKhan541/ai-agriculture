import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { updateFarmSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm, isFarmOwner } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// HELPER: Validate farm access
// ═══════════════════════════════════════════════════════════════

async function getFarmOrThrow(farmId: string, userId: string, userRole: string) {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, role: true },
          },
        },
      },
      fields: true,
      _count: {
        select: {
          crops: true,
          equipment: true,
          soilSamples: true,
          weathers: true,
        },
      },
    },
  });

  if (!farm) {
    throw new NotFoundError("Farm", farmId);
  }

  const hasAccess = await canAccessFarm(userId, farmId);
  if (!hasAccess) {
    throw new AppError("You do not have access to this farm", {
      code: "FORBIDDEN",
      statusCode: 403,
    });
  }

  return farm;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/farms/[id]
// ═══════════════════════════════════════════════════════════════
// Returns a single farm with full details including owner,
// members, fields, and summary counts.
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "GET /api/farms/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const farm = await getFarmOrThrow(
      params.id,
      session.user.id,
      session.user.role
    );

    requestLogger.info("Farm retrieved", {
      userId: session.user.id,
      farmId: farm.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: farm,
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

    requestLogger.error("Failed to retrieve farm", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve farm")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/farms/[id]
// ═══════════════════════════════════════════════════════════════
// Updates farm details. Only the farm owner, a farm manager,
// or an admin can update farm data. Tracks old/new values in
// the audit log.
// ═══════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "PATCH /api/farms/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // ── Verify farm exists & user has access ─────────────────
    const existingFarm = await getFarmOrThrow(params.id, userId, userRole);

    // ── Check write permission ───────────────────────────────
    const isOwner = await isFarmOwner(userId, params.id);
    const canWrite =
      isOwner ||
      userRole === "SUPER_ADMIN" ||
      userRole === "PLATFORM_ADMIN" ||
      userRole === "FARM_MANAGER";

    if (!canWrite) {
      throw new AppError("Only the farm owner or manager can update farm details", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = updateFarmSchema.safeParse(body);
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

    // ── Update farm in transaction ───────────────────────────
    const updatedFarm = await prisma.$transaction(async (tx) => {
      const farm = await tx.farm.update({
        where: { id: params.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.areaHa !== undefined && { areaHa: data.areaHa }),
          ...(data.latitude !== undefined && { latitude: data.latitude }),
          ...(data.longitude !== undefined && { longitude: data.longitude }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
          ...(data.timezone && { timezone: data.timezone }),
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
          ...(data.status && { status: data.status }),
        },
      });

      // Build audit diff
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && (existingFarm as Record<string, unknown>)[key] !== value) {
          oldValues[key] = (existingFarm as Record<string, unknown>)[key];
          newValues[key] = value;
        }
      }

      if (Object.keys(newValues).length > 0) {
        await tx.auditLog.create({
          data: {
            userId,
            action: "update",
            resource: "farm",
            resourceId: params.id,
            oldValues: JSON.stringify(oldValues),
            newValues: JSON.stringify(newValues),
          },
        });
      }

      return farm;
    });

    requestLogger.info("Farm updated", {
      userId,
      farmId: updatedFarm.id,
      updatedFields: Object.keys(data),
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedFarm,
        message: "Farm updated successfully",
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

    requestLogger.error("Failed to update farm", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to update farm")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/farms/[id]
// ═══════════════════════════════════════════════════════════════
// Soft-deletes a farm by setting status to ARCHIVED. Only the
// farm owner or a platform admin can archive farms.
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({ route: "DELETE /api/farms/[id]" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const existingFarm = await getFarmOrThrow(params.id, userId, userRole);

    const isOwner = await isFarmOwner(userId, params.id);
    if (!isOwner && userRole !== "SUPER_ADMIN" && userRole !== "PLATFORM_ADMIN") {
      throw new AppError("Only the farm owner can archive the farm", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Archive farm (soft delete) ───────────────────────────
    await prisma.$transaction(async (tx) => {
      await tx.farm.update({
        where: { id: params.id },
        data: { status: "ARCHIVED" },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "delete",
          resource: "farm",
          resourceId: params.id,
          oldValues: JSON.stringify({
            name: existingFarm.name,
            status: existingFarm.status,
          }),
          newValues: JSON.stringify({ status: "ARCHIVED" }),
        },
      });
    });

    requestLogger.info("Farm archived", {
      userId,
      farmId: params.id,
      farmName: existingFarm.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Farm archived successfully",
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

    requestLogger.error("Failed to archive farm", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to archive farm")),
      { status: 500 }
    );
  }
}
