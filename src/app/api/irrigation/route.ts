import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  getPaginationParams,
  createPaginatedResult,
  buildDateRangeFilter,
} from "@/lib/db";
import { createIrrigationSchema, irrigationFilterSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// GET /api/irrigation
// ═══════════════════════════════════════════════════════════════
// Lists irrigation events across all accessible farms. Supports
// filtering by zone, irrigation type, automation status, and
// date range. Returns events with zone and sensor details.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const requestLogger = logger.child({ route: "GET /api/irrigation" });

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
    const filterResult = irrigationFilterSchema.safeParse(queryParams);
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

    // Restrict to accessible farms via irrigation zones
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

      // Get zones belonging to accessible farms' fields
      const accessibleFields = await prisma.farmField.findMany({
        where: { farmId: { in: farmIds } },
        select: { id: true },
      });
      const fieldIds = accessibleFields.map((f) => f.id);

      const accessibleZones = await prisma.irrigationZone.findMany({
        where: { fieldId: { in: fieldIds } },
        select: { id: true },
      });
      const zoneIds = accessibleZones.map((z) => z.id);

      where.zoneId = { in: zoneIds };
    }

    if (filters.zoneId) {
      where.zoneId = filters.zoneId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.automated !== undefined) {
      where.automated = filters.automated;
    }

    const dateRange = buildDateRangeFilter(
      "startDate",
      filters.startDateFrom,
      filters.startDateTo
    );
    if (dateRange) {
      Object.assign(where, dateRange);
    }

    // ── Query irrigations ────────────────────────────────────
    const [irrigations, total] = await Promise.all([
      prisma.irrigation.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          zone: {
            select: {
              id: true,
              name: true,
              areaHa: true,
              field: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.irrigation.count({ where }),
    ]);

    // ── Compute summary stats ────────────────────────────────
    const stats = await prisma.irrigation.aggregate({
      where,
      _sum: {
        volumeLiters: true,
        durationMin: true,
      },
      _avg: {
        efficiency: true,
        flowRate: true,
      },
      _count: true,
    });

    requestLogger.info("Irrigation events listed", {
      userId,
      page,
      limit,
      total,
    });

    return NextResponse.json(
      {
        ...createPaginatedResult(irrigations, total, page, limit),
        summary: {
          totalEvents: stats._count,
          totalVolumeLiters: stats._sum.volumeLiters ?? 0,
          totalDurationMin: stats._sum.durationMin ?? 0,
          avgEfficiency: stats._avg.efficiency ?? 0,
          avgFlowRate: stats._avg.flowRate ?? 0,
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

    requestLogger.error("Failed to list irrigation events", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve irrigation events")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/irrigation
// ═══════════════════════════════════════════════════════════════
// Records a new irrigation event for a zone. Validates zone
// access, records flow metrics (volume, duration, efficiency),
// and tracks automation status.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const requestLogger = logger.child({ route: "POST /api/irrigation" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const body = await request.json();

    // ── Validate input ───────────────────────────────────────
    const validated = createIrrigationSchema.safeParse(body);
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

    // ── Verify zone exists and user has access ───────────────
    const zone = await prisma.irrigationZone.findUnique({
      where: { id: data.zoneId },
      select: {
        id: true,
        name: true,
        isActive: true,
        field: {
          select: { id: true, farmId: true },
        },
      },
    });

    if (!zone) {
      throw new NotFoundError("Irrigation zone", data.zoneId);
    }

    if (!zone.isActive) {
      throw new AppError("Irrigation zone is not active", {
        code: "ZONE_INACTIVE",
        statusCode: 400,
      });
    }

    const hasAccess = await canAccessFarm(userId, zone.field.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this irrigation zone", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate date range ──────────────────────────────────
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new AppError("End date cannot be before start date", {
        code: "INVALID_DATE_RANGE",
        statusCode: 400,
      });
    }

    // ── Create irrigation event ──────────────────────────────
    const irrigation = await prisma.$transaction(async (tx) => {
      const newIrrigation = await tx.irrigation.create({
        data: {
          zoneId: data.zoneId,
          type: data.type,
          startDate,
          endDate,
          durationMin: data.durationMin,
          volumeLiters: data.volumeLiters,
          flowRate: data.flowRate,
          efficiency: data.efficiency,
          automated: data.automated ?? false,
          notes: data.notes,
          metadata: data.metadata,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "irrigation",
          resourceId: newIrrigation.id,
          newValues: JSON.stringify({
            zoneId: data.zoneId,
            type: newIrrigation.type,
            volumeLiters: newIrrigation.volumeLiters,
            automated: newIrrigation.automated,
          }),
        },
      });

      return newIrrigation;
    });

    requestLogger.info("Irrigation event created", {
      userId,
      irrigationId: irrigation.id,
      zoneId: data.zoneId,
      type: irrigation.type,
    });

    return NextResponse.json(
      {
        success: true,
        data: irrigation,
        message: "Irrigation event recorded successfully",
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

    requestLogger.error("Failed to create irrigation event", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to record irrigation event")),
      { status: 500 }
    );
  }
}
