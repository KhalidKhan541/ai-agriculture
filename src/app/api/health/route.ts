import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseHealth } from "@/lib/db";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: { status: string; latency: number };
    memory: { status: string; usageMb: number; totalMb: number; percentage: number };
    disk: { status: string };
  };
  environment: string;
}

const startTime = Date.now();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "true";

    const [dbHealth, memoryInfo] = await Promise.all([
      checkDatabaseHealth(),
      getMemoryUsage(),
    ]);

    const diskStatus = await checkDiskSpace();

    const overallStatus: HealthCheckResult["status"] =
      dbHealth.status === "unhealthy" || memoryInfo.percentage > 95
        ? "unhealthy"
        : memoryInfo.percentage > 80 || dbHealth.latency > 1000
          ? "degraded"
          : "healthy";

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        database: { status: dbHealth.status, latency: dbHealth.latency },
        memory: { status: memoryInfo.percentage > 90 ? "critical" : memoryInfo.percentage > 80 ? "warning" : "healthy", ...memoryInfo },
        disk: diskStatus,
      },
      environment: process.env.NODE_ENV ?? "development",
    };

    const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "ping") {
      return NextResponse.json({ success: true, pong: true, timestamp: new Date().toISOString() });
    }

    if (body.action === "db-test") {
      const start = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;
        return NextResponse.json({ success: true, latency, timestamp: new Date().toISOString() });
      } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "DB error" }, { status: 503 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}

async function getMemoryUsage(): Promise<{ status: string; usageMb: number; totalMb: number; percentage: number }> {
  const mem = process.memoryUsage();
  const usageMb = Math.round(mem.heapUsed / 1024 / 1024);
  const totalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const percentage = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  return {
    status: percentage > 90 ? "critical" : percentage > 80 ? "warning" : "healthy",
    usageMb,
    totalMb,
    percentage,
  };
}

async function checkDiskSpace(): Promise<{ status: string }> {
  return { status: "healthy" };
}
