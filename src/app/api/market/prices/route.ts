import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult, buildSearchFilter } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const priceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
  cropName: z.string().optional(),
  marketId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

const createPriceSchema = z.object({
  marketId: z.string().min(1),
  cropName: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  unit: z.string().max(20).default("kg"),
  price: z.coerce.number().positive(),
  currency: z.string().max(3).default("USD"),
  date: z.coerce.date().default(new Date()),
  highPrice: z.coerce.number().min(0).optional(),
  lowPrice: z.coerce.number().min(0).optional(),
  avgPrice: z.coerce.number().min(0).optional(),
  volume: z.coerce.number().min(0).optional(),
  source: z.string().max(200).default("manual"),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const bulkPriceSchema = z.object({
  prices: z.array(
    z.object({
      marketId: z.string().min(1),
      cropName: z.string().min(1).max(100),
      variety: z.string().max(100).optional(),
      unit: z.string().max(20).default("kg"),
      price: z.coerce.number().positive(),
      currency: z.string().max(3).default("USD"),
      date: z.coerce.date(),
      volume: z.coerce.number().min(0).optional(),
      source: z.string().max(200).default("bulk_import"),
    })
  ).min(1).max(1000),
});

const priceAlertSchema = z.object({
  cropName: z.string().min(1).max(100),
  marketId: z.string().optional(),
  targetPrice: z.coerce.number().positive(),
  direction: z.enum(["above", "below"]),
  notifyEmail: z.boolean().default(true),
  notifyPush: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

const comparisonSchema = z.object({
  cropName: z.string().min(1).max(100),
  marketIds: z.array(z.string()).min(1).max(10),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/market/prices
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

    // Compare prices across markets
    if (action === "compare") {
      const query = comparisonSchema.parse({
        cropName: searchParams.get("cropName"),
        marketIds: JSON.parse(searchParams.get("marketIds") ?? "[]"),
        days: searchParams.get("days"),
      });

      const cutoffDate = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);

      const comparisons = await Promise.all(
        query.marketIds.map(async (marketId) => {
          const prices = await prisma.marketPrice.findMany({
            where: {
              marketId,
              cropName: query.cropName,
              date: { gte: cutoffDate },
            },
            orderBy: { date: "desc" },
          });

          const market = await prisma.market.findUnique({
            where: { id: marketId },
            select: { id: true, name: true, region: true, country: true },
          });

          const priceValues = prices.map((p) => Number(p.price));
          return {
            market,
            statistics: {
              average: priceValues.length
                ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length
                : 0,
              min: priceValues.length ? Math.min(...priceValues) : 0,
              max: priceValues.length ? Math.max(...priceValues) : 0,
              latest: priceValues.length ? priceValues[0] : 0,
              dataPoints: priceValues.length,
              trend:
                priceValues.length >= 2
                  ? priceValues[0] > priceValues[priceValues.length - 1]
                    ? "rising"
                    : priceValues[0] < priceValues[priceValues.length - 1]
                      ? "falling"
                      : "stable"
                  : "unknown",
            },
            recentPrices: prices.slice(0, 10),
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: comparisons,
        timestamp: new Date().toISOString(),
      });
    }

    // Price statistics for a crop
    if (action === "stats") {
      const cropName = searchParams.get("cropName");
      const days = parseInt(searchParams.get("days") ?? "30");

      if (!cropName) {
        throw new AppError("cropName is required", {
          code: "VALIDATION_ERROR",
          statusCode: 400,
        });
      }

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const prices = await prisma.marketPrice.findMany({
        where: {
          cropName,
          date: { gte: cutoffDate },
        },
        orderBy: { date: "desc" },
      });

      const priceValues = prices.map((p) => Number(p.price));
      const volumes = prices.map((p) => Number(p.volume ?? 0));

      const stats = {
        cropName,
        period: `${days} days`,
        price: {
          average: priceValues.length
            ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length
            : 0,
          min: priceValues.length ? Math.min(...priceValues) : 0,
          max: priceValues.length ? Math.max(...priceValues) : 0,
          latest: priceValues.length ? priceValues[0] : 0,
          median: priceValues.length
            ? priceValues.sort((a, b) => a - b)[Math.floor(priceValues.length / 2)]
            : 0,
          volatility: calculateVolatility(priceValues),
        },
        volume: {
          total: volumes.reduce((a, b) => a + b, 0),
          average: volumes.length
            ? volumes.reduce((a, b) => a + b, 0) / volumes.length
            : 0,
        },
        dataPoints: priceValues.length,
        markets: [...new Set(prices.map((p) => p.marketId))].length,
      };

      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    }

    // List price records
    const query = priceQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      orderBy: searchParams.get("orderBy"),
      order: searchParams.get("order"),
      cropName: searchParams.get("cropName"),
      marketId: searchParams.get("marketId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      currency: searchParams.get("currency"),
      source: searchParams.get("source"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
    });

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: query.page,
      limit: query.limit,
      orderBy: query.orderBy,
      order: query.order,
    });

    const where: Record<string, unknown> = {};
    if (query.cropName) where.cropName = query.cropName;
    if (query.marketId) where.marketId = query.marketId;
    if (query.currency) where.currency = query.currency;
    if (query.source) where.source = query.source;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, Date>).gte = query.startDate;
      if (query.endDate) (where.date as Record<string, Date>).lte = query.endDate;
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) (where.price as Record<string, number>).gte = query.minPrice;
      if (query.maxPrice) (where.price as Record<string, number>).lte = query.maxPrice;
    }

    const [prices, total] = await Promise.all([
      prisma.marketPrice.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          market: { select: { id: true, name: true, region: true } },
        },
      }),
      prisma.marketPrice.count({ where }),
    ]);

    const result = createPaginatedResult(prices, total, page, limit);

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
// POST /api/market/prices
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

    // Bulk price import
    if (action === "bulk") {
      const validated = bulkPriceSchema.parse(body);

      const prices = validated.prices.map((p) => ({
        marketId: p.marketId,
        cropName: p.cropName,
        variety: p.variety ?? null,
        unit: p.unit,
        price: p.price,
        currency: p.currency,
        date: p.date,
        volume: p.volume ?? null,
        source: p.source,
        createdById: session.user.id,
      }));

      const result = await prisma.marketPrice.createMany({
        data: prices,
        skipDuplicates: true,
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "create",
          resource: "market_price",
          resourceId: "bulk",
          metadata: JSON.stringify({ count: result.count }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: { count: result.count },
          message: `${result.count} price records imported`,
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Create price alert
    if (action === "alert") {
      const validated = priceAlertSchema.parse(body);

      const alert = await prisma.priceAlert.create({
        data: {
          userId: session.user.id,
          cropName: validated.cropName,
          marketId: validated.marketId ?? null,
          targetPrice: validated.targetPrice,
          direction: validated.direction,
          notifyEmail: validated.notifyEmail,
          notifyPush: validated.notifyPush,
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
          isActive: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: alert,
          message: "Price alert created",
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Single price record
    const validated = createPriceSchema.parse(body);

    const market = await prisma.market.findUnique({
      where: { id: validated.marketId },
    });

    if (!market) {
      throw new AppError("Market not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    const priceRecord = await prisma.marketPrice.create({
      data: {
        marketId: validated.marketId,
        cropName: validated.cropName,
        variety: validated.variety ?? null,
        unit: validated.unit,
        price: validated.price,
        currency: validated.currency,
        date: validated.date,
        highPrice: validated.highPrice ?? null,
        lowPrice: validated.lowPrice ?? null,
        avgPrice: validated.avgPrice ?? null,
        volume: validated.volume ?? null,
        source: validated.source,
        notes: validated.notes ?? null,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
      include: {
        market: { select: { id: true, name: true } },
      },
    });

    // Check price alerts
    const triggers = await prisma.priceAlert.findMany({
      where: {
        cropName: validated.cropName,
        isActive: true,
        OR: [
          { direction: "above", targetPrice: { lte: validated.price } },
          { direction: "below", targetPrice: { gte: validated.price } },
        ],
      },
    });

    for (const trigger of triggers) {
      await prisma.notification.create({
        data: {
          userId: trigger.userId,
          type: "MARKET_PRICE_CHANGE",
          title: `Price Alert: ${validated.cropName}`,
          message: `${validated.cropName} price is now $${validated.price}/${validated.unit} (${trigger.direction} your target of $${trigger.targetPrice})`,
          metadata: JSON.stringify({
            priceRecordId: priceRecord.id,
            alertId: trigger.id,
            price: validated.price,
            targetPrice: Number(trigger.targetPrice),
          }),
        },
      });

      await prisma.priceAlert.update({
        where: { id: trigger.id },
        data: { lastTriggeredAt: new Date() },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "create",
        resource: "market_price",
        resourceId: priceRecord.id,
        metadata: JSON.stringify({
          cropName: validated.cropName,
          price: validated.price,
          alertsTriggered: triggers.length,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          priceRecord,
          alertsTriggered: triggers.length,
        },
        message: "Price record created",
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
// DELETE /api/market/prices
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

    if (!["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.user.role)) {
      throw new AppError("Insufficient permissions", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");

    if (alertId) {
      const existing = await prisma.priceAlert.findUnique({ where: { id: alertId } });
      if (!existing) {
        throw new AppError("Price alert not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      await prisma.priceAlert.delete({ where: { id: alertId } });

      return NextResponse.json({
        success: true,
        message: "Price alert deleted",
        timestamp: new Date().toISOString(),
      });
    }

    throw new AppError("Provide 'alertId' to delete a price alert", {
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
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}
