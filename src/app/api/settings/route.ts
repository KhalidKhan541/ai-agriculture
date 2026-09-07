import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().default("UTC"),
  locale: z.string().default("en"),
});

const notificationSettingsSchema = z.object({
  weatherAlerts: z.boolean().default(true),
  pestAlerts: z.boolean().default(true),
  priceAlerts: z.boolean().default(true),
  orderUpdates: z.boolean().default(true),
  maintenanceReminders: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") ?? "profile";

    if (section === "profile") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true, name: true, firstName: true, lastName: true, email: true,
          phone: true, avatarUrl: true, timezone: true, locale: true, role: true,
          createdAt: true, lastLoginAt: true,
        },
      });

      return NextResponse.json({ success: true, data: user, timestamp: new Date().toISOString() });
    }

    if (section === "notifications") {
      const settings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
      });

      return NextResponse.json({
        success: true,
        data: settings ?? {
          weatherAlerts: true, pestAlerts: true, priceAlerts: true,
          orderUpdates: true, maintenanceReminders: true,
          emailNotifications: true, pushNotifications: true, smsNotifications: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (section === "api-keys") {
      const keys = await prisma.apiKey.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, key: true, isActive: true, createdAt: true, lastUsedAt: true, expiresAt: true },
      });

      return NextResponse.json({ success: true, data: keys, count: keys.length, timestamp: new Date().toISOString() });
    }

    if (section === "sessions") {
      const sessions = await prisma.session.findMany({
        where: { userId: session.user.id, expires: { gt: new Date() } },
        orderBy: { expires: "desc" },
        select: { id: true, sessionToken: true, expires: true, createdAt: true },
      });

      return NextResponse.json({ success: true, data: sessions, count: sessions.length, timestamp: new Date().toISOString() });
    }

    throw new AppError("Invalid section", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") ?? "profile";

    if (section === "profile") {
      const validated = updateProfileSchema.parse(body);
      const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(validated.name && { name: validated.name }),
          ...(validated.firstName !== undefined && { firstName: validated.firstName }),
          ...(validated.lastName !== undefined && { lastName: validated.lastName }),
          ...(validated.phone !== undefined && { phone: validated.phone }),
          ...(validated.avatarUrl !== undefined && { avatarUrl: validated.avatarUrl }),
          ...(validated.timezone && { timezone: validated.timezone }),
          ...(validated.locale && { locale: validated.locale }),
        },
        select: { id: true, name: true, firstName: true, lastName: true, email: true, timezone: true, locale: true },
      });

      await prisma.auditLog.create({
        data: { userId: session.user.id, action: "update", resource: "user_profile", resourceId: session.user.id, metadata: JSON.stringify({ changes: Object.keys(validated) }) },
      });

      return NextResponse.json({ success: true, data: updated, message: "Profile updated", timestamp: new Date().toISOString() });
    }

    if (section === "notifications") {
      const validated = notificationSettingsSchema.parse(body);
      const existing = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });

      const settings = existing
        ? await prisma.userSettings.update({ where: { userId: session.user.id }, data: validated })
        : await prisma.userSettings.create({ data: { userId: session.user.id, ...validated } });

      return NextResponse.json({ success: true, data: settings, message: "Notification settings updated", timestamp: new Date().toISOString() });
    }

    throw new AppError("Invalid section for PUT", { code: "VALIDATION_ERROR", statusCode: 400 });
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

    if (action === "create-api-key") {
      const validated = apiKeySchema.parse(body);
      const key = `agri_${crypto.randomUUID().replace(/-/g, "")}`;

      const apiKey = await prisma.apiKey.create({
        data: { userId: session.user.id, name: validated.name, key, expiresAt: validated.expiresAt ?? null },
      });

      await prisma.auditLog.create({
        data: { userId: session.user.id, action: "create", resource: "api_key", resourceId: apiKey.id, metadata: JSON.stringify({ name: validated.name }) },
      });

      return NextResponse.json({ success: true, data: apiKey, message: "API key created. Save it securely - it won't be shown again.", timestamp: new Date().toISOString() }, { status: 201 });
    }

    if (action === "revoke-api-key") {
      const { keyId } = body;
      if (!keyId) throw new AppError("keyId required", { code: "VALIDATION_ERROR", statusCode: 400 });

      const existing = await prisma.apiKey.findFirst({ where: { id: keyId, userId: session.user.id } });
      if (!existing) throw new AppError("API key not found", { code: "NOT_FOUND", statusCode: 404 });

      await prisma.apiKey.update({ where: { id: keyId }, data: { isActive: false } });

      return NextResponse.json({ success: true, message: "API key revoked", timestamp: new Date().toISOString() });
    }

    if (action === "delete-account") {
      if (!["SUPER_ADMIN"].includes(session.user.role)) {
        throw new AppError("Only super admins can delete accounts", { code: "FORBIDDEN", statusCode: 403 });
      }

      const { userId } = body;
      const targetId = userId ?? session.user.id;

      await prisma.user.update({ where: { id: targetId }, data: { isActive: false } });
      await prisma.session.deleteMany({ where: { userId: targetId } });
      await prisma.apiKey.updateMany({ where: { userId: targetId }, data: { isActive: false } });

      return NextResponse.json({ success: true, message: "Account deactivated", timestamp: new Date().toISOString() });
    }

    throw new AppError("Invalid action", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "revoke-all-sessions") {
      await prisma.session.deleteMany({ where: { userId: session.user.id } });
      await prisma.auditLog.create({
        data: { userId: session.user.id, action: "revoke_sessions", resource: "session", resourceId: session.user.id },
      });
      return NextResponse.json({ success: true, message: "All sessions revoked", timestamp: new Date().toISOString() });
    }

    if (action === "delete-api-key") {
      const keyId = searchParams.get("keyId");
      if (!keyId) throw new AppError("keyId required", { code: "VALIDATION_ERROR", statusCode: 400 });

      await prisma.apiKey.deleteMany({ where: { id: keyId, userId: session.user.id } });
      return NextResponse.json({ success: true, message: "API key deleted", timestamp: new Date().toISOString() });
    }

    throw new AppError("Invalid delete action", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
