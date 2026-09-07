import type {
  User,
  Account,
  Session,
  Farm,
  FarmMember,
  FarmField,
  Crop,
  CropVariety,
  Planting,
  Irrigation,
  IrrigationZone,
  Soil,
  SoilSample,
  Weather,
  WeatherForecast,
  Pest,
  PestAlert,
  Harvest,
  HarvestRecord,
  Equipment,
  EquipmentMaintenance,
  EquipmentAssignment,
  Market,
  MarketPrice,
  Produce,
  ProduceListing,
  Buyer,
  Order,
  OrderItem,
  Contract,
  Yield,
  YieldForecast,
  Satellite,
  SatelliteImage,
  Drone,
  DroneFlight,
  Sensor,
  SensorReading,
  Financial,
  Transaction,
  Notification,
  AuditLog,
  Document,
  ApiKey,
  FarmImage,
} from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// ENUM TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  UserRole,
  FarmStatus,
  CropStatus,
  IrrigationType,
  SoilType,
  PestSeverity,
  EquipmentStatus,
  MarketStatus,
  OrderStatus,
  ContractStatus,
  NotificationType,
  Season,
  GrowthStage,
  SoilMoistureLevel,
  WeatherCondition,
};

// ═══════════════════════════════════════════════════════════════
// PRISMA MODEL TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  User,
  Account,
  Session,
  Farm,
  FarmMember,
  FarmField,
  Crop,
  CropVariety,
  Planting,
  Irrigation,
  IrrigationZone,
  Soil,
  SoilSample,
  Weather,
  WeatherForecast,
  Pest,
  PestAlert,
  Harvest,
  HarvestRecord,
  Equipment,
  EquipmentMaintenance,
  EquipmentAssignment,
  Market,
  MarketPrice,
  Produce,
  ProduceListing,
  Buyer,
  Order,
  OrderItem,
  Contract,
  Yield,
  YieldForecast,
  Satellite,
  SatelliteImage,
  Drone,
  DroneFlight,
  Sensor,
  SensorReading,
  Financial,
  Transaction,
  Notification,
  AuditLog,
  Document,
  ApiKey,
  FarmImage,
};

// ═══════════════════════════════════════════════════════════════
// WITH RELATIONS TYPES
// ═══════════════════════════════════════════════════════════════

