import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { identifyPest, batchDetectPests, analyzePestTrends, analyzeCostBenefit } from "@/lib/ai/pest-detection";
import { z } from "zod";

const detectSchema = z.object({
  imageUrl: z.string().url(),
  farmId: z.string().optional(),
  fieldId: z.string().optional(),
  cropType: z.string().optional(),
  additionalContext: z.string().max(2000).optional(),
  createAlert: z.boolean().default(true),
});

const batchDetectSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(20),
  farmId: z.string().optional(),
  cropType: z.string().optional(),
});

const trendAnalysisSchema = z.object({
  farmId: z.string().optional(),
  periodDays: z.coerce.number().int().min(7).max(365).default(30),
  category: z.string().optional(),
});

const costBenefitSchema = z.object({
  pestType: z.string().min(1),
  farmId: z.string().optional(),
  treatmentCost: z.coerce.number().min(0).optional(),
  affectedAreaHa: z.coerce.number().min(0).optional(),
  cropValuePerHa: z.coerce.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "trends") {
      const query = trendAnalysisSchema.parse({
        farmId: searchParams.get("farmId"),
        periodDays: searchParams.get("periodDays"),
        category: searchParams.get("category"),
      });
      const trends = await analyzePestTrends(query);
      return NextResponse.json({ success: true, data: trends, timestamp: new Date().toISOString() });
    }

    if (action === "cost-benefit") {
      const query = costBenefitSchema.parse({
        pestType: searchParams.get("pestType"),
        farmId: searchParams.get("farmId"),
        treatmentCost: searchParams.get("treatmentCost"),
        affectedAreaHa: searchParams.get("affectedAreaHa"),
        cropValuePerHa: searchParams.get("cropValuePerHa"),
      });
      const analysis = await analyzeCostBenefit(query);
      return NextResponse.json({ success: true, data: analysis, timestamp: new Date().toISOString() });
    }

    if (action === "detection-history") {
      const farmId = searchParams.get("farmId");
      const limit = parseInt(searchParams.get("limit") ?? "30");

      const detections = await prisma.pestDetection.findMany({
        where: farmId ? { farmId } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { farm: { select: { id: true, name: true } } },
      });

      return NextResponse.json({ success: true, data: detections, count: detections.length, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      data: {
        endpoints: {
          "POST ?action=detect": "Detect pest from image",
          "POST ?action=batch-detect": "Batch detect pests",
          "GET ?action=trends": "Analyze pest trends",
          "GET ?action=cost-benefit": "Cost-benefit analysis",
          "GET ?action=detection-history": "Detection history",
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

    if (action === "detect") {
      const validated = detectSchema.parse(body);
      const detection = await identifyPest({
        imageUrl: validated.imageUrl,
        cropType: validated.cropType,
        additionalContext: validated.additionalContext,
      });

      const saved = await prisma.pestDetection.create({
        data: {
          farmId: validated.farmId ?? "external",
          fieldId: validated.fieldId ?? null,
          imageUrl: validated.imageUrl,
          pestName: detection.pestName,
          scientificName: detection.scientificName ?? null,
          category: detection.category as string,
          confidence: detection.confidence,
          severity: detection.severity as string,
          description: detection.description ?? null,
          treatmentRecommendation: detection.treatmentRecommendation ?? null,
          result: JSON.stringify(detection),
          createdById: session.user.id,
        },
      });

      let alert = null;
      if (validated.createAlert && validated.farmId && detection.confidence > 0.7) {
        alert = await prisma.pestAlert.create({
          data: {
            farmId: validated.farmId,
            fieldId: validated.fieldId ?? null,
            pestName: detection.pestName,
            scientificName: detection.scientificName ?? null,
            category: detection.category as string,
            severity: detection.severity as string,
            detectedBy: "ai",
            description: detection.description ?? null,
            treatment: detection.treatmentRecommendation ?? null,
            imageUrl: validated.imageUrl,
            confidence: detection.confidence,
            createdById: session.user.id,
          },
        });
      }

      return NextResponse.json(
        { success: true, data: { detectionId: saved.id, detection, alert }, timestamp: new Date().toISOString() },
        { status: 201 }
      );
    }

    if (action === "batch-detect") {
      const validated = batchDetectSchema.parse(body);
      const results = await batchDetectPests({
        imageUrls: validated.imageUrls,
        cropType: validated.cropType,
      });

      const saved = await prisma.pestDetection.createMany({
        data: results.map((r) => ({
          farmId: validated.farmId ?? "external",
          imageUrl: r.imageUrl ?? "",
          pestName: r.pestName,
          category: r.category as string,
          confidence: r.confidence,
          severity: r.severity as string,
          result: JSON.stringify(r),
          createdById: session.user.id,
        })),
      });

      return NextResponse.json(
        { success: true, data: { count: saved.count, results }, timestamp: new Date().toISOString() },
        { status: 201 }
      );
    }

    throw new AppError("Invalid action", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
