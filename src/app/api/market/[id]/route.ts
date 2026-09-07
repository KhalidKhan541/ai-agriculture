import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

const updateListingSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  quantity: z.coerce.number().positive().optional(),
  pricePerUnit: z.coerce.number().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD_OUT", "DELISTED"]).optional(),
  minOrderQty: z.coerce.number().positive().optional(),
  maxOrderQty: z.coerce.number().positive().optional(),
  qualityGrade: z.enum(["A", "B", "C", "D", "premium"]).optional(),
  organic: z.boolean().optional(),
  availableFrom: z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createOrderSchema = z.object({
  listingId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().max(20).default("kg"),
  shippingAddress: z.string().max(1000).optional(),
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().max(5000).optional(),
  paymentMethod: z
    .enum(["bank_transfer", "escrow", "cash_on_delivery", "mobile_money"])
    .default("bank_transfer"),
  metadata: z.record(z.unknown()).optional(),
});

const priceHistoryQuerySchema = z.object({
  cropName: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  region: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/market/[id]
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
    const type = searchParams.get("type") ?? "listing";

    // Get price history
    if (type === "price-history") {
      const query = priceHistoryQuerySchema.parse({
        cropName: searchParams.get("cropName"),
        days: searchParams.get("days"),
        region: searchParams.get("region"),
      });

      const where: Record<string, unknown> = {};
      if (query.cropName) where.cropName = query.cropName;
      if (query.region) where.region = query.region;

      const cutoffDate = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);
      where.date = { gte: cutoffDate };

      const priceHistory = await prisma.marketPrice.findMany({
        where,
        orderBy: { date: "desc" },
        take: 1000,
      });

      // Calculate statistics
      const prices = priceHistory.map((p) => Number(p.price));
      const stats = {
        average: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
        latest: prices.length ? prices[0] : 0,
        dataPoints: prices.length,
        trend:
          prices.length >= 2
            ? prices[0] > prices[prices.length - 1]
              ? "rising"
              : prices[0] < prices[prices.length - 1]
                ? "falling"
                : "stable"
            : "unknown",
      };

      return NextResponse.json({
        success: true,
        data: {
          history: priceHistory,
          statistics: stats,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get a specific listing
    const listing = await prisma.marketListing.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        market: {
          select: { id: true, name: true, region: true, country: true },
        },
      },
    });

    if (!listing) {
      throw new AppError("Market listing not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    // Increment view count
    await prisma.marketListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Get related listings (same crop, different seller)
    const relatedListings = await prisma.marketListing.findMany({
      where: {
        cropName: listing.cropName,
        status: "ACTIVE",
        id: { not: id },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        cropName: true,
        pricePerUnit: true,
        unit: true,
        quantity: true,
        qualityGrade: true,
        organic: true,
        createdAt: true,
        seller: { select: { id: true, name: true } },
      },
    });

    // Get recent orders for this listing
    const recentOrders = await prisma.order.findMany({
      where: { listingId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        quantity: true,
        totalPrice: true,
        createdAt: true,
        buyer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        viewCount: (listing.viewCount ?? 0) + 1,
        relatedListings,
        recentOrders,
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
// PUT /api/market/[id]
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

    // Place an order
    if (action === "order") {
      const validated = createOrderSchema.parse(body);

      const listing = await prisma.marketListing.findUnique({
        where: { id: validated.listingId },
      });

      if (!listing) {
        throw new AppError("Listing not found", {
          code: "NOT_FOUND",
          statusCode: 404,
        });
      }

      if (listing.status !== "ACTIVE") {
        throw new AppError("Listing is not available", {
          code: "INVALID_STATE",
          statusCode: 409,
        });
      }

      if (validated.quantity > listing.quantity) {
        throw new AppError("Requested quantity exceeds available stock", {
          code: "VALIDATION_ERROR",
          statusCode: 400,
        });
      }

      if (listing.minOrderQty && validated.quantity < Number(listing.minOrderQty)) {
        throw new AppError(
          `Minimum order quantity is ${listing.minOrderQty} ${listing.unit}`,
          { code: "VALIDATION_ERROR", statusCode: 400 }
        );
      }

      const totalPrice = validated.quantity * Number(listing.pricePerUnit);

      const order = await prisma.order.create({
        data: {
          buyerId: session.user.id,
          listingId: validated.listingId,
          sellerId: listing.sellerId,
          cropName: listing.cropName,
          quantity: validated.quantity,
          unit: validated.unit,
          pricePerUnit: Number(listing.pricePerUnit),
          totalPrice,
          currency: listing.currency,
          shippingAddress: validated.shippingAddress ?? null,
          deliveryDate: validated.deliveryDate ?? null,
          notes: validated.notes ?? null,
          paymentMethod: validated.paymentMethod,
          status: "PENDING",
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
        },
      });

      // Reduce listing quantity
      const newQuantity = listing.quantity - validated.quantity;
      await prisma.marketListing.update({
        where: { id: validated.listingId },
        data: {
          quantity: newQuantity,
          status: newQuantity <= 0 ? "SOLD_OUT" : listing.status,
        },
      });

      // Notify seller
      await prisma.notification.create({
        data: {
          userId: listing.sellerId,
          type: "ORDER_UPDATE",
          title: "New Order Received",
          message: `New order for ${validated.quantity} ${validated.unit} of ${listing.cropName}`,
          metadata: JSON.stringify({ orderId: order.id }),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "create",
          resource: "order",
          resourceId: order.id,
          metadata: JSON.stringify({
            listingId: validated.listingId,
            quantity: validated.quantity,
            totalPrice,
          }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: order,
          message: "Order placed successfully",
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    // Update listing
    const existing = await prisma.marketListing.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Market listing not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    // Only seller or admin can update
    if (existing.sellerId !== session.user.id && !["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.user.role)) {
      throw new AppError("Not authorized to update this listing", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    const validated = updateListingSchema.parse(body);

    const updated = await prisma.marketListing.update({
      where: { id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.quantity !== undefined && { quantity: validated.quantity }),
        ...(validated.pricePerUnit !== undefined && { pricePerUnit: validated.pricePerUnit }),
        ...(validated.status && { status: validated.status }),
        ...(validated.organic !== undefined && { organic: validated.organic }),
        ...(validated.images && { images: JSON.stringify(validated.images) }),
        ...(validated.metadata && { metadata: JSON.stringify(validated.metadata) }),
      },
      include: {
        seller: { select: { id: true, name: true } },
        market: { select: { id: true, name: true } },
      },
    });

    // Record new price data point if price changed
    if (validated.pricePerUnit) {
      await prisma.marketPrice.create({
        data: {
          marketId: existing.marketId,
          cropName: existing.cropName,
          variety: existing.variety ?? null,
          price: validated.pricePerUnit,
          unit: existing.unit,
          currency: existing.currency,
          date: new Date(),
          volume: existing.quantity,
          source: "listing_update",
          metadata: JSON.stringify({ listingId: id }),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "update",
        resource: "market_listing",
        resourceId: id,
        metadata: JSON.stringify({ changes: Object.keys(validated) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Listing updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/market/[id]
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

    const { id } = params;

    const existing = await prisma.marketListing.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Market listing not found", {
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }

    if (existing.sellerId !== session.user.id && !["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.user.role)) {
      throw new AppError("Not authorized to delete this listing", {
        code: "FORBIDDEN",
        statusCode: 403,
      });
    }

    // Check for active orders
    const activeOrders = await prisma.order.count({
      where: {
        listingId: id,
        status: { notIn: ["CANCELLED", "COMPLETED", "REFUNDED"] },
      },
    });

    if (activeOrders > 0) {
      throw new AppError("Cannot delete listing with active orders", {
        code: "INVALID_STATE",
        statusCode: 409,
        details: { activeOrders },
      });
    }

    await prisma.marketListing.update({
      where: { id },
      data: { status: "DELISTED" },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "delete",
        resource: "market_listing",
        resourceId: id,
        metadata: JSON.stringify({
          cropName: existing.cropName,
          price: existing.pricePerUnit,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Listing delisted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    const errorResponse = getErrorResponse(appError);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
