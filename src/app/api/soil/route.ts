import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  getPaginationParams,
  createPaginatedResult,
  buildDateRangeFilter,
} from "@/lib/db";
import { createSoilSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// GET /api/soil
// ═══════════════════════════════════════════════════════════════
// Lists soil records across all accessible farms. Supports
// filtering by field, soil type, moisture level, and pH range.
// Returns soil profiles with their linked samples.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const requestLogger = logger.child({ route: "GET /api/soil" });

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
      orderBy: searchParams.get("orderBy") || "createdAt",
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

      // Get fields belonging to accessible farms
      const accessibleFields = await prisma.farmField.findMany({
        where: { farmId: { in: farmIds } },
        select: { id: true },
      });
      const fieldIds = accessibleFields.map((f) => f.id);

      where.fieldId = { in: fieldIds };
    }

    if (searchParams.get("fieldId")) {
      where.fieldId = searchParams.get("fieldId");
    }

    if (searchParams.get("type")) {
      where.type = searchParams.get("type");
    }

    if (searchParams.get("moisture")) {
      where.moisture = searchParams.get("moisture");
    }

    // pH range filter
    const phMin = searchParams.get("phMin");
    const phMax = searchParams.get("phMax");
    if (phMin || phMax) {
      where.ph = {};
      if (phMin) (where.ph as Record<string, unknown>).gte = Number(phMin);
      if (phMax) (where.ph as Record<string, unknown>).lte = Number(phMax);
    }

    // ── Query soil records ───────────────────────────────────
    const [soils, total] = await Promise.all([
      prisma.soil.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          samples: {
            orderBy: { sampleDate: "desc" },
            take: 5,
          },
          field: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.soil.count({ where }),
    ]);

    requestLogger.info("Soil records listed", {
      userId,
      page,
      limit,
      total,
    });

    return NextResponse.json(
      createPaginatedResult(soils, total, page, limit),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to list soil records", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve soil records")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/soil
// ═══════════════════════════════════════════════════════════════
// Creates a new soil profile for a field. Records physical
// properties (type, moisture, temperature), chemical properties
// (pH, NPK, micronutrients), and electrical conductivity.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const requestLogger = logger.child({ route: "POST /api/soil" });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;
    const body = await request.json();

    // ── Validate input ───────────────────────────────────────
    const validated = createSoilSchema.safeParse(body);
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

    // ── Verify field exists and user has access ──────────────
    const field = await prisma.farmField.findUnique({
      where: { id: data.fieldId },
      select: { id: true, farmId: true, name: true },
    });

    if (!field) {
      throw new NotFoundError("Field", data.fieldId);
    }

    const hasAccess = await canAccessFarm(userId, field.farmId);
    if (!hasAccess) {
      throw new AppError("You do not have access to this field", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Create soil record ───────────────────────────────────
    const soil = await prisma.$transaction(async (tx) => {
      const newSoil = await tx.soil.create({
        data: {
          fieldId: data.fieldId,
          type: data.type,
          ph: data.ph,
          organicMatter: data.organicMatter,
          nitrogen: data.nitrogen,
          phosphorus: data.phosphorus,
          potassium: data.potassium,
          calcium: data.calcium,
          magnesium: data.magnesium,
          sulfur: data.sulfur,
          iron: data.iron,
          moisture: data.moisture as never,
          temperature: data.temperature,
          conductivity: data.conductivity,
          metadata: data.metadata,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "soil",
          resourceId: newSoil.id,
          newValues: JSON.stringify({
            fieldId: data.fieldId,
            type: newSoil.type,
            ph: newSoil.ph,
          }),
        },
      });

      return newSoil;
    });

    requestLogger.info("Soil record created", {
      userId,
      soilId: soil.id,
      fieldId: data.fieldId,
      type: soil.type,
    });

    return NextResponse.json(
      {
        success: true,
        data: soil,
        message: "Soil record created successfully",
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

    requestLogger.error("Failed to create soil record", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to create soil record")),
      { status: 500 }
    );
  }
}