export type UserWithRelations = User & {
  accounts: Account[];
  sessions: Session[];
  farms: FarmMember[];
  ownedFarms: Farm[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  documents: Document[];
  apiKeys: ApiKey[];
};

export type UserWithFarms = User & {
  farms: (FarmMember & {
    farm: Pick<Farm, "id" | "name" | "status" | "areaHa">;
  })[];
};

export type FarmWithRelations = Farm & {
  owner: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  members: (FarmMember & {
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  })[];
  fields: FarmField[];
  crops: Crop[];
  equipment: Equipment[];
};

export type FarmDetail = Farm & {
  owner: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  members: (FarmMember & {
    user: Pick<User, "id" | "name" | "email" | "avatarUrl" | "role">;
  })[];
  fields: FarmFieldWithCrops[];
  crops: CropWithRelations[];
  equipment: Equipment[];
  soilSamples: SoilSample[];
  weathers: Weather[];
  financials: Financial[];
  yieldForecasts: YieldForecast[];
};

export type FarmFieldWithCrops = FarmField & {
  crops: Crop[];
  irrigationZones: IrrigationZone[];
  soilSamples: SoilSample[];
};

export type CropWithRelations = Crop & {
  variety: CropVariety | null;
  field: FarmField | null;
  plantings: Planting[];
  harvestRecords: HarvestRecord[];
  yields: Yield[];
  yieldForecasts: YieldForecast[];
  pestAlerts: PestAlert[];
};

export type CropSummary = Crop & {
  field: Pick<FarmField, "id" | "name"> | null;
  variety: Pick<CropVariety, "id" | "name"> | null;
  _count: {
    harvestRecords: number;
    pestAlerts: number;
  };
};

export type IrrigationZoneWithIrrigations = IrrigationZone & {
  irrigations: Irrigation[];
  sensors: Sensor[];
};

export type EquipmentWithMaintenance = Equipment & {
  maintenance: EquipmentMaintenance[];
  assignments: EquipmentAssignment[];
};

export type HarvestWithRecords = Harvest & {
  records: (HarvestRecord & {
    crop: Pick<Crop, "id" | "name">;
    field: Pick<FarmField, "id" | "name">;
    produce: Produce[];
  })[];
};

export type OrderWithItems = Order & {
  buyer: Buyer & {
    user: Pick<User, "id" | "name" | "email">;
  };
  items: (OrderItem & {
    listing: ProduceListing & {
      produce: Produce;
    };
  })[];
  contract: Contract | null;
};

export type ContractWithRelations = Contract & {
  farm: Pick<Farm, "id" | "name">;
  market: Pick<Market, "id" | "name">;
  order: Order | null;
};

export type MarketWithPrices = Market & {
  prices: MarketPrice[];
  _count: {
    listings: number;
    prices: number;
  };
};

export type ProduceListingWithDetails = ProduceListing & {
  market: Pick<Market, "id" | "name">;
  produce: Produce & {
    harvestRecord: HarvestRecord & {
      crop: Pick<Crop, "id" | "name">;
      harvest: Harvest;
    };
  };
  seller: Pick<User, "id" | "name" | "email" | "avatarUrl">;
};

export type DroneWithFlights = Drone & {
  flights: DroneFlight[];
};

export type SensorWithReadings = Sensor & {
  readings: SensorReading[];
};

export type NotificationWithUser = Notification & {
  user: Pick<User, "id" | "name" | "email">;
};

export type AuditLogWithUser = AuditLog & {
  user: Pick<User, "id" | "name" | "email"> | null;
};

// ═══════════════════════════════════════════════════════════════
// API REQUEST TYPES
// ═══════════════════════════════════════════════════════════════

export type RegisterInput = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: "FARM_OWNER" | "FARM_MANAGER" | "BUYER" | "ANALYST" | "VIEWER";
};

export type LoginInput = {
  email: string;
  password: string;
  remember?: boolean;
};

export type UpdateProfileInput = {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
};

export type CreateFarmInput = {
  name: string;
  description?: string;
  areaHa: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
  logoUrl?: string;
};

export type UpdateFarmInput = Partial<CreateFarmInput> & {
  status?: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED" | "ARCHIVED";
};

export type CreateFieldInput = {
  name: string;
  description?: string;
  areaHa: number;
  latitude?: number;
  longitude?: number;
  soilType: "SANDY" | "SILTY" | "CLAY" | "LOAMY" | "PEATY" | "CHALKY" | "SALINE" | "ROCKY";
  metadata?: Record<string, unknown>;
};

export type CreateCropInput = {
  farmId: string;
  fieldId?: string;
  varietyId?: string;
  name: string;
  scientificName?: string;
  status?: string;
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
  growthStage?: string;
  plantingDate?: Date | string;
  expectedHarvest?: Date | string;
  areaPlantedHa?: number;
  seedRate?: number;
  metadata?: Record<string, unknown>;
};

