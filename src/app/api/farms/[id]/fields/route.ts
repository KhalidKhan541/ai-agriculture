import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  getPaginationParams,
  createPaginatedResult,
} from "@/lib/db";
import { createFieldSchema } from "@/lib/validators";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  getErrorResponse,
} from "@/lib/errors";
import { canAccessFarm } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// GET /api/farms/[id]/fields
// ═══════════════════════════════════════════════════════════════
// Lists all fields belonging to a specific farm. Includes
// summary counts of crops, irrigation zones, and soil samples
// per field. Supports pagination and sorting.
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({
    route: "GET /api/farms/[id]/fields",
  });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;

    // ── Verify farm access ───────────────────────────────────
    const hasAccess = await canAccessFarm(userId, params.id);
    if (!hasAccess) {
      throw new AppError("You do not have access to this farm", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Verify farm exists ───────────────────────────────────
    const farm = await prisma.farm.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!farm) {
      throw new NotFoundError("Farm", params.id);
    }

    // ── Parse pagination ─────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
      orderBy: searchParams.get("orderBy") || "name",
      order: (searchParams.get("order") as "asc" | "desc") || "asc",
    });

    // ── Build where clause ───────────────────────────────────
    const where: Record<string, unknown> = {
      farmId: params.id,
    };

    if (searchParams.get("soilType")) {
      where.soilType = searchParams.get("soilType");
    }

    if (searchParams.get("isActive") !== null) {
      where.isActive = searchParams.get("isActive") === "true";
    }

    if (searchParams.get("search")) {
      where.OR = [
        { name: { contains: searchParams.get("search"), mode: "insensitive" } },
        { description: { contains: searchParams.get("search"), mode: "insensitive" } },
      ];
    }

    // ── Query fields ─────────────────────────────────────────
    const [fields, total] = await Promise.all([
      prisma.farmField.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: {
              crops: true,
              irrigationZones: true,
              soilSamples: true,
              pestAlerts: { where: { resolvedAt: null } },
              sensorReadings: true,
            },
          },
        },
      }),
      prisma.farmField.count({ where }),
    ]);

    requestLogger.info("Farm fields listed", {
      userId,
      farmId: params.id,
      total,
    });

    return NextResponse.json(
      {
        ...createPaginatedResult(fields, total, page, limit),
        farm: { id: farm.id, name: farm.name },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Failed to list farm fields", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to retrieve farm fields")),
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/farms/[id]/fields
// ═══════════════════════════════════════════════════════════════
// Creates a new field under the specified farm. Validates that
// the user has farm access and the required soil type is valid.
// After creation, logs the action in the audit trail.
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestLogger = logger.child({
    route: "POST /api/farms/[id]/fields",
  });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError();
    }

    const userId = session.user.id;

    // ── Verify farm access ───────────────────────────────────
    const farm = await prisma.farm.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!farm) {
      throw new NotFoundError("Farm", params.id);
    }

    const hasAccess = await canAccessFarm(userId, params.id);
    if (!hasAccess) {
      throw new AppError("You do not have access to this farm", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const validated = createFieldSchema.safeParse(body);
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

    // ── Create field + audit log ─────────────────────────────
    const field = await prisma.$transaction(async (tx) => {
      const newField = await tx.farmField.create({
        data: {
          farmId: params.id,
          name: data.name,
          description: data.description,
          areaHa: data.areaHa,
          latitude: data.latitude,
          longitude: data.longitude,
          soilType: data.soilType,
          metadata: data.metadata,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          resource: "field",
          resourceId: newField.id,
          newValues: JSON.stringify({
            farmId: params.id,
            name: newField.name,
            areaHa: newField.areaHa,
            soilType: newField.soilType,
          }),
        },
      });

      return newField;
    });

    requestLogger.info("Field created", {
      userId,
      farmId: params.id,
      fieldId: field.id,
      name: field.name,
    });

    return NextResponse.json(
      {
        success: true,
        data: field,
        message: "Field created successfully",
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

    requestLogger.error("Failed to create field", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Failed to create field")),
      { status: 500 }
    );
  }
}
