import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ═══════════════════════════════════════════════════════════════
// ROUTE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/health", "/api/health"];
const apiPublicRoutes = ["/api/health"];
const adminRoles = ["SUPER_ADMIN", "PLATFORM_ADMIN"];

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING (in-memory, per-IP)
// ═══════════════════════════════════════════════════════════════

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

// ═══════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

function handleCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean);

  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin ?? "")) {
    response.headers.set("Access-Control-Allow-Origin", origin ?? "*");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

// ═══════════════════════════════════════════════════════════════
// REQUEST LOGGING
// ═══════════════════════════════════════════════════════════════

function logRequest(request: NextRequest, response: NextResponse, startTime: number): void {
  const duration = Date.now() - startTime;
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  const status = response.status;
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

  if (pathname.startsWith("/api/")) {
    console.log(
      JSON.stringify({
        method,
        pathname,
        status,
        duration: `${duration}ms`,
        ip,
        userAgent: request.headers.get("user-agent")?.substring(0, 100),
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Handle OPTIONS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return handleCors(request, setSecurityHeaders(response));
  }

  // Health check - skip auth
  if (pathname === "/api/health" || pathname === "/health") {
    const response = NextResponse.next();
    return handleCors(request, setSecurityHeaders(response));
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Too many requests", code: "RATE_LIMITED" }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  }

  // Get token for auth checks
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public routes - allow through
  if (publicRoutes.some((route) => pathname.startsWith(route)) || apiPublicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next();
    return handleCors(request, setSecurityHeaders(response));
  }

  // API routes require authentication
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Authentication required", code: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Admin-only API routes
    const adminApiRoutes = ["/api/settings", "/api/dashboard"];
    if (adminApiRoutes.some((route) => pathname.startsWith(route))) {
      if (!adminRoles.includes(token.role as string)) {
        return new NextResponse(
          JSON.stringify({ success: false, error: "Insufficient permissions", code: "FORBIDDEN" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Page routes - redirect to login if not authenticated
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/") && !pathname.startsWith("/favicon")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Dashboard requires admin role
    if (pathname.startsWith("/dashboard") && !adminRoles.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Set common headers
  const response = NextResponse.next();
  response.headers.set("X-Request-Id", crypto.randomUUID());
  response.headers.set("X-User-Id", token?.id as string ?? "");

  const finalResponse = handleCors(request, setSecurityHeaders(response));
  logRequest(request, finalResponse, startTime);

  return finalResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
