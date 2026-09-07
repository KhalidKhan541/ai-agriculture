import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult, buildSearchFilter } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { identifyPest, batchDetectPests, analyzePestTrends, analyzeCostBenefit } from "@/lib/ai/pest-detection";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const pestQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  category: z.enum(["insect", "fungus", "weed", "rodent", "nematode", "bacteria", "virus"]).optional(),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL", "SEVERE"]).optional(),
  farmId: z.string().optional(),
  fieldId: z.string().optional(),
  cropId: z.string().optional(),
  resolved: z.coerce.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const createPestAlertSchema = z.object({
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  cropId: z.string().optional(),
  pestName: z.string().min(1).max(200),
  scientificName: z.string().max(300).optional(),
  category: z.enum(["insect", "fungus", "weed", "rodent", "nematode", "bacteria", "virus"]),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL", "SEVERE"]),
  detectedBy: z.enum(["manual", "sensor", "satellite", "drone", "ai"]).default("manual"),
  description: z.string().max(5000).optional(),
  symptoms: z.string().max(5000).optional(),
  treatment: z.string().max(5000).optional(),
  prevention: z.string().max(5000).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  areaHa: z.coerce.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  estimatedAffectedAreaHa: z.coerce.number().min(0).optional(),
  pestDensity: z.coerce.number().min(0).optional(),
  growthStage: z.string().optional(),
  weatherConditions: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updatePestAlertSchema = createPestAlertSchema.partial().extend({
  id: z.string().min(1),
  resolved: z.boolean().optional(),
  resolvedAt: z.coerce.date().optional(),
  resolvedBy: z.string().optional(),
  resolutionNotes: z.string().max(5000).optional(),
  actualTreatment: z.string().max(5000).optional(),
  effectivenessRating: z.coerce.number().min(0).max(10).optional(),
});

const aiDetectionSchema = z.object({
  imageUrl: z.string().url(),
  farmId: z.string().optional(),
  fieldId: z.string().optional(),
  cropType: z.string().optional(),
  additionalContext: z.string().optional(),
});

const bulkDetectionSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(20),
  farmId: z.string().optional(),
  fieldId: z.string().optional(),
  cropType: z.string().optional(),
});

