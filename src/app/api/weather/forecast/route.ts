import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import {
  getDailyForecast,
  getHourlyForecast,
  getWeatherForecast,
  generateFarmingCalendar,
  compareLocations,
  getHistoricalWeather,
  calculateWeatherStatistics,
  WeatherServiceError,
} from "@/lib/weather/weather-service";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const forecastQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().int().min(1).max(14).default(7),
  includeAgricultural: z.coerce.boolean().default(true),
});

const hourlyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  hours: z.coerce.number().int().min(1).max(48).default(24),
});

const farmingCalendarSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  months: z.coerce.number().int().min(1).max(36).default(12),
});

const compareLocationsSchema = z.object({
  locations: z
    .array(
      z.object({
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180),
        name: z.string().optional(),
      })
    )
    .min(2)
    .max(10),
});

const savedForecastSchema = z.object({
  farmId: z.string().min(1),
  fieldId: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  forecastData: z.record(z.unknown()),
  forecastType: z.enum(["daily", "hourly", "full", "agricultural"]).default("full"),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  source: z.string().default("openweathermap"),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/weather/forecast
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
    const action = searchParams.get("action") ?? "daily";

    // Full weather forecast with agricultural data
    if (action === "full") {
      const query = forecastQuerySchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
        days: searchParams.get("days"),
        includeAgricultural: searchParams.get("includeAgricultural"),
      });

      const forecast = await getWeatherForecast(query.latitude, query.longitude);

      return NextResponse.json({
        success: true,
        data: {
          ...forecast,
          metadata: {
            latitude: query.latitude,
            longitude: query.longitude,
            generatedAt: new Date().toISOString(),
            includeAgricultural: query.includeAgricultural,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Daily forecast
    if (action === "daily") {
      const query = forecastQuerySchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
        days: searchParams.get("days"),
      });

      const dailyForecast = await getDailyForecast(
        query.latitude,
        query.longitude,
        query.days
      );

      return NextResponse.json({
        success: true,
        data: dailyForecast,
        count: dailyForecast.length,
        metadata: {
          latitude: query.latitude,
          longitude: query.longitude,
          days: query.days,
          generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Hourly forecast
    if (action === "hourly") {
      const query = hourlyQuerySchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
        hours: searchParams.get("hours"),
      });

      const hourlyForecast = await getHourlyForecast(
        query.latitude,
        query.longitude,
        query.hours
      );

      return NextResponse.json({
        success: true,
        data: hourlyForecast,
        count: hourlyForecast.length,
        metadata: {
          latitude: query.latitude,
          longitude: query.longitude,
          hours: query.hours,
          generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Farming calendar
    if (action === "calendar") {
      const query = farmingCalendarSchema.parse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
        months: searchParams.get("months"),
      });

      const historicalData = await getHistoricalWeather(
        query.latitude,
        query.longitude,
        new Date(Date.now() - query.months * 30 * 24 * 60 * 60 * 1000),
        new Date()
      );

      const calendar = generateFarmingCalendar(historicalData);

      return NextResponse.json({
        success: true,
        data: calendar,
        count: calendar.length,
        metadata: {
          latitude: query.latitude,
          longitude: query.longitude,
          months: query.months,
          generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Compare multiple locations
    if (action === "compare") {
      const rawLocations = searchParams.get("locations");
      if (!rawLocations) {
        throw new AppError("Locations parameter is required (JSON array)", {
          code: "VALIDATION_ERROR",
          statusCode: 400,
        });
      }

      const parsedLocations = JSON.parse(rawLocations);
      const validated = compareLocationsSchema.parse({ locations: parsedLocations });

      const comparisons = await compareLocations(
        validated.locations.map((loc) => ({
          lat: loc.latitude,
          lon: loc.longitude,
          name: loc.name,
        }))
      );

      return NextResponse.json({
        success: true,
        data: comparisons,
        count: comparisons.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Get saved forecasts from database
    const farmId = searchParams.get("farmId");
    const forecastType = searchParams.get("forecastType");

    const where: Record<string, unknown> = {};
    if (farmId) where.farmId = farmId;
    if (forecastType) where.forecastType = forecastType;

    const savedForecasts = await prisma.weatherForecast.findMany({
      where,
      orderBy: { validFrom: "desc" },
      take: 50,
      include: {
        farm: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: savedForecasts,
      count: savedForecasts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/weather/forecast
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

    // Save a forecast to database
    if (action === "save") {
      const validated = savedForecastSchema.parse(body);

      const farm = await prisma.farm.findUnique({
        where: { id: validated.farmId },
      });

      if (!farm) {
        throw new AppError("Farm not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      const savedForecast = await prisma.weatherForecast.create({
        data: {
          farmId: validated.farmId,
          fieldId: validated.fieldId ?? null,
          latitude: validated.latitude,
          longitude: validated.longitude,
          forecastData: JSON.stringify(validated.forecastData),
          forecastType: validated.forecastType,
          validFrom: validated.validFrom,
          validTo: validated.validTo,
          source: validated.source,
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
          resource: "weather_forecast",
          resourceId: savedForecast.id,
          metadata: JSON.stringify({
            farmId: validated.farmId,
            forecastType: validated.forecastType,
          }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: savedForecast,
          message: "Forecast saved successfully",
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Generate and save forecast for a farm
    if (action === "generate") {
      const bodySchema = z.object({
        farmId: z.string().min(1),
        fieldId: z.string().optional(),
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180),
        days: z.coerce.number().int().min(1).max(14).default(7),
      });

      const validated = bodySchema.parse(body);

      const farm = await prisma.farm.findUnique({
        where: { id: validated.farmId },
      });

      if (!farm) {
        throw new AppError("Farm not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      // Fetch live forecast
      const forecast = await getWeatherForecast(validated.latitude, validated.longitude);

      // Save to database
      const savedForecast = await prisma.weatherForecast.create({
        data: {
          farmId: validated.farmId,
          fieldId: validated.fieldId ?? null,
          latitude: validated.latitude,
          longitude: validated.longitude,
          forecastData: JSON.stringify(forecast),
          forecastType: "full",
          validFrom: new Date(),
          validTo: new Date(Date.now() + validated.days * 24 * 60 * 60 * 1000),
          source: "openweathermap",
          createdById: session.user.id,
        },
      });

      // Create alerts if severe weather detected
      const alerts = forecast.alerts || [];
      if (alerts.length > 0) {
        for (const alert of alerts) {
          await prisma.notification.create({
            data: {
              userId: session.user.id,
              type: "WEATHER_ALERT",
              title: `Weather Alert: ${alert.event}`,
              message: alert.description,
              metadata: JSON.stringify({
                farmId: validated.farmId,
                severity: alert.severity,
                onset: alert.onset,
                expires: alert.expires,
              }),
            },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "generate",
          resource: "weather_forecast",
          resourceId: savedForecast.id,
          metadata: JSON.stringify({
            farmId: validated.farmId,
            alertsCount: alerts.length,
          }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            forecast,
            savedForecastId: savedForecast.id,
            alertsGenerated: alerts.length,
          },
          message: "Forecast generated and saved successfully",
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    throw new AppError("Invalid action. Use 'save' or 'generate'", {
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
// DELETE /api/weather/forecast
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const farmId = searchParams.get("farmId");

    if (id) {
      const existing = await prisma.weatherForecast.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError("Saved forecast not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      await prisma.weatherForecast.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "delete",
          resource: "weather_forecast",
          resourceId: id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Forecast deleted successfully",
        timestamp: new Date().toISOString(),
      });
    }

    if (farmId) {
      // Delete expired forecasts for a farm
      const result = await prisma.weatherForecast.deleteMany({
        where: {
          farmId,
          validTo: { lt: new Date() },
        },
      });

      return NextResponse.json({
        success: true,
        data: { count: result.count },
        message: `${result.count} expired forecasts deleted`,
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