export type CreateIrrigationInput = {
  zoneId: string;
  type: "DRIP" | "SPRINKLER" | "FLOOD" | "CENTER_PIVOT" | "SUBSURFACE" | "MANUAL" | "SMART_AUTOMATED";
  startDate: Date | string;
  endDate?: Date | string;
  durationMin?: number;
  volumeLiters?: number;
  flowRate?: number;
  efficiency?: number;
  automated?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type CreatePestAlertInput = {
  fieldId: string;
  cropId?: string;
  pestId?: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "SEVERE";
  detectedBy?: "manual" | "sensor" | "satellite" | "drone";
  description?: string;
  latitude?: number;
  longitude?: number;
  areaHa?: number;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
};

export type CreateEquipmentInput = {
  farmId: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  year?: number;
  purchaseDate?: Date | string;
  purchasePrice?: number;
  currentValue?: number;
  fuelType?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
};

export type CreateMarketInput = {
  name: string;
  location?: string;
  region?: string;
  country?: string;
  currency?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

export type CreateOrderInput = {
  buyerId: string;
  items: {
    listingId: string;
    quantity: number;
    unit?: string;
  }[];
  shippingAddress?: string;
  deliveryDate?: Date | string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type CreateContractInput = {
  farmId: string;
  marketId: string;
  title: string;
  description?: string;
  totalValue: number;
  currency?: string;
  startDate: Date | string;
  endDate: Date | string;
  terms?: string;
  metadata?: Record<string, unknown>;
};

export type CreateHarvestInput = {
  farmId: string;
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
  year: number;
  startDate: Date | string;
  endDate?: Date | string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type CreateSensorInput = {
  farmId: string;
  zoneId?: string;
  name: string;
  type: string;
  model?: string;
  serialNumber?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
};

export type CreateFinancialInput = {
  farmId: string;
  type: "revenue" | "expense" | "investment" | "loan";
  category: string;
  amount: number;
  currency?: string;
  date: Date | string;
  description?: string;
  reference?: string;
  receiptUrl?: string;
  metadata?: Record<string, unknown>;
};

// ═══════════════════════════════════════════════════════════════
// FILTER TYPES
// ═══════════════════════════════════════════════════════════════

export type PaginationParams = {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
};

export type FarmFilters = PaginationParams & {
  status?: string;
  search?: string;
  ownerId?: string;
  minArea?: number;
  maxArea?: number;
  country?: string;
};

export type CropFilters = PaginationParams & {
  farmId?: string;
  fieldId?: string;
  status?: string;
  season?: string;
  growthStage?: string;
  search?: string;
  plantingDateFrom?: Date | string;
  plantingDateTo?: Date | string;
};

export type OrderFilters = PaginationParams & {
  buyerId?: string;
  status?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  minAmount?: number;
  maxAmount?: number;
};

export type MarketPriceFilters = PaginationParams & {
  marketId?: string;
  cropName?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  currency?: string;
};

export type SensorReadingFilters = PaginationParams & {
  sensorId?: string;
  fieldId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  anomaly?: boolean;
  minValue?: number;
  maxValue?: number;
};

export type FinancialFilters = PaginationParams & {
  farmId?: string;
  type?: "revenue" | "expense" | "investment" | "loan";
  category?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  minAmount?: number;
  maxAmount?: number;
};

export type NotificationFilters = PaginationParams & {
  type?: string;
  read?: boolean;
  dateFrom?: Date | string;
  dateTo?: Date | string;
};

export type PestAlertFilters = PaginationParams & {
  fieldId?: string;
  cropId?: string;
  severity?: string;
  resolved?: boolean;
  dateFrom?: Date | string;
  dateTo?: Date | string;
};

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type ErrorResponse = {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp: string;
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS TYPES
// ═══════════════════════════════════════════════════════════════

export type DashboardStats = {
  totalFarms: number;
  totalFields: number;
  totalCrops: number;
  totalEquipment: number;
  activeAlerts: number;
  pendingOrders: number;
  upcomingHarvests: number;
  recentActivities: AuditLog[];
};

export type FarmDashboard = {
  farm: Farm;
  stats: {
    totalArea: number;
    activeCrops: number;
    irrigationsThisMonth: number;
    maintenancePending: number;
    pestAlerts: number;
    totalYield: number;
    revenue: number;
    expenses: number;
  };
  recentCrops: CropSummary[];
  weatherForecast: WeatherForecast[];
  upcomingHarvests: (Harvest & { records: HarvestRecord[] })[];
  recentAlerts: PestAlert[];
};

export type CropAnalytics = {
  cropId: string;
  cropName: string;
  totalYield: number;
  averageYield: number;
  yieldTrend: number; // percentage change
  growthProgress: number; // percentage
  healthScore: number; // 0-100
  riskFactors: {
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }[];
  optimalActions: {
    action: string;
    priority: "low" | "medium" | "high";
    reason: string;
  }[];
};

export type MarketAnalytics = {
  cropName: string;
  currentPrice: number;
  priceChange: number; // percentage
  priceHistory: { date: string; price: number }[];
  demandForecast: {
    period: string;
    predicted: number;
    confidence: number;
  }[];
  competitorPrices: {
    market: string;
    price: number;
  }[];
};

export type WeatherAnalytics = {
  current: Weather;
  forecast: WeatherForecast[];
  historical: {
    averageTemp: number;
    totalRainfall: number;
    sunnyDays: number;
    rainyDays: number;
  };
  alerts: {
    type: string;
    severity: string;
    message: string;
    validUntil: Date;
  }[];
};

export type FinancialAnalytics = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByCategory: { category: string; amount: number }[];
  expenseByCategory: { category: string; amount: number }[];
  monthlyTrend: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  cashFlow: {
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }[];
};

export type YieldAnalytics = {
  totalYield: number;
  averageYieldPerHa: number;
  yieldByCrop: {
    cropName: string;
    yield: number;
    area: number;
    yieldPerHa: number;
  }[];
  yieldTrend: {
    period: string;
    yield: number;
  }[];
  forecast: YieldForecast[];
};

// ═══════════════════════════════════════════════════════════════
// CHART DATA TYPES
// ═══════════════════════════════════════════════════════════════

export type ChartDataPoint = {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
};

export type TimeSeriesDataPoint = {
  date: string;
  value: number;
  label?: string;
};

export type BarChartData = {
  category: string;
  value: number;
  fill?: string;
};

export type LineChartData = {
  timestamp: string;
  [key: string]: number | string;
};

export type PieChartData = {
  name: string;
  value: number;
  color: string;
  percent?: number;
};

export type HeatmapData = {
  x: string;
  y: string;
  value: number;
  color?: string;
};

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  type: "farm" | "field" | "sensor" | "alert" | "equipment";
  label: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET TYPES
// ═══════════════════════════════════════════════════════════════

export type WebSocketEvent =
  | { type: "sensor:reading"; data: SensorReading }
  | { type: "weather:alert"; data: Weather }
  | { type: "pest:alert"; data: PestAlert }
  | { type: "order:update"; data: Order }
  | { type: "notification:new"; data: Notification }
  | { type: "irrigation:status"; data: Irrigation }
  | { type: "equipment:maintenance"; data: EquipmentMaintenance }
  | { type: "market:price_update"; data: MarketPrice }
  | { type: "drone:flight_update"; data: DroneFlight }
  | { type: "satellite:new_image"; data: SatelliteImage };

export type WebSocketSubscription = {
  channel: string;
  filters?: Record<string, unknown>;
  callback: (event: WebSocketEvent) => void;
};

// ═══════════════════════════════════════════════════════════════
// EXPORT & REPORT TYPES
// ═══════════════════════════════════════════════════════════════

export type ExportOptions = {
  format: "csv" | "xlsx" | "json" | "pdf";
  includeHeaders?: boolean;
  dateRange?: {
    from: Date | string;
    to: Date | string;
  };
  columns?: string[];
  filters?: Record<string, unknown>;
};

export type ReportConfig = {
  title: string;
  description?: string;
  type: "farm_summary" | "crop_analysis" | "financial" | "harvest" | "weather";
  farmId: string;
  dateRange: {
    from: Date | string;
    to: Date | string;
  };
  sections: ReportSection[];
  format: "pdf" | "xlsx" | "csv";
};

export type ReportSection = {
  title: string;
  type: "table" | "chart" | "summary" | "text";
  dataSource?: string;
  config?: Record<string, unknown>;
  content?: string;
};

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════

export type AppConfig = {
  appName: string;
  appVersion: string;
  environment: "development" | "staging" | "production";
  apiBaseUrl: string;
  wsUrl: string;
  features: {
    enableSatellite: boolean;
    enableDrone: boolean;
    enableIoT: boolean;
    enableAI: boolean;
    enableMarketplace: boolean;
  };
  limits: {
    maxFarms: number;
    maxFields: number;
    maxSensors: number;
    maxFileSize: number;
    maxExportRows: number;
  };
};

export type UserPreferences = {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    defaultView: string;
    widgets: string[];
    refreshInterval: number;
  };
};

// ═══════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type SortDirection = "asc" | "desc";

export type SortConfig<T> = {
  field: keyof T;
  direction: SortDirection;
};

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "notIn"
  | "between";

export type FilterCondition<T> = {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
};

export type SearchableField<T> = {
  field: keyof T;
  weight?: number;
};