const pestDatabaseSchema = z.object({
  name: z.string().min(1).max(200),
  scientificName: z.string().max(300).optional(),
  category: z.enum(["insect", "fungus", "weed", "rodent", "nematode", "bacteria", "virus"]),
  description: z.string().max(10000).optional(),
  symptoms: z.string().max(10000).optional(),
  treatment: z.string().max(10000).optional(),
  prevention: z.string().max(10000).optional(),
  lifecycle: z.string().max(5000).optional(),
  favorableConditions: z.string().max(5000).optional(),
  economicImpact: z.string().max(5000).optional(),
  affectedCrops: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/pests
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", {
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Pest trend analysis
    if (action === "trends") {
      const farmId = searchParams.get("farmId");
      const period = searchParams.get("period") ?? "30";

      const trends = await analyzePestTrends({
        farmId: farmId ?? undefined,
        periodDays: parseInt(period),
      });

      return NextResponse.json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      });
    }

    // Cost-benefit analysis for pest control
    if (action === "cost-benefit") {
      const pestType = searchParams.get("pestType");
      const farmId = searchParams.get("farmId");

      if (!pestType) {
        throw new AppError("pestType parameter is required", {
          code: "VALIDATION_ERROR",
          statusCode: 400,
        });
      }

      const analysis = await analyzeCostBenefit({
        pestType,
        farmId: farmId ?? undefined,
      });

      return NextResponse.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
      });
    }

    // Get pest database entries
    if (action === "database") {
      const pestSearch = searchParams.get("search");
      const category = searchParams.get("category");

      const where: Record<string, unknown> = {};
      if (category) where.category = category;

      const searchFilter = buildSearchFilter(pestSearch, ["name", "scientificName", "description"]);
      if (searchFilter) Object.assign(where, searchFilter);

      const pests = await prisma.pestDatabase.findMany({
        where,
        orderBy: { name: "asc" },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: pests,
        count: pests.length,
        timestamp: new Date().toISOString(),
      });
    }

    // List pest alerts
    const query = pestQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      orderBy: searchParams.get("orderBy"),
      order: searchParams.get("order"),
      search: searchParams.get("search"),
      category: searchParams.get("category"),
      severity: searchParams.get("severity"),
      farmId: searchParams.get("farmId"),
      fieldId: searchParams.get("fieldId"),
      cropId: searchParams.get("cropId"),
      resolved: searchParams.get("resolved"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
    });

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: query.page,
      limit: query.limit,
      orderBy: query.orderBy,
      order: query.order,
    });

    const where: Record<string, unknown> = {};
    if (query.farmId) where.farmId = query.farmId;
    if (query.fieldId) where.fieldId = query.fieldId;
    if (query.cropId) where.cropId = query.cropId;
    if (query.category) where.category = query.category;
    if (query.severity) where.severity = query.severity;
    if (query.resolved !== undefined) where.resolved = query.resolved;

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) (where.createdAt as Record<string, Date>).gte = query.dateFrom;
      if (query.dateTo) (where.createdAt as Record<string, Date>).lte = query.dateTo;
    }

    const searchFilter = buildSearchFilter(query.search, ["pestName", "scientificName", "description"]);
    if (searchFilter) Object.assign(where, searchFilter);

    const [alerts, total] = await Promise.all([
      prisma.pestAlert.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          farm: { select: { id: true, name: true } },
          field: { select: { id: true, name: true } },
          crop: { select: { id: true, name: true } },
        },
      }),
      prisma.pestAlert.count({ where }),
    ]);

    const result = createPaginatedResult(alerts, total, page, limit);

    // Summary statistics
    const summary = await prisma.pestAlert.aggregate({
      where: { farmId: query.farmId ?? undefined },
      _count: true,
    });

    const severityCounts = await prisma.pestAlert.groupBy({
      by: ["severity"],
      where: { resolved: false, farmId: query.farmId ?? undefined },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      ...result,
      summary: {
        totalAlerts: summary._count,
        unresolvedBySeverity: severityCounts.reduce(
          (acc, item) => ({ ...acc, [item.severity]: item._count }),
          {} as Record<string, number>
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/pests
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", {
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // AI pest detection from image
    if (action === "detect") {
      const validated = aiDetectionSchema.parse(body);

      const detection = await identifyPest({
        imageUrl: validated.imageUrl,
        cropType: validated.cropType,
        additionalContext: validated.additionalContext,
      });

      // Auto-create alert if pest detected with high confidence
      if (detection.confidence > 0.7 && validated.farmId) {
        const alert = await prisma.pestAlert.create({
          data: {
            farmId: validated.farmId,
            fieldId: validated.fieldId ?? null,
            pestName: detection.pestName,
            scientificName: detection.scientificName ?? null,
            category: detection.category as string,
            severity: detection.severity as string,
            detectedBy: "ai",
            description: detection.description ?? null,
            symptoms: detection.symptoms ?? null,
            treatment: detection.treatmentRecommendation ?? null,
            imageUrl: validated.imageUrl,
            confidence: detection.confidence,
            metadata: JSON.stringify({
              aiModel: detection.model,
              boundingBox: detection.boundingBox,
            }),
            createdById: session.user.id,
          },
          include: {
            farm: { select: { id: true, name: true } },
          },
        });

        // Send notification for high severity
        if (["HIGH", "CRITICAL", "SEVERE"].includes(detection.severity)) {
          await prisma.notification.create({
            data: {
              userId: session.user.id,
              type: "PEST_ALERT",
              title: `Pest Detected: ${detection.pestName}`,
              message: `AI detected ${detection.pestName} with ${Math.round(detection.confidence * 100)}% confidence. Severity: ${detection.severity}`,
              metadata: JSON.stringify({ alertId: alert.id }),
            },
          });
        }

        return NextResponse.json(
          {
            success: true,
            data: {
              detection,
              alert,
            },
            message: "Pest detected and alert created",
            timestamp: new Date().toISOString(),
          },
          { status: 201 }
        );
      }

      return NextResponse.json({
        success: true,
        data: detection,
        timestamp: new Date().toISOString(),
      });
    }

    // Batch pest detection
    if (action === "batch-detect") {
      const validated = bulkDetectionSchema.parse(body);

      const results = await batchDetectPests({
        imageUrls: validated.imageUrls,
        cropType: validated.cropType,
      });

      return NextResponse.json({
        success: true,
        data: results,
        count: results.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Add to pest database
    if (action === "database") {
      const validated = pestDatabaseSchema.parse(body);

      const pest = await prisma.pestDatabase.create({
        data: {
          name: validated.name,
          scientificName: validated.scientificName ?? null,
          category: validated.category,
          description: validated.description ?? null,
          symptoms: validated.symptoms ?? null,
          treatment: validated.treatment ?? null,
          prevention: validated.prevention ?? null,
          lifecycle: validated.lifecycle ?? null,
          favorableConditions: validated.favorableConditions ?? null,
          economicImpact: validated.economicImpact ?? null,
          affectedCrops: validated.affectedCrops ? JSON.stringify(validated.affectedCrops) : null,
          images: validated.images ? JSON.stringify(validated.images) : null,
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
          createdById: session.user.id,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: pest,
          message: "Pest entry added to database",
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Create manual pest alert
    const validated = createPestAlertSchema.parse(body);

    const farm = await prisma.farm.findUnique({
      where: { id: validated.farmId },
    });

    if (!farm) {
      throw new AppError("Farm not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    const alert = await prisma.pestAlert.create({
      data: {
        farmId: validated.farmId,
        fieldId: validated.fieldId ?? null,
        cropId: validated.cropId ?? null,
        pestName: validated.pestName,
        scientificName: validated.scientificName ?? null,
        category: validated.category,
        severity: validated.severity,
        detectedBy: validated.detectedBy,
        description: validated.description ?? null,
        symptoms: validated.symptoms ?? null,
        treatment: validated.treatment ?? null,
        prevention: validated.prevention ?? null,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        areaHa: validated.areaHa ?? null,
        imageUrl: validated.imageUrl ?? null,
        images: validated.images ? JSON.stringify(validated.images) : null,
        estimatedAffectedAreaHa: validated.estimatedAffectedAreaHa ?? null,
        pestDensity: validated.pestDensity ?? null,
        growthStage: validated.growthStage ?? null,
        weatherConditions: validated.weatherConditions
          ? JSON.stringify(validated.weatherConditions)
          : null,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
      include: {
        farm: { select: { id: true, name: true } },
        field: { select: { id: true, name: true } },
        crop: { select: { id: true, name: true } },
      },
    });

    // Notification for critical alerts
    if (["HIGH", "CRITICAL", "SEVERE"].includes(validated.severity)) {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "PEST_ALERT",
          title: `Pest Alert: ${validated.pestName}`,
          message: `${validated.severity} severity pest alert for ${validated.pestName} on ${farm.name}`,
          metadata: JSON.stringify({ alertId: alert.id, farmId: validated.farmId }),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "create",
        resource: "pest_alert",
        resourceId: alert.id,
        metadata: JSON.stringify({
          farmId: validated.farmId,
          pestName: validated.pestName,
          severity: validated.severity,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: alert,
        message: "Pest alert created successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /api/pests
// ═══════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", {
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const body = await request.json();
    const validated = updatePestAlertSchema.parse(body);
    const { id, ...updates } = validated;

    const existing = await prisma.pestAlert.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Pest alert not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (updates.severity) updateData.severity = updates.severity;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.treatment !== undefined) updateData.treatment = updates.treatment;
    if (updates.actualTreatment !== undefined) updateData.actualTreatment = updates.actualTreatment;
    if (updates.resolutionNotes !== undefined) updateData.resolutionNotes = updates.resolutionNotes;
    if (updates.effectivenessRating !== undefined) updateData.effectivenessRating = updates.effectivenessRating;

    if (updates.resolved) {
      updateData.resolved = true;
      updateData.resolvedAt = updates.resolvedAt ?? new Date();
      updateData.resolvedBy = updates.resolvedBy ?? session.user.id;
    }

    const updated = await prisma.pestAlert.update({
      where: { id },
      data: updateData,
      include: {
        farm: { select: { id: true, name: true } },
        field: { select: { id: true, name: true } },
        crop: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "update",
        resource: "pest_alert",
        resourceId: id,
        metadata: JSON.stringify({ changes: Object.keys(updates) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Pest alert updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/pests
// ═══════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", {
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    if (!["SUPER_ADMIN", "PLATFORM_ADMIN", "FARM_OWNER"].includes(session.user.role)) {
      throw new AppError("Insufficient permissions", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (action === "bulk-resolve" && searchParams.get("farmId")) {
      const farmId = searchParams.get("farmId")!;
      const result = await prisma.pestAlert.updateMany({
        where: {
          farmId,
          resolved: false,
        },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
          resolutionNotes: "Bulk resolved",
        },
      });

      return NextResponse.json({
        success: true,
        data: { count: result.count },
        message: `${result.count} alerts resolved`,
        timestamp: new Date().toISOString(),
      });
    }

    if (id) {
      const existing = await prisma.pestAlert.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError("Pest alert not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      await prisma.pestAlert.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "delete",
          resource: "pest_alert",
          resourceId: id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Pest alert deleted successfully",
        timestamp: new Date().toISOString(),
      });
    }

    throw new AppError("Provide 'id' to delete a specific alert", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
