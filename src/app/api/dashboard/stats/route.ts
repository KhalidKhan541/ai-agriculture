import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const statsQuerySchema = z.object({
  farmId: z.string().optional(),
  period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const query = statsQuerySchema.parse({
      farmId: searchParams.get("farmId"),
      period: searchParams.get("period"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    const now = new Date();
    let dateFrom: Date;
    switch (query.period) {
      case "today": dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case "week": dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case "month": dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case "quarter": dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case "year": dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    }

    if (query.startDate) dateFrom = query.startDate;
    const dateTo = query.endDate ?? now;

    const farmFilter: Record<string, unknown> = {};
    if (query.farmId) farmFilter.farmId = query.farmId;

    const [farmCount, cropStats, equipmentStats, sensorStats, recentPestAlerts, recentOrders, revenueData, weatherAlerts] = await Promise.all([
      prisma.farm.count({ where: query.farmId ? { id: query.farmId } : {} }),
      prisma.crop.groupBy({
        by: ["status"],
        where: { ...farmFilter, createdAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
      }),
      prisma.equipment.aggregate({
        where: farmFilter,
        _count: true,
        _sum: { currentValue: true, hoursUsed: true },
      }),
      prisma.sensor.count({ where: farmFilter }),
      prisma.pestAlert.count({
        where: {
          ...farmFilter,
          resolved: false,
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),
      prisma.order.aggregate({
        where: {
          ...farmFilter,
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _count: true,
        _sum: { totalPrice: true },
      }),
      prisma.marketPrice.aggregate({
        where: { date: { gte: dateFrom, lte: dateTo } },
        _avg: { price: true },
        _count: true,
      }),
      prisma.weatherForecast.count({
        where: {
          ...farmFilter,
          validFrom: { gte: dateFrom },
          validTo: { lte: dateTo },
        },
      }),
    ]);

    const activeCrops = cropStats.reduce((sum, s) => sum + s._count, 0);
    const healthyCrops = cropStats.find((s) => s.status === "GROWING")?._count ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalFarms: farmCount,
          totalCrops: activeCrops,
          healthyCrops,
          cropHealthRate: activeCrops > 0 ? Math.round((healthyCrops / activeCrops) * 100) : 0,
          totalEquipment: equipmentStats._count,
          totalEquipmentValue: equipmentStats._sum.currentValue ?? 0,
          totalEquipmentHours: equipmentStats._sum.hoursUsed ?? 0,
          totalSensors: sensorStats,
          activePestAlerts: recentPestAlerts,
          totalOrders: recentOrders._count,
          totalRevenue: recentOrders._sum.totalPrice ?? 0,
          weatherForecasts: weatherAlerts,
        },
        cropsByStatus: cropStats.map((s) => ({ status: s.status, count: s._count })),
        period: query.period,
        dateRange: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
