import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { performComprehensiveAnalysis, analyzeCropImage, detectGrowthStage, assessHealthStatus, batchAnalyzeFields } from "@/lib/ai/crop-monitoring";
import { z } from "zod";

const analyzeImageSchema = z.object({
  imageUrl: z.string().url(),
  farmId: z.string().optional(),
  fieldId: z.string().optional(),
  cropType: z.string().optional(),
  growthStage: z.string().optional(),
  additionalContext: z.string().max(2000).optional(),
});

const comprehensiveAnalysisSchema = z.object({
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  includeRecommendations: z.boolean().default(true),
  includeRiskAssessment: z.boolean().default(true),
});

const growthStageSchema = z.object({
  imageUrl: z.string().url(),
  cropType: z.string().min(1),
  plantingDate: z.coerce.date().optional(),
});

const healthStatusSchema = z.object({
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  cropIds: z.array(z.string()).optional(),
});

const batchAnalysisSchema = z.object({
  farmId: z.string().min(1),
  fieldIds: z.array(z.string()).min(1).max(20),
  imageUrls: z.record(z.string(), z.string().url()),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "health-status") {
      const query = healthStatusSchema.parse({
        farmId: searchParams.get("farmId"),
        fieldId: searchParams.get("fieldId"),
      });

      const crops = await prisma.crop.findMany({
        where: { farmId: query.farmId, ...(query.fieldId && { fieldId: query.fieldId }) },
        include: { field: { select: { id: true, name: true } } },
      });

      const healthReport = crops.map((crop) => ({
        cropId: crop.id,
        cropName: crop.name,
        status: crop.status,
        growthStage: crop.growthStage,
        field: crop.field,
        healthScore: estimateHealthScore(crop.status, crop.growthStage),
        lastUpdated: crop.updatedAt,
      }));

      const overallScore = healthReport.length
        ? healthReport.reduce((sum, r) => sum + r.healthScore, 0) / healthReport.length
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          farmId: query.farmId,
          overallHealthScore: Math.round(overallScore * 100) / 100,
          crops: healthReport,
          summary: {
            total: healthReport.length,
            healthy: healthReport.filter((r) => r.healthScore >= 0.7).length,
            stressed: healthReport.filter((r) => r.healthScore >= 0.4 && r.healthScore < 0.7).length,
            critical: healthReport.filter((r) => r.healthScore < 0.4).length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "analysis-history") {
      const farmId = searchParams.get("farmId");
      const limit = parseInt(searchParams.get("limit") ?? "20");

      const analyses = await prisma.cropHealthAnalysis.findMany({
        where: farmId ? { farmId } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { farm: { select: { id: true, name: true } } },
      });

      return NextResponse.json({ success: true, data: analyses, count: analyses.length, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      data: {
        endpoints: {
          "GET ?action=health-status": "Get crop health status for a farm",
          "GET ?action=analysis-history": "Get analysis history",
          "POST ?action=analyze-image": "Analyze a single crop image",
          "POST ?action=comprehensive": "Comprehensive farm analysis",
          "POST ?action=growth-stage": "Detect growth stage from image",
          "POST ?action=batch": "Batch analyze multiple fields",
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "analyze-image") {
      const validated = analyzeImageSchema.parse(body);
      const result = await analyzeCropImage({
        imageUrl: validated.imageUrl,
        cropType: validated.cropType,
        growthStage: validated.growthStage,
      });

      const analysis = await prisma.cropHealthAnalysis.create({
        data: {
          farmId: validated.farmId ?? "external",
          fieldId: validated.fieldId ?? null,
          imageUrl: validated.imageUrl,
          analysisType: "image",
          result: JSON.stringify(result),
          healthScore: result.healthScore ?? null,
          createdById: session.user.id,
        },
      });

      return NextResponse.json({ success: true, data: { analysis, result }, timestamp: new Date().toISOString() }, { status: 201 });
    }

    if (action === "comprehensive") {
      const validated = comprehensiveAnalysisSchema.parse(body);
      const result = await performComprehensiveAnalysis({
        farmId: validated.farmId,
        fieldId: validated.fieldId,
        latitude: validated.latitude,
        longitude: validated.longitude,
        imageUrls: validated.imageUrls,
        includeRecommendations: validated.includeRecommendations,
        includeRiskAssessment: validated.includeRiskAssessment,
      });

      const analysis = await prisma.cropHealthAnalysis.create({
        data: {
          farmId: validated.farmId,
          fieldId: validated.fieldId ?? null,
          analysisType: "comprehensive",
          result: JSON.stringify(result),
          healthScore: result.overallHealthScore ?? null,
          createdById: session.user.id,
        },
      });

      return NextResponse.json({ success: true, data: { analysisId: analysis.id, ...result }, timestamp: new Date().toISOString() }, { status: 201 });
    }

    if (action === "growth-stage") {
      const validated = growthStageSchema.parse(body);
      const result = await detectGrowthStage({
        imageUrl: validated.imageUrl,
        cropType: validated.cropType,
        plantingDate: validated.plantingDate,
      });
      return NextResponse.json({ success: true, data: result, timestamp: new Date().toISOString() });
    }

    if (action === "batch") {
      const validated = batchAnalysisSchema.parse(body);
      const results = await batchAnalyzeFields({
        farmId: validated.farmId,
        fieldIds: validated.fieldIds,
        imageUrls: validated.imageUrls,
      });
      return NextResponse.json({ success: true, data: results, count: results.length, timestamp: new Date().toISOString() }, { status: 201 });
    }

    throw new AppError("Invalid action", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

function estimateHealthScore(status: string, growthStage: string | null): number {
  const statusScores: Record<string, number> = {
    GROWING: 0.8, FLOWERING: 0.85, FRUITING: 0.9, MATURING: 0.85, READY_FOR_HARVEST: 0.9,
    SEEDING: 0.7, GERMINATING: 0.6, PLANNED: 0.5, DORMANT: 0.4,
    DISEASED: 0.2, FAILED: 0.1, HARVESTED: 0.0,
  };
  return statusScores[status] ?? 0.5;
}
