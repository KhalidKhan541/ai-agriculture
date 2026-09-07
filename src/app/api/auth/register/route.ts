import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { AppError, DuplicateEmailError, getErrorResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════════
// Creates a new user account. Validates input with Zod, hashes
// the password, inserts into the database, and returns the
// sanitized user object (no sensitive fields).
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const requestLogger = logger.child({
    route: "POST /api/auth/register",
  });

  try {
    const body = await request.json();

    // ── Validate input ───────────────────────────────────────
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      const fieldErrors: Record<string, string[]> = {};
      validated.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      });

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: fieldErrors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, phone, role } =
      validated.data;

    // ── Check for existing user ──────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      requestLogger.warn("Registration attempt with existing email", {
        email,
      });
      throw new DuplicateEmailError(email);
    }

    // ── Hash password ────────────────────────────────────────
    const passwordHash = await hashPassword(password);

    // ── Build full name ──────────────────────────────────────
    const name = `${firstName} ${lastName}`.trim();

    // ── Create user in transaction ───────────────────────────
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name: name || null,
          firstName,
          lastName,
          phone: phone ?? null,
          role: role ?? "FARM_OWNER",
          emailVerified: null,
        },
      });

      // Create audit log for registration
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: "register",
          resource: "user",
          resourceId: newUser.id,
          metadata: JSON.stringify({
            email: newUser.email,
            role: newUser.role,
            method: "email",
          }),
        },
      });

      return newUser;
    });

    requestLogger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // ── Return sanitized user ────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
        },
        message: "Account created successfully. Please sign in.",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(getErrorResponse(error), {
        status: error.statusCode,
      });
    }

    requestLogger.error("Registration failed unexpectedly", error as Error);
    return NextResponse.json(
      getErrorResponse(new AppError("Registration failed. Please try again.")),
      { status: 500 }
    );
  }
}
