import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CropCategory =
  | "cereal"
  | "legume"
  | "vegetable"
  | "fruit"
  | "root"
  | "oilseed"
  | "fiber"
  | "forage"
  | "herb"
  | "spice"
  | "nut"
  | "other";

export type GrowthStage =
  | "seed"
  | "germination"
  | "seedling"
  | "vegetative"
  | "budding"
  | "flowering"
  | "fruiting"
  | "ripening"
  | "mature"
  | "harvestable"
  | "senescence";

export type WaterRequirement = "very_low" | "low" | "moderate" | "high" | "very_high";
export type SunExposure = "full_sun" | "partial_sun" | "partial_shade" | "full_shade";
export type SoilPreference = "any" | "well_drained" | "moist" | "dry" | "sandy" | "clay" | "loamy";
export type PlantingMethod = "seed" | "transplant" | "cutting" | "grafting" | "tuber" | "bulb";
export type HarvestMethod = "manual" | "mechanical" | "both";
export type CropStatus = "active" | "inactive" | "deprecated";
export type VarietyStatus = "active" | "trial" | "discontinued";

export interface CropNutrientProfile {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;
  iron: number;
  zinc: number;
  unit: "mg_per_kg" | "percent";
}

export interface CropClimateRequirements {
  minTemp: number;
  maxTemp: number;
  optimalTempMin: number;
  optimalTempMax: number;
  minRainfall: number;
  maxRainfall: number;
  humidity: { min: number; max: number };
  frostTolerance: "none" | "light" | "moderate" | "heavy";
  droughtTolerance: "none" | "light" | "moderate" | "heavy";
  heatTolerance: "none" | "light" | "moderate" | "heavy";
}

export interface CropSoilRequirements {
  phRange: { min: number; max: number };
  preferredSoilTypes: SoilPreference[];
  depthRequirement: "shallow" | "moderate" | "deep";
  drainageRequirement: "poor" | "moderate" | "good" | "excellent";
  organicMatterMin: number;
  salinityTolerance: number;
}

