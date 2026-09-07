import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { identifyPest } from "@/lib/ai/pest-detection";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const updatePestAlertSchema = z.object({
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL", "SEVERE"]).optional(),
  description: z.string().max(5000).optional(),
  symptoms: z.string().max(5000).optional(),
  treatment: z.string().max(5000).optional(),
  prevention: z.string().max(5000).optional(),
  actualTreatment: z.string().max(5000).optional(),
  resolved: z.boolean().optional(),
  resolvedAt: z.coerce.date().optional(),
  resolvedBy: z.string().optional(),
  resolutionNotes: z.string().max(5000).optional(),
  effectivenessRating: z.coerce.number().min(0).max(10).optional(),
  areaHa: z.coerce.number().positive().optional(),
  pestDensity: z.coerce.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const reAnalyzeSchema = z.object({
  imageUrl: z.string().url(),
  additionalContext: z.string().optional(),
});

const addNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(["observation", "treatment", "follow_up", "general"]).default("general"),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/pests/[id]
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", {
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include")?.split(",") ?? [];

    const alert = await prisma.pestAlert.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true, status: true } },
        field: include.includes("field")
          ? { select: { id: true, name: true, areaHa: true, soilType: true } }
          : false,
        crop: include.includes("crop")
          ? { select: { id: true, name: true, status: true, growthStage: true } }
          : false,
        createdBy: include.includes("user")
          ? { select: { id: true, name: true, email: true } }
          : false,
      },
    });

    if (!alert) {
      throw new AppError("Pest alert not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    // Get related alerts for same pest on same farm
    const relatedAlerts = await prisma.pestAlert.findMany({
      where: {
        farmId: alert.farmId,
        pestName: alert.pestName,
        id: { not: id },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        pestName: true,
        severity: true,
        resolved: true,
        createdAt: true,
        field: { select: { name: true } },
      },
    });

    // Get treatment history
    const treatmentHistory = await prisma.pestAlert.findMany({
      where: {
        farmId: alert.farmId,
        pestName: alert.pestName,
        resolved: true,
        actualTreatment: { not: null },
      },
      orderBy: { resolvedAt: "desc" },
      take: 5,
      select: {
        id: true,
        actualTreatment: true,
        effectivenessRating: true,
        resolvedAt: true,
        resolutionNotes: true,
      },
    });

    // Count active alerts for this farm
    const activeAlertsCount = await prisma.pestAlert.count({
      where: {
        farmId: alert.farmId,
        resolved: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...alert,
        relatedAlerts,
        treatmentHistory,
        activeAlertsCount,
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
// PUT /api/pests/[id]
// ═══════════════════════════════════════════════════════════════

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", {
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const { id } = params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Re-analyze with AI
    if (action === "re-analyze") {
      const validated = reAnalyzeSchema.parse(body);

      const existing = await prisma.pestAlert.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError("Pest alert not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      const detection = await identifyPest({
        imageUrl: validated.imageUrl,
        cropType: existing.growthStage ?? undefined,
        additionalContext: validated.additionalContext,
      });

      const updated = await prisma.pestAlert.update({
        where: { id },
        data: {
          pestName: detection.pestName,
          scientificName: detection.scientificName ?? existing.scientificName,
          category: detection.category as string,
          severity: detection.severity as string,
          confidence: detection.confidence,
          imageUrl: validated.imageUrl,
          description: detection.description ?? existing.description,
          symptoms: detection.symptoms ?? existing.symptoms,
          treatment: detection.treatmentRecommendation ?? existing.treatment,
          metadata: JSON.stringify({
            ...JSON.parse(existing.metadata ?? "{}"),
            reAnalysis: {
              timestamp: new Date().toISOString(),
              previousConfidence: existing.confidence,
              newConfidence: detection.confidence,
              model: detection.model,
            },
          }),
        },
        include: {
          farm: { select: { id: true, name: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "re_analyze",
          resource: "pest_alert",
          resourceId: id,
          metadata: JSON.stringify({
            newConfidence: detection.confidence,
            pestName: detection.pestName,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          alert: updated,
          detection,
        },
        message: "Pest alert re-analyzed successfully",
        timestamp: new Date().toISOString(),
      });
    }

    // Add a note to the alert
    if (action === "note") {
      const validated = addNoteSchema.parse(body);

      const existing = await prisma.pestAlert.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError("Pest alert not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      const currentMetadata = JSON.parse(existing.metadata ?? "{}");
      const notes = currentMetadata.notes ?? [];
      notes.push({
        id: crypto.randomUUID(),
        content: validated.content,
        type: validated.type,
        authorId: session.user.id,
        authorName: session.user.name,
        createdAt: new Date().toISOString(),
      });

      const updated = await prisma.pestAlert.update({
        where: { id },
        data: {
          metadata: JSON.stringify({ ...currentMetadata, notes }),
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Note added successfully",
        timestamp: new Date().toISOString(),
      });
    }

    // Standard update
    const validated = updatePestAlertSchema.parse(body);

    const existing = await prisma.pestAlert.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Pest alert not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (validated.severity) updateData.severity = validated.severity;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.symptoms !== undefined) updateData.symptoms = validated.symptoms;
    if (validated.treatment !== undefined) updateData.treatment = validated.treatment;
    if (validated.prevention !== undefined) updateData.prevention = validated.prevention;
    if (validated.actualTreatment !== undefined) updateData.actualTreatment = validated.actualTreatment;
    if (validated.resolutionNotes !== undefined) updateData.resolutionNotes = validated.resolutionNotes;
    if (validated.effectivenessRating !== undefined) updateData.effectivenessRating = validated.effectivenessRating;
    if (validated.areaHa !== undefined) updateData.areaHa = validated.areaHa;
    if (validated.pestDensity !== undefined) updateData.pestDensity = validated.pestDensity;
    if (validated.imageUrl) updateData.imageUrl = validated.imageUrl;

    if (validated.resolved) {
      updateData.resolved = true;
      updateData.resolvedAt = validated.resolvedAt ?? new Date();
      updateData.resolvedBy = validated.resolvedBy ?? session.user.id;
    }

    if (validated.metadata) {
      const currentMetadata = JSON.parse(existing.metadata ?? "{}");
      updateData.metadata = JSON.stringify({ ...currentMetadata, ...validated.metadata });
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
        metadata: JSON.stringify({ changes: Object.keys(validated).filter((k) => k !== "id") }),
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
// PATCH /api/pests/[id]
// ═══════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError("Authentication required", {
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const { id } = params;
    const body = await request.json();

    const existing = await prisma.pestAlert.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Pest alert not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    // Quick resolve endpoint
    if (body.resolved === true) {
      const updated = await prisma.pestAlert.update({
        where: { id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
          resolutionNotes: body.resolutionNotes ?? "Resolved",
          effectivenessRating: body.effectivenessRating ?? null,
        },
        include: {
          farm: { select: { id: true, name: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "resolve",
          resource: "pest_alert",
          resourceId: id,
          metadata: JSON.stringify({
            effectivenessRating: body.effectivenessRating,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Pest alert resolved",
        timestamp: new Date().toISOString(),
      });
    }

    // Quick severity update
    if (body.severity) {
      const updated = await prisma.pestAlert.update({
        where: { id },
        data: { severity: body.severity },
        include: {
          farm: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Severity updated",
        timestamp: new Date().toISOString(),
      });
    }

    throw new AppError("Invalid PATCH body. Provide 'resolved' or 'severity'", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/pests/[id]
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

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
        metadata: JSON.stringify({
          pestName: existing.pestName,
          farmId: existing.farmId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pest alert deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
