import { Prisma, PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// ═══════════════════════════════════════════════════════════════
// PRISMA SINGLETON
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const logLevels: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"];

  return new PrismaClient({
    log: logLevels,
    errorFormat: "pretty",
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { Decimal };

// ═══════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export function getPaginationParams(params?: PaginationParams): {
  skip: number;
  take: number;
  orderBy: Record<string, Prisma.SortOrder>;
  page: number;
  limit: number;
} {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const skip = (page - 1) * limit;
  const orderByField = params?.orderBy ?? "createdAt";
  const orderDirection = params?.order ?? "desc";

  return {
    skip,
    take: limit,
    orderBy: { [orderByField]: orderDirection },
    page,
    limit,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function getCursorPaginationParams(params?: CursorPaginationParams): {
  cursor: { id: string } | undefined;
  take: number;
  orderBy: Record<string, Prisma.SortOrder>;
  limit: number;
} {
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const orderByField = params?.orderBy ?? "createdAt";
  const orderDirection = params?.order ?? "desc";
  const cursor = params?.cursor ? { id: params.cursor } : undefined;

  return {
    cursor,
    take: limit + 1, // fetch one extra to determine if there are more
    orderBy: { [orderByField]: orderDirection },
    limit,
  };
}

export function createCursorPaginatedResult<T extends { id: string }>(
  data: T[],
  limit: number
): CursorPaginatedResult<T> {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    data: items,
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTION HELPERS
// ═══════════════════════════════════════════════════════════════

export async function executeTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}

// ═══════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════

export async function batchCreate<T>(
  model: { createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<Prisma.BatchPayload> },
  data: T[],
  batchSize: number = 1000,
  skipDuplicates: boolean = true
): Promise<Prisma.BatchPayload> {
  let totalCreated = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const result = await model.createMany({ data: batch, skipDuplicates });
    totalCreated += result.count;
  }

  return { count: totalCreated };
}

// ═══════════════════════════════════════════════════════════════
// AGGREGATION HELPERS
// ═══════════════════════════════════════════════════════════════

export async function aggregateSum<T extends Record<string, unknown>>(
  model: {
    aggregate: (args: {
      _sum: Record<string, boolean>;
      where?: T;
    }) => Promise<Record<string, { _sum: Record<string, Decimal | null> }>>;
  },
  field: string,
  where?: T
): Promise<Decimal> {
  const result = await model.aggregate({
    _sum: { [field]: true },
    where,
  });
  return (result as Record<string, { _sum: Record<string, Decimal | null> }>)._sum?.[field] ?? new Decimal(0);
}

export async function aggregateCount<T extends Record<string, unknown>>(
  model: {
    count: (args: { where?: T }) => Promise<number>;
  },
  where?: T
): Promise<number> {
  return model.count({ where });
}

// ═══════════════════════════════════════════════════════════════
// SEARCH HELPERS
// ═══════════════════════════════════════════════════════════════

export function buildSearchFilter<T extends Record<string, unknown>>(
  searchTerm: string | undefined,
  searchableFields: string[]
): T | undefined {
  if (!searchTerm || searchTerm.trim() === "") return undefined;

  const conditions = searchableFields.map((field) => ({
    [field]: { contains: searchTerm, mode: "insensitive" as const },
  }));

  return { OR: conditions } as T;
}

export function buildDateRangeFilter(
  field: string,
  startDate?: string | Date,
  endDate?: string | Date
): Record<string, unknown> | undefined {
  if (!startDate && !endDate) return undefined;

  const filter: Record<string, Record<string, Date>> = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].gte = new Date(startDate);
    if (endDate) filter[field].lte = new Date(endDate);
  }

  return filter;
}

// ═══════════════════════════════════════════════════════════════
// SOFT DELETE
// ═══════════════════════════════════════════════════════════════

export async function softDelete<T extends { deletedAt?: Date | null }>(
  model: {
    update: (args: { where: { id: string }; data: { deletedAt: Date } }) => Promise<T>;
  },
  id: string
): Promise<T> {
  return model.update({
    where: { id },
    data: { deletedAt: new Date() } as Partial<T>,
  });
}

export async function restoreSoftDelete<T extends { deletedAt?: Date | null }>(
  model: {
    update: (args: { where: { id: string }; data: { deletedAt: null } }) => Promise<T>;
  },
  id: string
): Promise<T> {
  return model.update({
    where: { id },
    data: { deletedAt: null } as Partial<T>,
  });
}

// ═══════════════════════════════════════════════════════════════
// DATABASE HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy";
  latency: number;
  timestamp: Date;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return {
      status: "healthy",
      latency,
      timestamp: new Date(),
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: "unhealthy",
      latency,
      timestamp: new Date(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

process.on("beforeExit", async () => {
  await disconnectDatabase();
});

export default prisma;
