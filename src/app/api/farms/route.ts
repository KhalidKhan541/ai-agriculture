import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  getPaginationParams,
  createPaginatedResult,
  buildSearchFilter,
} from "@/lib/db";
import { createFarmSchema, farmFilterSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// GET /api/farms
// ═══════════════════════════════════════════════════════════════
// Lists all farms the current user has access to (owned or
// member of). Supports pagination, search, filtering by status,
// area range, and country.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const requestLogger = logger.child({ route: "GET /api/farms" });

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
    const filterResult = farmFilterSchema.safeParse(queryParams);
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

    // Admin users see all farms; others see only owned or member farms
    if (userRole !== "SUPER_ADMIN" && userRole !== "PLATFORM_ADMIN") {
      where.OR = [
        { ownerId: userId },
        { members: { some: { userId } } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.country) {
      where.country = { contains: filters.country, mode: "insensitive" };
    }

    if (filters.minArea !== undefined || filters.maxArea !== undefined) {
      where.areaHa = {};
      if (filters.minArea !== undefined) {
        (where.areaHa as Record<string, unknown>).gte = filters.minArea;
      }
      if (filters.maxArea !== undefined) {
        (where.areaHa as Record<string, unknown>).lte = filters.maxArea;
      }
    }

    if (filters.search) {
      const searchFilter = buildSearchFilter(filters.search, [
        "name",
        "description",
        "city",
        "state",
        "address",
      ]);
      if (searchFilter) {
        where.AND = [searchFilter];
      }
    }

    // ── Query database ───────────────────────────────────────
    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: {
              fields: true,
              crops: true,
              equipment: true,
            },
          },
        },
      }),
      prisma.farm.count({ where }),
    ]);

    requestLogger.info("Farms listed", {
      userId,
      page,
      limit,
      total,
      returned: farms.length,
    });

    return NextResponse.json(
      createPaginatedResult(farms, total, page, limit),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to list farms", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve farms")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/farms
// ═══════════════════════════════════════════════════════════════
// Creates a new farm. Automatically adds the creator as owner
// and as a FarmMember with FARM_OWNER role.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const requestLogger = logger.child({ route: "POST /api/farms" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const body = await request.json();

    // ── Validate input ───────────────────────────────────────
    const validated = createFarmSchema.safeParse(body);
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

    // ── Create farm + member in transaction ──────────────────
    const farm = await prisma.$transaction(async (tx) => {
      const newFarm = await tx.farm.create({
        data: {
          ownerId: userId,
          name: data.name,
          description: data.description,
          areaHa: data.areaHa,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country ?? "US",
          postalCode: data.postalCode,
          timezone: data.timezone ?? "UTC",
          logoUrl: data.logoUrl,
        },
      });

      // Add creator as farm member
      await tx.farmMember.create({
        data: {
          farmId: newFarm.id,
          userId,
          role: "FARM_OWNER",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "farm",
          resourceId: newFarm.id,
          newValues: JSON.stringify({
            name: newFarm.name,
            areaHa: newFarm.areaHa,
          }),
        },
      });

      return newFarm;
    });

    requestLogger.info("Farm created", {
      userId,
      farmId: farm.id,
      name: farm.name,
    });

    return NextResponse.json(
      {
        success: true,
        data: farm,
        message: "Farm created successfully",
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

    requestLogger.error("Failed to create farm", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to create farm")),
      { status: 500 }
    );
  }
}
