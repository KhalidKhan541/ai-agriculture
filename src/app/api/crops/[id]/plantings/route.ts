import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  getPaginationParams,
  createPaginatedResult,
} from "@/lib/db";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const createPlantingSchema = z.object({
  batchNumber: z.string().min(1).max(100),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  seedSource: z.string().max(200).optional(),
  cost: z.coerce.number().min(0).optional(),
  depthCm: z.coerce.number().min(0).max(100).optional(),
  spacingCm: z.coerce.number().min(0).max(200).optional(),
  method: z
    .enum(["broadcast", "row", "drill", "transplant"])
    .optional(),
  datePlanted: z.coerce.date().default(new Date()),
  metadata: z.record(z.unknown()).optional(),
});

const plantingFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("datePlanted"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/crops/[id]/plantings
// ═══════════════════════════════════════════════════════════════
// Lists all planting batches for a specific crop. Includes
// batch details such as seed source, cost, planting method,
// and depth/spacing parameters.
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({
    route: "GET /api/crops/[id]/plantings",
  });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    // ── Verify crop exists ───────────────────────────────────
    const crop = await prisma.crop.findUnique({
      where: { id: params.id },
      select: { id: true, farmId: true, name: true },
    });

    if (!crop) {
      throw new NotFoundError("Crop", params.id);
    }

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(session.user.id, crop.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this crop", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Parse pagination ─────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const filterResult = plantingFilterSchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!filterResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          code: "VALIDATION_ERROR",
          details: filterResult.error.flatten().fieldErrors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const filters = filterResult.data;
    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: filters.page,
      limit: filters.limit,
      orderBy: filters.orderBy,
      order: filters.order,
    });

    // ── Query plantings ──────────────────────────────────────
    const where = { cropId: params.id };

    const [plantings, total] = await Promise.all([
      prisma.planting.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.planting.count({ where }),
    ]);

    // ── Calculate summary ────────────────────────────────────
    const summary = await prisma.planting.aggregate({
      where: { cropId: params.id },
      _sum: { quantity: true, cost: true },
      _count: true,
    });

    requestLogger.info("Plantings listed", {
      userId: session.user.id,
      cropId: params.id,
      total,
    });

    return NextResponse.json(
      {
        ...createPaginatedResult(plantings, total, page, limit),
        crop: { id: crop.id, name: crop.name },
        summary: {
          totalBatches: summary._count,
          totalQuantity: summary._sum.quantity ?? 0,
          totalCost: summary._sum.cost ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to list plantings", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve plantings")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/crops/[id]/plantings
// ═══════════════════════════════════════════════════════════════
// Records a new planting batch for a crop. Each batch tracks
// seed source, quantity, cost, planting method, and depth/
// spacing parameters. Automatically generates a unique batch
// number if one is not provided.
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({
    route: "POST /api/crops/[id]/plantings",
  });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;

    // ── Verify crop exists ───────────────────────────────────
    const crop = await prisma.crop.findUnique({
      where: { id: params.id },
      select: { id: true, farmId: true, name: true, season: true },
    });

    if (!crop) {
      throw new NotFoundError("Crop", params.id);
    }

    // ── Verify access ────────────────────────────────────────
    const hasAccess = await canAccessFarm(userId, crop.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this crop", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = createPlantingSchema.safeParse(body);
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

    // ── Generate batch number ────────────────────────────────
    const batchCount = await prisma.planting.count({
      where: { cropId: params.id },
    });
    const batchNumber =
      data.batchNumber || `BATCH-${crop.season}-${String(batchCount + 1).padStart(4, "0")}`;

    // ── Create planting ──────────────────────────────────────
    const planting = await prisma.$transaction(async (tx) => {
      const newPlanting = await tx.planting.create({
        data: {
          cropId: params.id,
          batchNumber,
          quantity: data.quantity,
          seedSource: data.seedSource,
          cost: data.cost,
          depthCm: data.depthCm,
          spacingCm: data.spacingCm,
          method: data.method,
          datePlanted: data.datePlanted,
          metadata: data.metadata,
        },
      });

      // Update crop status to SEEDING if it was PLANNED
      await tx.crop.updateMany({
        where: {
          id: params.id,
          status: "PLANNED",
        },
        data: {
          status: "SEEDING",
          plantingDate: data.datePlanted,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "planting",
          resourceId: newPlanting.id,
          newValues: JSON.stringify({
            cropId: params.id,
            batchNumber,
            quantity: newPlanting.quantity,
            method: newPlanting.method,
          }),
        },
      });

      return newPlanting;
    });

    requestLogger.info("Planting created", {
      userId,
      cropId: params.id,
      plantingId: planting.id,
      batchNumber,
    });

    return NextResponse.json(
      {
        success: true,
        data: planting,
        message: "Planting recorded successfully",
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

    requestLogger.error("Failed to create planting", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to record planting")),
      { status: 500 }
    );
  }
}
