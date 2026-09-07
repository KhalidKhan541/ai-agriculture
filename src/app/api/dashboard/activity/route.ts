import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const activityQuerySchema = z.object({
  farmId: z.string().optional(),
  type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "timeline") {
      const query = activityQuerySchema.parse({
        farmId: searchParams.get("farmId"),
        type: searchParams.get("type"),
        limit: searchParams.get("limit"),
        offset: searchParams.get("offset"),
        startDate: searchParams.get("startDate"),
        endDate: searchParams.get("endDate"),
      });

      const where: Record<string, unknown> = {};
      if (query.farmId) where.farmId = query.farmId;
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) (where.createdAt as Record<string, Date>).gte = query.startDate;
        if (query.endDate) (where.createdAt as Record<string, Date>).lte = query.endDate;
      }

      const [auditLogs, notifications, pestAlerts, orders] = await Promise.all([
        prisma.auditLog.findMany({
          where: query.type ? { action: query.type } : {},
          orderBy: { createdAt: "desc" },
          take: query.limit,
          skip: query.offset,
          include: { user: { select: { id: true, name: true } } },
        }),
        prisma.notification.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.pestAlert.findMany({
          where: { ...farmFilter(where.farmId), resolved: false },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, pestName: true, severity: true, createdAt: true, farm: { select: { name: true } } },
        }),
        prisma.order.findMany({
          where: { ...farmFilter(where.farmId) },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, cropName: true, status: true, totalPrice: true, createdAt: true },
        }),
      ]);

      const timeline = [
        ...auditLogs.map((log) => ({
          type: "audit",
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          user: log.user,
          timestamp: log.createdAt,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
        })),
        ...notifications.map((n) => ({
          type: "notification",
          action: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          timestamp: n.createdAt,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, query.limit);

      return NextResponse.json({
        success: true,
        data: {
          timeline,
          alerts: pestAlerts,
          recentOrders: orders,
          unreadNotifications: notifications.filter((n) => !n.read).length,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "summary") {
      const unreadNotifications = await prisma.notification.count({ where: { userId: session.user.id, read: false } });
      const activePestAlerts = await prisma.pestAlert.count({ where: { resolved: false } });
      const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });

      const recentActivity = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { id: true, name: true } } },
      });

      return NextResponse.json({
        success: true,
        data: { unreadNotifications, activePestAlerts, pendingOrders, recentActivity },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        endpoints: {
          "GET ?action=timeline": "Get activity timeline",
          "GET ?action=summary": "Get activity summary",
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

function farmFilter(farmId?: string): Record<string, unknown> {
  return farmId ? { farmId } : {};
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const body = await request.json();

    if (body.action === "mark-read") {
      const { notificationIds } = body;
      if (notificationIds && Array.isArray(notificationIds)) {
        await prisma.notification.updateMany({
          where: { id: { in: notificationIds }, userId: session.user.id },
          data: { read: true },
        });
      } else {
        await prisma.notification.updateMany({
          where: { userId: session.user.id, read: false },
          data: { read: true },
        });
      }
      return NextResponse.json({ success: true, message: "Notifications marked as read", timestamp: new Date().toISOString() });
    }

    throw new AppError("Invalid action", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
