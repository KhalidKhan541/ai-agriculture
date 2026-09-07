import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  getPaginationParams,
  createPaginatedResult,
  buildSearchFilter,
  buildDateRangeFilter,
} from "@/lib/db";
import { createCropSchema, cropFilterSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// GET /api/crops
// ═══════════════════════════════════════════════════════════════
// Lists crops across all farms the user has access to.
// Supports filtering by farm, field, status, season, growth
// stage, search text, and planting date range. Results include
// related field, variety, and summary counts.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const requestLogger = logger.child({ route: "GET /api/crops" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // ── Parse & validate filters ─────────────────────────────
    const filterResult = cropFilterSchema.safeParse(queryParams);
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

    // ── Build where clause ───────────────────────────────────
    const where: Record<string, unknown> = {};

    // Restrict to accessible farms
    if (userRole !== "SUPER_ADMIN" && userRole !== "PLATFORM_ADMIN") {
      const accessibleFarms = await prisma.farm.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        select: { id: true },
      });
      const farmIds = accessibleFarms.map((f) => f.id);

      if (farmIds.length === 0) {
        return NextResponse.json(
          createPaginatedResult([], 0, page, limit),
          { status: 200 }
        );
      }

      where.farmId = { in: farmIds };
    }

    if (filters.farmId) {
      where.farmId = filters.farmId;
    }

    if (filters.fieldId) {
      where.fieldId = filters.fieldId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.season) {
      where.season = filters.season;
    }

    if (filters.growthStage) {
      where.growthStage = filters.growthStage;
    }

    if (filters.search) {
      const searchFilter = buildSearchFilter(filters.search, [
        "name",
        "scientificName",
      ]);
      if (searchFilter) {
        where.AND = [searchFilter];
      }
    }

    const dateRange = buildDateRangeFilter(
      "plantingDate",
      filters.plantingDateFrom,
      filters.plantingDateTo
    );
    if (dateRange) {
      where.AND = [...(where.AND as [] || []), dateRange];
    }

    // ── Query database ───────────────────────────────────────
    const [crops, total] = await Promise.all([
      prisma.crop.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          field: { select: { id: true, name: true } },
          variety: { select: { id: true, name: true } },
          _count: {
            select: {
              harvestRecords: true,
              pestAlerts: true,
              plantings: true,
              yields: true,
            },
          },
        },
      }),
      prisma.crop.count({ where }),
    ]);

    requestLogger.info("Crops listed", {
      userId,
      page,
      limit,
      total,
    });

    return NextResponse.json(
      createPaginatedResult(crops, total, page, limit),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to list crops", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve crops")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/crops
// ═══════════════════════════════════════════════════════════════
// Creates a new crop record. Validates that the target farm and
// optional field are accessible. Supports optional linking to a
// crop variety and field assignment.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const requestLogger = logger.child({ route: "POST /api/crops" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const body = await request.json();

    // ── Validate input ───────────────────────────────────────
    const validated = createCropSchema.safeParse(body);
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

    // ── Verify farm access ───────────────────────────────────
    const hasAccess = await canAccessFarm(userId, data.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this farm", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Verify farm exists ───────────────────────────────────
    const farm = await prisma.farm.findUnique({
      where: { id: data.farmId },
      select: { id: true },
    });
    if (!farm) {
      throw new NotFoundError("Farm", data.farmId);
    }

    // ── Verify field exists if provided ──────────────────────
    if (data.fieldId) {
      const field = await prisma.farmField.findUnique({
        where: { id: data.fieldId },
        select: { id: true, farmId: true },
      });
      if (!field || field.farmId !== data.farmId) {
        throw new AppError("Field not found or does not belong to this farm", {
          code: "INVALID_FIELD",
          statusCode: 400,
        });
      }
    }

    // ── Verify variety exists if provided ────────────────────
    if (data.varietyId) {
      const variety = await prisma.cropVariety.findUnique({
        where: { id: data.varietyId },
        select: { id: true },
      });
      if (!variety) {
        throw new NotFoundError("Crop variety", data.varietyId);
      }
    }

    // ── Create crop ──────────────────────────────────────────
    const crop = await prisma.$transaction(async (tx) => {
      const newCrop = await tx.crop.create({
        data: {
          farmId: data.farmId,
          fieldId: data.fieldId,
          varietyId: data.varietyId,
          name: data.name,
          scientificName: data.scientificName,
          status: data.status as never,
          season: data.season as never,
          growthStage: data.growthStage as never,
          plantingDate: data.plantingDate ? new Date(data.plantingDate) : null,
          expectedHarvest: data.expectedHarvest
            ? new Date(data.expectedHarvest)
            : null,
          areaPlantedHa: data.areaPlantedHa,
          seedRate: data.seedRate,
          metadata: data.metadata,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "crop",
          resourceId: newCrop.id,
          newValues: JSON.stringify({
            farmId: newCrop.farmId,
            name: newCrop.name,
            season: newCrop.season,
            status: newCrop.status,
          }),
        },
      });

      return newCrop;
    });

    requestLogger.info("Crop created", {
      userId,
      cropId: crop.id,
      name: crop.name,
      farmId: data.farmId,
    });

    return NextResponse.json(
      {
        success: true,
        data: crop,
        message: "Crop created successfully",
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

    requestLogger.error("Failed to create crop", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to create crop")),
      { status: 500 }
    );
  }
}
