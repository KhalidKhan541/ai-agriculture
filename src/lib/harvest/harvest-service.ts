import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type HarvestStatus = "planned" | "in_progress" | "completed" | "cancelled" | "partial";
export type QualityGrade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "rejected";
export type HarvestMethod = "manual" | "mechanical" | "mixed";
export type CropCondition = "excellent" | "good" | "fair" | "poor" | "damaged";
export type StorageType = "ambient" | "cold" | "controlled_atmosphere" | "frozen" | "dried";
export type MarketChannel = "wholesale" | "retail" | "direct" | "processing" | "export" | "local_market";
export type YieldUnit = "kg" | "tonnes" | "lbs" | "bushels" | "quintals";
export type HarvestEquipmentType = "combine" | "forage_harvester" | "potato_digger" | "corn_picker" | "manual_tools" | "shaker" | "bulldozer";

export interface HarvestPlan {
  id: string;
  farmId: string;
  fieldId: string;
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  name: string;
  description: string;
  status: HarvestStatus;
  plannedDate: Date;
  estimatedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedYield: number;
  estimatedYieldUnit: YieldUnit;
  method: HarvestMethod;
  equipment: HarvestEquipment[];
  crewSize: number;
  priority: "low" | "medium" | "high" | "urgent";
  weatherDependency: boolean;
  minTemperature: number;
  maxTemperature: number;
  maxWindSpeed: number;
  maxRainfall: number;
  preHarvestChecklist: ChecklistItem[];
  qualityTargets: QualityTarget[];
  logistics: HarvestLogistics;
  records: HarvestRecord[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HarvestPlanCreateInput {
  farmId: string;
  fieldId: string;
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  name: string;
  description?: string;
  plannedDate: Date;
  estimatedEndDate?: Date;
  estimatedYield?: number;
  estimatedYieldUnit?: YieldUnit;
  method?: HarvestMethod;
  equipment?: HarvestEquipment[];
  crewSize?: number;
  priority?: HarvestPlan["priority"];
  weatherDependency?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  maxWindSpeed?: number;
  maxRainfall?: number;
  preHarvestChecklist?: ChecklistItem[];
  qualityTargets?: QualityTarget[];
  logistics?: Partial<HarvestLogistics>;
  metadata?: Record<string, unknown>;
}

export interface HarvestPlanUpdateInput {
  name?: string;
  description?: string;
  status?: HarvestStatus;
  plannedDate?: Date;
  estimatedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedYield?: number;
  method?: HarvestMethod;
  equipment?: HarvestEquipment[];
  crewSize?: number;
  priority?: HarvestPlan["priority"];
  metadata?: Record<string, unknown>;
}

export interface HarvestEquipment {
  id: string;
  type: HarvestEquipmentType;
  name: string;
  model?: string;
  serialNumber?: string;
  capacity: number;
  capacityUnit: string;
  status: "available" | "in_use" | "maintenance" | "unavailable";
  assignedDate?: Date;
  returnDate?: Date;
  operator?: string;
  hourlyRate: number;
}

export interface ChecklistItem {
  id: string;
  task: string;
  category: "safety" | "equipment" | "field" | "quality" | "logistics";
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
}

export interface QualityTarget {
  grade: QualityGrade;
  minPercentage: number;
  maxMoisture: number;
  maxSizeVariation: number;
  colorUniformity: number;
  defectTolerance: number;
}

export interface HarvestLogistics {
  transportVehicles: TransportVehicle[];
  storageArrangement: StorageArrangement;
  laborSchedule: LaborSchedule[];
  receivingPoints: ReceivingPoint[];
  packagingRequirements: PackagingRequirement[];
}

export interface TransportVehicle {
  id: string;
  type: "truck" | "trailer" | "container" | "van";
  capacity: number;
  capacityUnit: string;
  driverName: string;
  driverPhone: string;
  licensePlate: string;
  departureTime?: Date;
  arrivalTime?: Date;
  route?: string;
  status: "scheduled" | "en_route" | "arrived" | "delivered";
}

export interface StorageArrangement {
  facility: string;
  location: string;
  type: StorageType;
  capacity: number;
  capacityUnit: string;
  temperatureRange: { min: number; max: number };
  humidityRange: { min: number; max: number };
  reservedSpace: number;
  availableSpace: number;
}

export interface LaborSchedule {
  id: string;
  role: string;
  workerName: string;
  shiftStart: string;
  shiftEnd: string;
  hourlyRate: number;
  tasks: string[];
  status: "scheduled" | "checked_in" | "working" | "completed" | "absent";
}

export interface ReceivingPoint {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentLoad: number;
  status: "open" | "closed" | "full";
}

export interface PackagingRequirement {
  type: string;
  size: string;
  quantity: number;
  label: string;
  qualityStandard?: string;
}

export interface HarvestRecord {
  id: string;
  planId: string;
  date: Date;
  sessionNumber: number;
  startTime: Date;
  endTime?: Date;
  duration: number;
  yield: HarvestYield;
  quality: QualityAssessment;
  fieldCondition: FieldConditionAtHarvest;
  weatherConditions: WeatherAtHarvest;
  equipmentUsed: string[];
  laborUsed: { workerId: string; name: string; hours: number }[];
  incidents: HarvestIncident[];
  photos: string[];
  notes: string;
  recordedBy: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HarvestRecordCreateInput {
  planId: string;
  date?: Date;
  startTime: Date;
  endTime?: Date;
  yield: HarvestYield;
  quality: QualityAssessment;
  fieldCondition?: FieldConditionAtHarvest;
  weatherConditions?: WeatherAtHarvest;
  equipmentUsed?: string[];
  laborUsed?: { workerId: string; name: string; hours: number }[];
  incidents?: HarvestIncident[];
  photos?: string[];
  notes?: string;
  recordedBy: string;
}

export interface HarvestYield {
  grossYield: number;
  netYield: number;
  unit: YieldUnit;
  areaHarvested: number;
  areaUnit: "hectares" | "acres";
  yieldPerUnit: number;
  waste: number;
  loss: number;
  moistureContent: number;
}

export interface QualityAssessment {
  grade: QualityGrade;
  overallScore: number;
  appearance: number;
  size: number;
  color: number;
  firmness: number;
  taste: number;
  defects: QualityDefect[];
  maturityIndex: number;
  sugarContent?: number;
  acidity?: number;
  dryMatter?: number;
  assessedBy: string;
  assessedAt: Date;
}

export interface QualityDefect {
  type: string;
  severity: "minor" | "moderate" | "severe";
  affectedPercentage: number;
  description: string;
}

export interface FieldConditionAtHarvest {
  soilMoisture: number;
  soilCondition: "dry" | "moist" | "wet" | "waterlogged";
  cropCondition: CropCondition;
  pestPressure: "none" | "low" | "moderate" | "high";
  diseasePressure: "none" | "low" | "moderate" | "high";
  weedPressure: "none" | "low" | "moderate" | "high";
}

export interface WeatherAtHarvest {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  cloudCover: number;
  visibility: number;
}

export interface HarvestIncident {
  type: "equipment_failure" | "injury" | "weather_delay" | "quality_issue" | "other";
  description: string;
  time: Date;
  severity: "low" | "medium" | "high";
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  cost?: number;
}

export interface YieldTracking {
  farmId: string;
  fieldId?: string;
  cropId?: string;
  period: { start: Date; end: Date };
  totalHarvests: number;
  totalYield: number;
  avgYield: number;
  yieldUnit: YieldUnit;
  yieldTrend: "improving" | "declining" | "stable" | "fluctuating";
  byCrop: { cropId: string; cropName: string; totalYield: number; avgYield: number; harvests: number }[];
  byGrade: Record<QualityGrade, number>;
  byMonth: { month: string; yield: number; harvests: number }[];
  bestPerformingField: { fieldId: string; fieldName: string; avgYield: number } | null;
  worstPerformingField: { fieldId: string; fieldName: string; avgYield: number } | null;
}

export interface QualityGradingStatistics {
  totalAssessed: number;
  byGrade: { grade: QualityGrade; count: number; percentage: number }[];
  avgScore: number;
  avgMaturityIndex: number;
  defectRate: number;
  commonDefects: { type: string; count: number; severity: string }[];
  qualityTrend: "improving" | "declining" | "stable";
}

export interface HarvestPlanFilter {
  farmId?: string;
  fieldId?: string;
  cropId?: string;
  status?: HarvestStatus;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
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

// ─── Quality Grade Thresholds ───────────────────────────────────────────────

const GRADE_THRESHOLDS: Record<QualityGrade, { minScore: number }> = {
  "A+": { minScore: 95 },
  "A": { minScore: 85 },
  "B+": { minScore: 75 },
  "B": { minScore: 65 },
  "C+": { minScore: 55 },
  "C": { minScore: 45 },
  "D": { minScore: 30 },
  "rejected": { minScore: 0 },
};

// ─── In-Memory Store ────────────────────────────────────────────────────────

const plans = new Map<string, HarvestPlan>();
const records = new Map<string, HarvestRecord>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function assessQuality(quality: QualityAssessment): QualityGrade {
  const score = quality.overallScore;
  const grades: QualityGrade[] = ["A+", "A", "B+", "B", "C+", "C", "D", "rejected"];

  for (const grade of grades) {
    if (score >= GRADE_THRESHOLDS[grade].minScore) {
      return grade;
    }
  }
  return "rejected";
}

function calculateYieldPerUnit(yield_: HarvestYield): number {
  if (yield_.areaHarvested <= 0) return 0;
  const areaHa = yield_.areaUnit === "hectares" ? yield_.areaHarvested : yield_.areaHarvested * 0.404686;
  return yield_.netYield / areaHa;
}

// ─── Harvest Service ────────────────────────────────────────────────────────

export const HarvestService = {
  // ─── Plan Management ───────────────────────────────────────────────────

  /**
   * Create a harvest plan.
   */
  async createPlan(input: HarvestPlanCreateInput): Promise<HarvestPlan> {
    const errors: string[] = [];
    if (!input.farmId?.trim()) errors.push("Farm ID is required");
    if (!input.fieldId?.trim()) errors.push("Field ID is required");
    if (!input.cropId?.trim()) errors.push("Crop ID is required");
    if (!input.cropName?.trim()) errors.push("Crop name is required");
    if (!input.name?.trim()) errors.push("Plan name is required");
    if (!input.plannedDate) errors.push("Planned date is required");

    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    const now = new Date();
    const estimatedEndDate = input.estimatedEndDate || new Date(input.plannedDate);
    if (!input.estimatedEndDate) {
      estimatedEndDate.setDate(estimatedEndDate.getDate() + 3);
    }

    const defaultChecklist: ChecklistItem[] = [
      { id: randomUUID(), task: "Check weather forecast", category: "safety", completed: false },
      { id: randomUUID(), task: "Inspect equipment", category: "equipment", completed: false },
      { id: randomUUID(), task: "Prepare field access routes", category: "field", completed: false },
      { id: randomUUID(), task: "Set up receiving point", category: "logistics", completed: false },
      { id: randomUUID(), task: "Brief crew on safety protocols", category: "safety", completed: false },
      { id: randomUUID(), task: "Confirm transport arrangements", category: "logistics", completed: false },
    ];

    const defaultQualityTargets: QualityTarget[] = [
      { grade: "A", minPercentage: 60, maxMoisture: 15, maxSizeVariation: 20, colorUniformity: 80, defectTolerance: 5 },
      { grade: "B", minPercentage: 25, maxMoisture: 18, maxSizeVariation: 30, colorUniformity: 70, defectTolerance: 10 },
    ];

    const plan: HarvestPlan = {
      id: randomUUID(),
      farmId: input.farmId.trim(),
      fieldId: input.fieldId.trim(),
      cropId: input.cropId.trim(),
      cropName: input.cropName.trim(),
      varietyId: input.varietyId,
      varietyName: input.varietyName,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      status: "planned",
      plannedDate: input.plannedDate,
      estimatedEndDate,
      estimatedYield: input.estimatedYield || 0,
      estimatedYieldUnit: input.estimatedYieldUnit || "kg",
      method: input.method || "mechanical",
      equipment: input.equipment || [],
      crewSize: input.crewSize || 5,
      priority: input.priority || "medium",
      weatherDependency: input.weatherDependency !== false,
      minTemperature: input.minTemperature ?? 5,
      maxTemperature: input.maxTemperature ?? 38,
      maxWindSpeed: input.maxWindSpeed ?? 40,
      maxRainfall: input.maxRainfall ?? 5,
      preHarvestChecklist: input.preHarvestChecklist || defaultChecklist,
      qualityTargets: input.qualityTargets || defaultQualityTargets,
      logistics: input.logistics as HarvestLogistics || {
        transportVehicles: [],
        storageArrangement: {
          facility: "",
          location: "",
          type: "ambient",
          capacity: 0,
          capacityUnit: "kg",
          temperatureRange: { min: 0, max: 30 },
          humidityRange: { min: 30, max: 70 },
          reservedSpace: 0,
          availableSpace: 0,
        },
        laborSchedule: [],
        receivingPoints: [],
        packagingRequirements: [],
      },
      records: [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    plans.set(plan.id, plan);
    return plan;
  },

  /**
   * Get a plan by ID with records.
   */
  async getPlanById(planId: string): Promise<HarvestPlan | null> {
    return plans.get(planId) || null;
  },

  /**
   * List plans with filtering and pagination.
   */
  async listPlans(
    filter: HarvestPlanFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<HarvestPlan>> {
    let results = Array.from(plans.values());

    if (filter.farmId) results = results.filter((p) => p.farmId === filter.farmId);
    if (filter.fieldId) results = results.filter((p) => p.fieldId === filter.fieldId);
    if (filter.cropId) results = results.filter((p) => p.cropId === filter.cropId);
    if (filter.status) results = results.filter((p) => p.status === filter.status);
    if (filter.priority) results = results.filter((p) => p.priority === filter.priority);
    if (filter.dateFrom) results = results.filter((p) => p.plannedDate >= filter.dateFrom!);
    if (filter.dateTo) results = results.filter((p) => p.plannedDate <= filter.dateTo!);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.cropName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    const sortBy = pagination.sortBy || "plannedDate";
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
   * Update a harvest plan.
   */
  async updatePlan(planId: string, input: HarvestPlanUpdateInput): Promise<HarvestPlan> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Harvest plan not found: ${planId}`);

    if (input.status && plan.status === "completed") {
      throw new Error("Cannot modify a completed plan");
    }

    const updated: HarvestPlan = {
      ...plan,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.plannedDate !== undefined && { plannedDate: input.plannedDate }),
      ...(input.estimatedEndDate !== undefined && { estimatedEndDate: input.estimatedEndDate }),
      ...(input.actualStartDate !== undefined && { actualStartDate: input.actualStartDate }),
      ...(input.actualEndDate !== undefined && { actualEndDate: input.actualEndDate }),
      ...(input.estimatedYield !== undefined && { estimatedYield: input.estimatedYield }),
      ...(input.method !== undefined && { method: input.method }),
      ...(input.equipment !== undefined && { equipment: input.equipment }),
      ...(input.crewSize !== undefined && { crewSize: input.crewSize }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.metadata !== undefined && { metadata: { ...plan.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    if (input.status === "in_progress" && !plan.actualStartDate) {
      updated.actualStartDate = new Date();
    }
    if (input.status === "completed") {
      updated.actualEndDate = new Date();
    }

    plans.set(planId, updated);
    return updated;
  },

  /**
   * Delete a harvest plan.
   */
  async deletePlan(planId: string): Promise<boolean> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Harvest plan not found: ${planId}`);

    if (plan.status === "in_progress") {
      throw new Error("Cannot delete an in-progress harvest plan");
    }

    // Remove associated records
    for (const [recordId, record] of records.entries()) {
      if (record.planId === planId) {
        records.delete(recordId);
      }
    }

    plans.delete(planId);
    return true;
  },

  // ─── Record Management ─────────────────────────────────────────────────

  /**
   * Record a harvest session.
   */
  async createRecord(input: HarvestRecordCreateInput): Promise<HarvestRecord> {
    const plan = plans.get(input.planId);
    if (!plan) throw new Error(`Harvest plan not found: ${input.planId}`);

    if (!input.startTime) throw new Error("Start time is required");

    const yieldPerUnit = calculateYieldPerUnit(input.yield);
    const grade = input.quality.grade || assessQuality(input.quality);

    const now = new Date();
    const record: HarvestRecord = {
      id: randomUUID(),
      planId: input.planId,
      date: input.date || now,
      sessionNumber: plan.records.length + 1,
      startTime: input.startTime,
      endTime: input.endTime,
      duration: input.endTime
        ? Math.round((input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60))
        : 0,
      yield: {
        ...input.yield,
        yieldPerUnit,
      },
      quality: {
        ...input.quality,
        grade,
      },
      fieldCondition: input.fieldCondition || {
        soilMoisture: 30,
        soilCondition: "moist",
        cropCondition: "good",
        pestPressure: "none",
        diseasePressure: "none",
        weedPressure: "none",
      },
      weatherConditions: input.weatherConditions || {
        temperature: 22,
        humidity: 55,
        windSpeed: 10,
        windDirection: "N",
        precipitation: 0,
        cloudCover: 30,
        visibility: 10,
      },
      equipmentUsed: input.equipmentUsed || [],
      laborUsed: input.laborUsed || [],
      incidents: input.incidents || [],
      photos: input.photos || [],
      notes: input.notes?.trim() || "",
      recordedBy: input.recordedBy,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    records.set(record.id, record);

    // Add to plan
    plan.records.push(record);
    plan.updatedAt = now;

    if (plan.status === "planned") {
      plan.status = "in_progress";
      plan.actualStartDate = input.startTime;
    }

    plans.set(input.planId, plan);
    return record;
  },

  /**
   * Get a record by ID.
   */
  async getRecordById(recordId: string): Promise<HarvestRecord | null> {
    return records.get(recordId) || null;
  },

  /**
   * List records for a plan.
   */
  async listRecords(planId: string): Promise<HarvestRecord[]> {
    return Array.from(records.values())
      .filter((r) => r.planId === planId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  /**
   * Update a record.
   */
  async updateRecord(
    recordId: string,
    input: Partial<HarvestRecordCreateInput>
  ): Promise<HarvestRecord> {
    const record = records.get(recordId);
    if (!record) throw new Error(`Harvest record not found: ${recordId}`);

    if (input.endTime && input.startTime) {
      record.duration = Math.round(
        (input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60)
      );
    }

    if (input.yield) {
      record.yield = { ...record.yield, ...input.yield };
      record.yield.yieldPerUnit = calculateYieldPerUnit(record.yield);
    }

    if (input.quality) {
      record.quality = { ...record.quality, ...input.quality };
      record.quality.grade = assessQuality(record.quality);
    }

    if (input.fieldCondition) record.fieldCondition = { ...record.fieldCondition, ...input.fieldCondition };
    if (input.weatherConditions) record.weatherConditions = { ...record.weatherConditions, ...input.weatherConditions };
    if (input.equipmentUsed) record.equipmentUsed = input.equipmentUsed;
    if (input.laborUsed) record.laborUsed = input.laborUsed;
    if (input.incidents) record.incidents = input.incidents;
    if (input.notes !== undefined) record.notes = input.notes.trim();

    record.updatedAt = new Date();
    records.set(recordId, record);

    // Update plan total
    const plan = plans.get(record.planId);
    if (plan) {
      plan.updatedAt = new Date();
      plans.set(plan.id, plan);
    }

    return record;
  },

  /**
   * Delete a record.
   */
  async deleteRecord(recordId: string): Promise<boolean> {
    const record = records.get(recordId);
    if (!record) throw new Error(`Harvest record not found: ${recordId}`);

    const plan = plans.get(record.planId);
    if (plan) {
      plan.records = plan.records.filter((r) => r.id !== recordId);
      plan.updatedAt = new Date();
      plans.set(plan.id, plan);
    }

    records.delete(recordId);
    return true;
  },

  /**
   * Verify a record.
   */
  async verifyRecord(recordId: string, verifiedBy: string): Promise<HarvestRecord> {
    const record = records.get(recordId);
    if (!record) throw new Error(`Harvest record not found: ${recordId}`);

    record.verifiedBy = verifiedBy;
    record.verifiedAt = new Date();
    record.updatedAt = new Date();
    records.set(recordId, record);

    return record;
  },

  // ─── Yield Tracking ────────────────────────────────────────────────────

  /**
   * Get yield tracking data.
   */
  async getYieldTracking(
    farmId: string,
    startDate: Date,
    endDate: Date,
    fieldId?: string,
    cropId?: string
  ): Promise<YieldTracking> {
    let allRecords = Array.from(records.values())
      .filter((r) => {
        const plan = plans.get(r.planId);
        if (!plan || plan.farmId !== farmId) return false;
        if (fieldId && plan.fieldId !== fieldId) return false;
        if (cropId && plan.cropId !== cropId) return false;
        if (r.date < startDate || r.date > endDate) return false;
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const totalHarvests = allRecords.length;
    const totalYield = allRecords.reduce((sum, r) => sum + r.yield.netYield, 0);
    const avgYield = totalHarvests > 0 ? totalYield / totalHarvests : 0;
    const yieldUnit = allRecords[0]?.yield.unit || "kg";

    // By crop
    const cropMap = new Map<string, { cropName: string; totalYield: number; harvests: number }>();
    for (const record of allRecords) {
      const plan = plans.get(record.planId);
      if (!plan) continue;
      const key = plan.cropId;
      const existing = cropMap.get(key) || { cropName: plan.cropName, totalYield: 0, harvests: 0 };
      existing.totalYield += record.yield.netYield;
      existing.harvests += 1;
      cropMap.set(key, existing);
    }
    const byCrop = Array.from(cropMap.entries()).map(([cropId, data]) => ({
      cropId,
      cropName: data.cropName,
      totalYield: Math.round(data.totalYield),
      avgYield: Math.round(data.totalYield / data.harvests),
      harvests: data.harvests,
    }));

    // By grade
    const byGrade: Record<QualityGrade, number> = {
      "A+": 0, A: 0, "B+": 0, B: 0, "C+": 0, C: 0, D: 0, rejected: 0,
    };
    for (const record of allRecords) {
      byGrade[record.quality.grade] = (byGrade[record.quality.grade] || 0) + 1;
    }

    // By month
    const monthMap = new Map<string, { yield: number; harvests: number }>();
    for (const record of allRecords) {
      const monthKey = record.date.toISOString().substring(0, 7);
      const existing = monthMap.get(monthKey) || { yield: 0, harvests: 0 };
      existing.yield += record.yield.netYield;
      existing.harvests += 1;
      monthMap.set(monthKey, existing);
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Best/worst field
    const fieldMap = new Map<string, { fieldName: string; totalYield: number; harvests: number }>();
    for (const record of allRecords) {
      const plan = plans.get(record.planId);
      if (!plan) continue;
      const existing = fieldMap.get(plan.fieldId) || { fieldName: plan.fieldId, totalYield: 0, harvests: 0 };
      existing.totalYield += record.yield.netYield;
      existing.harvests += 1;
      fieldMap.set(plan.fieldId, existing);
    }

    let bestField = null;
    let worstField = null;
    let bestAvg = 0;
    let worstAvg = Infinity;

    for (const [fieldId, data] of fieldMap.entries()) {
      const avg = data.totalYield / data.harvests;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestField = { fieldId, fieldName: data.fieldName, avgYield: Math.round(avg) };
      }
      if (avg < worstAvg) {
        worstAvg = avg;
        worstField = { fieldId, fieldName: data.fieldName, avgYield: Math.round(avg) };
      }
    }

    // Trend
    let yieldTrend: YieldTracking["yieldTrend"] = "stable";
    if (byMonth.length >= 2) {
      const midPoint = Math.floor(byMonth.length / 2);
      const firstHalf = byMonth.slice(0, midPoint);
      const secondHalf = byMonth.slice(midPoint);
      const firstAvg = firstHalf.reduce((s, m) => s + m.yield, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, m) => s + m.yield, 0) / secondHalf.length;
      const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      if (changePercent > 10) yieldTrend = "improving";
      else if (changePercent < -10) yieldTrend = "declining";
      else if (Math.abs(changePercent) > 5) yieldTrend = "fluctuating";
    }

    return {
      farmId,
      period: { start: startDate, end: endDate },
      totalHarvests,
      totalYield: Math.round(totalYield),
      avgYield: Math.round(avgYield),
      yieldUnit,
      yieldTrend,
      byCrop,
      byGrade,
      byMonth,
      bestPerformingField: bestField,
      worstPerformingField: worstField,
    };
  },

  /**
   * Get quality grading statistics.
   */
  async getQualityStatistics(
    farmId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<QualityGradingStatistics> {
    let allRecords = Array.from(records.values()).filter((r) => {
      const plan = plans.get(r.planId);
      if (!plan || plan.farmId !== farmId) return false;
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });

    const totalAssessed = allRecords.length;
    const avgScore = totalAssessed > 0
      ? allRecords.reduce((sum, r) => sum + r.quality.overallScore, 0) / totalAssessed
      : 0;
    const avgMaturityIndex = totalAssessed > 0
      ? allRecords.reduce((sum, r) => sum + r.quality.maturityIndex, 0) / totalAssessed
      : 0;

    // By grade
    const gradeCounts = new Map<QualityGrade, number>();
    for (const record of allRecords) {
      gradeCounts.set(record.quality.grade, (gradeCounts.get(record.quality.grade) || 0) + 1);
    }
    const byGrade: QualityGradingStatistics["byGrade"] = (
      ["A+", "A", "B+", "B", "C+", "C", "D", "rejected"] as QualityGrade[]
    ).map((grade) => ({
      grade,
      count: gradeCounts.get(grade) || 0,
      percentage: totalAssessed > 0 ? ((gradeCounts.get(grade) || 0) / totalAssessed) * 100 : 0,
    }));

    // Defect analysis
    const defectMap = new Map<string, { count: number; severity: string }>();
    let totalDefects = 0;
    for (const record of allRecords) {
      for (const defect of record.quality.defects) {
        totalDefects++;
        const existing = defectMap.get(defect.type) || { count: 0, severity: defect.severity };
        existing.count += 1;
        defectMap.set(defect.type, existing);
      }
    }

    const commonDefects = Array.from(defectMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trend
    let qualityTrend: QualityGradingStatistics["qualityTrend"] = "stable";
    if (allRecords.length >= 4) {
      const sorted = [...allRecords].sort((a, b) => a.date.getTime() - b.date.getTime());
      const midPoint = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, midPoint);
      const secondHalf = sorted.slice(midPoint);
      const firstAvg = firstHalf.reduce((s, r) => s + r.quality.overallScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, r) => s + r.quality.overallScore, 0) / secondHalf.length;

      if (secondAvg - firstAvg > 5) qualityTrend = "improving";
      else if (firstAvg - secondAvg > 5) qualityTrend = "declining";
    }

    return {
      totalAssessed,
      byGrade,
      avgScore: Math.round(avgScore * 10) / 10,
      avgMaturityIndex: Math.round(avgMaturityIndex * 10) / 10,
      defectRate: totalAssessed > 0 ? Math.round((totalDefects / totalAssessed) * 100) : 0,
      commonDefects,
      qualityTrend,
    };
  },

  /**
   * Get upcoming harvests.
   */
  async getUpcomingHarvests(farmId: string, daysAhead = 14): Promise<HarvestPlan[]> {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return Array.from(plans.values())
      .filter(
        (p) =>
          p.farmId === farmId &&
          p.status === "planned" &&
          p.plannedDate >= now &&
          p.plannedDate <= cutoff
      )
      .sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime());
  },

  /**
   * Get harvest statistics.
   */
  async getHarvestStats(farmId?: string): Promise<{
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    totalRecords: number;
    totalYield: number;
    avgYieldPerSession: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
    byPriority: Record<string, number>;
    avgCrewSize: number;
    incidentsCount: number;
  }> {
    let allPlans = Array.from(plans.values());
    if (farmId) allPlans = allPlans.filter((p) => p.farmId === farmId);

    let allRecordsList = Array.from(records.values());
    if (farmId) {
      const planIds = new Set(allPlans.map((p) => p.id));
      allRecordsList = allRecordsList.filter((r) => planIds.has(r.planId));
    }

    const byStatus: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const plan of allPlans) {
      byStatus[plan.status] = (byStatus[plan.status] || 0) + 1;
      byMethod[plan.method] = (byMethod[plan.method] || 0) + 1;
      byPriority[plan.priority] = (byPriority[plan.priority] || 0) + 1;
    }

    const totalYield = allRecordsList.reduce((sum, r) => sum + r.yield.netYield, 0);
    const totalIncidents = allRecordsList.reduce((sum, r) => sum + r.incidents.length, 0);
    const avgCrewSize = allPlans.length > 0
      ? allPlans.reduce((sum, p) => sum + p.crewSize, 0) / allPlans.length
      : 0;

    return {
      totalPlans: allPlans.length,
      activePlans: allPlans.filter((p) => p.status === "in_progress").length,
      completedPlans: allPlans.filter((p) => p.status === "completed").length,
      totalRecords: allRecordsList.length,
      totalYield: Math.round(totalYield),
      avgYieldPerSession: allRecordsList.length > 0
        ? Math.round(totalYield / allRecordsList.length)
        : 0,
      byStatus,
      byMethod,
      byPriority,
      avgCrewSize: Math.round(avgCrewSize * 10) / 10,
      incidentsCount: totalIncidents,
    };
  },

  /**
   * Clear all data.
   */
  async clearAll(): Promise<void> {
    plans.clear();
    records.clear();
  },

  /**
   * Get counts.
   */
  async count(): Promise<{ plans: number; records: number }> {
    return { plans: plans.size, records: records.size };
  },
};
