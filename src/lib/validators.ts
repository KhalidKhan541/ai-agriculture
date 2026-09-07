import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// COMMON VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const idSchema = z.string().cuid();
export const emailSchema = z.string().email("Invalid email address");
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number")
  .optional();
export const urlSchema = z.string().url("Invalid URL");
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name is too long");
export const descriptionSchema = z
  .string()
  .max(5000, "Description is too long")
  .optional();
export const positiveNumberSchema = z
  .number()
  .positive("Must be a positive number");
export const nonNegativeNumberSchema = z
  .number()
  .nonnegative("Must be non-negative");
export const percentageSchema = z
  .number()
  .min(0, "Percentage must be at least 0")
  .max(100, "Percentage must be at most 100");
export const coordinateSchema = z
  .number()
  .min(-180, "Invalid longitude")
  .max(180, "Invalid longitude");
export const latitudeSchema = z
  .number()
  .min(-90, "Invalid latitude")
  .max(90, "Invalid latitude");
export const decimalSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Invalid decimal value");
export const dateSchema = z.coerce.date();
export const dateStringSchema = z.string().datetime();
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ═══════════════════════════════════════════════════════════════
// AUTH VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const registerSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    phone: phoneSchema,
    role: z
      .enum([
        "FARM_OWNER",
        "FARM_MANAGER",
        "BUYER",
        "ANALYST",
        "VIEWER",
      ])
      .default("FARM_OWNER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema,
  avatarUrl: urlSchema.optional(),
  timezone: z.string().default("UTC"),
  locale: z.string().default("en"),
});

// ═══════════════════════════════════════════════════════════════
// FARM VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createFarmSchema = z.object({
  name: z
    .string()
    .min(2, "Farm name must be at least 2 characters")
    .max(100, "Farm name is too long"),
  description: descriptionSchema,
  areaHa: positiveNumberSchema,
  latitude: latitudeSchema.optional(),
  longitude: coordinateSchema.optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default("US"),
  postalCode: z.string().max(20).optional(),
  timezone: z.string().default("UTC"),
  logoUrl: urlSchema.optional(),
});

export const updateFarmSchema = createFarmSchema.partial().extend({
  status: z
    .enum([
      "ACTIVE",
      "INACTIVE",
      "PENDING_VERIFICATION",
      "SUSPENDED",
      "ARCHIVED",
    ])
    .optional(),
});