export interface CropCreateInput {
  name: string;
  scientificName?: string;
  category: CropCategory;
  description?: string;
  family?: string;
  origin?: string;
  waterRequirement: WaterRequirement;
  sunExposure: SunExposure;
  soilRequirements: CropSoilRequirements;
  climateRequirements: CropClimateRequirements;
  nutrientRequirements?: Partial<CropNutrientProfile>;
  growthCycleDays: number;
  plantingMethods: PlantingMethod[];
  harvestMethod: HarvestMethod;
  avgYieldPerHectare?: number;
  yieldUnit?: string;
  spacing?: { rowCm: number; plantCm: number };
  plantingDepthCm?: number;
  germinationDays?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CropUpdateInput {
  name?: string;
  scientificName?: string;
  description?: string;
  waterRequirement?: WaterRequirement;
  sunExposure?: SunExposure;
  soilRequirements?: CropSoilRequirements;
  climateRequirements?: CropClimateRequirements;
  nutrientRequirements?: Partial<CropNutrientProfile>;
  growthCycleDays?: number;
  plantingMethods?: PlantingMethod[];
  harvestMethod?: HarvestMethod;
  avgYieldPerHectare?: number;
  yieldUnit?: string;
  spacing?: { rowCm: number; plantCm: number };
  plantingDepthCm?: number;
  germinationDays?: number;
  status?: CropStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface Crop {
  id: string;
  name: string;
  scientificName: string;
  category: CropCategory;
  description: string;
  family: string;
  origin: string;
  waterRequirement: WaterRequirement;
  sunExposure: SunExposure;
  soilRequirements: CropSoilRequirements;
  climateRequirements: CropClimateRequirements;
  nutrientRequirements: CropNutrientProfile;
  growthCycleDays: number;
  plantingMethods: PlantingMethod[];
  harvestMethod: HarvestMethod;
  avgYieldPerHectare: number;
  yieldUnit: string;
  spacing: { rowCm: number; plantCm: number };
  plantingDepthCm: number;
  germinationDays: number;
  varieties: CropVariety[];
  status: CropStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CropVariety {
  id: string;
  cropId: string;
  name: string;
  description: string;
  origin: string;
  maturityDays: number;
  yieldPotential: "low" | "medium" | "high" | "very_high";
  diseaseResistance: string[];
  pestResistance: string[];
  climateAdaptation: string[];
  seedWeight: number;
  seedWeightUnit: "g" | "mg";
  color: string;
  size: "small" | "medium" | "large";
  taste: string;
  shelfLife: number;
  shelfLifeUnit: "days" | "weeks" | "months";
  status: VarietyStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VarietyCreateInput {
  name: string;
  description?: string;
  origin?: string;
  maturityDays: number;
  yieldPotential?: CropVariety["yieldPotential"];
  diseaseResistance?: string[];
  pestResistance?: string[];
  climateAdaptation?: string[];
  seedWeight?: number;
  seedWeightUnit?: "g" | "mg";
  color?: string;
  size?: CropVariety["size"];
  taste?: string;
  shelfLife?: number;
  shelfLifeUnit?: CropVariety["shelfLifeUnit"];
  metadata?: Record<string, unknown>;
}

export interface VarietyUpdateInput {
  name?: string;
  description?: string;
  origin?: string;
  maturityDays?: number;
  yieldPotential?: CropVariety["yieldPotential"];
  diseaseResistance?: string[];
  pestResistance?: string[];
  climateAdaptation?: string[];
  seedWeight?: number;
  seedWeightUnit?: "g" | "mg";
  color?: string;
  size?: CropVariety["size"];
  taste?: string;
  shelfLife?: number;
  shelfLifeUnit?: CropVariety["shelfLifeUnit"];
  status?: VarietyStatus;
  metadata?: Record<string, unknown>;
}

export interface CropLifecycleStage {
  stage: GrowthStage;
  name: string;
  description: string;
  durationDays: number;
  startDay: number;
  endDay: number;
  temperatureRange: { min: number; max: number };
  waterNeed: WaterRequirement;
  tasks: string[];
  alerts: string[];
}

export interface CropLifecycle {
  cropId: string;
  cropName: string;
  totalDays: number;
  stages: CropLifecycleStage[];
  currentStage?: GrowthStage;
  plantedDate?: Date;
  expectedHarvestDate?: Date;
  actualHarvestDate?: Date;
}

export interface PlantingScheduleEntry {
  id: string;
  cropId: string;
  cropName: string;
  varietyId?: string;
  varietyName?: string;
  region: string;
  plantingWindowStart: Date;
  plantingWindowEnd: Date;
  harvestWindowStart: Date;
  harvestWindowEnd: Date;
  season: "spring" | "summer" | "fall" | "winter" | "year_round";
  climate: string;
  notes: string;
  suitableFor: string[];
  createdAt: Date;
}

export interface PlantingScheduleCreateInput {
  cropId: string;
  varietyId?: string;
  region: string;
  plantingWindowStart: Date;
  plantingWindowEnd: Date;
  harvestWindowStart: Date;
  harvestWindowEnd: Date;
  season: PlantingScheduleEntry["season"];
  climate: string;
  notes?: string;
  suitableFor?: string[];
}

export interface CropFilter {
  category?: CropCategory | CropCategory[];
  status?: CropStatus;
  waterRequirement?: WaterRequirement;
  sunExposure?: SunExposure;
  minGrowthCycle?: number;
  maxGrowthCycle?: number;
  tags?: string[];
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

export interface CropSummary {
  id: string;
  name: string;
  scientificName: string;
  category: CropCategory;
  growthCycleDays: number;
  waterRequirement: WaterRequirement;
  varietyCount: number;
  status: CropStatus;
}

export interface CropCompatibility {
  cropAId: string;
  cropBId: string;
  compatible: boolean;
  relationship: "companion" | "neutral" | "antagonist";
  reason: string;
}

export interface CropSeasonRecommendation {
  season: "spring" | "summer" | "fall" | "winter";
  recommendedCrops: {
    cropId: string;
    cropName: string;
    category: CropCategory;
    plantingWindow: { start: Date; end: Date };
    expectedYield: number;
    waterNeed: WaterRequirement;
    confidence: number;
  }[];
  region: string;
  climate: string;
  generatedAt: Date;
}

// ─── Companion Planting Data ────────────────────────────────────────────────

const COMPANION_DATABASE: Record<string, Record<string, CropCompatibility>> = {
  tomato: {
    basil: { cropAId: "tomato", cropBId: "basil", compatible: true, relationship: "companion", reason: "Basil repels tomato hornworm and improves flavor" },
    carrot: { cropAId: "tomato", cropBId: "carrot", compatible: true, relationship: "companion", reason: "Carrots loosen soil benefiting tomato roots" },
    cabbage: { cropAId: "tomato", cropBId: "cabbage", compatible: false, relationship: "antagonist", reason: "Both heavy feeders competing for nutrients" },
    fennel: { cropAId: "tomato", cropBId: "fennel", compatible: false, relationship: "antagonist", reason: "Fennel inhibits tomato growth" },
    beans: { cropAId: "tomato", cropBId: "beans", compatible: true, relationship: "companion", reason: "Beans fix nitrogen that tomatoes need" },
  },
  corn: {
    beans: { cropAId: "corn", cropBId: "beans", compatible: true, relationship: "companion", reason: "Classic Three Sisters: beans fix nitrogen, corn provides support" },
    squash: { cropAId: "corn", cropBId: "squash", compatible: true, relationship: "companion", reason: "Squash shades soil, retains moisture" },
    sunflower: { cropAId: "corn", cropBId: "sunflower", compatible: false, relationship: "antagonist", reason: "Sunflowers attract pests that affect corn" },
  },
  carrot: {
    onion: { cropAId: "carrot", cropBId: "onion", compatible: true, relationship: "companion", reason: "Onion repels carrot fly" },
    tomato: { cropAId: "carrot", cropBId: "tomato", compatible: true, relationship: "companion", reason: "Tomato repels carrot fly" },
    dill: { cropAId: "carrot", cropBId: "dill", compatible: false, relationship: "antagonist", reason: "Mature dill stunts carrot growth" },
  },
  lettuce: {
    strawberry: { cropAId: "lettuce", cropBId: "strawberry", compatible: true, relationship: "companion", reason: "Lettuce provides ground cover for strawberries" },
    carrot: { cropAId: "lettuce", cropBId: "carrot", compatible: true, relationship: "companion", reason: "Complementary root depths" },
  },
};

// ─── In-Memory Store ────────────────────────────────────────────────────────

const crops = new Map<string, Crop>();
const varieties = new Map<string, CropVariety>();
const plantingSchedules = new Map<string, PlantingScheduleEntry>();

// ─── Default Nutrient Profile ───────────────────────────────────────────────

function defaultNutrientProfile(): CropNutrientProfile {
  return {
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    calcium: 0,
    magnesium: 0,
    sulfur: 0,
    iron: 0,
    zinc: 0,
    unit: "mg_per_kg",
  };
}

// ─── Lifecycle Generation ───────────────────────────────────────────────────

function generateLifecycleStages(crop: Crop): CropLifecycleStage[] {
  const totalDays = crop.growthCycleDays;
  const stagePercentages: { stage: GrowthStage; percent: number; water: WaterRequirement }[] = [
    { stage: "seed", percent: 0.02, water: "low" },
    { stage: "germination", percent: 0.05, water: "moderate" },
    { stage: "seedling", percent: 0.1, water: "moderate" },
    { stage: "vegetative", percent: 0.3, water: "high" },
    { stage: "budding", percent: 0.08, water: "high" },
    { stage: "flowering", percent: 0.15, water: "high" },
    { stage: "fruiting", percent: 0.15, water: "moderate" },
    { stage: "ripening", percent: 0.08, water: "low" },
    { stage: "mature", percent: 0.04, water: "very_low" },
    { stage: "harvestable", percent: 0.02, water: "very_low" },
    { stage: "senescence", percent: 0.01, water: "very_low" },
  ];

  const climate = crop.climateRequirements;
  let currentDay = 0;

  return stagePercentages.map((sp) => {
    const duration = Math.max(1, Math.round(totalDays * sp.percent));
    const startDay = currentDay;
    const endDay = currentDay + duration;
    currentDay = endDay;

    const tasks: string[] = [];
    const alerts: string[] = [];

    switch (sp.stage) {
      case "seed":
        tasks.push("Prepare seedbed", "Select quality seeds", "Check soil temperature");
        alerts.push("Ensure soil temp above minimum for germination");
        break;
      case "germination":
        tasks.push("Maintain soil moisture", "Monitor for damping off", "Provide warmth");
        alerts.push("Risk of damping off in high humidity");
        break;
      case "seedling":
        tasks.push("Thin seedlings", "Begin light fertilization", "Monitor for pests");
        alerts.push("Watch for leggy seedlings (insufficient light)");
        break;
      case "vegetative":
        tasks.push("Regular watering", "Side-dress with nitrogen", "Weed management", "Monitor growth rate");
        alerts.push("Ensure adequate nitrogen for leaf growth");
        break;
      case "budding":
        tasks.push("Monitor bud development", "Adjust irrigation", "Scout for pests");
        alerts.push("Buds sensitive to frost");
        break;
      case "flowering":
        tasks.push("Ensure pollinator access", "Reduce nitrogen", "Monitor flower drop", "Avoid overhead watering");
        alerts.push("Flower loss indicates stress");
        break;
      case "fruiting":
        tasks.push("Support heavy fruit", "Monitor fruit set", "Adjust watering schedule", "Begin pest monitoring");
        alerts.push("Irregular watering causes fruit cracking");
        break;
      case "ripening":
        tasks.push("Reduce watering", "Monitor sugar content", "Prepare harvest equipment", "Watch for bird damage");
        alerts.push("Overripe fruit attracts pests");
        break;
      case "mature":
        tasks.push("Final quality assessment", "Schedule harvest crew", "Prepare storage facilities");
        alerts.push("Harvest window is limited");
        break;
      case "harvestable":
        tasks.push("Harvest at optimal time", "Handle carefully to avoid bruising", "Sort by quality grade");
        alerts.push("Delayed harvest reduces quality");
        break;
      case "senescence":
        tasks.push("Remove plant debris", "Prepare field for next crop", "Soil amendment planning");
        alerts.push("Disease-carrying debris should be removed");
        break;
    }

    return {
      stage: sp.stage,
      name: sp.stage.charAt(0).toUpperCase() + sp.stage.slice(1).replace("_", " "),
      description: `${sp.stage} stage for ${crop.name}`,
      durationDays: duration,
      startDay,
      endDay,
      temperatureRange: {
        min: climate.optimalTempMin - 5,
        max: climate.optimalTempMax + 5,
      },
      waterNeed: sp.water,
      tasks,
      alerts,
    };
  });
}

// ─── Crop Service ───────────────────────────────────────────────────────────

export const CropService = {
  // ─── Crop Catalog CRUD ─────────────────────────────────────────────────

  /**
   * Create a new crop in the catalog.
   */
  async createCrop(input: CropCreateInput): Promise<Crop> {
    const errors: string[] = [];
    if (!input.name?.trim()) errors.push("Crop name is required");
    if (!input.category) errors.push("Category is required");
    if (input.growthCycleDays <= 0) errors.push("Growth cycle must be positive");
    if (!input.plantingMethods?.length) errors.push("At least one planting method required");
    if (!input.harvestMethod) errors.push("Harvest method is required");

    if (input.soilRequirements) {
      const ph = input.soilRequirements.phRange;
      if (ph.min < 0 || ph.max > 14) errors.push("pH range must be 0-14");
      if (ph.min > ph.max) errors.push("Minimum pH cannot exceed maximum pH");
    }

    if (input.climateRequirements) {
      const cl = input.climateRequirements;
      if (cl.minTemp > cl.maxTemp) errors.push("Min temp cannot exceed max temp");
      if (cl.optimalTempMin > cl.optimalTempMax) errors.push("Optimal min temp cannot exceed optimal max temp");
      if (cl.minRainfall > cl.maxRainfall) errors.push("Min rainfall cannot exceed max rainfall");
    }

    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    const now = new Date();
    const crop: Crop = {
      id: randomUUID(),
      name: input.name.trim(),
      scientificName: input.scientificName?.trim() || "",
      category: input.category,
      description: input.description?.trim() || "",
      family: input.family?.trim() || "",
      origin: input.origin?.trim() || "",
      waterRequirement: input.waterRequirement,
      sunExposure: input.sunExposure,
      soilRequirements: input.soilRequirements,
      climateRequirements: input.climateRequirements,
      nutrientRequirements: { ...defaultNutrientProfile(), ...input.nutrientRequirements },
      growthCycleDays: input.growthCycleDays,
      plantingMethods: input.plantingMethods,
      harvestMethod: input.harvestMethod,
      avgYieldPerHectare: input.avgYieldPerHectare || 0,
      yieldUnit: input.yieldUnit || "kg",
      spacing: input.spacing || { rowCm: 30, plantCm: 20 },
      plantingDepthCm: input.plantingDepthCm || 2,
      germinationDays: input.germinationDays || 10,
      varieties: [],
      status: "active",
      tags: input.tags || [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    crops.set(crop.id, crop);
    return crop;
  },

  /**
   * Get a crop by ID with all varieties.
   */
  async getCropById(cropId: string): Promise<Crop | null> {
    const crop = crops.get(cropId);
    if (!crop) return null;

    const cropVarieties = Array.from(varieties.values()).filter((v) => v.cropId === cropId);
    return { ...crop, varieties: cropVarieties };
  },

  /**
   * Get a crop by name (case-insensitive).
   */
  async getCropByName(name: string): Promise<Crop | null> {
    const lower = name.toLowerCase();
    for (const crop of crops.values()) {
      if (crop.name.toLowerCase() === lower) {
        return this.getCropById(crop.id);
      }
    }
    return null;
  },

  /**
   * List crops with filtering and pagination.
   */
  async listCrops(
    filter: CropFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<CropSummary>> {
    let results = Array.from(crops.values());

    if (filter.category) {
      const cats = Array.isArray(filter.category) ? filter.category : [filter.category];
      results = results.filter((c) => cats.includes(c.category));
    }
    if (filter.status) {
      results = results.filter((c) => c.status === filter.status);
    }
    if (filter.waterRequirement) {
      results = results.filter((c) => c.waterRequirement === filter.waterRequirement);
    }
    if (filter.sunExposure) {
      results = results.filter((c) => c.sunExposure === filter.sunExposure);
    }
    if (filter.minGrowthCycle !== undefined) {
      results = results.filter((c) => c.growthCycleDays >= filter.minGrowthCycle!);
    }
    if (filter.maxGrowthCycle !== undefined) {
      results = results.filter((c) => c.growthCycleDays <= filter.maxGrowthCycle!);
    }
    if (filter.tags?.length) {
      results = results.filter((c) =>
        filter.tags!.some((t) => c.tags.includes(t))
      );
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.scientificName.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.family.toLowerCase().includes(q)
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
    const paginated = results.slice(start, start + pagination.limit);

    const summaries: CropSummary[] = paginated.map((c) => ({
      id: c.id,
      name: c.name,
      scientificName: c.scientificName,
      category: c.category,
      growthCycleDays: c.growthCycleDays,
      waterRequirement: c.waterRequirement,
      varietyCount: Array.from(varieties.values()).filter((v) => v.cropId === c.id).length,
      status: c.status,
    }));

    return {
      data: summaries,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };
  },

  /**
   * Update a crop's properties.
   */
  async updateCrop(cropId: string, input: CropUpdateInput): Promise<Crop> {
    const crop = crops.get(cropId);
    if (!crop) throw new Error(`Crop not found: ${cropId}`);

    const updated: Crop = {
      ...crop,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.scientificName !== undefined && { scientificName: input.scientificName.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.waterRequirement !== undefined && { waterRequirement: input.waterRequirement }),
      ...(input.sunExposure !== undefined && { sunExposure: input.sunExposure }),
      ...(input.soilRequirements !== undefined && { soilRequirements: input.soilRequirements }),
      ...(input.climateRequirements !== undefined && { climateRequirements: input.climateRequirements }),
      ...(input.nutrientRequirements !== undefined && {
        nutrientRequirements: { ...crop.nutrientRequirements, ...input.nutrientRequirements },
      }),
      ...(input.growthCycleDays !== undefined && { growthCycleDays: input.growthCycleDays }),
      ...(input.plantingMethods !== undefined && { plantingMethods: input.plantingMethods }),
      ...(input.harvestMethod !== undefined && { harvestMethod: input.harvestMethod }),
      ...(input.avgYieldPerHectare !== undefined && { avgYieldPerHectare: input.avgYieldPerHectare }),
      ...(input.yieldUnit !== undefined && { yieldUnit: input.yieldUnit }),
      ...(input.spacing !== undefined && { spacing: input.spacing }),
      ...(input.plantingDepthCm !== undefined && { plantingDepthCm: input.plantingDepthCm }),
      ...(input.germinationDays !== undefined && { germinationDays: input.germinationDays }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.metadata !== undefined && { metadata: { ...crop.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    crops.set(cropId, updated);
    return updated;
  },

  /**
   * Delete a crop. Fails if varieties or schedules reference it.
   */
  async deleteCrop(cropId: string): Promise<boolean> {
    const crop = crops.get(cropId);
    if (!crop) throw new Error(`Crop not found: ${cropId}`);

    const linkedVarieties = Array.from(varieties.values()).filter((v) => v.cropId === cropId);
    if (linkedVarieties.length > 0) {
      throw new Error(
        `Cannot delete crop with ${linkedVarieties.length} linked variety(ies). Remove varieties first.`
      );
    }

    const linkedSchedules = Array.from(plantingSchedules.values()).filter(
      (s) => s.cropId === cropId
    );
    if (linkedSchedules.length > 0) {
      throw new Error(
        `Cannot delete crop with ${linkedSchedules.length} planting schedule(s). Remove schedules first.`
      );
    }

    crops.delete(cropId);
    return true;
  },

  // ─── Variety Management ────────────────────────────────────────────────

  /**
   * Add a variety to a crop.
   */
  async createVariety(cropId: string, input: VarietyCreateInput): Promise<CropVariety> {
    const crop = crops.get(cropId);
    if (!crop) throw new Error(`Crop not found: ${cropId}`);

    if (!input.name?.trim()) throw new Error("Variety name is required");
    if (input.maturityDays <= 0) throw new Error("Maturity days must be positive");

    // Check for duplicate variety name
    const existing = Array.from(varieties.values()).find(
      (v) => v.cropId === cropId && v.name.toLowerCase() === input.name!.trim().toLowerCase()
    );
    if (existing) throw new Error(`Variety '${input.name.trim()}' already exists for this crop`);

    const now = new Date();
    const variety: CropVariety = {
      id: randomUUID(),
      cropId,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      origin: input.origin?.trim() || "",
      maturityDays: input.maturityDays,
      yieldPotential: input.yieldPotential || "medium",
      diseaseResistance: input.diseaseResistance || [],
      pestResistance: input.pestResistance || [],
      climateAdaptation: input.climateAdaptation || [],
      seedWeight: input.seedWeight || 0,
      seedWeightUnit: input.seedWeightUnit || "g",
      color: input.color || "",
      size: input.size || "medium",
      taste: input.taste || "",
      shelfLife: input.shelfLife || 7,
      shelfLifeUnit: input.shelfLifeUnit || "days",
      status: "active",
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    varieties.set(variety.id, variety);
    return variety;
  },

  /**
   * Get a variety by ID.
   */
  async getVarietyById(varietyId: string): Promise<CropVariety | null> {
    return varieties.get(varietyId) || null;
  },

  /**
   * List all varieties for a crop.
   */
  async listVarieties(cropId: string, status?: VarietyStatus): Promise<CropVariety[]> {
    let results = Array.from(varieties.values()).filter((v) => v.cropId === cropId);
    if (status) {
      results = results.filter((v) => v.status === status);
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Update a variety.
   */
  async updateVariety(varietyId: string, input: VarietyUpdateInput): Promise<CropVariety> {
    const variety = varieties.get(varietyId);
    if (!variety) throw new Error(`Variety not found: ${varietyId}`);

    const updated: CropVariety = {
      ...variety,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.origin !== undefined && { origin: input.origin.trim() }),
      ...(input.maturityDays !== undefined && { maturityDays: input.maturityDays }),
      ...(input.yieldPotential !== undefined && { yieldPotential: input.yieldPotential }),
      ...(input.diseaseResistance !== undefined && { diseaseResistance: input.diseaseResistance }),
      ...(input.pestResistance !== undefined && { pestResistance: input.pestResistance }),
      ...(input.climateAdaptation !== undefined && { climateAdaptation: input.climateAdaptation }),
      ...(input.seedWeight !== undefined && { seedWeight: input.seedWeight }),
      ...(input.seedWeightUnit !== undefined && { seedWeightUnit: input.seedWeightUnit }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.size !== undefined && { size: input.size }),
      ...(input.taste !== undefined && { taste: input.taste }),
      ...(input.shelfLife !== undefined && { shelfLife: input.shelfLife }),
      ...(input.shelfLifeUnit !== undefined && { shelfLifeUnit: input.shelfLifeUnit }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.metadata !== undefined && { metadata: { ...variety.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    varieties.set(varietyId, updated);
    return updated;
  },

  /**
   * Delete a variety.
   */
  async deleteVariety(varietyId: string): Promise<boolean> {
    const variety = varieties.get(varietyId);
    if (!variety) throw new Error(`Variety not found: ${varietyId}`);
    varieties.delete(varietyId);
    return true;
  },

  // ─── Lifecycle Management ──────────────────────────────────────────────

  /**
   * Generate the full lifecycle for a crop based on its parameters.
   */
  async getCropLifecycle(cropId: string): Promise<CropLifecycle> {
    const crop = crops.get(cropId);
    if (!crop) throw new Error(`Crop not found: ${cropId}`);

    const stages = generateLifecycleStages(crop);

    return {
      cropId: crop.id,
      cropName: crop.name,
      totalDays: crop.growthCycleDays,
      stages,
    };
  },

  /**
   * Get lifecycle with planting context (dates, current stage).
   */
  async getPlantedLifecycle(
    cropId: string,
    plantedDate: Date,
    currentDate?: Date
  ): Promise<CropLifecycle> {
    const lifecycle = await this.getCropLifecycle(cropId);
    const now = currentDate || new Date();
    const daysSincePlanted = Math.floor(
      (now.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const currentStage = lifecycle.stages.find(
      (s) => daysSincePlanted >= s.startDay && daysSincePlanted <= s.endDay
    );

    const expectedHarvestDate = new Date(plantedDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + lifecycle.totalDays);

    return {
      ...lifecycle,
      currentStage: currentStage?.stage,
      plantedDate,
      expectedHarvestDate,
    };
  },

  /**
   * Get the current growth stage for a planted crop.
   */
  async getCurrentStage(cropId: string, plantedDate: Date): Promise<{
    stage: GrowthStage;
    stageName: string;
    dayNumber: number;
    progressPercent: number;
    daysRemaining: number;
    tasks: string[];
    alerts: string[];
  }> {
    const crop = crops.get(cropId);
    if (!crop) throw new Error(`Crop not found: ${cropId}`);

    const lifecycle = await this.getPlantedLifecycle(cropId, plantedDate);
    const now = new Date();
    const daysSincePlanted = Math.max(
      0,
      Math.floor((now.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const currentStage = lifecycle.stages.find(
      (s) => daysSincePlanted >= s.startDay && daysSincePlanted <= s.endDay
    );

    if (!currentStage) {
      return {
        stage: daysSincePlanted > lifecycle.totalDays ? "senescence" : "seed",
        stageName: "Unknown",
        dayNumber: daysSincePlanted,
        progressPercent: Math.min(100, (daysSincePlanted / lifecycle.totalDays) * 100),
        daysRemaining: Math.max(0, lifecycle.totalDays - daysSincePlanted),
        tasks: [],
        alerts: ["Unable to determine current stage"],
      };
    }

    return {
      stage: currentStage.stage,
      stageName: currentStage.name,
      dayNumber: daysSincePlanted,
      progressPercent: Math.min(100, (daysSincePlanted / lifecycle.totalDays) * 100),
      daysRemaining: Math.max(0, lifecycle.totalDays - daysSincePlanted),
      tasks: currentStage.tasks,
      alerts: currentStage.alerts,
    };
  },

  // ─── Planting Schedules ────────────────────────────────────────────────

  /**
   * Create a planting schedule entry.
   */
  async createPlantingSchedule(input: PlantingScheduleCreateInput): Promise<PlantingScheduleEntry> {
    const crop = crops.get(input.cropId);
    if (!crop) throw new Error(`Crop not found: ${input.cropId}`);

    if (!input.region?.trim()) throw new Error("Region is required");
    if (input.plantingWindowStart >= input.plantingWindowEnd) {
      throw new Error("Planting window start must be before end");
    }
    if (input.harvestWindowStart >= input.harvestWindowEnd) {
      throw new Error("Harvest window start must be before end");
    }

    let varietyName: string | undefined;
    if (input.varietyId) {
      const variety = varieties.get(input.varietyId);
      if (!variety) throw new Error(`Variety not found: ${input.varietyId}`);
      if (variety.cropId !== input.cropId) throw new Error("Variety does not belong to this crop");
      varietyName = variety.name;
    }

    const now = new Date();
    const entry: PlantingScheduleEntry = {
      id: randomUUID(),
      cropId: input.cropId,
      cropName: crop.name,
      varietyId: input.varietyId,
      varietyName,
      region: input.region.trim(),
      plantingWindowStart: input.plantingWindowStart,
      plantingWindowEnd: input.plantingWindowEnd,
      harvestWindowStart: input.harvestWindowStart,
      harvestWindowEnd: input.harvestWindowEnd,
      season: input.season,
      climate: input.climate?.trim() || "temperate",
      notes: input.notes?.trim() || "",
      suitableFor: input.suitableFor || [],
      createdAt: now,
    };

    plantingSchedules.set(entry.id, entry);
    return entry;
  },

  /**
   * List planting schedules with optional filters.
   */
  async listPlantingSchedules(filters?: {
    cropId?: string;
    region?: string;
    season?: string;
    activeOnly?: boolean;
  }): Promise<PlantingScheduleEntry[]> {
    let results = Array.from(plantingSchedules.values());

    if (filters?.cropId) {
      results = results.filter((s) => s.cropId === filters.cropId);
    }
    if (filters?.region) {
      const q = filters.region.toLowerCase();
      results = results.filter((s) => s.region.toLowerCase().includes(q));
    }
    if (filters?.season) {
      results = results.filter((s) => s.season === filters.season);
    }
    if (filters?.activeOnly) {
      const now = new Date();
      results = results.filter(
        (s) => s.plantingWindowStart <= now && s.plantingWindowEnd >= now
      );
    }

    return results.sort(
      (a, b) => a.plantingWindowStart.getTime() - b.plantingWindowStart.getTime()
    );
  },

  /**
   * Delete a planting schedule.
   */
  async deletePlantingSchedule(scheduleId: string): Promise<boolean> {
    if (!plantingSchedules.has(scheduleId)) {
      throw new Error(`Planting schedule not found: ${scheduleId}`);
    }
    plantingSchedules.delete(scheduleId);
    return true;
  },

  // ─── Compatibility & Recommendations ───────────────────────────────────

  /**
   * Check compatibility between two crops.
   */
  async checkCropCompatibility(cropIdA: string, cropIdB: string): Promise<CropCompatibility> {
    const cropA = crops.get(cropIdA);
    const cropB = crops.get(cropIdB);
    if (!cropA) throw new Error(`Crop not found: ${cropIdA}`);
    if (!cropB) throw new Error(`Crop not found: ${cropIdB}`);

    const nameA = cropA.name.toLowerCase();
    const nameB = cropB.name.toLowerCase();

    // Check direct match
    if (COMPANION_DATABASE[nameA]?.[nameB]) {
      return COMPANION_DATABASE[nameA][nameB];
    }

    // Check reverse
    if (COMPANION_DATABASE[nameB]?.[nameA]) {
      const reverse = COMPANION_DATABASE[nameB][nameA];
      return {
        cropAId: cropIdA,
        cropBId: cropIdB,
        compatible: reverse.compatible,
        relationship: reverse.relationship,
        reason: reverse.reason,
      };
    }

    // Default: neutral with basic checks
    const sameFamily = cropA.family && cropB.family && cropA.family === cropB.family;
    const sameCategory = cropA.category === cropB.category;

    if (sameFamily && sameCategory) {
      return {
        cropAId: cropIdA,
        cropBId: cropIdB,
        compatible: false,
        relationship: "antagonist",
        reason: `Same family (${cropA.family}) - likely compete for similar nutrients and attract same pests`,
      };
    }

    return {
      cropAId: cropIdA,
      cropBId: cropIdB,
      compatible: true,
      relationship: "neutral",
      reason: "No specific compatibility data available - generally safe to plant together",
    };
  },

  /**
   * Get crop recommendations for a specific season and region.
   */
  async getSeasonRecommendations(
    season: CropSeasonRecommendation["season"],
    region: string,
    climate: string = "temperate"
  ): Promise<CropSeasonRecommendation> {
    const allCrops = Array.from(crops.values()).filter((c) => c.status === "active");
    const now = new Date();

    const recommended = allCrops
      .filter((crop) => {
        const climateOk =
          crop.climateRequirements.minTemp < 40 &&
          crop.climateRequirements.maxTemp > -10;
        return climateOk;
      })
      .map((crop) => {
        const startMonth =
          season === "spring" ? 2 : season === "summer" ? 5 : season === "fall" ? 8 : 11;
        const plantStart = new Date(now.getFullYear(), startMonth, 1);
        const plantEnd = new Date(now.getFullYear(), startMonth + 2, 0);

        const harvestStart = new Date(plantStart);
        harvestStart.setDate(harvestStart.getDate() + crop.growthCycleDays);
        const harvestEnd = new Date(harvestStart);
        harvestEnd.setDate(harvestEnd.getDate() + 14);

        const confidence = Math.random() * 0.3 + 0.7;

        return {
          cropId: crop.id,
          cropName: crop.name,
          category: crop.category,
          plantingWindow: { start: plantStart, end: plantEnd },
          expectedYield: crop.avgYieldPerHectare,
          waterNeed: crop.waterRequirement,
          confidence: Math.round(confidence * 100) / 100,
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    return {
      season,
      recommendedCrops: recommended,
      region,
      climate,
      generatedAt: new Date(),
    };
  },

  /**
   * Get crop statistics.
   */
  async getCropStats(): Promise<{
    totalCrops: number;
    activeCrops: number;
    totalVarieties: number;
    byCategory: Record<CropCategory, number>;
    byWaterRequirement: Record<WaterRequirement, number>;
    avgGrowthCycle: number;
    avgYield: number;
  }> {
    const allCrops = Array.from(crops.values());
    const activeCrops = allCrops.filter((c) => c.status === "active");
    const allVarieties = Array.from(varieties.values());

    const byCategory: Record<string, number> = {};
    const byWaterRequirement: Record<string, number> = {};

    for (const crop of allCrops) {
      byCategory[crop.category] = (byCategory[crop.category] || 0) + 1;
      byWaterRequirement[crop.waterRequirement] =
        (byWaterRequirement[crop.waterRequirement] || 0) + 1;
    }

    const avgGrowthCycle =
      allCrops.length > 0
        ? allCrops.reduce((sum, c) => sum + c.growthCycleDays, 0) / allCrops.length
        : 0;

    const cropsWithYield = allCrops.filter((c) => c.avgYieldPerHectare > 0);
    const avgYield =
      cropsWithYield.length > 0
        ? cropsWithYield.reduce((sum, c) => sum + c.avgYieldPerHectare, 0) /
          cropsWithYield.length
        : 0;

    return {
      totalCrops: allCrops.length,
      activeCrops: activeCrops.length,
      totalVarieties: allVarieties.length,
      byCategory: byCategory as Record<CropCategory, number>,
      byWaterRequirement: byWaterRequirement as Record<WaterRequirement, number>,
      avgGrowthCycle: Math.round(avgGrowthCycle),
      avgYield: Math.round(avgYield * 100) / 100,
    };
  },

  /**
   * Clear all data (for testing).
   */
  async clearAll(): Promise<void> {
    crops.clear();
    varieties.clear();
    plantingSchedules.clear();
  },

  /**
   * Get counts.
   */
  async count(): Promise<{ crops: number; varieties: number; schedules: number }> {
    return {
      crops: crops.size,
      varieties: varieties.size,
      schedules: plantingSchedules.size,
    };
  },
};
