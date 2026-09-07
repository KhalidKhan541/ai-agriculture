import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlantingPlanStatus = "draft" | "approved" | "in_progress" | "completed" | "cancelled";
export type SeedTreatment = "untreated" | "fungicide" | "insecticide" | "inoculant" | "primed" | "pelleted";
export type RowConfiguration = "straight" | "contour" | "raised_bed" | "drill" | "broadcast" | "transplant_row";
export type PlantingDensity = "sparse" | "normal" | "dense" | "intensive";
export type SeedSource = "saved" | "purchased" | "trial" | "exchange";
export type SeedLotStatus = "active" | "depleted" | "expired" | "quarantine";
export type PlanPriority = "low" | "medium" | "high" | "urgent";

export interface PlantingPlan {
  id: string;
  farmId: string;
  name: string;
  description: string;
  season: string;
  year: number;
  status: PlantingPlanStatus;
  priority: PlanPriority;
  entries: PlantingPlanEntry[];
  totalAreaPlanned: number;
  areaUnit: "hectares" | "acres";
  estimatedCost: number;
  currency: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantingPlanEntry {
  id: string;
  planId: string;
  fieldId: string;
  fieldName: string;
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  area: number;
  areaUnit: "hectares" | "acres";
  rowConfig: RowConfiguration;
  rowSpacingCm: number;
  plantSpacingCm: number;
  plantDensity: PlantingDensity;
  plantsPerRow: number;
  totalPlants: number;
  seedRate: number;
  seedRateUnit: "kg_per_ha" | "seeds_per_m" | "seeds_per_hole";
  seedQuantity: number;
  seedQuantityUnit: "kg" | "g" | "seeds";
  seedTreatment: SeedTreatment;
  seedLotId?: string;
  plantingDate: Date;
  expectedGerminationDate: Date;
  expectedTransplantDate?: Date;
  expectedFirstHarvestDate: Date;
  expectedLastHarvestDate: Date;
  notes: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PlantingPlanCreateInput {
  farmId: string;
  name: string;
  description?: string;
  season: string;
  year: number;
  priority?: PlanPriority;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface PlantingPlanUpdateInput {
  name?: string;
  description?: string;
  season?: string;
  year?: number;
  status?: PlantingPlanStatus;
  priority?: PlanPriority;
  metadata?: Record<string, unknown>;
}

export interface PlantingEntryCreateInput {
  fieldId: string;
  fieldName: string;
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  area: number;
  areaUnit?: "hectares" | "acres";
  rowConfig?: RowConfiguration;
  rowSpacingCm?: number;
  plantSpacingCm?: number;
  plantDensity?: PlantingDensity;
  seedRate?: number;
  seedRateUnit?: PlantingEntryCreateInput["seedRateUnit"];
  seedQuantity?: number;
  seedQuantityUnit?: "kg" | "g" | "seeds";
  seedTreatment?: SeedTreatment;
  seedLotId?: string;
  plantingDate: Date;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PlantingEntryUpdateInput {
  fieldId?: string;
  fieldName?: string;
  cropId?: string;
  cropName?: string;
  varietyId?: string | null;
  varietyName?: string | null;
  area?: number;
  rowConfig?: RowConfiguration;
  rowSpacingCm?: number;
  plantSpacingCm?: number;
  plantDensity?: PlantingDensity;
  seedRate?: number;
  seedRateUnit?: string;
  seedQuantity?: number;
  seedQuantityUnit?: string;
  seedTreatment?: SeedTreatment;
  seedLotId?: string | null;
  plantingDate?: Date;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SeedLot {
  id: string;
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  lotNumber: string;
  supplier: string;
  source: SeedSource;
  quantityOriginal: number;
  quantityRemaining: number;
  quantityUnit: "kg" | "g" | "seeds";
  germinationRate: number;
  purity: number;
  purchaseDate: Date;
  expiryDate: Date;
  costPerUnit: number;
  costCurrency: string;
  treatment: SeedTreatment;
  status: SeedLotStatus;
  storageLocation?: string;
  storageConditions?: string;
  testDate?: Date;
  testResults?: Record<string, number>;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedLotCreateInput {
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  lotNumber: string;
  supplier: string;
  source?: SeedSource;
  quantityOriginal: number;
  quantityUnit?: "kg" | "g" | "seeds";
  germinationRate?: number;
  purity?: number;
  purchaseDate?: Date;
  expiryDate: Date;
  costPerUnit?: number;
  costCurrency?: string;
  treatment?: SeedTreatment;
  storageLocation?: string;
  storageConditions?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface SeedLotUpdateInput {
  supplier?: string;
  source?: SeedSource;
  quantityRemaining?: number;
  germinationRate?: number;
  purity?: number;
  expiryDate?: Date;
  costPerUnit?: number;
  treatment?: SeedTreatment;
  status?: SeedLotStatus;
  storageLocation?: string;
  storageConditions?: string;
  testDate?: Date;
  testResults?: Record<string, number>;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface RowConfigCalculation {
  rowSpacingCm: number;
  plantSpacingCm: number;
  rowConfig: RowConfiguration;
  plantsPerRowMeter: number;
  plantsPerSquareMeter: number;
  plantsPerHectare: number;
  seedRateKgPerHectare: number;
  seedWeightPerMeter: number;
  effectiveWidth: number;
  efficiency: number;
}

export interface PlantingScheduleFilter {
  farmId?: string;
  cropId?: string;
  fieldId?: string;
  status?: PlantingPlanStatus;
  season?: string;
  year?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SeedInventorySummary {
  totalLots: number;
  activeLots: number;
  totalQuantity: number;
  quantityUnit: string;
  totalValue: number;
  currency: string;
  expiringLots: SeedLot[];
  lowGerminationLots: SeedLot[];
  byCrop: { cropId: string; cropName: string; lots: number; totalQuantity: number }[];
}

export interface PlantingEfficiency {
  planId: string;
  totalEntries: number;
  totalAreaPlanned: number;
  totalSeedRequired: number;
  seedUtilizationPercent: number;
  fieldUtilizationPercent: number;
  estimatedCostPerHectare: number;
  overlapRisk: string[];
  suggestions: string[];
}

export interface BulkPlantingEntry {
  fieldId: string;
  fieldName: string;
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  area: number;
  plantingDate: Date;
  seedLotId?: string;
  seedQuantity?: number;
}

// ─── Spacing Presets ────────────────────────────────────────────────────────

const SPACING_PRESETS: Record<
  string,
  { rowCm: number; plantCm: number; density: PlantingDensity }
> = {
  wheat: { rowCm: 18, plantCm: 3, density: "dense" },
  corn: { rowCm: 75, plantCm: 20, density: "normal" },
  soybean: { rowCm: 38, plantCm: 5, density: "dense" },
  tomato: { rowCm: 90, plantCm: 45, density: "normal" },
  potato: { rowCm: 75, plantCm: 25, density: "normal" },
  lettuce: { rowCm: 30, plantCm: 25, density: "normal" },
  carrot: { rowCm: 25, plantCm: 5, density: "dense" },
  onion: { rowCm: 30, plantCm: 10, density: "normal" },
  cotton: { rowCm: 100, plantCm: 30, density: "sparse" },
  rice: { rowCm: 20, plantCm: 15, density: "normal" },
};

// ─── In-Memory Store ────────────────────────────────────────────────────────

const plans = new Map<string, PlantingPlan>();
const seedLots = new Map<string, SeedLot>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function calculatePlantingMetrics(
  area: number,
  areaUnit: string,
  rowSpacingCm: number,
  plantSpacingCm: number,
  rowConfig: RowConfiguration
): RowConfigCalculation {
  const areaSqm =
    areaUnit === "hectares" ? area * 10000 : areaUnit === "acres" ? area * 4046.86 : area;

  const plantsPerRowMeter = 100 / plantSpacingCm;
  const effectiveWidth = rowConfig === "raised_bed" ? rowSpacingCm * 0.85 : rowSpacingCm;
  const plantsPerSquareMeter = (100 / effectiveWidth) * plantsPerRowMeter;
  const plantsPerHectare = plantsPerSquareMeter * 10000;
  const totalPlants = Math.round(plantsPerSquareMeter * areaSqm);

  const seedWeightPerMeter = 0.05; // Default grams, crop-dependent
  const seedRateKgPerHectare = (plantsPerHectare * seedWeightPerMeter) / 1000;

  const efficiency =
    rowConfig === "raised_bed"
      ? 0.92
      : rowConfig === "contour"
      ? 0.85
      : rowConfig === "drill"
      ? 0.95
      : 0.88;

  return {
    rowSpacingCm,
    plantSpacingCm,
    rowConfig,
    plantsPerRowMeter: Math.round(plantsPerRowMeter * 100) / 100,
    plantsPerSquareMeter: Math.round(plantsPerSquareMeter * 100) / 100,
    plantsPerHectare: Math.round(plantsPerHectare),
    seedRateKgPerHectare: Math.round(seedRateKgPerHectare * 100) / 100,
    seedWeightPerMeter,
    effectiveWidth,
    efficiency,
  };
}

function calculateSeedQuantity(
  plantsPerHectare: number,
  area: number,
  areaUnit: string,
  germinationRate: number,
  seedWeightPerSeed: number
): { quantityKg: number; quantitySeeds: number } {
  const areaHa = areaUnit === "hectares" ? area : area * 0.404686;
  const germinationFactor = germinationRate > 0 ? 1 / (germinationRate / 100) : 1.2;
  const totalSeedsNeeded = Math.ceil(plantsPerHectare * areaHa * germinationFactor);
  const quantityKg = (totalSeedsNeeded * seedWeightPerSeed) / 1000;

  return {
    quantityKg: Math.round(quantityKg * 100) / 100,
    quantitySeeds: totalSeedsNeeded,
  };
}

// ─── Planting Service ───────────────────────────────────────────────────────

export const PlantingService = {
  // ─── Planting Plans ────────────────────────────────────────────────────

  /**
   * Create a new planting plan.
   */
  async createPlan(input: PlantingPlanCreateInput): Promise<PlantingPlan> {
    const errors: string[] = [];
    if (!input.farmId?.trim()) errors.push("Farm ID is required");
    if (!input.name?.trim()) errors.push("Plan name is required");
    if (!input.season?.trim()) errors.push("Season is required");
    if (!input.year || input.year < 2000 || input.year > 2100) errors.push("Valid year required (2000-2100)");

    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    const now = new Date();
    const plan: PlantingPlan = {
      id: randomUUID(),
      farmId: input.farmId.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || "",
      season: input.season.trim(),
      year: input.year,
      status: "draft",
      priority: input.priority || "medium",
      entries: [],
      totalAreaPlanned: 0,
      areaUnit: "hectares",
      estimatedCost: 0,
      currency: input.currency || "USD",
      createdBy: "",
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    plans.set(plan.id, plan);
    return plan;
  },

  /**
   * Get a planting plan by ID with all entries.
   */
  async getPlanById(planId: string): Promise<PlantingPlan | null> {
    return plans.get(planId) || null;
  },

  /**
   * List planting plans with filters.
   */
  async listPlans(
    filter: PlantingScheduleFilter = {},
    pagination: { page: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc" } = {
      page: 1,
      limit: 20,
    }
  ): Promise<{ data: PlantingPlan[]; total: number; page: number; limit: number; totalPages: number }> {
    let results = Array.from(plans.values());

    if (filter.farmId) results = results.filter((p) => p.farmId === filter.farmId);
    if (filter.status) results = results.filter((p) => p.status === filter.status);
    if (filter.season) results = results.filter((p) => p.season === filter.season);
    if (filter.year) results = results.filter((p) => p.year === filter.year);

    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";
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
    };
  },

  /**
   * Update a planting plan.
   */
  async updatePlan(planId: string, input: PlantingPlanUpdateInput): Promise<PlantingPlan> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Planting plan not found: ${planId}`);

    if (input.status && plan.status === "completed") {
      throw new Error("Cannot modify a completed plan");
    }
    if (input.status && plan.status === "cancelled") {
      throw new Error("Cannot modify a cancelled plan");
    }

    const updated: PlantingPlan = {
      ...plan,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.season !== undefined && { season: input.season.trim() }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.metadata !== undefined && { metadata: { ...plan.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    if (input.status === "completed") {
      updated.completedAt = new Date();
    }

    plans.set(planId, updated);
    return updated;
  },

  /**
   * Delete a planting plan. Only drafts can be deleted.
   */
  async deletePlan(planId: string): Promise<boolean> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Planting plan not found: ${planId}`);
    if (plan.status !== "draft") {
      throw new Error(`Cannot delete plan with status '${plan.status}'. Only draft plans can be deleted.`);
    }
    plans.delete(planId);
    return true;
  },

  // ─── Planting Entries ──────────────────────────────────────────────────

  /**
   * Add a planting entry to a plan.
   */
  async addEntry(planId: string, input: PlantingEntryCreateInput): Promise<PlantingPlanEntry> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Planting plan not found: ${planId}`);

    if (plan.status === "completed" || plan.status === "cancelled") {
      throw new Error(`Cannot add entries to a ${plan.status} plan`);
    }

    if (!input.fieldId?.trim()) throw new Error("Field ID is required");
    if (!input.cropId?.trim()) throw new Error("Crop ID is required");
    if (!input.cropName?.trim()) throw new Error("Crop name is required");
    if (input.area <= 0) throw new Error("Area must be greater than 0");
    if (!input.plantingDate) throw new Error("Planting date is required");

    const areaUnit = input.areaUnit || plan.areaUnit;
    const rowConfig = input.rowConfig || "straight";
    const rowSpacingCm = input.rowSpacingCm || 30;
    const plantSpacingCm = input.plantSpacingCm || 15;

    // Get spacing preset if available
    const cropLower = input.cropName.toLowerCase();
    const preset = SPACING_PRESETS[cropLower];

    const effectiveRowSpacing = input.rowSpacingCm || preset?.rowCm || rowSpacingCm;
    const effectivePlantSpacing = input.plantSpacingCm || preset?.plantCm || plantSpacingCm;
    const effectiveDensity = input.plantDensity || preset?.density || "normal";

    const metrics = calculatePlantingMetrics(
      input.area,
      areaUnit,
      effectiveRowSpacing,
      effectivePlantSpacing,
      rowConfig
    );

    const germinationRate = 90; // Default, should come from seed lot
    const seedWeightPerSeed = 0.05; // Default grams
    const seedQty = calculateSeedQuantity(
      metrics.plantsPerHectare,
      input.area,
      areaUnit,
      germinationRate,
      seedWeightPerSeed
    );

    const plantingDate = new Date(input.plantingDate);
    const germinationDays = 10; // Default
    const expectedGerminationDate = new Date(plantingDate);
    expectedGerminationDate.setDate(expectedGerminationDate.getDate() + germinationDays);

    const growthCycleDays = 90; // Default
    const expectedFirstHarvest = new Date(plantingDate);
    expectedFirstHarvest.setDate(expectedFirstHarvest.getDate() + Math.round(growthCycleDays * 0.8));
    const expectedLastHarvest = new Date(plantingDate);
    expectedLastHarvest.setDate(expectedLastHarvest.getDate() + growthCycleDays + 14);

    const now = new Date();
    const entry: PlantingPlanEntry = {
      id: randomUUID(),
      planId,
      fieldId: input.fieldId.trim(),
      fieldName: input.fieldName?.trim() || "",
      cropId: input.cropId.trim(),
      cropName: input.cropName.trim(),
      varietyId: input.varietyId,
      varietyName: input.varietyName,
      area: input.area,
      areaUnit,
      rowConfig,
      rowSpacingCm: effectiveRowSpacing,
      plantSpacingCm: effectivePlantSpacing,
      plantDensity: effectiveDensity,
      plantsPerRow: Math.round(100 / effectivePlantSpacing),
      totalPlants: metrics.plantsPerHectare * (areaUnit === "hectares" ? input.area : input.area * 0.404686),
      seedRate: input.seedRate || metrics.seedRateKgPerHectare,
      seedRateUnit: input.seedRateUnit || "kg_per_ha",
      seedQuantity: input.seedQuantity || seedQty.quantityKg,
      seedQuantityUnit: input.seedQuantityUnit || "kg",
      seedTreatment: input.seedTreatment || "untreated",
      seedLotId: input.seedLotId,
      plantingDate,
      expectedGerminationDate,
      expectedTransplantDate: undefined,
      expectedFirstHarvestDate: expectedFirstHarvest,
      expectedLastHarvestDate: expectedLastHarvest,
      notes: input.notes?.trim() || "",
      tags: input.tags || [],
      metadata: input.metadata || {},
    };

    plan.entries.push(entry);
    plan.totalAreaPlanned = plan.entries.reduce((sum, e) => {
      const ha = e.areaUnit === "hectares" ? e.area : e.area * 0.404686;
      return sum + ha;
    }, 0);
    plan.updatedAt = now;

    plans.set(planId, plan);
    return entry;
  },

  /**
   * Update a planting entry.
   */
  async updateEntry(
    planId: string,
    entryId: string,
    input: PlantingEntryUpdateInput
  ): Promise<PlantingPlanEntry> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Planting plan not found: ${planId}`);

    const entryIndex = plan.entries.findIndex((e) => e.id === entryId);
    if (entryIndex === -1) throw new Error(`Entry not found: ${entryId}`);

    if (plan.status === "completed" || plan.status === "cancelled") {
      throw new Error(`Cannot update entries in a ${plan.status} plan`);
    }

    const entry = plan.entries[entryIndex];

    // Recalculate metrics if spacing changed
    if (input.rowSpacingCm || input.plantSpacingCm || input.area || input.rowConfig) {
      const newArea = input.area ?? entry.area;
      const newRowSpacing = input.rowSpacingCm ?? entry.rowSpacingCm;
      const newPlantSpacing = input.plantSpacingCm ?? entry.plantSpacingCm;
      const newConfig = input.rowConfig ?? entry.rowConfig;
      const newAreaUnit = entry.areaUnit;

      const metrics = calculatePlantingMetrics(
        newArea,
        newAreaUnit,
        newRowSpacing,
        newPlantSpacing,
        newConfig
      );

      entry.plantsPerRow = Math.round(metrics.plantsPerRowMeter);
      entry.totalPlants = metrics.plantsPerHectare * (newAreaUnit === "hectares" ? newArea : newArea * 0.404686);
    }

    if (input.fieldId !== undefined) entry.fieldId = input.fieldId.trim();
    if (input.fieldName !== undefined) entry.fieldName = input.fieldName.trim();
    if (input.cropId !== undefined) entry.cropId = input.cropId.trim();
    if (input.cropName !== undefined) entry.cropName = input.cropName.trim();
    if (input.varietyId !== undefined) entry.varietyId = input.varietyId || undefined;
    if (input.varietyName !== undefined) entry.varietyName = input.varietyName || undefined;
    if (input.area !== undefined) entry.area = input.area;
    if (input.rowConfig !== undefined) entry.rowConfig = input.rowConfig;
    if (input.rowSpacingCm !== undefined) entry.rowSpacingCm = input.rowSpacingCm;
    if (input.plantSpacingCm !== undefined) entry.plantSpacingCm = input.plantSpacingCm;
    if (input.plantDensity !== undefined) entry.plantDensity = input.plantDensity;
    if (input.seedRate !== undefined) entry.seedRate = input.seedRate;
    if (input.seedRateUnit !== undefined) entry.seedRateUnit = input.seedRateUnit as any;
    if (input.seedQuantity !== undefined) entry.seedQuantity = input.seedQuantity;
    if (input.seedQuantityUnit !== undefined) entry.seedQuantityUnit = input.seedQuantityUnit as any;
    if (input.seedTreatment !== undefined) entry.seedTreatment = input.seedTreatment;
    if (input.seedLotId !== undefined) entry.seedLotId = input.seedLotId || undefined;
    if (input.plantingDate !== undefined) {
      entry.plantingDate = new Date(input.plantingDate);
      entry.expectedGerminationDate = new Date(input.plantingDate);
      entry.expectedGerminationDate.setDate(entry.expectedGerminationDate.getDate() + 10);
      entry.expectedFirstHarvestDate = new Date(input.plantingDate);
      entry.expectedFirstHarvestDate.setDate(entry.expectedFirstHarvestDate.getDate() + 72);
      entry.expectedLastHarvestDate = new Date(input.plantingDate);
      entry.expectedLastHarvestDate.setDate(entry.expectedLastHarvestDate.getDate() + 104);
    }
    if (input.notes !== undefined) entry.notes = input.notes.trim();
    if (input.tags !== undefined) entry.tags = input.tags;

    plan.entries[entryIndex] = entry;
    plan.totalAreaPlanned = plan.entries.reduce((sum, e) => {
      const ha = e.areaUnit === "hectares" ? e.area : e.area * 0.404686;
      return sum + ha;
    }, 0);
    plan.updatedAt = new Date();

    plans.set(planId, plan);
    return entry;
  },

  /**
   * Remove a planting entry from a plan.
   */
  async removeEntry(planId: string, entryId: string): Promise<boolean> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Planting plan not found: ${planId}`);

    if (plan.status === "completed" || plan.status === "cancelled") {
      throw new Error(`Cannot remove entries from a ${plan.status} plan`);
    }

    const index = plan.entries.findIndex((e) => e.id === entryId);
    if (index === -1) throw new Error(`Entry not found: ${entryId}`);

    plan.entries.splice(index, 1);
    plan.totalAreaPlanned = plan.entries.reduce((sum, e) => {
      const ha = e.areaUnit === "hectares" ? e.area : e.area * 0.404686;
      return sum + ha;
    }, 0);
    plan.updatedAt = new Date();

    plans.set(planId, plan);
    return true;
  },

  /**
   * Bulk add planting entries to a plan.
   */
  async bulkAddEntries(
    planId: string,
    entries: BulkPlantingEntry[]
  ): Promise<{ added: number; errors: { index: number; error: string }[] }> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Planting plan not found: ${planId}`);

    const added = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < entries.length; i++) {
      try {
        const entry = entries[i];
        const created = await this.addEntry(planId, {
          fieldId: entry.fieldId,
          fieldName: entry.fieldName,
          cropId: entry.cropId,
          cropName: entry.cropName,
          varietyId: entry.varietyId,
          varietyName: entry.varietyName,
          area: entry.area,
          plantingDate: entry.plantingDate,
          seedLotId: entry.seedLotId,
          seedQuantity: entry.seedQuantity,
        });
        added.push(created);
      } catch (err) {
        errors.push({
          index: i,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { added: added.length, errors };
  },

  // ─── Row Configuration ─────────────────────────────────────────────────

  /**
   * Calculate optimal row configuration for a crop and field.
   */
  async calculateRowConfiguration(params: {
    cropName: string;
    fieldWidth: number;
    fieldLength: number;
    fieldUnit: "meters" | "feet";
    rowConfig?: RowConfiguration;
  }): Promise<RowConfigCalculation> {
    const cropLower = params.cropName.toLowerCase();
    const preset = SPACING_PRESETS[cropLower] || { rowCm: 30, plantCm: 15, density: "normal" as PlantingDensity };

    const config = params.rowConfig || "straight";
    return calculatePlantingMetrics(
      1, // 1 hectare for rate calculations
      "hectares",
      preset.rowCm,
      preset.plantCm,
      config
    );
  },

  /**
   * Get spacing presets for common crops.
   */
  async getSpacingPresets(): Promise<Record<string, { rowCm: number; plantCm: number; density: PlantingDensity }>> {
    return { ...SPACING_PRESETS };
  },

  /**
   * Get a custom spacing recommendation based on conditions.
   */
  async getSpacingRecommendation(params: {
    cropName: string;
    soilType: string;
    irrigationType: string;
    targetDensity: PlantingDensity;
  }): Promise<{
    rowSpacingCm: number;
    plantSpacingCm: number;
    plantsPerHectare: number;
    adjustments: string[];
  }> {
    const cropLower = params.cropName.toLowerCase();
    const preset = SPACING_PRESETS[cropLower] || { rowCm: 30, plantCm: 15, density: "normal" as PlantingDensity };

    let rowAdj = 1;
    let plantAdj = 1;
    const adjustments: string[] = [];

    // Adjust for density
    switch (params.targetDensity) {
      case "sparse":
        rowAdj *= 1.3;
        plantAdj *= 1.3;
        adjustments.push("Wide spacing for sparse planting");
        break;
      case "dense":
        rowAdj *= 0.8;
        plantAdj *= 0.8;
        adjustments.push("Tight spacing for dense planting");
        break;
      case "intensive":
        rowAdj *= 0.65;
        plantAdj *= 0.65;
        adjustments.push("Very tight spacing for intensive planting");
        break;
    }

    // Adjust for soil type
    if (params.soilType === "clay") {
      rowAdj *= 1.1;
      adjustments.push("Slightly wider rows for clay soil drainage");
    } else if (params.soilType === "sandy") {
      plantAdj *= 0.9;
      adjustments.push("Closer plants to maximize water use in sandy soil");
    }

    // Adjust for irrigation
    if (params.irrigationType === "drip") {
      rowAdj *= 0.95;
      adjustments.push("Drip irrigation allows tighter row spacing");
    } else if (params.irrigationType === "sprinkler") {
      rowAdj *= 1.05;
      adjustments.push("Sprinkler irrigation needs slightly wider rows");
    }

    const rowSpacing = Math.round(preset.rowCm * rowAdj);
    const plantSpacing = Math.round(preset.plantCm * plantAdj);
    const plantsPerHectare = Math.round((10000 / (rowSpacing * plantSpacing)) * 100);

    return {
      rowSpacingCm: rowSpacing,
      plantSpacingCm: plantSpacing,
      plantsPerHectare,
      adjustments,
    };
  },

  // ─── Seed Lot Management ───────────────────────────────────────────────

  /**
   * Register a new seed lot.
   */
  async createSeedLot(input: SeedLotCreateInput): Promise<SeedLot> {
    const errors: string[] = [];
    if (!input.cropId?.trim()) errors.push("Crop ID is required");
    if (!input.cropName?.trim()) errors.push("Crop name is required");
    if (!input.lotNumber?.trim()) errors.push("Lot number is required");
    if (!input.supplier?.trim()) errors.push("Supplier is required");
    if (input.quantityOriginal <= 0) errors.push("Original quantity must be positive");
    if (input.germinationRate !== undefined && (input.germinationRate < 0 || input.germinationRate > 100)) {
      errors.push("Germination rate must be 0-100");
    }
    if (input.purity !== undefined && (input.purity < 0 || input.purity > 100)) {
      errors.push("Purity must be 0-100");
    }
    if (input.expiryDate && new Date(input.expiryDate) < new Date()) {
      errors.push("Expiry date is in the past");
    }

    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    // Check for duplicate lot number
    const existing = Array.from(seedLots.values()).find(
      (s) => s.lotNumber.toLowerCase() === input.lotNumber!.trim().toLowerCase()
    );
    if (existing) throw new Error(`Seed lot '${input.lotNumber}' already exists`);

    const now = new Date();
    const lot: SeedLot = {
      id: randomUUID(),
      cropId: input.cropId.trim(),
      cropName: input.cropName.trim(),
      varietyId: input.varietyId,
      varietyName: input.varietyName,
      lotNumber: input.lotNumber.trim(),
      supplier: input.supplier.trim(),
      source: input.source || "purchased",
      quantityOriginal: input.quantityOriginal,
      quantityRemaining: input.quantityOriginal,
      quantityUnit: input.quantityUnit || "kg",
      germinationRate: input.germinationRate || 90,
      purity: input.purity || 98,
      purchaseDate: input.purchaseDate || new Date(),
      expiryDate: new Date(input.expiryDate),
      costPerUnit: input.costPerUnit || 0,
      costCurrency: input.costCurrency || "USD",
      treatment: input.treatment || "untreated",
      status: "active",
      storageLocation: input.storageLocation,
      storageConditions: input.storageConditions,
      notes: input.notes?.trim() || "",
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    seedLots.set(lot.id, lot);
    return lot;
  },

  /**
   * Get a seed lot by ID.
   */
  async getSeedLotById(lotId: string): Promise<SeedLot | null> {
    return seedLots.get(lotId) || null;
  },

  /**
   * List seed lots with filters.
   */
  async listSeedLots(filters?: {
    cropId?: string;
    varietyId?: string;
    status?: SeedLotStatus;
    supplier?: string;
    expiringWithinDays?: number;
  }): Promise<SeedLot[]> {
    let results = Array.from(seedLots.values());

    if (filters?.cropId) results = results.filter((l) => l.cropId === filters.cropId);
    if (filters?.varietyId) results = results.filter((l) => l.varietyId === filters.varietyId);
    if (filters?.status) results = results.filter((l) => l.status === filters.status);
    if (filters?.supplier) {
      const q = filters.supplier.toLowerCase();
      results = results.filter((l) => l.supplier.toLowerCase().includes(q));
    }
    if (filters?.expiringWithinDays !== undefined) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + filters.expiringWithinDays);
      results = results.filter((l) => l.expiryDate <= cutoff && l.status === "active");
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Update a seed lot.
   */
  async updateSeedLot(lotId: string, input: SeedLotUpdateInput): Promise<SeedLot> {
    const lot = seedLots.get(lotId);
    if (!lot) throw new Error(`Seed lot not found: ${lotId}`);

    if (input.quantityRemaining !== undefined && input.quantityRemaining < 0) {
      throw new Error("Remaining quantity cannot be negative");
    }

    const updated: SeedLot = {
      ...lot,
      ...(input.supplier !== undefined && { supplier: input.supplier.trim() }),
      ...(input.source !== undefined && { source: input.source }),
      ...(input.quantityRemaining !== undefined && { quantityRemaining: input.quantityRemaining }),
      ...(input.germinationRate !== undefined && { germinationRate: input.germinationRate }),
      ...(input.purity !== undefined && { purity: input.purity }),
      ...(input.expiryDate !== undefined && { expiryDate: new Date(input.expiryDate) }),
      ...(input.costPerUnit !== undefined && { costPerUnit: input.costPerUnit }),
      ...(input.treatment !== undefined && { treatment: input.treatment }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.storageLocation !== undefined && { storageLocation: input.storageLocation }),
      ...(input.storageConditions !== undefined && { storageConditions: input.storageConditions }),
      ...(input.testDate !== undefined && { testDate: new Date(input.testDate) }),
      ...(input.testResults !== undefined && { testResults: input.testResults }),
      ...(input.notes !== undefined && { notes: input.notes.trim() }),
      ...(input.metadata !== undefined && { metadata: { ...lot.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    seedLots.set(lotId, updated);
    return updated;
  },

  /**
   * Deplete seed from a lot.
   */
  async depleteSeed(lotId: string, amount: number, unit: string): Promise<SeedLot> {
    const lot = seedLots.get(lotId);
    if (!lot) throw new Error(`Seed lot not found: ${lotId}`);

    if (amount <= 0) throw new Error("Depletion amount must be positive");
    if (lot.quantityRemaining < amount) {
      throw new Error(
        `Insufficient seed. Available: ${lot.quantityRemaining} ${lot.quantityUnit}, Requested: ${amount} ${unit}`
      );
    }

    lot.quantityRemaining -= amount;
    lot.updatedAt = new Date();

    if (lot.quantityRemaining <= 0) {
      lot.status = "depleted";
    }

    seedLots.set(lotId, lot);
    return lot;
  },

  /**
   * Get seed inventory summary.
   */
  async getSeedInventorySummary(): Promise<SeedInventorySummary> {
    const allLots = Array.from(seedLots.values());
    const activeLots = allLots.filter((l) => l.status === "active");
    const now = new Date();
    const thirtyDays = new Date(now);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const expiringLots = activeLots.filter((l) => l.expiryDate <= thirtyDays);
    const lowGerminationLots = activeLots.filter((l) => l.germinationRate < 75);

    const totalQuantity = activeLots.reduce((sum, l) => {
      if (l.quantityUnit === "kg") return sum + l.quantityRemaining;
      if (l.quantityUnit === "g") return sum + l.quantityRemaining / 1000;
      return sum + l.quantityRemaining;
    }, 0);

    const totalValue = activeLots.reduce(
      (sum, l) => sum + l.quantityRemaining * l.costPerUnit,
      0
    );

    const byCropMap = new Map<string, { cropName: string; lots: number; totalQuantity: number }>();
    for (const lot of activeLots) {
      const existing = byCropMap.get(lot.cropId) || {
        cropName: lot.cropName,
        lots: 0,
        totalQuantity: 0,
      };
      existing.lots += 1;
      existing.totalQuantity += lot.quantityRemaining;
      byCropMap.set(lot.cropId, existing);
    }

    return {
      totalLots: allLots.length,
      activeLots: activeLots.length,
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      quantityUnit: "kg",
      totalValue: Math.round(totalValue * 100) / 100,
      currency: "USD",
      expiringLots,
      lowGerminationLots,
      byCrop: Array.from(byCropMap.entries()).map(([cropId, data]) => ({
        cropId,
        ...data,
      })),
    };
  },

  // ─── Efficiency Analysis ───────────────────────────────────────────────

  /**
   * Analyze planting plan efficiency.
   */
  async analyzePlanEfficiency(planId: string): Promise<PlantingEfficiency> {
    const plan = plans.get(planId);
    if (!plan) throw new Error(`Planting plan not found: ${planId}`);

    const totalEntries = plan.entries.length;
    const totalAreaPlanned = plan.totalAreaPlanned;
    const totalSeedRequired = plan.entries.reduce((sum, e) => sum + e.seedQuantity, 0);

    // Check for overlapping fields
    const fieldUsage = new Map<string, { areas: number[]; entries: string[] }>();
    for (const entry of plan.entries) {
      const existing = fieldUsage.get(entry.fieldId) || { areas: [], entries: [] };
      existing.areas.push(entry.area);
      existing.entries.push(entry.id);
      fieldUsage.set(entry.fieldId, existing);
    }

    const overlapRisk: string[] = [];
    for (const [fieldId, usage] of fieldUsage.entries()) {
      if (usage.entries.length > 1) {
        const totalArea = usage.areas.reduce((a, b) => a + b, 0);
        overlapRisk.push(
          `Field ${fieldId} has ${usage.entries.length} entries totaling ${totalArea.toFixed(2)} ha - possible overlap`
        );
      }
    }

    const suggestions: string[] = [];
    if (totalEntries === 0) {
      suggestions.push("Plan has no entries yet");
    }
    if (totalAreaPlanned < 1) {
      suggestions.push("Total planned area is small - consider consolidation");
    }
    if (overlapRisk.length > 0) {
      suggestions.push("Review overlapping field assignments");
    }

    const estimatedCostPerHectare =
      totalAreaPlanned > 0 ? plan.estimatedCost / totalAreaPlanned : 0;

    return {
      planId,
      totalEntries,
      totalAreaPlanned,
      totalSeedRequired: Math.round(totalSeedRequired * 100) / 100,
      seedUtilizationPercent: 0,
      fieldUtilizationPercent: 0,
      estimatedCostPerHectare: Math.round(estimatedCostPerHectare * 100) / 100,
      overlapRisk,
      suggestions,
    };
  },

  /**
   * Get planting statistics.
   */
  async getPlantingStats(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalEntries: number;
    totalAreaPlanned: number;
    byStatus: Record<string, number>;
    bySeason: Record<string, number>;
    avgEntriesPerPlan: number;
    totalSeedLots: number;
    activeSeedLots: number;
  }> {
    const allPlans = Array.from(plans.values());
    const allSeedLotsList = Array.from(seedLots.values());

    const byStatus: Record<string, number> = {};
    const bySeason: Record<string, number> = {};
    let totalEntries = 0;
    let totalArea = 0;

    for (const plan of allPlans) {
      byStatus[plan.status] = (byStatus[plan.status] || 0) + 1;
      bySeason[plan.season] = (bySeason[plan.season] || 0) + 1;
      totalEntries += plan.entries.length;
      totalArea += plan.totalAreaPlanned;
    }

    return {
      totalPlans: allPlans.length,
      activePlans: allPlans.filter((p) => p.status === "in_progress").length,
      totalEntries,
      totalAreaPlanned: Math.round(totalArea * 100) / 100,
      byStatus,
      bySeason,
      avgEntriesPerPlan: allPlans.length > 0 ? Math.round(totalEntries / allPlans.length) : 0,
      totalSeedLots: allSeedLotsList.length,
      activeSeedLots: allSeedLotsList.filter((l) => l.status === "active").length,
    };
  },

  /**
   * Clear all data.
   */
  async clearAll(): Promise<void> {
    plans.clear();
    seedLots.clear();
  },

  /**
   * Get counts.
   */
  async count(): Promise<{ plans: number; seedLots: number }> {
    return { plans: plans.size, seedLots: seedLots.size };
  },
};
