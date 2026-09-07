import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  getPaginationParams,
  createPaginatedResult,
  buildDateRangeFilter,
} from "@/lib/db";
import { createHarvestSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// GET /api/harvest
// ═══════════════════════════════════════════════════════════════
// Lists harvest seasons across all accessible farms. Supports
// filtering by farm, season, year, and date range. Returns
// harvests with summary record counts and total yield.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const requestLogger = logger.child({ route: "GET /api/harvest" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
      orderBy: searchParams.get("orderBy") || "startDate",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
    });

    // ── Build where clause ───────────────────────────────────
    const where: Record<string, unknown> = {};

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

    if (searchParams.get("farmId")) {
      where.farmId = searchParams.get("farmId");
    }

    if (searchParams.get("season")) {
      where.season = searchParams.get("season");
    }

    if (searchParams.get("year")) {
      where.year = Number(searchParams.get("year"));
    }

    const dateRange = buildDateRangeFilter(
      "startDate",
      searchParams.get("dateFrom"),
      searchParams.get("dateTo")
    );
    if (dateRange) {
      Object.assign(where, dateRange);
    }

    // ── Query harvests ───────────────────────────────────────
    const [harvests, total] = await Promise.all([
      prisma.harvest.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          farm: { select: { id: true, name: true } },
          records: {
            include: {
              crop: { select: { id: true, name: true } },
              field: { select: { id: true, name: true } },
              produce: true,
            },
          },
          _count: { select: { records: true } },
        },
      }),
      prisma.harvest.count({ where }),
    ]);

    // ── Compute aggregate stats ──────────────────────────────
    const harvestIds = harvests.map((h) => h.id);
    const recordStats = await prisma.harvestRecord.aggregate({
      where: { harvestId: { in: harvestIds } },
      _sum: { yieldKg: true, laborHours: true, laborCost: true },
      _avg: { moistureContent: true },
      _count: true,
    });

    requestLogger.info("Harvests listed", {
      userId,
      page,
      limit,
      total,
    });

    return NextResponse.json(
      {
        ...createPaginatedResult(harvests, total, page, limit),
        summary: {
          totalHarvests: total,
          totalRecords: recordStats._count,
          totalYieldKg: recordStats._sum.yieldKg ?? 0,
          totalLaborHours: recordStats._sum.laborHours ?? 0,
          totalLaborCost: recordStats._sum.laborCost ?? 0,
          avgMoistureContent: recordStats._avg.moistureContent ?? 0,
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

    requestLogger.error("Failed to list harvests", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve harvests")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/harvest
// ═══════════════════════════════════════════════════════════════
// Creates a new harvest season record. A harvest season
// represents a grouping of harvest activity (e.g., "Summer
// 2026"). Individual crop yields are added as HarvestRecords.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const requestLogger = logger.child({ route: "POST /api/harvest" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const body = await request.json();

    // ── Validate input ───────────────────────────────────────
    const validated = createHarvestSchema.safeParse(body);
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
      select: { id: true, name: true },
    });
    if (!farm) {
      throw new NotFoundError("Farm", data.farmId);
    }

    // ── Check for duplicate harvest season ───────────────────
    const existingHarvest = await prisma.harvest.findFirst({
      where: {
        farmId: data.farmId,
        season: data.season as never,
        year: data.year,
      },
    });

    if (existingHarvest) {
      throw new AppError(
        `A harvest for ${data.season} ${data.year} already exists for this farm`,
        {
          code: "DUPLICATE_HARVEST",
          statusCode: 409,
        }
      );
    }

    // ── Create harvest ───────────────────────────────────────
    const harvest = await prisma.$transaction(async (tx) => {
      const newHarvest = await tx.harvest.create({
        data: {
          farmId: data.farmId,
          season: data.season as never,
          year: data.year,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          notes: data.notes,
          metadata: data.metadata,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "harvest",
          resourceId: newHarvest.id,
          newValues: JSON.stringify({
            farmId: data.farmId,
            season: newHarvest.season,
            year: newHarvest.year,
            startDate: newHarvest.startDate,
          }),
        },
      });

      return newHarvest;
    });

    requestLogger.info("Harvest season created", {
      userId,
      harvestId: harvest.id,
      farmId: data.farmId,
      season: harvest.season,
      year: harvest.year,
    });

    return NextResponse.json(
      {
        success: true,
        data: harvest,
        message: "Harvest season created successfully",
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

    requestLogger.error("Failed to create harvest", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to create harvest")),
      { status: 500 }
    );
  }
}
