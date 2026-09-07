import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, getPaginationParams, createPaginatedResult, buildSearchFilter } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const marketQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD_OUT", "PRICE_UPDATING", "DELISTED"]).optional(),
  cropName: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sellerId: z.string().optional(),
  sortBy: z.enum(["price", "date", "quantity", "name"]).optional(),
});

const createMarketSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().max(200).optional(),
  region: z.string().max(100).optional(),
  country: z.string().max(100).default("US"),
  currency: z.string().max(3).default("USD"),
  description: z.string().max(5000).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  timezone: z.string().default("UTC"),
  marketType: z.enum(["local", "regional", "national", "international"]).default("local"),
  operatingHours: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateMarketSchema = createMarketSchema.partial();

const createListingSchema = z.object({
  marketId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  cropName: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  quantity: z.coerce.number().positive(),
  unit: z.string().max(20).default("kg"),
  pricePerUnit: z.coerce.number().positive(),
  currency: z.string().max(3).default("USD"),
  minOrderQty: z.coerce.number().positive().optional(),
  maxOrderQty: z.coerce.number().positive().optional(),
  qualityGrade: z.enum(["A", "B", "C", "D", "premium"]).optional(),
  organic: z.boolean().default(false),
  certifications: z.array(z.string()).optional(),
  availableFrom: z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
  images: z.array(z.string().url()).optional(),
  location: z.string().max(200).optional(),
  shippingOptions: z
    .array(
      z.object({
        method: z.string(),
        costPerUnit: z.coerce.number().min(0),
        estimatedDays: z.coerce.number().int().positive(),
      })
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

const marketAnalyticsSchema = z.object({
  marketId: z.string().optional(),
  cropName: z.string().optional(),
  period: z.enum(["daily", "weekly", "monthly", "quarterly"]).default("monthly"),
  region: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/market
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

    // Market analytics
    if (action === "analytics") {
      const query = marketAnalyticsSchema.parse({
        marketId: searchParams.get("marketId"),
        cropName: searchParams.get("cropName"),
        period: searchParams.get("period"),
        region: searchParams.get("region"),
      });

      const where: Record<string, unknown> = {};
      if (query.marketId) where.marketId = query.marketId;
      if (query.cropName) where.cropName = query.cropName;

      const prices = await prisma.marketPrice.findMany({
        where,
        orderBy: { date: "desc" },
        take: 365,
      });

      const stats = {
        averagePrice: prices.length
          ? prices.reduce((sum, p) => sum + Number(p.price), 0) / prices.length
          : 0,
        minPrice: prices.length ? Math.min(...prices.map((p) => Number(p.price))) : 0,
        maxPrice: prices.length ? Math.max(...prices.map((p) => Number(p.price))) : 0,
        totalVolume: prices.reduce((sum, p) => sum + (Number(p.volume) || 0), 0),
        pricePoints: prices.length,
        period: query.period,
      };

      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    }

    // Popular crops
    if (action === "popular-crops") {
      const popularCrops = await prisma.marketPrice.groupBy({
        by: ["cropName"],
        _count: true,
        _avg: { price: true },
        orderBy: { _count: { cropName: "desc" } },
        take: 20,
      });

      return NextResponse.json({
        success: true,
        data: popularCrops,
        timestamp: new Date().toISOString(),
      });
    }

    // Market summary
    if (action === "summary") {
      const [totalMarkets, activeListings, totalOrders] = await Promise.all([
        prisma.market.count(),
        prisma.marketListing.count({ where: { status: "ACTIVE" } }),
        prisma.order.count(),
      ]);

      const recentListings = await prisma.marketListing.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          cropName: true,
          pricePerUnit: true,
          unit: true,
          quantity: true,
          createdAt: true,
          seller: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          totalMarkets,
          activeListings,
          totalOrders,
          recentListings,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // List markets
    const query = marketQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      orderBy: searchParams.get("orderBy"),
      order: searchParams.get("order"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      cropName: searchParams.get("cropName"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      sellerId: searchParams.get("sellerId"),
    });

    const { skip, take, orderBy, page, limit } = getPaginationParams({
      page: query.page,
      limit: query.limit,
      orderBy: query.orderBy,
      order: query.order,
    });

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.sellerId) where.sellerId = query.sellerId;

    if (query.minPrice || query.maxPrice) {
      where.pricePerUnit = {};
      if (query.minPrice) (where.pricePerUnit as Record<string, number>).gte = query.minPrice;
      if (query.maxPrice) (where.pricePerUnit as Record<string, number>).lte = query.maxPrice;
    }

    const searchFilter = buildSearchFilter(query.search, ["title", "cropName", "description"]);
    if (searchFilter) Object.assign(where, searchFilter);

    const [listings, total] = await Promise.all([
      prisma.marketListing.findMany({
        where,
        orderBy: query.sortBy === "price"
          ? { pricePerUnit: query.order }
          : query.sortBy === "quantity"
            ? { quantity: query.order }
            : orderBy,
        skip,
        take,
        include: {
          seller: { select: { id: true, name: true, email: true } },
          market: { select: { id: true, name: true, region: true } },
        },
      }),
      prisma.marketListing.count({ where }),
    ]);

    const result = createPaginatedResult(listings, total, page, limit);

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
// POST /api/market
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

    // Create a market listing
    if (action === "listing") {
      const validated = createListingSchema.parse(body);

      const market = await prisma.market.findUnique({
        where: { id: validated.marketId },
      });

      if (!market) {
        throw new AppError("Market not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      const listing = await prisma.marketListing.create({
        data: {
          marketId: validated.marketId,
          sellerId: session.user.id,
          title: validated.title,
          description: validated.description ?? null,
          cropName: validated.cropName,
          variety: validated.variety ?? null,
          quantity: validated.quantity,
          unit: validated.unit,
          pricePerUnit: validated.pricePerUnit,
          currency: validated.currency,
          minOrderQty: validated.minOrderQty ?? null,
          maxOrderQty: validated.maxOrderQty ?? null,
          qualityGrade: validated.qualityGrade ?? null,
          organic: validated.organic,
          certifications: validated.certifications
            ? JSON.stringify(validated.certifications)
            : null,
          availableFrom: validated.availableFrom ?? null,
          availableUntil: validated.availableUntil ?? null,
          images: validated.images ? JSON.stringify(validated.images) : null,
          location: validated.location ?? null,
          shippingOptions: validated.shippingOptions
            ? JSON.stringify(validated.shippingOptions)
            : null,
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
          status: "ACTIVE",
        },
        include: {
          seller: { select: { id: true, name: true } },
          market: { select: { id: true, name: true } },
        },
      });

      // Record price data point
      await prisma.marketPrice.create({
        data: {
          marketId: validated.marketId,
          cropName: validated.cropName,
          variety: validated.variety ?? null,
          price: validated.pricePerUnit,
          unit: validated.unit,
          currency: validated.currency,
          date: new Date(),
          volume: validated.quantity,
          source: "listing",
          metadata: JSON.stringify({ listingId: listing.id }),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "create",
          resource: "market_listing",
          resourceId: listing.id,
          metadata: JSON.stringify({
            cropName: validated.cropName,
            price: validated.pricePerUnit,
          }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: listing,
          message: "Market listing created successfully",
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Create a new market
    const validated = createMarketSchema.parse(body);

    const market = await prisma.market.create({
      data: {
        name: validated.name,
        location: validated.location ?? null,
        region: validated.region ?? null,
        country: validated.country,
        currency: validated.currency,
        description: validated.description ?? null,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        timezone: validated.timezone,
        marketType: validated.marketType,
        operatingHours: validated.operatingHours ?? null,
        contactEmail: validated.contactEmail ?? null,
        contactPhone: validated.contactPhone ?? null,
        website: validated.website ?? null,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        createdById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "create",
        resource: "market",
        resourceId: market.id,
        metadata: JSON.stringify({ name: validated.name, country: validated.country }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: market,
        message: "Market created successfully",
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
// PUT /api/market
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
      throw new AppError("Market ID is required", {
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
    }

    const existing = await prisma.market.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Market not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    const validated = updateMarketSchema.parse(updates);

    const updated = await prisma.market.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.location !== undefined && { location: validated.location }),
        ...(validated.region !== undefined && { region: validated.region }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.latitude !== undefined && { latitude: validated.latitude }),
        ...(validated.longitude !== undefined && { longitude: validated.longitude }),
        ...(validated.operatingHours !== undefined && { operatingHours: validated.operatingHours }),
        ...(validated.contactEmail !== undefined && { contactEmail: validated.contactEmail }),
        ...(validated.contactPhone !== undefined && { contactPhone: validated.contactPhone }),
        ...(validated.website !== undefined && { website: validated.website }),
        ...(validated.metadata && { metadata: JSON.stringify(validated.metadata) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "update",
        resource: "market",
        resourceId: id,
        metadata: JSON.stringify({ changes: Object.keys(validated) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Market updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/market
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
    const id = searchParams.get("id");

    if (!id) {
      throw new AppError("Market ID is required", {
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
    }

    const existing = await prisma.market.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Market not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    // Soft-delete: deactivate market and its listings
    await prisma.market.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    await prisma.marketListing.updateMany({
      where: { marketId: id, status: "ACTIVE" },
      data: { status: "DELISTED" },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "delete",
        resource: "market",
        resourceId: id,
        metadata: JSON.stringify({ name: existing.name }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Market deactivated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
