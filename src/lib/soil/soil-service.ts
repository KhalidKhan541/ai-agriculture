import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SoilSampleStatus = "collected" | "processing" | "analyzed" | "archived";
export type SoilLayer = "topsoil" | "subsoil" | "root_zone" | "deep";
export type AnalysisType = "basic" | "standard" | "comprehensive" | "custom";
export type NutrientLevel = "deficient" | "low" | "adequate" | "high" | "excessive";
export type pHLevel = "very_acidic" | "acidic" | "slightly_acidic" | "neutral" | "slightly_alkaline" | "alkaline" | "very_alkaline";
export type RecommendationPriority = "low" | "medium" | "high" | "urgent";
export type SoilHealthGrade = "A" | "B" | "C" | "D" | "F";

export interface SoilCoordinates {
  latitude: number;
  longitude: number;
  depth: number;
}

export interface SoilSample {
  id: string;
  farmId: string;
  fieldId: string;
  sampleCode: string;
  layer: SoilLayer;
  depthCm: number;
  coordinates: SoilCoordinates;
  collectionDate: Date;
  collectedBy: string;
  status: SoilSampleStatus;
  analysisType: AnalysisType;
  analysis?: SoilAnalysis;
  labId?: string;
  labReference?: string;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoilSampleCreateInput {
  farmId: string;
  fieldId: string;
  layer?: SoilLayer;
  depthCm?: number;
  coordinates?: SoilCoordinates;
  collectionDate?: Date;
  collectedBy?: string;
  analysisType?: AnalysisType;
  labId?: string;
  labReference?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface SoilAnalysis {
  id: string;
  sampleId: string;
  analysisDate: Date;
  analyst: string;
  laboratory: string;

  // Physical properties
  texture: SoilTexture;
  structure: SoilStructure;
  bulkDensity: number;
  waterHoldingCapacity: number;
  infiltrationRate: number;
  porosity: number;

  // Chemical properties
  pH: number;
  ec: number;
  cec: number;
  organicMatter: number;
  carbonate: number;
  gypsum: number;

  // Macronutrients
  nitrogen: NutrientMeasurement;
  phosphorus: NutrientMeasurement;
  potassium: NutrientMeasurement;
  calcium: NutrientMeasurement;
  magnesium: NutrientMeasurement;
  sulfur: NutrientMeasurement;

  // Micronutrients
  iron: NutrientMeasurement;
  manganese: NutrientMeasurement;
  zinc: NutrientMeasurement;
  copper: NutrientMeasurement;
  boron: NutrientMeasurement;
  molybdenum: NutrientMeasurement;
  chloride: NutrientMeasurement;

  // Biological indicators
  microbialBiomass: number;
  respirationRate: number;
  earthwormCount: number;
  enzymeActivity: number;

  // Carbon
  totalCarbon: number;
  soilOrganicCarbon: number;
  carbonNitrogenRatio: number;

  // Aggregate stability
  aggregateStability: number;
  waterStableAggregates: number;

  metadata: Record<string, unknown>;
  generatedAt: Date;
}

export interface SoilAnalysisInput {
  analyst: string;
  laboratory: string;
  texture?: SoilTexture;
  structure?: SoilStructure;
  bulkDensity?: number;
  waterHoldingCapacity?: number;
  infiltrationRate?: number;
  porosity?: number;
  pH: number;
  ec?: number;
  cec?: number;
  organicMatter?: number;
  carbonate?: number;
  gypsum?: number;
  nitrogen?: Partial<NutrientMeasurement>;
  phosphorus?: Partial<NutrientMeasurement>;
  potassium?: Partial<NutrientMeasurement>;
  calcium?: Partial<NutrientMeasurement>;
  magnesium?: Partial<NutrientMeasurement>;
  sulfur?: Partial<NutrientMeasurement>;
  iron?: Partial<NutrientMeasurement>;
  manganese?: Partial<NutrientMeasurement>;
  zinc?: Partial<NutrientMeasurement>;
  copper?: Partial<NutrientMeasurement>;
  boron?: Partial<NutrientMeasurement>;
  molybdenum?: Partial<NutrientMeasurement>;
  chloride?: Partial<NutrientMeasurement>;
  microbialBiomass?: number;
  respirationRate?: number;
  earthwormCount?: number;
  enzymeActivity?: number;
  totalCarbon?: number;
  soilOrganicCarbon?: number;
  carbonNitrogenRatio?: number;
  aggregateStability?: number;
  waterStableAggregates?: number;
}

export interface SoilTexture {
  sand: number;
  silt: number;
  clay: number;
  classification: "sand" | "loamy_sand" | "sandy_loam" | "loam" | "silt_loam" | "silt" | "sandy_clay_loam" | "clay_loam" | "silty_clay_loam" | "sandy_clay" | "silty_clay" | "clay";
}

export interface SoilStructure {
  grade: "structureless" | "weak" | "moderate" | "strong";
  type: "granular" | "subangular_blocky" | "angular_blocky" | "prismatic" | "columnar" | "platy" | "massive";
  size: "fine" | "medium" | "coarse";
}

export interface NutrientMeasurement {
  value: number;
  unit: string;
  level: NutrientLevel;
  optimalRange: { min: number; max: number };
  deficiencyThreshold: number;
  excessThreshold: number;
}

export interface SoilNutrientTracking {
  farmId: string;
  fieldId: string;
  nutrientName: string;
  readings: {
    date: Date;
    value: number;
    unit: string;
    sampleId: string;
  }[];
  trend: "increasing" | "decreasing" | "stable" | "fluctuating";
  avgValue: number;
  minValue: number;
  maxValue: number;
  changeRate: number;
  lastUpdated: Date;
}

export interface SoilRecommendation {
  id: string;
  farmId: string;
  fieldId: string;
  sampleId: string;
  category: "amendment" | "tillage" | "irrigation" | "cover_crop" | "liming" | "fertilization" | "drainage" | "erosion_control";
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  product?: string;
  applicationRate?: string;
  timing: string;
  estimatedCost: number;
  expectedImpact: string;
  urgency: "immediate" | "next_season" | "long_term";
  validUntil: Date;
  implementedAt?: Date;
  implementedBy?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface SoilRecommendationCreateInput {
  farmId: string;
  fieldId: string;
  sampleId: string;
  category: SoilRecommendation["category"];
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  product?: string;
  applicationRate?: string;
  timing: string;
  estimatedCost?: number;
  expectedImpact?: string;
  urgency?: SoilRecommendation["urgency"];
  validUntil?: Date;
}

export interface SoilHealthReport {
  id: string;
  farmId: string;
  fieldId: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  overallGrade: SoilHealthGrade;
  overallScore: number;
  physicalScore: number;
  chemicalScore: number;
  biologicalScore: number;
  scores: {
    category: string;
    metric: string;
    value: number;
    weight: number;
    score: number;
    grade: string;
  }[];
  nutrients: {
    name: string;
    status: NutrientLevel;
    trend: "improving" | "declining" | "stable";
    value: number;
    optimal: { min: number; max: number };
  }[];
  recommendations: SoilRecommendation[];
  comparisonWithPrevious?: {
    overallChange: number;
    improvements: string[];
    declines: string[];
  };
  metadata: Record<string, unknown>;
}

export interface SoilFilter {
  farmId?: string;
  fieldId?: string;
  layer?: SoilLayer | SoilLayer[];
  status?: SoilSampleStatus;
  analysisType?: AnalysisType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface NutrientTrendFilter {
  farmId: string;
  fieldId?: string;
  nutrientName: string;
  dateFrom?: Date;
  dateTo?: Date;
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

// ─── Constants ──────────────────────────────────────────────────────────────

const TEXTURE_CLASSIFICATIONS: { classification: SoilTexture["classification"]; sandMax: number; clayMax: number }[] = [
  { classification: "sand", sandMax: 100, clayMax: 10 },
  { classification: "loamy_sand", sandMax: 90, clayMax: 15 },
  { classification: "sandy_loam", sandMax: 52, clayMax: 20 },
  { classification: "loam", sandMax: 52, clayMax: 27 },
  { classification: "silt_loam", sandMax: 50, clayMax: 27 },
  { classification: "silt", sandMax: 20, clayMax: 12 },
  { classification: "sandy_clay_loam", sandMax: 52, clayMax: 35 },
  { classification: "clay_loam", sandMax: 52, clayMax: 40 },
  { classification: "silty_clay_loam", sandMax: 20, clayMax: 40 },
  { classification: "sandy_clay", sandMax: 45, clayMax: 55 },
  { classification: "silty_clay", sandMax: 20, clayMax: 40 },
  { classification: "clay", sandMax: 100, clayMax: 100 },
];

const NUTRIENT_OPTIMAL_RANGES: Record<string, { min: number; max: number; deficiency: number; excess: number; unit: string }> = {
  nitrogen: { min: 20, max: 50, deficiency: 14, excess: 100, unit: "mg/kg" },
  phosphorus: { min: 15, max: 40, deficiency: 10, excess: 80, unit: "mg/kg" },
  potassium: { min: 150, max: 300, deficiency: 100, excess: 600, unit: "mg/kg" },
  calcium: { min: 1000, max: 3000, deficiency: 500, excess: 5000, unit: "mg/kg" },
  magnesium: { min: 100, max: 300, deficiency: 50, excess: 800, unit: "mg/kg" },
  sulfur: { min: 10, max: 30, deficiency: 6, excess: 60, unit: "mg/kg" },
  iron: { min: 4, max: 10, deficiency: 2, excess: 30, unit: "mg/kg" },
  manganese: { min: 2, max: 8, deficiency: 1, excess: 20, unit: "mg/kg" },
  zinc: { min: 1, max: 5, deficiency: 0.5, excess: 15, unit: "mg/kg" },
  copper: { min: 0.3, max: 2, deficiency: 0.2, excess: 8, unit: "mg/kg" },
  boron: { min: 0.5, max: 3, deficiency: 0.3, excess: 10, unit: "mg/kg" },
  molybdenum: { min: 0.1, max: 1, deficiency: 0.05, excess: 5, unit: "mg/kg" },
  chloride: { min: 2, max: 10, deficiency: 1, excess: 30, unit: "mg/kg" },
};

// ─── In-Memory Store ────────────────────────────────────────────────────────

const samples = new Map<string, SoilSample>();
const recommendations = new Map<string, SoilRecommendation>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function classifyTexture(sand: number, silt: number, clay: number): SoilTexture["classification"] {
  for (const rule of TEXTURE_CLASSIFICATIONS) {
    if (sand <= rule.sandMax && clay <= rule.clayMax) {
      return rule.classification;
    }
  }
  return "clay";
}

function classifyNutrient(value: number, nutrientName: string): NutrientLevel {
  const range = NUTRIENT_OPTIMAL_RANGES[nutrientName.toLowerCase()];
  if (!range) return "adequate";

  if (value < range.deficiency) return "deficient";
  if (value < range.min) return "low";
  if (value >= range.min && value <= range.max) return "adequate";
  if (value > range.excess) return "excessive";
  return "high";
}

function classifypH(pH: number): pHLevel {
  if (pH < 4.5) return "very_acidic";
  if (pH < 5.5) return "acidic";
  if (pH < 6.2) return "slightly_acidic";
  if (pH >= 6.2 && pH <= 7.3) return "neutral";
  if (pH <= 8.0) return "slightly_alkaline";
  if (pH <= 8.5) return "alkaline";
  return "very_alkaline";
}

function createNutrientMeasurement(
  value: number,
  nutrientName: string
): NutrientMeasurement {
  const range = NUTRIENT_OPTIMAL_RANGES[nutrientName.toLowerCase()] || {
    min: 0,
    max: 100,
    deficiency: 0,
    excess: 200,
    unit: "mg/kg",
  };

  return {
    value,
    unit: range.unit,
    level: classifyNutrient(value, nutrientName),
    optimalRange: { min: range.min, max: range.max },
    deficiencyThreshold: range.deficiency,
    excessThreshold: range.excess,
  };
}

function generateSampleCode(farmId: string, fieldId: string, layer: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const farmShort = farmId.slice(0, 4).toUpperCase();
  const fieldShort = fieldId.slice(0, 4).toUpperCase();
  const layerCode = layer.charAt(0).toUpperCase();
  return `SS-${farmShort}-${fieldShort}-${layerCode}-${timestamp}`;
}

// ─── Soil Service ───────────────────────────────────────────────────────────

export const SoilService = {
  // ─── Sample Management ─────────────────────────────────────────────────

  /**
   * Create a new soil sample record.
   */
  async createSample(input: SoilSampleCreateInput): Promise<SoilSample> {
    const errors: string[] = [];
    if (!input.farmId?.trim()) errors.push("Farm ID is required");
    if (!input.fieldId?.trim()) errors.push("Field ID is required");

    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    const now = new Date();
    const layer = input.layer || "topsoil";
    const sample: SoilSample = {
      id: randomUUID(),
      farmId: input.farmId.trim(),
      fieldId: input.fieldId.trim(),
      sampleCode: generateSampleCode(input.farmId, input.fieldId, layer),
      layer,
      depthCm: input.depthCm || (layer === "topsoil" ? 15 : layer === "subsoil" ? 30 : layer === "root_zone" ? 45 : 60),
      coordinates: input.coordinates || { latitude: 0, longitude: 0, depth: 0 },
      collectionDate: input.collectionDate || new Date(),
      collectedBy: input.collectedBy || "system",
      status: "collected",
      analysisType: input.analysisType || "standard",
      labId: input.labId,
      labReference: input.labReference,
      notes: input.notes?.trim() || "",
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    samples.set(sample.id, sample);
    return sample;
  },

  /**
   * Get a soil sample by ID.
   */
  async getSampleById(sampleId: string): Promise<SoilSample | null> {
    return samples.get(sampleId) || null;
  },

  /**
   * List soil samples with filtering and pagination.
   */
  async listSamples(
    filter: SoilFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<SoilSample>> {
    let results = Array.from(samples.values());

    if (filter.farmId) results = results.filter((s) => s.farmId === filter.farmId);
    if (filter.fieldId) results = results.filter((s) => s.fieldId === filter.fieldId);
    if (filter.layer) {
      const layers = Array.isArray(filter.layer) ? filter.layer : [filter.layer];
      results = results.filter((s) => layers.includes(s.layer));
    }
    if (filter.status) results = results.filter((s) => s.status === filter.status);
    if (filter.analysisType) results = results.filter((s) => s.analysisType === filter.analysisType);
    if (filter.dateFrom) results = results.filter((s) => s.collectionDate >= filter.dateFrom!);
    if (filter.dateTo) results = results.filter((s) => s.collectionDate <= filter.dateTo!);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.sampleCode.toLowerCase().includes(q) ||
          s.notes.toLowerCase().includes(q) ||
          s.collectedBy.toLowerCase().includes(q)
      );
    }

    const sortBy = pagination.sortBy || "collectionDate";
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
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };
  },

  /**
   * Update a soil sample.
   */
  async updateSample(
    sampleId: string,
    input: Partial<Pick<SoilSample, "layer" | "depthCm" | "coordinates" | "status" | "labId" | "labReference" | "notes" | "metadata">>
  ): Promise<SoilSample> {
    const sample = samples.get(sampleId);
    if (!sample) throw new Error(`Soil sample not found: ${sampleId}`);

    const updated: SoilSample = {
      ...sample,
      ...(input.layer !== undefined && { layer: input.layer }),
      ...(input.depthCm !== undefined && { depthCm: input.depthCm }),
      ...(input.coordinates !== undefined && { coordinates: input.coordinates }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.labId !== undefined && { labId: input.labId }),
      ...(input.labReference !== undefined && { labReference: input.labReference }),
      ...(input.notes !== undefined && { notes: input.notes.trim() }),
      ...(input.metadata !== undefined && { metadata: { ...sample.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    samples.set(sampleId, updated);
    return updated;
  },

  /**
   * Delete a soil sample.
   */
  async deleteSample(sampleId: string): Promise<boolean> {
    const sample = samples.get(sampleId);
    if (!sample) throw new Error(`Soil sample not found: ${sampleId}`);
    samples.delete(sampleId);
    return true;
  },

  // ─── Analysis Management ───────────────────────────────────────────────

  /**
   * Record soil analysis results for a sample.
   */
  async recordAnalysis(sampleId: string, input: SoilAnalysisInput): Promise<SoilAnalysis> {
    const sample = samples.get(sampleId);
    if (!sample) throw new Error(`Soil sample not found: ${sampleId}`);

    if (input.pH < 0 || input.pH > 14) throw new Error("pH must be between 0 and 14");

    const now = new Date();

    // Build texture
    const sand = input.texture?.sand || 40;
    const silt = input.texture?.silt || 40;
    const clay = input.texture?.clay || 20;
    const textureClassification = classifyTexture(sand, silt, clay);

    const analysis: SoilAnalysis = {
      id: randomUUID(),
      sampleId,
      analysisDate: now,
      analyst: input.analyst,
      laboratory: input.laboratory,

      texture: {
        sand,
        silt,
        clay,
        classification: input.texture?.classification || textureClassification,
      },
      structure: input.structure || {
        grade: "moderate",
        type: "granular",
        size: "medium",
      },
      bulkDensity: input.bulkDensity || 1.3,
      waterHoldingCapacity: input.waterHoldingCapacity || 35,
      infiltrationRate: input.infiltrationRate || 25,
      porosity: input.porosity || 45,

      pH: input.pH,
      ec: input.ec || 0.5,
      cec: input.cec || 15,
      organicMatter: input.organicMatter || 3,
      carbonate: input.carbonate || 0,
      gypsum: input.gypsum || 0,

      nitrogen: createNutrientMeasurement(input.nitrogen?.value || 25, "nitrogen"),
      phosphorus: createNutrientMeasurement(input.phosphorus?.value || 20, "phosphorus"),
      potassium: createNutrientMeasurement(input.potassium?.value || 180, "potassium"),
      calcium: createNutrientMeasurement(input.calcium?.value || 1500, "calcium"),
      magnesium: createNutrientMeasurement(input.magnesium?.value || 200, "magnesium"),
      sulfur: createNutrientMeasurement(input.sulfur?.value || 15, "sulfur"),

      iron: createNutrientMeasurement(input.iron?.value || 5, "iron"),
      manganese: createNutrientMeasurement(input.manganese?.value || 3, "manganese"),
      zinc: createNutrientMeasurement(input.zinc?.value || 2, "zinc"),
      copper: createNutrientMeasurement(input.copper?.value || 0.8, "copper"),
      boron: createNutrientMeasurement(input.boron?.value || 1.2, "boron"),
      molybdenum: createNutrientMeasurement(input.molybdenum?.value || 0.3, "molybdenum"),
      chloride: createNutrientMeasurement(input.chloride?.value || 5, "chloride"),

      microbialBiomass: input.microbialBiomass || 250,
      respirationRate: input.respirationRate || 3.5,
      earthwormCount: input.earthwormCount || 15,
      enzymeActivity: input.enzymeActivity || 0.8,

      totalCarbon: input.totalCarbon || 2.5,
      soilOrganicCarbon: input.soilOrganicCarbon || 1.5,
      carbonNitrogenRatio: input.carbonNitrogenRatio || 12,

      aggregateStability: input.aggregateStability || 70,
      waterStableAggregates: input.waterStableAggregates || 65,

      metadata: {},
      generatedAt: now,
    };

    // Update sample
    sample.analysis = analysis;
    sample.status = "analyzed";
    sample.updatedAt = now;
    samples.set(sampleId, sample);

    return analysis;
  },

  /**
   * Get analysis results for a sample.
   */
  async getAnalysis(sampleId: string): Promise<SoilAnalysis | null> {
    const sample = samples.get(sampleId);
    return sample?.analysis || null;
  },

  /**
   * Compare two soil analyses.
   */
  async compareAnalyses(
    sampleIdA: string,
    sampleIdB: string
  ): Promise<{
    sampleA: string;
    sampleB: string;
    pHChange: number;
    organicMatterChange: number;
    nutrientsImproved: string[];
    nutrientsDeclined: string[];
    textureSimilarity: number;
    overallChange: string;
  }> {
    const sampleA = samples.get(sampleIdA);
    const sampleB = samples.get(sampleIdB);

    if (!sampleA?.analysis) throw new Error(`Sample A not found or has no analysis: ${sampleIdA}`);
    if (!sampleB?.analysis) throw new Error(`Sample B not found or has no analysis: ${sampleIdB}`);

    const a = sampleA.analysis;
    const b = sampleB.analysis;

    const pHChange = Math.round((b.pH - a.pH) * 100) / 100;
    const omChange = Math.round((b.organicMatter - a.organicMatter) * 100) / 100;

    const nutrientsImproved: string[] = [];
    const nutrientsDeclined: string[] = [];

    const nutrientPairs: [string, NutrientMeasurement, NutrientMeasurement][] = [
      ["Nitrogen", a.nitrogen, b.nitrogen],
      ["Phosphorus", a.phosphorus, b.phosphorus],
      ["Potassium", a.potassium, b.potassium],
      ["Calcium", a.calcium, b.calcium],
      ["Magnesium", a.magnesium, b.magnesium],
      ["Sulfur", a.sulfur, b.sulfur],
      ["Iron", a.iron, b.iron],
      ["Zinc", a.zinc, b.zinc],
    ];

    for (const [name, valA, valB] of nutrientPairs) {
      const diff = valB.value - valA.value;
      if (diff > 5) nutrientsImproved.push(name);
      else if (diff < -5) nutrientsDeclined.push(name);
    }

    // Texture similarity (Euclidean distance normalized)
    const textureDiff = Math.sqrt(
      Math.pow(a.texture.sand - b.texture.sand, 2) +
      Math.pow(a.texture.silt - b.texture.silt, 2) +
      Math.pow(a.texture.clay - b.texture.clay, 2)
    );
    const textureSimilarity = Math.max(0, 100 - textureDiff);

    const improved = nutrientsImproved.length;
    const declined = nutrientsDeclined.length;
    let overallChange = "Stable";
    if (improved > declined + 2) overallChange = "Significantly Improved";
    else if (improved > declined) overallChange = "Improved";
    else if (declined > improved + 2) overallChange = "Significantly Declined";
    else if (declined > improved) overallChange = "Declined";

    return {
      sampleA: sampleIdA,
      sampleB: sampleIdB,
      pHChange,
      organicMatterChange: omChange,
      nutrientsImproved,
      nutrientsDeclined,
      textureSimilarity: Math.round(textureSimilarity),
      overallChange,
    };
  },

  // ─── Nutrient Tracking ─────────────────────────────────────────────────

  /**
   * Get nutrient tracking data for a field.
   */
  async getNutrientTracking(filter: NutrientTrendFilter): Promise<SoilNutrientTracking> {
    const fieldSamples = Array.from(samples.values())
      .filter(
        (s) =>
          s.farmId === filter.farmId &&
          (!filter.fieldId || s.fieldId === filter.fieldId) &&
          s.analysis
      )
      .filter((s) => {
        if (filter.dateFrom && s.collectionDate < filter.dateFrom) return false;
        if (filter.dateTo && s.collectionDate > filter.dateTo) return false;
        return true;
      })
      .sort((a, b) => a.collectionDate.getTime() - b.collectionDate.getTime());

    const nutrientName = filter.nutrientName.toLowerCase();
    const readings: SoilNutrientTracking["readings"] = [];

    for (const sample of fieldSamples) {
      const analysis = sample.analysis!;
      let value = 0;

      switch (nutrientName) {
        case "nitrogen": value = analysis.nitrogen.value; break;
        case "phosphorus": value = analysis.phosphorus.value; break;
        case "potassium": value = analysis.potassium.value; break;
        case "calcium": value = analysis.calcium.value; break;
        case "magnesium": value = analysis.magnesium.value; break;
        case "sulfur": value = analysis.sulfur.value; break;
        case "iron": value = analysis.iron.value; break;
        case "zinc": value = analysis.zinc.value; break;
        case "copper": value = analysis.copper.value; break;
        case "boron": value = analysis.boron.value; break;
        case "manganese": value = analysis.manganese.value; break;
        case "ph": value = analysis.pH; break;
        case "organic_matter": value = analysis.organicMatter; break;
        default: value = 0;
      }

      readings.push({
        date: sample.collectionDate,
        value,
        unit: NUTRIENT_OPTIMAL_RANGES[nutrientName]?.unit || "mg/kg",
        sampleId: sample.id,
      });
    }

    const values = readings.map((r) => r.value);
    const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 0;

    // Calculate trend
    let trend: SoilNutrientTracking["trend"] = "stable";
    if (values.length >= 2) {
      const recentHalf = values.slice(Math.floor(values.length / 2));
      const olderHalf = values.slice(0, Math.floor(values.length / 2));
      const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;
      const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

      if (changePercent > 10) trend = "increasing";
      else if (changePercent < -10) trend = "decreasing";
      else if (Math.abs(changePercent) > 5) trend = "fluctuating";
    }

    // Calculate rate of change per month
    let changeRate = 0;
    if (readings.length >= 2) {
      const first = readings[0];
      const last = readings[readings.length - 1];
      const monthsDiff =
        (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsDiff > 0) {
        changeRate = Math.round(((last.value - first.value) / monthsDiff) * 100) / 100;
      }
    }

    return {
      farmId: filter.farmId,
      fieldId: filter.fieldId || "",
      nutrientName: filter.nutrientName,
      readings,
      trend,
      avgValue: Math.round(avgValue * 100) / 100,
      minValue,
      maxValue,
      changeRate,
      lastUpdated: readings.length > 0 ? readings[readings.length - 1].date : new Date(),
    };
  },

  /**
   * Get pH tracking data.
   */
  async getPHTracking(farmId: string, fieldId?: string): Promise<{
    readings: { date: Date; pH: number; level: pHLevel; sampleId: string }[];
    trend: "increasing" | "decreasing" | "stable" | "fluctuating";
    avgPH: number;
    currentLevel: pHLevel;
    limingRecommendation: string | null;
  }> {
    const tracking = await this.getNutrientTracking({
      farmId,
      fieldId,
      nutrientName: "ph",
    });

    const readings = tracking.readings.map((r) => ({
      date: r.date,
      pH: r.value,
      level: classifypH(r.value),
      sampleId: r.sampleId,
    }));

    const avgPH = tracking.avgValue;
    const currentLevel = classifypH(avgPH);

    let limingRecommendation: string | null = null;
    if (avgPH < 5.5) {
      limingRecommendation = `Soil is acidic (pH ${avgPH}). Apply agricultural lime at 2-4 tonnes/ha to raise pH to 6.0-6.5.`;
    } else if (avgPH < 6.0) {
      limingRecommendation = `Soil is slightly acidic (pH ${avgPH}). Consider light liming at 1-2 tonnes/ha.`;
    } else if (avgPH > 8.0) {
      limingRecommendation = `Soil is alkaline (pH ${avgPH}). Apply eleite sulfur at 0.5-1 tonne/ha or use acidifying fertilizers.`;
    }

    return {
      readings,
      trend: tracking.trend,
      avgPH: Math.round(avgPH * 100) / 100,
      currentLevel,
      limingRecommendation,
    };
  },

  // ─── Recommendations ───────────────────────────────────────────────────

  /**
   * Create a soil amendment recommendation.
   */
  async createRecommendation(input: SoilRecommendationCreateInput): Promise<SoilRecommendation> {
    const errors: string[] = [];
    if (!input.farmId?.trim()) errors.push("Farm ID is required");
    if (!input.fieldId?.trim()) errors.push("Field ID is required");
    if (!input.sampleId?.trim()) errors.push("Sample ID is required");
    if (!input.title?.trim()) errors.push("Title is required");
    if (!input.description?.trim()) errors.push("Description is required");
    if (!input.rationale?.trim()) errors.push("Rationale is required");

    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    const now = new Date();
    const validUntil = input.validUntil || new Date(now);
    if (!input.validUntil) validUntil.setMonth(validUntil.getMonth() + 3);

    const recommendation: SoilRecommendation = {
      id: randomUUID(),
      farmId: input.farmId.trim(),
      fieldId: input.fieldId.trim(),
      sampleId: input.sampleId.trim(),
      category: input.category,
      priority: input.priority,
      title: input.title.trim(),
      description: input.description.trim(),
      rationale: input.rationale.trim(),
      product: input.product,
      applicationRate: input.applicationRate,
      timing: input.timing,
      estimatedCost: input.estimatedCost || 0,
      expectedImpact: input.expectedImpact || "",
      urgency: input.urgency || "next_season",
      validUntil,
      metadata: {},
      createdAt: now,
    };

    recommendations.set(recommendation.id, recommendation);
    return recommendation;
  },

  /**
   * Generate recommendations based on analysis.
   */
  async generateRecommendations(sampleId: string): Promise<SoilRecommendation[]> {
    const sample = samples.get(sampleId);
    if (!sample) throw new Error(`Soil sample not found: ${sampleId}`);
    if (!sample.analysis) throw new Error("Sample has no analysis data");

    const analysis = sample.analysis;
    const generated: SoilRecommendation[] = [];
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + 3);

    // pH recommendations
    if (analysis.pH < 5.5) {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "liming",
        priority: "high",
        title: "Apply agricultural lime",
        description: `Soil pH is ${analysis.pH} (acidic). Apply agricultural lime to raise pH.`,
        rationale: "Acidic soil limits nutrient availability and can be toxic to plants",
        product: "Agricultural limestone (CaCO3)",
        applicationRate: analysis.pH < 4.5 ? "4-5 tonnes/ha" : "2-3 tonnes/ha",
        timing: "Apply 3-6 months before planting",
        estimatedCost: 200,
        expectedImpact: "Raise pH to 6.0-6.5, improve nutrient availability",
        urgency: analysis.pH < 4.5 ? "immediate" : "next_season",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    } else if (analysis.pH > 8.0) {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "amendment",
        priority: "high",
        title: "Apply sulfur to reduce pH",
        description: `Soil pH is ${analysis.pH} (alkaline). Apply elemental sulfur.`,
        rationale: "Alkaline soil can cause micronutrient deficiencies",
        product: "Elemental sulfur",
        applicationRate: "0.5-1.5 tonnes/ha",
        timing: "Apply in fall for spring planting",
        estimatedCost: 150,
        expectedImpact: "Lower pH to 6.5-7.0",
        urgency: "next_season",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    }

    // Nutrient recommendations
    if (analysis.nitrogen.level === "deficient" || analysis.nitrogen.level === "low") {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "fertilization",
        priority: analysis.nitrogen.level === "deficient" ? "high" : "medium",
        title: "Increase nitrogen fertilization",
        description: `Nitrogen level is ${analysis.nitrogen.value} ${analysis.nitrogen.unit} (${analysis.nitrogen.level}).`,
        rationale: "Nitrogen is essential for vegetative growth",
        product: "Urea (46-0-0) or Ammonium sulfate",
        applicationRate: analysis.nitrogen.level === "deficient" ? "80-120 kg N/ha" : "40-60 kg N/ha",
        timing: "Split application: 60% at planting, 40% at vegetative stage",
        estimatedCost: 300,
        expectedImpact: "Improve vegetative growth and yield potential",
        urgency: "next_season",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    }

    if (analysis.phosphorus.level === "deficient" || analysis.phosphorus.level === "low") {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "fertilization",
        priority: "high",
        title: "Apply phosphorus fertilizer",
        description: `Phosphorus level is ${analysis.phosphorus.value} ${analysis.phosphorus.unit} (${analysis.phosphorus.level}).`,
        rationale: "Phosphorus is critical for root development and energy transfer",
        product: "Triple superphosphate (0-46-0)",
        applicationRate: "40-60 kg P2O5/ha",
        timing: "Apply at planting, incorporate into root zone",
        estimatedCost: 200,
        expectedImpact: "Improve root development and early growth",
        urgency: "next_season",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    }

    if (analysis.organicMatter < 2) {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "amendment",
        priority: "high",
        title: "Increase organic matter",
        description: `Organic matter is ${analysis.organicMatter}% (below 2% threshold).`,
        rationale: "Low organic matter reduces water retention and microbial activity",
        product: "Composted manure or green manure cover crops",
        applicationRate: "5-10 tonnes/ha",
        timing: "Apply in fall, incorporate before planting",
        estimatedCost: 250,
        expectedImpact: "Improve soil structure, water retention, and microbial activity",
        urgency: "next_season",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    }

    if (analysis.potassium.level === "deficient") {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "fertilization",
        priority: "high",
        title: "Apply potassium fertilizer",
        description: `Potassium level is ${analysis.potassium.value} ${analysis.potassium.unit} (${analysis.potassium.level}).`,
        rationale: "Potassium is vital for water regulation and disease resistance",
        product: "Muriate of potash (0-0-60)",
        applicationRate: "60-80 kg K2O/ha",
        timing: "Apply at planting or as split application",
        estimatedCost: 180,
        expectedImpact: "Improve water regulation and stress tolerance",
        urgency: "next_season",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    }

    // Drainage recommendation
    if (analysis.waterHoldingCapacity > 50) {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "drainage",
        priority: "medium",
        title: "Improve drainage",
        description: `Water holding capacity is ${analysis.waterHoldingCapacity}%, suggesting potential waterlogging.`,
        rationale: "Excess water holding can lead to root rot and anaerobic conditions",
        timing: "Install drainage before planting season",
        estimatedCost: 500,
        expectedImpact: "Reduce waterlogging risk and improve root health",
        urgency: "long_term",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    }

    // Cover crop recommendation
    if (analysis.aggregateStability < 50) {
      generated.push({
        id: randomUUID(),
        farmId: sample.farmId,
        fieldId: sample.fieldId,
        sampleId,
        category: "cover_crop",
        priority: "medium",
        title: "Plant cover crops",
        description: `Aggregate stability is ${analysis.aggregateStability}% (below 50%). Cover crops can improve soil structure.`,
        rationale: "Cover crops protect soil and improve aggregation through root action",
        product: "Mixed cover crop blend (legume + grass)",
        applicationRate: "20-30 kg/ha",
        timing: "Plant after main crop harvest",
        estimatedCost: 100,
        expectedImpact: "Improve aggregate stability and reduce erosion",
        urgency: "next_season",
        validUntil,
        metadata: {},
        createdAt: now,
      });
    }

    // Save all recommendations
    for (const rec of generated) {
      recommendations.set(rec.id, rec);
    }

    return generated;
  },

  /**
   * List recommendations.
   */
  async listRecommendations(filters?: {
    farmId?: string;
    fieldId?: string;
    category?: string;
    priority?: RecommendationPriority;
    implemented?: boolean;
  }): Promise<SoilRecommendation[]> {
    let results = Array.from(recommendations.values());

    if (filters?.farmId) results = results.filter((r) => r.farmId === filters.farmId);
    if (filters?.fieldId) results = results.filter((r) => r.fieldId === filters.fieldId);
    if (filters?.category) results = results.filter((r) => r.category === filters.category);
    if (filters?.priority) results = results.filter((r) => r.priority === filters.priority);
    if (filters?.implemented !== undefined) {
      results = results.filter((r) =>
        filters.implemented ? !!r.implementedAt : !r.implementedAt
      );
    }

    return results.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  /**
   * Mark a recommendation as implemented.
   */
  async implementRecommendation(
    recommendationId: string,
    implementedBy: string
  ): Promise<SoilRecommendation> {
    const rec = recommendations.get(recommendationId);
    if (!rec) throw new Error(`Recommendation not found: ${recommendationId}`);

    rec.implementedAt = new Date();
    rec.implementedBy = implementedBy;
    recommendations.set(recommendationId, rec);
    return rec;
  },

  // ─── Soil Health Report ────────────────────────────────────────────────

  /**
   * Generate a comprehensive soil health report.
   */
  async generateHealthReport(
    farmId: string,
    fieldId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<SoilHealthReport> {
    const fieldSamples = Array.from(samples.values())
      .filter(
        (s) =>
          s.farmId === farmId &&
          s.fieldId === fieldId &&
          s.analysis &&
          s.collectionDate >= periodStart &&
          s.collectionDate <= periodEnd
      )
      .sort((a, b) => a.collectionDate.getTime() - b.collectionDate.getTime());

    if (fieldSamples.length === 0) {
      throw new Error("No analyzed samples found for the specified period");
    }

    const latestAnalysis = fieldSamples[fieldSamples.length - 1].analysis!;
    const now = new Date();

    // Calculate scores
    const physicalScore = Math.min(100, Math.round(
      (latestAnalysis.bulkDensity >= 1.0 && latestAnalysis.bulkDensity <= 1.5 ? 25 : 15) +
      (latestAnalysis.waterHoldingCapacity >= 20 && latestAnalysis.waterHoldingCapacity <= 45 ? 25 : 15) +
      (latestAnalysis.infiltrationRate >= 15 ? 25 : 15) +
      (latestAnalysis.aggregateStability >= 50 ? 25 : 15)
    ));

    const chemicalScore = Math.min(100, Math.round(
      (latestAnalysis.pH >= 6.0 && latestAnalysis.pH <= 7.5 ? 20 : 10) +
      (latestAnalysis.organicMatter >= 2 ? 20 : 10) +
      (latestAnalysis.cec >= 10 ? 20 : 10) +
      (latestAnalysis.nitrogen.level === "adequate" ? 10 : 5) +
      (latestAnalysis.phosphorus.level === "adequate" ? 15 : 8) +
      (latestAnalysis.potassium.level === "adequate" ? 15 : 8)
    ));

    const biologicalScore = Math.min(100, Math.round(
      (latestAnalysis.microbialBiomass >= 200 ? 25 : 15) +
      (latestAnalysis.respirationRate >= 2 ? 25 : 15) +
      (latestAnalysis.earthwormCount >= 10 ? 25 : 15) +
      (latestAnalysis.enzymeActivity >= 0.5 ? 25 : 15)
    ));

    const overallScore = Math.round(physicalScore * 0.3 + chemicalScore * 0.4 + biologicalScore * 0.3);

    let overallGrade: SoilHealthGrade;
    if (overallScore >= 90) overallGrade = "A";
    else if (overallScore >= 75) overallGrade = "B";
    else if (overallScore >= 60) overallGrade = "C";
    else if (overallScore >= 40) overallGrade = "D";
    else overallGrade = "F";

    // Build nutrient status
    const nutrients = [
      { name: "Nitrogen", status: latestAnalysis.nitrogen.level, value: latestAnalysis.nitrogen.value, optimal: latestAnalysis.nitrogen.optimalRange },
      { name: "Phosphorus", status: latestAnalysis.phosphorus.level, value: latestAnalysis.phosphorus.value, optimal: latestAnalysis.phosphorus.optimalRange },
      { name: "Potassium", status: latestAnalysis.potassium.level, value: latestAnalysis.potassium.value, optimal: latestAnalysis.potassium.optimalRange },
      { name: "Calcium", status: latestAnalysis.calcium.level, value: latestAnalysis.calcium.value, optimal: latestAnalysis.calcium.optimalRange },
      { name: "Magnesium", status: latestAnalysis.magnesium.level, value: latestAnalysis.magnesium.value, optimal: latestAnalysis.magnesium.optimalRange },
      { name: "Iron", status: latestAnalysis.iron.level, value: latestAnalysis.iron.value, optimal: latestAnalysis.iron.optimalRange },
      { name: "Zinc", status: latestAnalysis.zinc.level, value: latestAnalysis.zinc.value, optimal: latestAnalysis.zinc.optimalRange },
    ].map((n) => ({
      ...n,
      trend: "stable" as const,
    }));

    // Detect trends from multiple samples
    if (fieldSamples.length >= 2) {
      for (const nutrient of nutrients) {
        const first = fieldSamples[0].analysis!;
        const last = fieldSamples[fieldSamples.length - 1].analysis!;
        let firstVal = 0;
        let lastVal = 0;

        switch (nutrient.name) {
          case "Nitrogen": firstVal = first.nitrogen.value; lastVal = last.nitrogen.value; break;
          case "Phosphorus": firstVal = first.phosphorus.value; lastVal = last.phosphorus.value; break;
          case "Potassium": firstVal = first.potassium.value; lastVal = last.potassium.value; break;
          case "Calcium": firstVal = first.calcium.value; lastVal = last.calcium.value; break;
          case "Magnesium": firstVal = first.magnesium.value; lastVal = last.magnesium.value; break;
          case "Iron": firstVal = first.iron.value; lastVal = last.iron.value; break;
          case "Zinc": firstVal = first.zinc.value; lastVal = last.zinc.value; break;
        }

        const change = lastVal - firstVal;
        if (change > 5) nutrient.trend = "improving";
        else if (change < -5) nutrient.trend = "declining";
      }
    }

    // Get field recommendations
    const fieldRecs = Array.from(recommendations.values())
      .filter((r) => r.farmId === farmId && r.fieldId === fieldId && !r.implementedAt)
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    const reportId = randomUUID();
    return {
      id: reportId,
      farmId,
      fieldId,
      generatedAt: now,
      period: { start: periodStart, end: periodEnd },
      overallGrade,
      overallScore,
      physicalScore,
      chemicalScore,
      biologicalScore,
      scores: [
        { category: "Physical", metric: "Bulk Density", value: latestAnalysis.bulkDensity, weight: 25, score: physicalScore, grade: overallGrade },
        { category: "Chemical", metric: "pH", value: latestAnalysis.pH, weight: 20, score: chemicalScore, grade: overallGrade },
        { category: "Biological", metric: "Microbial Biomass", value: latestAnalysis.microbialBiomass, weight: 25, score: biologicalScore, grade: overallGrade },
      ],
      nutrients,
      recommendations: fieldRecs.slice(0, 5),
      metadata: { sampleCount: fieldSamples.length },
    };
  },

  /**
   * Get soil statistics.
   */
  async getSoilStats(farmId?: string): Promise<{
    totalSamples: number;
    analyzedSamples: number;
    totalRecommendations: number;
    implementedRecommendations: number;
    avgPH: number;
    avgOrganicMatter: number;
    byLayer: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    let allSamples = Array.from(samples.values());
    if (farmId) allSamples = allSamples.filter((s) => s.farmId === farmId);

    let allRecs = Array.from(recommendations.values());
    if (farmId) allRecs = allRecs.filter((r) => r.farmId === farmId);

    const analyzed = allSamples.filter((s) => s.analysis);
    const avgPH =
      analyzed.length > 0
        ? analyzed.reduce((sum, s) => sum + (s.analysis?.pH || 0), 0) / analyzed.length
        : 0;
    const avgOM =
      analyzed.length > 0
        ? analyzed.reduce((sum, s) => sum + (s.analysis?.organicMatter || 0), 0) /
          analyzed.length
        : 0;

    const byLayer: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const s of allSamples) {
      byLayer[s.layer] = (byLayer[s.layer] || 0) + 1;
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    }

    return {
      totalSamples: allSamples.length,
      analyzedSamples: analyzed.length,
      totalRecommendations: allRecs.length,
      implementedRecommendations: allRecs.filter((r) => !!r.implementedAt).length,
      avgPH: Math.round(avgPH * 100) / 100,
      avgOrganicMatter: Math.round(avgOM * 100) / 100,
      byLayer,
      byStatus,
    };
  },

  /**
   * Clear all data.
   */
  async clearAll(): Promise<void> {
    samples.clear();
    recommendations.clear();
  },

  /**
   * Get counts.
   */
  async count(): Promise<{ samples: number; recommendations: number }> {
    return { samples: samples.size, recommendations: recommendations.size };
  },
};
