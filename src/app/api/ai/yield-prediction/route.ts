import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { predictYield, compareCropYields, generateSeasonalReport } from "@/lib/ai/yield-prediction";
import { z } from "zod";

const predictYieldSchema = z.object({
  farmId: z.string().min(1),
  cropId: z.string().optional(),
  cropType: z.string().min(1),
  areaHa: z.coerce.number().positive(),
  plantingDate: z.coerce.date().optional(),
  soilData: z.object({
    ph: z.coerce.number().min(0).max(14).optional(),
    organicMatter: z.coerce.number().min(0).max(100).optional(),
    nitrogen: z.coerce.number().min(0).optional(),
    phosphorus: z.coerce.number().min(0).optional(),
    potassium: z.coerce.number().min(0).optional(),
  }).optional(),
  weatherData: z.object({
    avgTemperature: z.coerce.number(),
    totalPrecipitation: z.coerce.number().min(0),
    avgHumidity: z.coerce.number().min(0).max(100),
    frostDays: z.coerce.number().min(0).optional(),
  }).optional(),
  includeScenarios: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
});

const compareSchema = z.object({
  farmId: z.string().min(1),
  cropType: z.string().min(1),
  years: z.array(z.coerce.number().int().min(2000).max(2100)).min(2).max(10),
});

const seasonalReportSchema = z.object({
  farmId: z.string().min(1),
  season: z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER"]),
  year: z.coerce.number().int().min(2000).max(2100),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "history") {
      const farmId = searchParams.get("farmId");
      const cropType = searchParams.get("cropType");

      const where: Record<string, unknown> = {};
      if (farmId) where.farmId = farmId;
      if (cropType) where.cropType = cropType;

      const predictions = await prisma.yieldPrediction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { farm: { select: { id: true, name: true } } },
      });

      return NextResponse.json({ success: true, data: predictions, count: predictions.length, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      data: {
        endpoints: {
          "POST ?action=predict": "Predict yield for a crop",
          "POST ?action=compare": "Compare yields across years",
          "POST ?action=seasonal-report": "Generate seasonal report",
          "GET ?action=history": "Get prediction history",
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

    if (action === "predict") {
      const validated = predictYieldSchema.parse(body);
      const prediction = await predictYield({
        cropType: validated.cropType,
        areaHa: validated.areaHa,
        plantingDate: validated.plantingDate,
        soilData: validated.soilData,
        weatherData: validated.weatherData,
        includeScenarios: validated.includeScenarios,
        includeRecommendations: validated.includeRecommendations,
      });

      const saved = await prisma.yieldPrediction.create({
        data: {
          farmId: validated.farmId,
          cropId: validated.cropId ?? null,
          cropType: validated.cropType,
          areaHa: validated.areaHa,
          predictedYield: prediction.predictedYield ?? 0,
          predictedTotal: prediction.predictedTotal ?? 0,
          unit: prediction.unit ?? "kg",
          confidence: prediction.confidence ?? 0,
          factors: prediction.factors ? JSON.stringify(prediction.factors) : null,
          scenarios: prediction.scenarios ? JSON.stringify(prediction.scenarios) : null,
          recommendations: prediction.recommendations ? JSON.stringify(prediction.recommendations) : null,
          createdById: session.user.id,
        },
      });

      return NextResponse.json({ success: true, data: { predictionId: saved.id, ...prediction }, timestamp: new Date().toISOString() }, { status: 201 });
    }

    if (action === "compare") {
      const validated = compareSchema.parse(body);
      const comparison = await compareCropYields({
        farmId: validated.farmId,
        cropType: validated.cropType,
        years: validated.years,
      });
      return NextResponse.json({ success: true, data: comparison, timestamp: new Date().toISOString() });
    }

    if (action === "seasonal-report") {
      const validated = seasonalReportSchema.parse(body);
      const report = await generateSeasonalReport({
        farmId: validated.farmId,
        season: validated.season,
        year: validated.year,
      });
      return NextResponse.json({ success: true, data: report, timestamp: new Date().toISOString() });
    }

    throw new AppError("Invalid action", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