export const farmFilterSchema = z.object({
  status: z
    .enum([
      "ACTIVE",
      "INACTIVE",
      "PENDING_VERIFICATION",
      "SUSPENDED",
      "ARCHIVED",
    ])
    .optional(),
  search: z.string().optional(),
  ownerId: idSchema.optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  country: z.string().optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// FIELD VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createFieldSchema = z.object({
  name: z.string().min(2).max(100),
  description: descriptionSchema,
  areaHa: positiveNumberSchema,
  latitude: latitudeSchema.optional(),
  longitude: coordinateSchema.optional(),
  soilType: z.enum([
    "SANDY",
    "SILTY",
    "CLAY",
    "LOAMY",
    "PEATY",
    "CHALKY",
    "SALINE",
    "ROCKY",
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export const updateFieldSchema = createFieldSchema.partial();

// ═══════════════════════════════════════════════════════════════
// CROP VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createCropSchema = z.object({
  farmId: idSchema,
  fieldId: idSchema.optional(),
  varietyId: idSchema.optional(),
  name: z.string().min(1).max(100),
  scientificName: z.string().max(200).optional(),
  status: z
    .enum([
      "PLANNED",
      "SEEDING",
      "GERMINATING",
      "GROWING",
      "FLOWERING",
      "FRUITING",
      "MATURING",
      "READY_FOR_HARVEST",
      "HARVESTED",
      "FAILED",
      "DISEASED",
    ])
    .default("PLANNED"),
  season: z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER"]),
  growthStage: z
    .enum([
      "DORMANT",
      "EMERGENCE",
      "VEGETATIVE",
      "REPRODUCTIVE",
      "RIPENESS",
      "SENESCENCE",
    ])
    .default("DORMANT"),
  plantingDate: dateSchema.optional(),
  expectedHarvest: dateSchema.optional(),
  areaPlantedHa: z.coerce.number().positive().optional(),
  seedRate: z.coerce.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateCropSchema = createCropSchema
  .omit({ farmId: true })
  .partial();

export const cropFilterSchema = z.object({
  farmId: idSchema.optional(),
  fieldId: idSchema.optional(),
  status: z
    .enum([
      "PLANNED",
      "SEEDING",
      "GERMINATING",
      "GROWING",
      "FLOWERING",
      "FRUITING",
      "MATURING",
      "READY_FOR_HARVEST",
      "HARVESTED",
      "FAILED",
      "DISEASED",
    ])
    .optional(),
  season: z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER"]).optional(),
  growthStage: z
    .enum([
      "DORMANT",
      "EMERGENCE",
      "VEGETATIVE",
      "REPRODUCTIVE",
      "RIPENESS",
      "SENESCENCE",
    ])
    .optional(),
  search: z.string().optional(),
  plantingDateFrom: dateSchema.optional(),
  plantingDateTo: dateSchema.optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// IRRIGATION VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createIrrigationZoneSchema = z.object({
  fieldId: idSchema,
  name: z.string().min(2).max(100),
  areaHa: positiveNumberSchema,
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const createIrrigationSchema = z.object({
  zoneId: idSchema,
  type: z.enum([
    "DRIP",
    "SPRINKLER",
    "FLOOD",
    "CENTER_PIVOT",
    "SUBSURFACE",
    "MANUAL",
    "SMART_AUTOMATED",
  ]),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  durationMin: z.coerce.number().int().positive().optional(),
  volumeLiters: z.coerce.number().positive().optional(),
  flowRate: z.coerce.number().positive().optional(),
  efficiency: percentageSchema.optional(),
  automated: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const irrigationFilterSchema = z.object({
  zoneId: idSchema.optional(),
  type: z
    .enum([
      "DRIP",
      "SPRINKLER",
      "FLOOD",
      "CENTER_PIVOT",
      "SUBSURFACE",
      "MANUAL",
      "SMART_AUTOMATED",
    ])
    .optional(),
  automated: z.coerce.boolean().optional(),
  startDateFrom: dateSchema.optional(),
  startDateTo: dateSchema.optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// SOIL VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createSoilSchema = z.object({
  fieldId: idSchema,
  type: z.enum([
    "SANDY",
    "SILTY",
    "CLAY",
    "LOAMY",
    "PEATY",
    "CHALKY",
    "SALINE",
    "ROCKY",
  ]),
  ph: z.coerce.number().min(0).max(14).optional(),
  organicMatter: z.coerce.number().min(0).max(100).optional(),
  nitrogen: z.coerce.number().min(0).optional(),
  phosphorus: z.coerce.number().min(0).optional(),
  potassium: z.coerce.number().min(0).optional(),
  calcium: z.coerce.number().min(0).optional(),
  magnesium: z.coerce.number().min(0).optional(),
  sulfur: z.coerce.number().min(0).optional(),
  iron: z.coerce.number().min(0).optional(),
  moisture: z
    .enum(["DRY", "LOW", "ADEQUATE", "OPTIMAL", "HIGH", "WATERLOGGED"])
    .optional(),
  temperature: z.coerce.number().optional(),
  conductivity: z.coerce.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createSoilSampleSchema = z.object({
  farmId: idSchema,
  fieldId: idSchema,
  soilId: idSchema.optional(),
  labName: z.string().max(200).optional(),
  sampleDate: dateSchema.default(new Date()),
  depthCm: z.coerce.number().min(0).max(200).optional(),
  ph: z.coerce.number().min(0).max(14).optional(),
  organicMatter: z.coerce.number().min(0).max(100).optional(),
  nitrogen: z.coerce.number().min(0).optional(),
  phosphorus: z.coerce.number().min(0).optional(),
  potassium: z.coerce.number().min(0).optional(),
  cec: z.coerce.number().min(0).optional(),
  texture: z.string().max(100).optional(),
  recommendations: z.string().max(5000).optional(),
  reportUrl: urlSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ═══════════════════════════════════════════════════════════════
// WEATHER VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const weatherFilterSchema = z.object({
  farmId: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  condition: z
    .enum([
      "CLEAR",
      "PARTLY_CLOUDY",
      "CLOUDY",
      "RAINY",
      "HEAVY_RAIN",
      "THUNDERSTORM",
      "SNOWY",
      "FOGGY",
      "WINDY",
      "HOT",
      "COLD",
      "FROST",
    ])
    .optional(),
});

// ═══════════════════════════════════════════════════════════════
// PEST VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createPestSchema = z.object({
  name: z.string().min(1).max(100),
  scientificName: z.string().max(200).optional(),
  category: z.enum([
    "insect",
    "fungus",
    "weed",
    "rodent",
    "nematode",
  ]),
  description: z.string().max(5000).optional(),
  symptoms: z.string().max(5000).optional(),
  treatment: z.string().max(5000).optional(),
  prevention: z.string().max(5000).optional(),
  imageUrl: urlSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createPestAlertSchema = z.object({
  fieldId: idSchema,
  cropId: idSchema.optional(),
  pestId: idSchema.optional(),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL", "SEVERE"]),
  detectedBy: z
    .enum(["manual", "sensor", "satellite", "drone"])
    .optional(),
  description: z.string().max(5000).optional(),
  latitude: latitudeSchema.optional(),
  longitude: coordinateSchema.optional(),
  areaHa: z.coerce.number().positive().optional(),
  imageUrl: urlSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const pestAlertFilterSchema = z.object({
  fieldId: idSchema.optional(),
  cropId: idSchema.optional(),
  severity: z
    .enum(["LOW", "MODERATE", "HIGH", "CRITICAL", "SEVERE"])
    .optional(),
  resolved: z.coerce.boolean().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createEquipmentSchema = z.object({
  farmId: idSchema,
  name: z.string().min(2).max(100),
  type: z.string().min(2).max(50),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  purchaseDate: dateSchema.optional(),
  purchasePrice: z.coerce.number().positive().optional(),
  currentValue: z.coerce.number().min(0).optional(),
  fuelType: z.string().max(50).optional(),
  imageUrl: urlSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema
  .omit({ farmId: true })
  .extend({
    status: z
      .enum([
        "AVAILABLE",
        "IN_USE",
        "MAINTENANCE",
        "REPAIR_NEEDED",
        "OUT_OF_SERVICE",
        "RETIRED",
      ])
      .optional(),
    hoursUsed: z.coerce.number().min(0).optional(),
  })
  .partial();

export const createMaintenanceSchema = z.object({
  equipmentId: idSchema,
  type: z.enum(["scheduled", "unscheduled", "inspection"]),
  description: z.string().min(1).max(5000),
  cost: z.coerce.number().min(0).optional(),
  performedBy: z.string().max(200).optional(),
  performedAt: dateSchema.default(new Date()),
  nextServiceAt: dateSchema.optional(),
  hoursAtService: z.coerce.number().min(0).optional(),
  partsReplaced: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ═══════════════════════════════════════════════════════════════
// MARKET VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createMarketSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().max(200).optional(),
  region: z.string().max(100).optional(),
  country: z.string().max(100).default("US"),
  currency: z.string().max(3).default("USD"),
  description: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createMarketPriceSchema = z.object({
  marketId: idSchema,
  cropName: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  unit: z.string().max(20).default("kg"),
  price: z.coerce.number().positive(),
  currency: z.string().max(3).default("USD"),
  date: dateSchema,
  highPrice: z.coerce.number().min(0).optional(),
  lowPrice: z.coerce.number().min(0).optional(),
  avgPrice: z.coerce.number().min(0).optional(),
  volume: z.coerce.number().min(0).optional(),
  source: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const marketPriceFilterSchema = z.object({
  marketId: idSchema.optional(),
  cropName: z.string().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  currency: z.string().optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// PRODUCE & LISTING VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createProduceListingSchema = z.object({
  marketId: idSchema,
  produceId: idSchema,
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  quantity: positiveNumberSchema,
  unit: z.string().max(20).default("kg"),
  pricePerUnit: z.coerce.number().positive(),
  currency: z.string().max(3).default("USD"),
  minOrderQty: z.coerce.number().positive().optional(),
  availableFrom: dateSchema.optional(),
  availableUntil: dateSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const produceFilterSchema = z.object({
  marketId: idSchema.optional(),
  sellerId: idSchema.optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "SOLD_OUT", "PRICE_UPDATING", "DELISTED"])
    .optional(),
  cropName: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// ORDER VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createOrderSchema = z.object({
  buyerId: idSchema,
  items: z
    .array(
      z.object({
        listingId: idSchema,
        quantity: positiveNumberSchema,
        unit: z.string().max(20).default("kg"),
      })
    )
    .min(1, "At least one item is required"),
  shippingAddress: z.string().max(1000).optional(),
  deliveryDate: dateSchema.optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
    "DISPUTED",
  ]),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const orderFilterSchema = z.object({
  buyerId: idSchema.optional(),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "IN_TRANSIT",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
      "DISPUTED",
    ])
    .optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// CONTRACT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createContractSchema = z
  .object({
    farmId: idSchema,
    marketId: idSchema,
    title: z.string().min(2).max(200),
    description: z.string().max(5000).optional(),
    totalValue: positiveNumberSchema,
    currency: z.string().max(3).default("USD"),
    startDate: dateSchema,
    endDate: dateSchema,
    terms: z.string().max(10000).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const contractFilterSchema = z.object({
  farmId: idSchema.optional(),
  status: z
    .enum([
      "DRAFT",
      "PENDING_REVIEW",
      "ACTIVE",
      "FULFILLED",
      "BREACHED",
      "TERMINATED",
      "EXPIRED",
    ])
    .optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// HARVEST VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createHarvestSchema = z
  .object({
    farmId: idSchema,
    season: z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER"]),
    year: z.coerce.number().int().min(2000).max(2100),
    startDate: dateSchema,
    endDate: dateSchema.optional(),
    notes: z.string().max(5000).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export const createHarvestRecordSchema = z.object({
  harvestId: idSchema,
  cropId: idSchema,
  fieldId: idSchema,
  yieldKg: positiveNumberSchema,
  qualityGrade: z.enum(["A", "B", "C", "D"]).optional(),
  moistureContent: percentageSchema.optional(),
  laborHours: z.coerce.number().min(0).optional(),
  laborCost: z.coerce.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ═══════════════════════════════════════════════════════════════
// SENSOR VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createSensorSchema = z.object({
  farmId: idSchema,
  zoneId: idSchema.optional(),
  name: z.string().min(2).max(100),
  type: z.enum([
    "temperature",
    "humidity",
    "soil_moisture",
    "ph",
    "light",
    "rain",
    "wind",
  ]),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  latitude: latitudeSchema.optional(),
  longitude: coordinateSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createSensorReadingSchema = z.object({
  sensorId: idSchema,
  fieldId: idSchema.optional(),
  timestamp: dateSchema.default(new Date()),
  value: z.coerce.number(),
  unit: z.string().max(20),
  quality: percentageSchema.optional(),
  anomaly: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export const sensorReadingFilterSchema = z.object({
  sensorId: idSchema.optional(),
  fieldId: idSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  anomaly: z.coerce.boolean().optional(),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// FINANCIAL VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createFinancialSchema = z.object({
  farmId: idSchema,
  type: z.enum(["revenue", "expense", "investment", "loan"]),
  category: z.string().min(1).max(50),
  amount: z.coerce.number(),
  currency: z.string().max(3).default("USD"),
  date: dateSchema,
  description: z.string().max(5000).optional(),
  reference: z.string().max(100).optional(),
  receiptUrl: urlSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const financialFilterSchema = z.object({
  farmId: idSchema.optional(),
  type: z.enum(["revenue", "expense", "investment", "loan"]).optional(),
  category: z.string().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const notificationFilterSchema = z.object({
  type: z
    .enum([
      "WEATHER_ALERT",
      "PEST_ALERT",
      "IRRIGATION_REMINDER",
      "HARVEST_SCHEDULE",
      "MARKET_PRICE_CHANGE",
      "ORDER_UPDATE",
      "MAINTENANCE_REMINDER",
      "SYSTEM_ALERT",
      "PAYMENT_RECEIVED",
      "CONTRACT_UPDATE",
    ])
    .optional(),
  read: z.coerce.boolean().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// YIELD VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createYieldSchema = z.object({
  cropId: idSchema,
  season: z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER"]),
  year: z.coerce.number().int().min(2000).max(2100),
  actualKg: positiveNumberSchema,
  expectedKg: z.coerce.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const yieldFilterSchema = z.object({
  cropId: idSchema.optional(),
  farmId: idSchema.optional(),
  season: z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER"]).optional(),
  yearFrom: z.coerce.number().int().optional(),
  yearTo: z.coerce.number().int().optional(),
  ...paginationSchema.shape,
});

// ═══════════════════════════════════════════════════════════════
// SATELLITE & DRONE VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createSatelliteImageSchema = z.object({
  farmId: idSchema,
  satelliteId: idSchema,
  capturedAt: dateSchema,
  imageUrl: urlSchema,
  thumbnailUrl: urlSchema.optional(),
  ndviValue: z.coerce.number().min(-1).max(1).optional(),
  ndwiValue: z.coerce.number().min(-1).max(1).optional(),
  cloudCover: percentageSchema.optional(),
  resolution: z.string().max(20).optional(),
  bands: z.record(z.unknown()).optional(),
  analysis: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createDroneSchema = z.object({
  farmId: idSchema,
  name: z.string().min(2).max(100),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  batteryType: z.string().max(50).optional(),
  maxFlightMin: z.coerce.number().int().positive().optional(),
  maxRange: z.coerce.number().positive().optional(),
  sensors: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createDroneFlightSchema = z.object({
  droneId: idSchema,
  farmId: idSchema,
  fieldId: idSchema.optional(),
  pilotName: z.string().max(100).optional(),
  startTime: dateSchema,
  endTime: dateSchema.optional(),
  durationMin: z.coerce.number().int().min(0).optional(),
  distanceKm: z.coerce.number().min(0).optional(),
  altitude: z.coerce.number().min(0).optional(),
  areaCovered: z.coerce.number().min(0).optional(),
  images: z.array(urlSchema).optional(),
  analysis: z.record(z.unknown()).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ═══════════════════════════════════════════════════════════════
// SEARCH & EXPORT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const globalSearchSchema = z.object({
  query: z.string().min(1).max(200),
  types: z
    .array(
      z.enum([
        "farm",
        "crop",
        "equipment",
        "market",
        "order",
        "contract",
        "harvest",
      ])
    )
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const exportDataSchema = z.object({
  type: z.enum([
    "farms",
    "crops",
    "harvests",
    "financials",
    "orders",
    "sensors",
  ]),
  format: z.enum(["csv", "xlsx", "json"]).default("csv"),
  filters: z.record(z.unknown()).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});
