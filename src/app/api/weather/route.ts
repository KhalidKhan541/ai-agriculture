import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult, buildSearchFilter, buildDateRangeFilter } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import {
  getCurrentWeather,
  getWeatherForecast,
  getHistoricalWeather,
  calculateWeatherStatistics,
  getWeatherAlerts,
  configureWeatherService,
  WeatherServiceError,
} from "@/lib/weather/weather-service";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const currentWeatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

const historicalWeatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const weatherLogsQuerySchema = z.object({
  farmId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("recordedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  condition: z.string().optional(),
  search: z.string().optional(),
});

const createWeatherLogSchema = z.object({
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  temperature: z.coerce.number(),
  feelsLike: z.coerce.number().optional(),
  humidity: z.coerce.number().min(0).max(100),
  pressure: z.coerce.number().positive().optional(),
  windSpeed: z.coerce.number().min(0).optional(),
  windDirection: z.coerce.number().min(0).max(360).optional(),
  windGust: z.coerce.number().min(0).optional(),
  visibility: z.coerce.number().min(0).optional(),
  uvIndex: z.coerce.number().min(0).max(15).optional(),
  cloudCover: z.coerce.number().min(0).max(100).optional(),
  precipitation: z.coerce.number().min(0).optional(),
  precipitationType: z.enum(["none", "rain", "snow", "sleet", "hail"]).default("none"),
  condition: z.string().optional(),
  recordedAt: z.coerce.date().default(new Date()),
  source: z.string().default("manual"),
  metadata: z.record(z.unknown()).optional(),
});

const bulkWeatherLogSchema = z.object({
  farmId: z.string().min(1),
  logs: z.array(
    z.object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      temperature: z.coerce.number(),
      humidity: z.coerce.number().min(0).max(100),
      windSpeed: z.coerce.number().min(0).optional(),
      precipitation: z.coerce.number().min(0).optional(),
      condition: z.string().optional(),
      recordedAt: z.coerce.date(),
      metadata: z.record(z.unknown()).optional(),
    })
  ).min(1).max(500),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/weather
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

    // Current weather for a location
    if (action === "current") {
      const query = currentWeatherQuerySchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
      });

      const weather = await getCurrentWeather(query.latitude, query.longitude);

      return NextResponse.json({
        success: true,
        data: weather,
        timestamp: new Date().toISOString(),
      });
    }

    // Full forecast for a location
    if (action === "forecast") {
      const query = currentWeatherQuerySchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
      });

      const forecast = await getWeatherForecast(query.latitude, query.longitude);

      return NextResponse.json({
        success: true,
        data: forecast,
        timestamp: new Date().toISOString(),
      });
    }

    // Historical weather data
    if (action === "historical") {
      const query = historicalWeatherQuerySchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
        startDate: searchParams.get("startDate"),
        endDate: searchParams.get("endDate"),
      });

      const historicalData = await getHistoricalWeather(
        query.latitude,
        query.longitude,
        query.startDate,
        query.endDate
      );

      const statistics = calculateWeatherStatistics(historicalData);

      return NextResponse.json({
        success: true,
        data: {
          readings: historicalData,
          statistics,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Weather alerts
    if (action === "alerts") {
      const query = currentWeatherQuerySchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
      });

      const alerts = await getWeatherAlerts(query.latitude, query.longitude);

      return NextResponse.json({
        success: true,
        data: alerts,
        count: alerts.length,
        timestamp: new Date().toISOString(),
      });
    }

    // List stored weather logs from database
    const query = weatherLogsQuerySchema.parse({
      farmId: searchParams.get("farmId"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      orderBy: searchParams.get("orderBy"),
      order: searchParams.get("order"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      condition: searchParams.get("condition"),
      search: searchParams.get("search"),
    });

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: query.page,
      limit: query.limit,
      orderBy: query.orderBy,
      order: query.order,
    });

    const where: Record<string, unknown> = {};

    if (query.farmId) {
      where.farmId = query.farmId;
    }

    if (query.condition) {
      where.condition = query.condition;
    }

    const dateFilter = buildDateRangeFilter("recordedAt", query.startDate, query.endDate);
    if (dateFilter) {
      Object.assign(where, dateFilter);
    }

    const searchFilter = buildSearchFilter(query.search, ["condition", "source"]);
    if (searchFilter) {
      Object.assign(where, searchFilter);
    }

    const [weatherLogs, total] = await Promise.all([
      prisma.weatherLog.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          farm: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.weatherLog.count({ where }),
    ]);

    const result = createPaginatedResult(weatherLogs, total, page, limit);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/weather
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

    // Bulk insert weather logs
    if (action === "bulk") {
      const validated = bulkWeatherLogSchema.parse(body);

      const logs = validated.logs.map((log) => ({
        farmId: validated.farmId,
        latitude: log.latitude,
        longitude: log.longitude,
        temperature: log.temperature,
        humidity: log.humidity,
        windSpeed: log.windSpeed ?? null,
        precipitation: log.precipitation ?? null,
        precipitationType: "none" as const,
        condition: log.condition ?? null,
        recordedAt: log.recordedAt,
        source: "bulk_import",
        metadata: log.metadata ? JSON.stringify(log.metadata) : null,
        createdById: session.user.id,
      }));

      const result = await prisma.weatherLog.createMany({
        data: logs,
        skipDuplicates: true,
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "create",
          resource: "weather_log",
          resourceId: validated.farmId,
          metadata: JSON.stringify({ count: result.count, action: "bulk_import" }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: { count: result.count },
          message: `${result.count} weather logs created successfully`,
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Single weather log creation
    const validated = createWeatherLogSchema.parse(body);

    // Verify farm exists and user has access
    const farm = await prisma.farm.findUnique({
      where: { id: validated.farmId },
      select: { id: true, name: true },
    });

    if (!farm) {
      throw new AppError("Farm not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    const weatherLog = await prisma.weatherLog.create({
      data: {
        farmId: validated.farmId,
        fieldId: validated.fieldId ?? null,
        latitude: validated.latitude,
        longitude: validated.longitude,
        temperature: validated.temperature,
        feelsLike: validated.feelsLike ?? null,
        humidity: validated.humidity,
        pressure: validated.pressure ?? null,
        windSpeed: validated.windSpeed ?? null,
        windDirection: validated.windDirection ?? null,
        windGust: validated.windGust ?? null,
        visibility: validated.visibility ?? null,
        uvIndex: validated.uvIndex ?? null,
        cloudCover: validated.cloudCover ?? null,
        precipitation: validated.precipitation ?? null,
        precipitationType: validated.precipitationType,
        condition: validated.condition ?? null,
        recordedAt: validated.recordedAt,
        source: validated.source,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
      include: {
        farm: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "create",
        resource: "weather_log",
        resourceId: weatherLog.id,
        metadata: JSON.stringify({
          farmId: validated.farmId,
          temperature: validated.temperature,
          condition: validated.condition,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: weatherLog,
        message: "Weather log created successfully",
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
// PUT /api/weather
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
    const { id, ...updates } = body;

    if (!id) {
      throw new AppError("Weather log ID is required", {
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
    }

    const existing = await prisma.weatherLog.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Weather log not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    const updatedLog = await prisma.weatherLog.update({
      where: { id },
      data: {
        ...(updates.temperature !== undefined && { temperature: updates.temperature }),
        ...(updates.humidity !== undefined && { humidity: updates.humidity }),
        ...(updates.windSpeed !== undefined && { windSpeed: updates.windSpeed }),
        ...(updates.precipitation !== undefined && { precipitation: updates.precipitation }),
        ...(updates.condition !== undefined && { condition: updates.condition }),
        ...(updates.metadata !== undefined && { metadata: JSON.stringify(updates.metadata) }),
      },
      include: {
        farm: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "update",
        resource: "weather_log",
        resourceId: id,
        metadata: JSON.stringify({ changes: Object.keys(updates) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLog,
      message: "Weather log updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/weather
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

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PLATFORM_ADMIN") {
      throw new AppError("Insufficient permissions", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const farmId = searchParams.get("farmId");

    if (id) {
      const existing = await prisma.weatherLog.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError("Weather log not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      await prisma.weatherLog.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "delete",
          resource: "weather_log",
          resourceId: id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Weather log deleted successfully",
        timestamp: new Date().toISOString(),
      });
    }

    if (farmId) {
      const result = await prisma.weatherLog.deleteMany({
        where: { farmId },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "delete",
          resource: "weather_log",
          resourceId: farmId,
          metadata: JSON.stringify({ count: result.count, farmId }),
        },
      });

      return NextResponse.json({
        success: true,
        data: { count: result.count },
        message: `${result.count} weather logs deleted`,
        timestamp: new Date().toISOString(),
      });
    }

    throw new AppError("Provide either 'id' or 'farmId' to delete", {
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
