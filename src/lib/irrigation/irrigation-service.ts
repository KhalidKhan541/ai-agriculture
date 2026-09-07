import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type IrrigationSystem = "drip" | "sprinkler" | "center_pivot" | "surface" | "subsurface" | "manual" | "flood";
export type IrrigationZoneStatus = "active" | "inactive" | "maintenance" | "setup";
export type ScheduleStatus = "scheduled" | "running" | "completed" | "paused" | "cancelled" | "failed";
export type WaterSource = "well" | "river" | "canal" | "reservoir" | "municipal" | "rainwater" | "recycled";
export type TriggerType = "time" | "moisture" | "temperature" | "rainfall" | "evapotranspiration" | "manual" | "soil_sensor";
export type MoistureUnit = "vwc" | "cb" | "kpa" | "bar" | "atmosphere";
export type FlowUnit = "lpm" | "gpm" | "m3h" | "lph";
export type AutomationRule = "always" | "day_only" | "night_only" | "weekdays" | "custom";
export type SensorType = "soil_moisture" | "temperature" | "humidity" | "rainfall" | "flow" | "pressure" | "ec" | "ph";

export interface IrrigationZone {
  id: string;
  farmId: string;
  fieldId: string;
  name: string;
  description: string;
  area: number;
  areaUnit: "hectares" | "acres";
  system: IrrigationSystem;
  status: IrrigationZoneStatus;
  waterSource: WaterSource;
  flowRate: number;
  flowUnit: FlowUnit;
  pressure: number;
  pressureUnit: "psi" | "bar" | "kpa";
  uniformity: number;
  emitterCount?: number;
  emitterSpacingCm?: number;
  pipeDiameterCm?: number;
  mainlineLengthM?: number;
  lateralLengthM?: number;
  filters: IrrigationFilter[];
  schedule: IrrigationSchedule[];
  sensors: IrrigationSensor[];
  automation: IrrigationAutomation;
  waterUsage: WaterUsageRecord[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IrrigationZoneCreateInput {
  farmId: string;
  fieldId: string;
  name: string;
  description?: string;
  area: number;
  areaUnit?: "hectares" | "acres";
  system: IrrigationSystem;
  waterSource?: WaterSource;
  flowRate?: number;
  flowUnit?: FlowUnit;
  pressure?: number;
  pressureUnit?: "psi" | "bar" | "kpa";
  emitterCount?: number;
  emitterSpacingCm?: number;
  pipeDiameterCm?: number;
  mainlineLengthM?: number;
  lateralLengthM?: number;
  metadata?: Record<string, unknown>;
}

export interface IrrigationZoneUpdateInput {
  name?: string;
  description?: string;
  area?: number;
  system?: IrrigationSystem;
  status?: IrrigationZoneStatus;
  waterSource?: WaterSource;
  flowRate?: number;
  flowUnit?: FlowUnit;
  pressure?: number;
  emitterCount?: number;
  emitterSpacingCm?: number;
  metadata?: Record<string, unknown>;
}

export interface IrrigationFilter {
  id: string;
  type: "screen" | "disc" | "sand" | "cartridge" | "media";
  meshSize: number;
  lastCleaned: Date;
  nextCleaning: Date;
  status: "good" | "needs_cleaning" | "replace";
}

export interface IrrigationSchedule {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  status: ScheduleStatus;
  triggerType: TriggerType;
  automationRule: AutomationRule;
  startTime: string;
  endTime: string;
  duration: number;
  durationUnit: "minutes" | "hours";
  daysOfWeek: number[];
  dateRange?: { start: Date; end: Date };
  waterAmount: number;
  waterAmountUnit: "liters" | "gallons" | "mm" | "inches";
  frequency: "daily" | "every_other_day" | "weekly" | "biweekly" | "monthly" | "custom";
  customIntervalDays?: number;
  priority: number;
  conditions: ScheduleCondition[];
  history: ScheduleExecution[];
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IrrigationScheduleCreateInput {
  zoneId: string;
  name: string;
  description?: string;
  triggerType?: TriggerType;
  automationRule?: AutomationRule;
  startTime?: string;
  endTime?: string;
  duration?: number;
  durationUnit?: "minutes" | "hours";
  daysOfWeek?: number[];
  dateRange?: { start: Date; end: Date };
  waterAmount?: number;
  waterAmountUnit?: string;
  frequency?: IrrigationSchedule["frequency"];
  customIntervalDays?: number;
  priority?: number;
  conditions?: ScheduleCondition[];
  metadata?: Record<string, unknown>;
}

export interface ScheduleCondition {
  type: "moisture_below" | "moisture_above" | "temp_above" | "temp_below" | "rainfall_below" | "rainfall_above" | "et_above" | "wind_below";
  value: number;
  unit: string;
  sensorId?: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  waterUsed: number;
  waterUnit: string;
  status: "success" | "partial" | "failed" | "cancelled";
  error?: string;
  triggerData?: Record<string, unknown>;
}

export interface IrrigationSensor {
  id: string;
  type: SensorType;
  name: string;
  location: { x: number; y: number; depth?: number };
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  currentValue: number;
  lastReading: Date;
  batteryLevel: number;
  status: "online" | "offline" | "low_battery" | "error";
  calibrationDate?: Date;
  metadata: Record<string, unknown>;
}

export interface IrrigationSensorCreateInput {
  type: SensorType;
  name: string;
  location: { x: number; y: number; depth?: number };
  unit: string;
  minThreshold: number;
  maxThreshold: number;
}

export interface IrrigationAutomation {
  enabled: boolean;
  mode: "auto" | "semi_auto" | "manual";
  rules: AutomationCondition[];
  weatherIntegration: boolean;
  soilSensorIntegration: boolean;
  lastAutomationRun?: Date;
  nextScheduledRun?: Date;
}

export interface AutomationCondition {
  id: string;
  name: string;
  enabled: boolean;
  parameter: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "between";
  value: number;
  valueMax?: number;
  unit: string;
  action: "start_irrigation" | "stop_irrigation" | "adjust_flow" | "skip_cycle" | "send_alert";
  actionValue?: number;
}

export interface WaterUsageRecord {
  id: string;
  zoneId: string;
  date: Date;
  amount: number;
  unit: string;
  cost: number;
  costCurrency: string;
  source: WaterSource;
  scheduleId?: string;
  method: "metered" | "calculated" | "estimated";
  metadata: Record<string, unknown>;
}

export interface WaterUsageCreateInput {
  zoneId: string;
  date: Date;
  amount: number;
  unit?: string;
  cost?: number;
  costCurrency?: string;
  source?: WaterSource;
  scheduleId?: string;
  method?: "metered" | "calculated" | "estimated";
  metadata?: Record<string, unknown>;
}

export interface WaterUsageSummary {
  zoneId: string;
  zoneName: string;
  period: { start: Date; end: Date };
  totalWaterUsed: number;
  totalCost: number;
  currency: string;
  avgDailyUsage: number;
  peakDailyUsage: number;
  bySchedule: { scheduleId: string; scheduleName: string; waterUsed: number; percentage: number }[];
  bySource: { source: WaterSource; amount: number; percentage: number }[];
  efficiency: number;
  costPerHectare: number;
  comparisonToAverage: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface IrrigationEfficiency {
  zoneId: string;
  distributionUniformity: number;
  applicationEfficiency: number;
  waterSavingsPotential: number;
  currentWaterUse: number;
  optimalWaterUse: number;
  wastePercentage: number;
  recommendations: string[];
  score: "A" | "B" | | "C" | "D" | "F";
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  evapotranspiration: number;
  forecast: {
    date: Date;
    temperature: number;
    rainfall: number;
    humidity: number;
  }[];
}

export interface SoilMoistureData {
  sensorId: string;
  value: number;
  unit: MoistureUnit;
  depth: number;
  timestamp: Date;
}

export interface IrrigationRecommendation {
  zoneId: string;
  recommendedAction: "irrigate" | "skip" | "reduce" | "increase";
  amount: number;
  amountUnit: string;
  duration: number;
  durationUnit: string;
  reason: string;
  confidence: number;
  basedOn: string[];
  generatedAt: Date;
}

export interface ZoneFilter {
  farmId?: string;
  fieldId?: string;
  system?: IrrigationSystem;
  status?: IrrigationZoneStatus;
  waterSource?: WaterSource;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

const zones = new Map<string, IrrigationZone>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDefaultAutomation(): IrrigationAutomation {
  return {
    enabled: false,
    mode: "manual",
    rules: [],
    weatherIntegration: false,
    soilSensorIntegration: false,
  };
}

function calculateEfficiency(zone: IrrigationZone): IrrigationEfficiency {
  const uniformity = zone.uniformity || 80;
  const applicationEfficiency =
    zone.system === "drip" ? 0.9
    : zone.system === "sprinkler" ? 0.75
    : zone.system === "center_pivot" ? 0.8
    : zone.system === "surface" ? 0.6
    : zone.system === "flood" ? 0.5
    : 0.7;

  const currentUse = zone.waterUsage.reduce((sum, w) => sum + w.amount, 0);
  const optimalUse = currentUse * applicationEfficiency;
  const waste = currentUse - optimalUse;
  const wastePercentage = currentUse > 0 ? (waste / currentUse) * 100 : 0;

  const recommendations: string[] = [];
  let score: "A" | "B" | "C" | "D" | "F" = "C";

  if (uniformity < 70) {
    recommendations.push("Low distribution uniformity - check emitter clogging and pressure");
  }
  if (applicationEfficiency < 0.7) {
    recommendations.push("Consider upgrading to drip irrigation for better efficiency");
  }
  if (wastePercentage > 20) {
    recommendations.push("Significant water waste detected - review scheduling and flow rates");
  }

  const overallScore = uniformity * 0.4 + applicationEfficiency * 100 * 0.6;
  if (overallScore >= 85) score = "A";
  else if (overallScore >= 75) score = "B";
  else if (overallScore >= 60) score = "C";
  else if (overallScore >= 45) score = "D";
  else score = "F";

  if (recommendations.length === 0) {
    recommendations.push("System operating within acceptable parameters");
  }

  return {
    zoneId: zone.id,
    distributionUniformity: uniformity,
    applicationEfficiency: Math.round(applicationEfficiency * 100),
    waterSavingsPotential: Math.round(waste),
    currentWaterUse: Math.round(currentUse),
    optimalWaterUse: Math.round(optimalUse),
    wastePercentage: Math.round(wastePercentage),
    recommendations,
    score,
  };
}

function getDefaultScheduleConditions(): ScheduleCondition[] {
  return [
    { type: "moisture_below", value: 30, unit: "%" },
    { type: "temp_above", value: 35, unit: "°C" },
    { type: "rainfall_below", value: 5, unit: "mm" },
  ];
}

// ─── Irrigation Service ─────────────────────────────────────────────────────

export const IrrigationService = {
  // ─── Zone Management ───────────────────────────────────────────────────

  /**
   * Create a new irrigation zone.
   */
  async createZone(input: IrrigationZoneCreateInput): Promise<IrrigationZone> {
    const errors: string[] = [];
    if (!input.farmId?.trim()) errors.push("Farm ID is required");
    if (!input.fieldId?.trim()) errors.push("Field ID is required");
    if (!input.name?.trim()) errors.push("Zone name is required");
    if (input.area <= 0) errors.push("Area must be positive");
    if (!input.system) errors.push("Irrigation system is required");

    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    const now = new Date();
    const zone: IrrigationZone = {
      id: randomUUID(),
      farmId: input.farmId.trim(),
      fieldId: input.fieldId.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || "",
      area: input.area,
      areaUnit: input.areaUnit || "hectares",
      system: input.system,
      status: "setup",
      waterSource: input.waterSource || "well",
      flowRate: input.flowRate || 0,
      flowUnit: input.flowUnit || "lpm",
      pressure: input.pressure || 0,
      pressureUnit: input.pressureUnit || "psi",
      uniformity: 0,
      emitterCount: input.emitterCount,
      emitterSpacingCm: input.emitterSpacingCm,
      pipeDiameterCm: input.pipeDiameterCm,
      mainlineLengthM: input.mainlineLengthM,
      lateralLengthM: input.lateralLengthM,
      filters: [],
      schedule: [],
      sensors: [],
      automation: getDefaultAutomation(),
      waterUsage: [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    zones.set(zone.id, zone);
    return zone;
  },

  /**
   * Get a zone by ID.
   */
  async getZoneById(zoneId: string): Promise<IrrigationZone | null> {
    return zones.get(zoneId) || null;
  },

  /**
   * List zones with filtering and pagination.
   */
  async listZones(
    filter: ZoneFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<IrrigationZone>> {
    let results = Array.from(zones.values());

    if (filter.farmId) results = results.filter((z) => z.farmId === filter.farmId);
    if (filter.fieldId) results = results.filter((z) => z.fieldId === filter.fieldId);
    if (filter.system) results = results.filter((z) => z.system === filter.system);
    if (filter.status) results = results.filter((z) => z.status === filter.status);
    if (filter.waterSource) results = results.filter((z) => z.waterSource === filter.waterSource);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (z) => z.name.toLowerCase().includes(q) || z.description.toLowerCase().includes(q)
      );
    }

    const sortBy = pagination.sortBy || "name";
    const sortOrder = pagination.sortOrder || "asc";
    results.sort((a: any, b: any) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const total = results.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;

    return {
      data: results.slice(start, start + pagination.limit),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };
  },

  /**
   * Update a zone.
   */
  async updateZone(zoneId: string, input: IrrigationZoneUpdateInput): Promise<IrrigationZone> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const updated: IrrigationZone = {
      ...zone,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.area !== undefined && { area: input.area }),
      ...(input.system !== undefined && { system: input.system }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.waterSource !== undefined && { waterSource: input.waterSource }),
      ...(input.flowRate !== undefined && { flowRate: input.flowRate }),
      ...(input.flowUnit !== undefined && { flowUnit: input.flowUnit }),
      ...(input.pressure !== undefined && { pressure: input.pressure }),
      ...(input.emitterCount !== undefined && { emitterCount: input.emitterCount }),
      ...(input.emitterSpacingCm !== undefined && { emitterSpacingCm: input.emitterSpacingCm }),
      ...(input.metadata !== undefined && { metadata: { ...zone.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    zones.set(zoneId, updated);
    return updated;
  },

  /**
   * Delete a zone.
   */
  async deleteZone(zoneId: string): Promise<boolean> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const activeSchedule = zone.schedule.find((s) => s.status === "running");
    if (activeSchedule) {
      throw new Error("Cannot delete zone with active irrigation. Stop all schedules first.");
    }

    zones.delete(zoneId);
    return true;
  },

  // ─── Schedule Management ───────────────────────────────────────────────

  /**
   * Create an irrigation schedule.
   */
  async createSchedule(input: IrrigationScheduleCreateInput): Promise<IrrigationSchedule> {
    const zone = zones.get(input.zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${input.zoneId}`);

    if (!input.name?.trim()) throw new Error("Schedule name is required");
    if (input.duration !== undefined && input.duration <= 0) {
      throw new Error("Duration must be positive");
    }

    const now = new Date();
    const schedule: IrrigationSchedule = {
      id: randomUUID(),
      zoneId: input.zoneId,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      status: "scheduled",
      triggerType: input.triggerType || "time",
      automationRule: input.automationRule || "always",
      startTime: input.startTime || "06:00",
      endTime: input.endTime || "07:00",
      duration: input.duration || 60,
      durationUnit: input.durationUnit || "minutes",
      daysOfWeek: input.daysOfWeek || [1, 2, 3, 4, 5, 6, 0],
      dateRange: input.dateRange,
      waterAmount: input.waterAmount || 0,
      waterAmountUnit: input.waterAmountUnit || "liters",
      frequency: input.frequency || "daily",
      customIntervalDays: input.customIntervalDays,
      priority: input.priority || 5,
      conditions: input.conditions || getDefaultScheduleConditions(),
      history: [],
      isActive: true,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    zone.schedule.push(schedule);
    zone.updatedAt = now;
    zones.set(input.zoneId, zone);

    return schedule;
  },

  /**
   * Get a schedule by ID.
   */
  async getScheduleById(zoneId: string, scheduleId: string): Promise<IrrigationSchedule | null> {
    const zone = zones.get(zoneId);
    if (!zone) return null;
    return zone.schedule.find((s) => s.id === scheduleId) || null;
  },

  /**
   * List schedules for a zone.
   */
  async listSchedules(zoneId: string, activeOnly = false): Promise<IrrigationSchedule[]> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    let schedules = [...zone.schedule];
    if (activeOnly) {
      schedules = schedules.filter((s) => s.isActive);
    }
    return schedules.sort((a, b) => a.priority - b.priority);
  },

  /**
   * Update a schedule.
   */
  async updateSchedule(
    zoneId: string,
    scheduleId: string,
    input: Partial<IrrigationScheduleCreateInput>
  ): Promise<IrrigationSchedule> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const schedIndex = zone.schedule.findIndex((s) => s.id === scheduleId);
    if (schedIndex === -1) throw new Error(`Schedule not found: ${scheduleId}`);

    const schedule = zone.schedule[schedIndex];

    if (input.name !== undefined) schedule.name = input.name.trim();
    if (input.description !== undefined) schedule.description = input.description.trim();
    if (input.triggerType !== undefined) schedule.triggerType = input.triggerType;
    if (input.automationRule !== undefined) schedule.automationRule = input.automationRule;
    if (input.startTime !== undefined) schedule.startTime = input.startTime;
    if (input.endTime !== undefined) schedule.endTime = input.endTime;
    if (input.duration !== undefined) schedule.duration = input.duration;
    if (input.durationUnit !== undefined) schedule.durationUnit = input.durationUnit;
    if (input.daysOfWeek !== undefined) schedule.daysOfWeek = input.daysOfWeek;
    if (input.dateRange !== undefined) schedule.dateRange = input.dateRange;
    if (input.waterAmount !== undefined) schedule.waterAmount = input.waterAmount;
    if (input.frequency !== undefined) schedule.frequency = input.frequency;
    if (input.priority !== undefined) schedule.priority = input.priority;
    if (input.conditions !== undefined) schedule.conditions = input.conditions;

    schedule.updatedAt = new Date();
    zone.schedule[schedIndex] = schedule;
    zone.updatedAt = new Date();

    zones.set(zoneId, zone);
    return schedule;
  },

  /**
   * Delete a schedule.
   */
  async deleteSchedule(zoneId: string, scheduleId: string): Promise<boolean> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const schedIndex = zone.schedule.findIndex((s) => s.id === scheduleId);
    if (schedIndex === -1) throw new Error(`Schedule not found: ${scheduleId}`);

    const schedule = zone.schedule[schedIndex];
    if (schedule.status === "running") {
      throw new Error("Cannot delete a running schedule. Stop it first.");
    }

    zone.schedule.splice(schedIndex, 1);
    zone.updatedAt = new Date();
    zones.set(zoneId, zone);
    return true;
  },

  /**
   * Execute a schedule (start irrigation).
   */
  async executeSchedule(zoneId: string, scheduleId: string): Promise<ScheduleExecution> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const schedule = zone.schedule.find((s) => s.id === scheduleId);
    if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);

    if (schedule.status === "running") {
      throw new Error("Schedule is already running");
    }

    const now = new Date();
    const execution: ScheduleExecution = {
      id: randomUUID(),
      scheduleId,
      startedAt: now,
      duration: schedule.duration,
      waterUsed: schedule.waterAmount,
      waterUnit: schedule.waterAmountUnit,
      status: "success",
    };

    // Update schedule
    schedule.status = "running";
    schedule.history.push(execution);

    // Update zone usage
    const usageRecord: WaterUsageRecord = {
      id: randomUUID(),
      zoneId,
      date: now,
      amount: schedule.waterAmount,
      unit: schedule.waterAmountUnit,
      cost: 0,
      costCurrency: "USD",
      source: zone.waterSource,
      scheduleId,
      method: "calculated",
      metadata: {},
    };
    zone.waterUsage.push(usageRecord);
    zone.updatedAt = now;

    zones.set(zoneId, zone);

    // Simulate completion
    setTimeout(() => {
      const z = zones.get(zoneId);
      if (z) {
        const s = z.schedule.find((sc) => sc.id === scheduleId);
        if (s) {
          s.status = "completed";
          const exec = s.history.find((h) => h.id === execution.id);
          if (exec) {
            exec.endedAt = new Date();
            exec.status = "success";
          }
        }
        z.updatedAt = new Date();
        zones.set(zoneId, z);
      }
    }, 1000);

    return execution;
  },

  /**
   * Stop a running schedule.
   */
  async stopSchedule(zoneId: string, scheduleId: string): Promise<IrrigationSchedule> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const schedule = zone.schedule.find((s) => s.id === scheduleId);
    if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);

    if (schedule.status !== "running") {
      throw new Error("Schedule is not running");
    }

    schedule.status = "completed";
    const lastExecution = schedule.history[schedule.history.length - 1];
    if (lastExecution && !lastExecution.endedAt) {
      lastExecution.endedAt = new Date();
      lastExecution.status = "partial";
    }

    schedule.updatedAt = new Date();
    zone.updatedAt = new Date();
    zones.set(zoneId, zone);

    return schedule;
  },

  // ─── Sensor Management ─────────────────────────────────────────────────

  /**
   * Add a sensor to a zone.
   */
  async addSensor(zoneId: string, input: IrrigationSensorCreateInput): Promise<IrrigationSensor> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    if (!input.name?.trim()) throw new Error("Sensor name is required");

    const now = new Date();
    const sensor: IrrigationSensor = {
      id: randomUUID(),
      type: input.type,
      name: input.name.trim(),
      location: input.location,
      unit: input.unit,
      minThreshold: input.minThreshold,
      maxThreshold: input.maxThreshold,
      currentValue: (input.minThreshold + input.maxThreshold) / 2,
      lastReading: now,
      batteryLevel: 100,
      status: "online",
      metadata: {},
    };

    zone.sensors.push(sensor);
    zone.updatedAt = now;
    zones.set(zoneId, zone);

    return sensor;
  },

  /**
   * Update sensor reading.
   */
  async updateSensorReading(
    zoneId: string,
    sensorId: string,
    value: number
  ): Promise<IrrigationSensor> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const sensor = zone.sensors.find((s) => s.id === sensorId);
    if (!sensor) throw new Error(`Sensor not found: ${sensorId}`);

    sensor.currentValue = value;
    sensor.lastReading = new Date();

    if (value < sensor.minThreshold || value > sensor.maxThreshold) {
      // Could trigger alerts here
    }

    zone.updatedAt = new Date();
    zones.set(zoneId, zone);
    return sensor;
  },

  /**
   * Remove a sensor.
   */
  async removeSensor(zoneId: string, sensorId: string): Promise<boolean> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const index = zone.sensors.findIndex((s) => s.id === sensorId);
    if (index === -1) throw new Error(`Sensor not found: ${sensorId}`);

    zone.sensors.splice(index, 1);
    zone.updatedAt = new Date();
    zones.set(zoneId, zone);
    return true;
  },

  // ─── Water Usage Tracking ──────────────────────────────────────────────

  /**
   * Record water usage.
   */
  async recordWaterUsage(input: WaterUsageCreateInput): Promise<WaterUsageRecord> {
    const zone = zones.get(input.zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${input.zoneId}`);

    const now = new Date();
    const record: WaterUsageRecord = {
      id: randomUUID(),
      zoneId: input.zoneId,
      date: input.date || now,
      amount: input.amount,
      unit: input.unit || "liters",
      cost: input.cost || 0,
      costCurrency: input.costCurrency || "USD",
      source: input.source || zone.waterSource,
      scheduleId: input.scheduleId,
      method: input.method || "estimated",
      metadata: input.metadata || {},
    };

    zone.waterUsage.push(record);
    zone.updatedAt = now;
    zones.set(input.zoneId, zone);

    return record;
  },

  /**
   * Get water usage summary for a zone.
   */
  async getWaterUsageSummary(
    zoneId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WaterUsageSummary> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    const records = zone.waterUsage.filter(
      (w) => w.date >= startDate && w.date <= endDate
    );

    const totalWaterUsed = records.reduce((sum, r) => sum + r.amount, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    const daysDiff = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgDailyUsage = totalWaterUsed / daysDiff;

    // Daily usage for peak
    const dailyUsage = new Map<string, number>();
    for (const r of records) {
      const dayKey = r.date.toISOString().split("T")[0];
      dailyUsage.set(dayKey, (dailyUsage.get(dayKey) || 0) + r.amount);
    }
    const peakDailyUsage = Math.max(0, ...Array.from(dailyUsage.values()));

    // By schedule
    const byScheduleMap = new Map<string, { waterUsed: number }>();
    for (const r of records) {
      const key = r.scheduleId || "unscheduled";
      const existing = byScheduleMap.get(key) || { waterUsed: 0 };
      existing.waterUsed += r.amount;
      byScheduleMap.set(key, existing);
    }

    const bySchedule = Array.from(byScheduleMap.entries()).map(([id, data]) => ({
      scheduleId: id,
      scheduleName: id === "unscheduled" ? "Unscheduled" : id,
      waterUsed: data.waterUsed,
      percentage: totalWaterUsed > 0 ? (data.waterUsed / totalWaterUsed) * 100 : 0,
    }));

    // By source
    const bySourceMap = new Map<string, number>();
    for (const r of records) {
      bySourceMap.set(r.source, (bySourceMap.get(r.source) || 0) + r.amount);
    }
    const bySource = Array.from(bySourceMap.entries()).map(([source, amount]) => ({
      source: source as WaterSource,
      amount,
      percentage: totalWaterUsed > 0 ? (amount / totalWaterUsed) * 100 : 0,
    }));

    // Efficiency
    const efficiency = zone.uniformity || 80;
    const areaHa = zone.areaUnit === "hectares" ? zone.area : zone.area * 0.404686;
    const costPerHectare = areaHa > 0 ? totalCost / areaHa : 0;

    // Trend
    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (records.length >= 2) {
      const midPoint = Math.floor(records.length / 2);
      const firstHalf = records.slice(0, midPoint);
      const secondHalf = records.slice(midPoint);
      const firstAvg = firstHalf.reduce((s, r) => s + r.amount, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, r) => s + r.amount, 0) / secondHalf.length;
      const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      if (changePercent > 10) trend = "increasing";
      else if (changePercent < -10) trend = "decreasing";
    }

    return {
      zoneId,
      zoneName: zone.name,
      period: { start: startDate, end: endDate },
      totalWaterUsed: Math.round(totalWaterUsed),
      totalCost: Math.round(totalCost * 100) / 100,
      currency: "USD",
      avgDailyUsage: Math.round(avgDailyUsage),
      peakDailyUsage: Math.round(peakDailyUsage),
      bySchedule,
      bySource,
      efficiency,
      costPerHectare: Math.round(costPerHectare * 100) / 100,
      comparisonToAverage: 0,
      trend,
    };
  },

  // ─── Automation ────────────────────────────────────────────────────────

  /**
   * Configure automation for a zone.
   */
  async configureAutomation(
    zoneId: string,
    config: {
      enabled?: boolean;
      mode?: IrrigationAutomation["mode"];
      weatherIntegration?: boolean;
      soilSensorIntegration?: boolean;
      rules?: AutomationCondition[];
    }
  ): Promise<IrrigationAutomation> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    if (config.enabled !== undefined) zone.automation.enabled = config.enabled;
    if (config.mode !== undefined) zone.automation.mode = config.mode;
    if (config.weatherIntegration !== undefined) zone.automation.weatherIntegration = config.weatherIntegration;
    if (config.soilSensorIntegration !== undefined) zone.automation.soilSensorIntegration = config.soilSensorIntegration;
    if (config.rules !== undefined) zone.automation.rules = config.rules;

    zone.updatedAt = new Date();
    zones.set(zoneId, zone);

    return zone.automation;
  },

  /**
   * Get irrigation recommendation based on conditions.
   */
  async getIrrigationRecommendation(
    zoneId: string,
    weatherData?: WeatherData,
    soilMoisture?: SoilMoistureData[]
  ): Promise<IrrigationRecommendation> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);

    let action: IrrigationRecommendation["recommendedAction"] = "irrigate";
    let amount = zone.waterAmount || 0;
    let duration = zone.schedule[0]?.duration || 30;
    let reason = "Default irrigation schedule";
    let confidence = 0.7;
    const basedOn: string[] = ["zone configuration"];

    // Check soil moisture
    if (soilMoisture && soilMoisture.length > 0) {
      const avgMoisture =
        soilMoisture.reduce((sum, s) => sum + s.value, 0) / soilMoisture.length;
      basedOn.push(`soil moisture: ${avgMoisture.toFixed(1)}%`);

      const moistureSensor = zone.sensors.find((s) => s.type === "soil_moisture");
      if (moistureSensor && avgMoisture < moistureSensor.minThreshold) {
        action = "irrigate";
        amount = (moistureSensor.minThreshold - avgMoisture) * zone.area * 100;
        reason = `Soil moisture (${avgMoisture.toFixed(1)}%) below threshold (${moistureSensor.minThreshold}%)`;
        confidence = 0.9;
      } else if (moistureSensor && avgMoisture > moistureSensor.maxThreshold) {
        action = "skip";
        reason = `Soil moisture (${avgMoisture.toFixed(1)}%) above threshold (${moistureSensor.maxThreshold}%)`;
        confidence = 0.85;
      }
    }

    // Check weather
    if (weatherData) {
      basedOn.push(`temperature: ${weatherData.temperature}°C`);
      basedOn.push(`rainfall: ${weatherData.rainfall}mm`);

      if (weatherData.rainfall > 10) {
        action = "skip";
        reason = `Significant rainfall expected (${weatherData.rainfall}mm)`;
        confidence = 0.95;
      } else if (weatherData.evapotranspiration > 6) {
        action = "increase";
        amount *= 1.3;
        reason = `High evapotranspiration rate (${weatherData.evapotranspiration}mm/day)`;
        confidence = 0.8;
      }
    }

    const areaHa = zone.areaUnit === "hectares" ? zone.area : zone.area * 0.404686;
    const amountPerHectare = areaHa > 0 ? amount / areaHa : 0;

    return {
      zoneId,
      recommendedAction: action,
      amount: Math.round(amountPerHectare),
      amountUnit: "liters/ha",
      duration,
      durationUnit: "minutes",
      reason,
      confidence: Math.round(confidence * 100) / 100,
      basedOn,
      generatedAt: new Date(),
    };
  },

  // ─── Efficiency Analysis ───────────────────────────────────────────────

  /**
   * Analyze irrigation efficiency for a zone.
   */
  async analyzeEfficiency(zoneId: string): Promise<IrrigationEfficiency> {
    const zone = zones.get(zoneId);
    if (!zone) throw new Error(`Irrigation zone not found: ${zoneId}`);
    return calculateEfficiency(zone);
  },

  /**
   * Get farm-wide irrigation summary.
   */
  async getFarmIrrigationSummary(farmId: string): Promise<{
    totalZones: number;
    activeZones: number;
    totalAreaIrrigated: number;
    bySystem: Record<string, number>;
    byStatus: Record<string, number>;
    avgUniformity: number;
    totalWaterUsage: number;
    automationEnabled: number;
    zonesNeedingAttention: string[];
  }> {
    const farmZones = Array.from(zones.values()).filter((z) => z.farmId === farmId);

    const bySystem: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalUniformity = 0;
    let totalWater = 0;
    let automationCount = 0;
    const needingAttention: string[] = [];

    for (const zone of farmZones) {
      bySystem[zone.system] = (bySystem[zone.system] || 0) + 1;
      byStatus[zone.status] = (byStatus[zone.status] || 0) + 1;
      totalUniformity += zone.uniformity;
      totalWater += zone.waterUsage.reduce((sum, w) => sum + w.amount, 0);

      if (zone.automation.enabled) automationCount++;

      // Check for issues
      if (zone.uniformity < 60) {
        needingAttention.push(`${zone.name}: Low uniformity (${zone.uniformity}%)`);
      }
      if (zone.status === "maintenance") {
        needingAttention.push(`${zone.name}: In maintenance`);
      }
      const lowBattery = zone.sensors.filter((s) => s.batteryLevel < 20);
      if (lowBattery.length > 0) {
        needingAttention.push(`${zone.name}: ${lowBattery.length} sensor(s) low battery`);
      }
    }

    const activeCount = farmZones.filter((z) => z.status === "active").length;
    const totalArea = farmZones.reduce(
      (sum, z) => sum + (z.areaUnit === "hectares" ? z.area : z.area * 0.404686),
      0
    );

    return {
      totalZones: farmZones.length,
      activeZones: activeCount,
      totalAreaIrrigated: Math.round(totalArea * 100) / 100,
      bySystem,
      byStatus,
      avgUniformity: farmZones.length > 0 ? Math.round(totalUniformity / farmZones.length) : 0,
      totalWaterUsage: Math.round(totalWater),
      automationEnabled: automationCount,
      zonesNeedingAttention: needingAttention,
    };
  },

  /**
   * Clear all data.
   */
  async clearAll(): Promise<void> {
    zones.clear();
  },

  /**
   * Get zone count.
   */
  async count(): Promise<number> {
    return zones.size;
  },
};
