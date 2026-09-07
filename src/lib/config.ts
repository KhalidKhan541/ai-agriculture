import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT SCHEMA
// ═══════════════════════════════════════════════════════════════

const envSchema = z
  .object({
    // ─── Core ──────────────────────────────────────────────
    NODE_ENV: z
      .enum(["development", "staging", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3000),
    HOSTNAME: z.string().default("localhost"),
    APP_URL: z.string().url().default("http://localhost:3000"),
    API_URL: z.string().url().default("http://localhost:3000/api"),

    // ─── Database ──────────────────────────────────────────
    DATABASE_URL: z.string().url(),
    DATABASE_DIRECT_URL: z.string().url().optional(),

    // ─── Authentication ────────────────────────────────────
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),

    // OAuth Providers
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // ─── Email (SMTP) ─────────────────────────────────────
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // ─── Redis (Cache & Queues) ────────────────────────────
    REDIS_URL: z.string().url().optional(),
    REDIS_TOKEN: z.string().optional(),

    // ─── File Storage ──────────────────────────────────────
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().default("us-east-1"),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_ENDPOINT: z.string().url().optional(),

    // ─── External APIs ─────────────────────────────────────
    WEATHER_API_KEY: z.string().optional(),
    WEATHER_API_URL: z.string().url().optional(),
    SATELLITE_API_KEY: z.string().optional(),
    SATELLITE_API_URL: z.string().url().optional(),
    MAPBOX_TOKEN: z.string().optional(),

    // ─── Payments ──────────────────────────────────────────
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // ─── AI / ML ───────────────────────────────────────────
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    ML_API_URL: z.string().url().optional(),
    ML_API_KEY: z.string().optional(),

    // ─── Logging ───────────────────────────────────────────
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error", "fatal"])
      .default("info"),
    SERVICE_NAME: z.string().default("ai-agriculture"),

    // ─── Rate Limiting ─────────────────────────────────────
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 min
    RATE_LIMIT_MAX: z.coerce.number().default(100),

    // ─── App Limits ────────────────────────────────────────
    MAX_FARM_COUNT: z.coerce.number().default(50),
    MAX_FIELD_COUNT: z.coerce.number().default(500),
    MAX_SENSOR_COUNT: z.coerce.number().default(1000),
    MAX_FILE_SIZE_MB: z.coerce.number().default(50),
    MAX_EXPORT_ROWS: z.coerce.number().default(100000),

    // ─── Feature Flags ─────────────────────────────────────
    ENABLE_SATELLITE: z.coerce.boolean().default(false),
    ENABLE_DRONE: z.coerce.boolean().default(false),
    ENABLE_IOT: z.coerce.boolean().default(true),
    ENABLE_AI: z.coerce.boolean().default(true),
    ENABLE_MARKETPLACE: z.coerce.boolean().default(true),
    ENABLE_WEBSOCKET: z.coerce.boolean().default(true),
  })
  .passthrough();

// ═══════════════════════════════════════════════════════════════
// PARSE & VALIDATE ENVIRONMENT
// ═══════════════════════════════════════════════════════════════

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (issue) => `  ${issue.path.join(".")}: ${issue.message}`
      );
      console.error(
        "\n❌ Invalid environment variables:\n" + missingVars.join("\n") + "\n"
      );
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION OBJECT
// ═══════════════════════════════════════════════════════════════

const env = validateEnv();

export const config = {
  // ─── Core ────────────────────────────────────────────────
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
  isStaging: env.NODE_ENV === "staging",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  hostname: env.HOSTNAME,
  appUrl: env.APP_URL,
  apiUrl: env.API_URL,

  // ─── Database ────────────────────────────────────────────
  database: {
    url: env.DATABASE_URL,
    directUrl: env.DATABASE_DIRECT_URL,
  },

  // ─── Auth ────────────────────────────────────────────────
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  // ─── Email ───────────────────────────────────────────────
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
    isConfigured: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  },

  // ─── Redis ───────────────────────────────────────────────
  redis: {
    url: env.REDIS_URL,
    token: env.REDIS_TOKEN,
    isConfigured: Boolean(env.REDIS_URL),
  },

  // ─── Storage ─────────────────────────────────────────────
  storage: {
    s3: {
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      endpoint: env.S3_ENDPOINT,
      isConfigured: Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY),
    },
  },

  // ─── External APIs ───────────────────────────────────────
  weather: {
    apiKey: env.WEATHER_API_KEY,
    apiUrl: env.WEATHER_API_URL ?? "https://api.openweathermap.org/data/2.5",
    isConfigured: Boolean(env.WEATHER_API_KEY),
  },

  satellite: {
    apiKey: env.SATELLITE_API_KEY,
    apiUrl: env.SATELLITE_API_URL,
    isConfigured: Boolean(env.SATELLITE_API_KEY),
  },

  mapbox: {
    token: env.MAPBOX_TOKEN,
    isConfigured: Boolean(env.MAPBOX_TOKEN),
  },

  // ─── Payments ────────────────────────────────────────────
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    isConfigured: Boolean(env.STRIPE_SECRET_KEY),
  },

  // ─── AI / ML ─────────────────────────────────────────────
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL,
    mlApiUrl: env.ML_API_URL,
    mlApiKey: env.ML_API_KEY,
    isOpenAIConfigured: Boolean(env.OPENAI_API_KEY),
    isMLApiConfigured: Boolean(env.ML_API_URL && env.ML_API_KEY),
  },

  // ─── Logging ─────────────────────────────────────────────
  logging: {
    level: env.LOG_LEVEL,
    serviceName: env.SERVICE_NAME,
  },

  // ─── Rate Limiting ───────────────────────────────────────
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  // ─── Limits ──────────────────────────────────────────────
  limits: {
    maxFarms: env.MAX_FARM_COUNT,
    maxFields: env.MAX_FIELD_COUNT,
    maxSensors: env.MAX_SENSOR_COUNT,
    maxFileSizeMb: env.MAX_FILE_SIZE_MB,
    maxExportRows: env.MAX_EXPORT_ROWS,
  },

  // ─── Feature Flags ───────────────────────────────────────
  features: {
    satellite: env.ENABLE_SATELLITE,
    drone: env.ENABLE_DRONE,
    iot: env.ENABLE_IOT,
    ai: env.ENABLE_AI,
    marketplace: env.ENABLE_MARKETPLACE,
    websocket: env.ENABLE_WEBSOCKET,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════

export type Config = typeof config;
export type Environment = z.infer<typeof envSchema>;

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export function isFeatureEnabled(feature: keyof Config["features"]): boolean {
  return config.features[feature];
}

export function requireFeature(feature: keyof Config["features"]): void {
  if (!config.features[feature]) {
    throw new Error(
      `Feature '${feature}' is not enabled. Set ENABLE_${feature.toUpperCase()}=true`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// BUILD INFO
// ═══════════════════════════════════════════════════════════════

export const buildInfo = {
  version: process.env.npm_package_version ?? "1.0.0",
  buildTime: process.env.BUILD_TIME ?? new Date().toISOString(),
  gitCommit: process.env.GIT_COMMIT ?? "unknown",
  nodeVersion: process.version,
} as const;

export default config;
