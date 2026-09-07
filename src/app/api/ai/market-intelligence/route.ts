import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, getErrorResponse, toAppError } from "@/lib/errors";
import { getMarketIntelligence, generateMarketReport, createPriceAlert, checkPriceAlerts, compareMarkets } from "@/lib/ai/market-intelligence";
import { z } from "zod";

const intelligenceSchema = z.object({
  cropName: z.string().min(1).max(100),
  region: z.string().optional(),
  timeframe: z.enum(["short", "medium", "long"]).default("medium"),
  includeForecast: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
});

const reportSchema = z.object({
  farmId: z.string().optional(),
  cropNames: z.array(z.string()).min(1).max(20),
  region: z.string().optional(),
  period: z.enum(["weekly", "monthly", "quarterly"]).default("monthly"),
});

const priceAlertSchema = z.object({
  cropName: z.string().min(1).max(100),
  targetPrice: z.coerce.number().positive(),
  direction: z.enum(["above", "below"]),
  region: z.string().optional(),
  notifyEmail: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

const compareSchema = z.object({
  cropName: z.string().min(1).max(100),
  regions: z.array(z.string()).min(2).max(10),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new AppError("Authentication required", { code: "UNAUTHORIZED", statusCode: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "alerts") {
      const alerts = await prisma.priceAlert.findMany({
        where: { userId: session.user.id, isActive: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: alerts, count: alerts.length, timestamp: new Date().toISOString() });
    }

    if (action === "check-alerts") {
      const triggered = await checkPriceAlerts();
      return NextResponse.json({ success: true, data: triggered, count: triggered.length, timestamp: new Date().toISOString() });
    }

    if (action === "reports") {
      const farmId = searchParams.get("farmId");
      const limit = parseInt(searchParams.get("limit") ?? "10");

      const reports = await prisma.marketReport.findMany({
        where: farmId ? { farmId } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return NextResponse.json({ success: true, data: reports, count: reports.length, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      data: {
        endpoints: {
          "POST ?action=intelligence": "Get market intelligence for a crop",
          "POST ?action=report": "Generate market report",
          "POST ?action=compare": "Compare markets across regions",
          "POST ?action=price-alert": "Create price alert",
          "GET ?action=alerts": "List active price alerts",
          "GET ?action=check-alerts": "Check triggered alerts",
          "GET ?action=reports": "List market reports",
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

    if (action === "intelligence") {
      const validated = intelligenceSchema.parse(body);
      const intelligence = await getMarketIntelligence({
        cropName: validated.cropName,
        region: validated.region,
        timeframe: validated.timeframe,
        includeForecast: validated.includeForecast,
        includeRecommendations: validated.includeRecommendations,
      });
      return NextResponse.json({ success: true, data: intelligence, timestamp: new Date().toISOString() });
    }

    if (action === "report") {
      const validated = reportSchema.parse(body);
      const report = await generateMarketReport({
        cropNames: validated.cropNames,
        region: validated.region,
        period: validated.period,
      });

      const saved = await prisma.marketReport.create({
        data: {
          farmId: validated.farmId ?? null,
          cropNames: JSON.stringify(validated.cropNames),
          region: validated.region ?? null,
          period: validated.period,
          reportData: JSON.stringify(report),
          createdById: session.user.id,
        },
      });

      return NextResponse.json({ success: true, data: { reportId: saved.id, ...report }, timestamp: new Date().toISOString() }, { status: 201 });
    }

    if (action === "compare") {
      const validated = compareSchema.parse(body);
      const comparison = await compareMarkets({
        cropName: validated.cropName,
        regions: validated.regions,
      });
      return NextResponse.json({ success: true, data: comparison, timestamp: new Date().toISOString() });
    }

    if (action === "price-alert") {
      const validated = priceAlertSchema.parse(body);
      const alert = await createPriceAlert({
        userId: session.user.id,
        cropName: validated.cropName,
        targetPrice: validated.targetPrice,
        direction: validated.direction,
        region: validated.region,
        notifyEmail: validated.notifyEmail,
        metadata: validated.metadata,
      });
      return NextResponse.json({ success: true, data: alert, message: "Price alert created", timestamp: new Date().toISOString() }, { status: 201 });
    }

    throw new AppError("Invalid action", { code: "VALIDATION_ERROR", statusCode: 400 });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(getErrorResponse(appError), { status: appError.statusCode });
  }
}
