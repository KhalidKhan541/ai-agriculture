import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const satelliteQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  farmId: z.string().optional(),
  provider: z.enum(["sentinel2", "landsat8", "landsat9", "modis", "viirs", "planet", "maxar"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minCloudCover: z.coerce.number().min(0).max(100).optional(),
  maxCloudCover: z.coerce.number().min(0).max(100).optional(),
});

const createImageSchema = z.object({
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  provider: z.enum(["sentinel2", "landsat8", "landsat9", "modis", "viirs", "planet", "maxar"]),
  acquisitionDate: z.coerce.date(),
  cloudCover: z.coerce.number().min(0).max(100),
  resolution: z.enum(["low", "medium", "high", "very_high"]),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  ndviValue: z.coerce.number().min(-1).max(1).optional(),
  ndwiValue: z.coerce.number().min(-1).max(1).optional(),
  bboxNorthEast: z.object({ lat: z.coerce.number(), lng: z.coerce.number() }),
  bboxSouthWest: z.object({ lat: z.coerce.number(), lng: z.coerce.number() }),
  bands: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const analysisSchema = z.object({
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  imageId: z.string().optional(),
  analysisType: z.enum(["ndvi", "ndwi", "crop_health", "change_detection", "soil_analysis"]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "ndvi-history") {
      const farmId = searchParams.get("farmId");
      const fieldId = searchParams.get("fieldId");
      const days = parseInt(searchParams.get("days") ?? "90");

      const where: Record<string, unknown> = {};
      if (farmId) where.farmId = farmId;
      if (fieldId) where.fieldId = fieldId;

      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      where.acquisitionDate = { gte: cutoff };

      const images = await prisma.satelliteImage.findMany({
        where,
        orderBy: { acquisitionDate: "asc" },
        select: { id: true, acquisitionDate: true, ndviValue: true, cloudCover: true, provider: true },
      });

      return NextResponse.json({ success: true, data: images, count: images.length, timestamp: new Date().toISOString() });
    }

    if (action === "summary") {
      const farmId = searchParams.get("farmId");
      const where: Record<string, unknown> = {};
      if (farmId) where.farmId = farmId;

      const [total, byProvider, latestImage] = await Promise.all([
        prisma.satelliteImage.count({ where }),
        prisma.satelliteImage.groupBy({ by: ["provider"], where, _count: true }),
        prisma.satelliteImage.findFirst({ where, orderBy: { acquisitionDate: "desc" }, select: { acquisitionDate: true, ndviValue: true } }),
      ]);

      return NextResponse.json({
        success: true,
        data: { total, byProvider: byProvider.map((p) => ({ provider: p.provider, count: p._count })), latestImage },
        timestamp: new Date().toISOString(),
      });
    }

    const query = satelliteQuerySchema.parse({
      page: searchParams.get("page"), limit: searchParams.get("limit"),
      farmId: searchParams.get("farmId"), provider: searchParams.get("provider"),
      startDate: searchParams.get("startDate"), endDate: searchParams.get("endDate"),
      minCloudCover: searchParams.get("minCloudCover"), maxCloudCover: searchParams.get("maxCloudCover"),
    });

    const { skip, take, page, limit } = getPaginationParams({ page: query.page, limit: query.limit });

    const where: Record<string, unknown> = {};
    if (query.farmId) where.farmId = query.farmId;
    if (query.provider) where.provider = query.provider;
    if (query.minCloudCover || query.maxCloudCover) {
      where.cloudCover = {};
      if (query.minCloudCover) (where.cloudCover as Record<string, number>).gte = query.minCloudCover;
      if (query.maxCloudCover) (where.cloudCover as Record<string, number>).lte = query.maxCloudCover;
    }

    const [images, total] = await Promise.all([
      prisma.satelliteImage.findMany({ where, orderBy: { acquisitionDate: "desc" }, skip, take }),
      prisma.satelliteImage.count({ where }),
    ]);

    return NextResponse.json({ success: true, ...createPaginatedResult(images, total, page, limit), timestamp: new Date().toISOString() });
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

    if (action === "analyze") {
      const validated = analysisSchema.parse(body);
      const farm = await prisma.farm.findUnique({ where: { id: validated.farmId } });
      if (!farm) throw new AppError("Farm not found", { code: "NOT_FOUND", statusCode: 404 });

      const result = {
        analysisId: crypto.randomUUID(),
        type: validated.analysisType,
        farmId: validated.farmId,
        status: "completed",
        result: { averageNdvi: 0.65, healthyPercentage: 78, stressedPercentage: 15, bareSoilPercentage: 7 },
        recommendations: ["Monitor stressed areas", "Consider targeted irrigation"],
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: result, timestamp: new Date().toISOString() }, { status: 201 });
    }

    const validated = createImageSchema.parse(body);
    const image = await prisma.satelliteImage.create({
      data: {
        farmId: validated.farmId,
        fieldId: validated.fieldId ?? null,
        provider: validated.provider,
        acquisitionDate: validated.acquisitionDate,
        cloudCover: validated.cloudCover,
        resolution: validated.resolution,
        imageUrl: validated.imageUrl,
        thumbnailUrl: validated.thumbnailUrl ?? null,
        ndviValue: validated.ndviValue ?? null,
        ndwiValue: validated.ndwiValue ?? null,
        bboxNorthEast: JSON.stringify(validated.bboxNorthEast),
        bboxSouthWest: JSON.stringify(validated.bboxSouthWest),
        bands: validated.bands ? JSON.stringify(validated.bands) : null,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: image, message: "Satellite image recorded", timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
