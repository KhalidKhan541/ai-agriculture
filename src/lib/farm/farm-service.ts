import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type FarmStatus = "active" | "inactive" | "archived";
export type FieldType = "cropland" | "pasture" | "orchard" | "vineyard" | "greenhouse" | "nursery" | "fallow";
export type SoilType = "clay" | "sandy" | "loamy" | "silty" | "peaty" | "chalky" | "saline";
export type TerrainType = "flat" | "rolling" | "hilly" | "mountainous" | "terraced";
export type CropSeason = "spring" | "summer" | "fall" | "winter" | "year-round";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoBoundary {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][];
}

export interface FarmCreateInput {
  name: string;
  description?: string;
  owner: string;
  organizationId?: string;
  location: Coordinates;
  address?: FarmAddress;
  totalArea: number;
  areaUnit: "hectares" | "acres" | "sqm";
  timezone?: string;
  metadata?: Record<string, unknown>;
}

export interface FarmUpdateInput {
  name?: string;
  description?: string;
  location?: Coordinates;
  address?: FarmAddress;
  totalArea?: number;
  status?: FarmStatus;
  metadata?: Record<string, unknown>;
}

export interface FarmAddress {
  street?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Farm {
  id: string;
  name: string;
  description: string;
  owner: string;
  organizationId: string;
  location: Coordinates;
  address: FarmAddress;
  totalArea: number;
  areaUnit: "hectares" | "acres" | "sqm";
  timezone: string;
  status: FarmStatus;
  fields: FarmField[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmField {
  id: string;
  farmId: string;
  name: string;
  fieldType: FieldType;
  area: number;
  areaUnit: "hectares" | "acres" | "sqm";
  soilType: SoilType;
  terrainType: TerrainType;
  elevation: number;
  slope: number;
  drainage: "poor" | "moderate" | "good" | "excellent";
  irrigationSource: "rainfed" | "well" | "river" | "canal" | "drip" | "sprinkler";
  boundary?: GeoBoundary;
  isActive: boolean;
  currentCropId?: string;
  plantingSeason: CropSeason;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldCreateInput {
  name: string;
  fieldType: FieldType;
  area: number;
  areaUnit?: "hectares" | "acres" | "sqm";
  soilType: SoilType;
  terrainType?: TerrainType;
  elevation?: number;
  slope?: number;
  drainage?: "poor" | "moderate" | "good" | "excellent";
  irrigationSource?: FarmField["irrigationSource"];
  boundary?: GeoBoundary;
  plantingSeason?: CropSeason;
  metadata?: Record<string, unknown>;
}

export interface FieldUpdateInput {
  name?: string;
  fieldType?: FieldType;
  area?: number;
  soilType?: SoilType;
  terrainType?: TerrainType;
  elevation?: number;
  slope?: number;
  drainage?: FarmField["drainage"];
  irrigationSource?: FarmField["irrigationSource"];
  boundary?: GeoBoundary;
  isActive?: boolean;
  currentCropId?: string | null;
  plantingSeason?: CropSeason;
  metadata?: Record<string, unknown>;
}

export interface FarmAnalytics {
  farmId: string;
  totalFields: number;
  activeFields: number;
  totalArea: number;
  areaByFieldType: Record<FieldType, number>;
  areaBySoilType: Record<SoilType, number>;
  areaByIrrigationSource: Record<string, number>;
  averageFieldSize: number;
  largestField: { id: string; name: string; area: number } | null;
  smallestField: { id: string; name: string; area: number } | null;
  utilizationRate: number;
  capacityMetrics: FarmCapacity;
  cropDistribution: CropDistribution[];
  seasonalOverview: SeasonalOverview;
  generatedAt: Date;
}

export interface FarmCapacity {
  totalCapacityHectares: number;
  usedCapacityHectares: number;
  availableCapacityHectares: number;
  utilizationPercent: number;
  byFieldType: { fieldType: FieldType; capacity: number; used: number }[];
  bySeason: { season: CropSeason; capacity: number; planted: number }[];
}

export interface CropDistribution {
  cropId: string;
  cropName: string;
  fieldCount: number;
  totalArea: number;
  percentageOfTotal: number;
}

export interface SeasonalOverview {
  currentSeason: CropSeason;
  fieldsInSeason: number;
  fieldsPreparing: number;
  fieldsFallow: number;
  upcomingPlantings: number;
  expectedHarvests: number;
}

export interface FarmFilter {
  status?: FarmStatus;
  owner?: string;
  organizationId?: string;
  minArea?: number;
  maxArea?: number;
  areaUnit?: string;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface FieldFilter {
  farmId?: string;
  fieldType?: FieldType | FieldType[];
  soilType?: SoilType | SoilType[];
  isActive?: boolean;
  hasCrop?: boolean;
  irrigationSource?: string;
  minArea?: number;
  maxArea?: number;
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

export interface FarmSummary {
  id: string;
  name: string;
  totalArea: number;
  areaUnit: string;
  fieldCount: number;
  status: FarmStatus;
  owner: string;
  location: Coordinates;
  createdAt: Date;
}

export interface BulkFieldOperation {
  fieldIds: string[];
  operation: "activate" | "deactivate" | "setCrop" | "updateSeason" | "delete";
  params?: Record<string, unknown>;
}

export interface BulkFieldResult {
  succeeded: string[];
  failed: { id: string; error: string }[];
  totalProcessed: number;
}

export interface FarmBoundaryValidation {
  isValid: boolean;
  area: number;
  centroid: Coordinates;
  boundingBox: { min: Coordinates; max: Coordinates };
  issues: string[];
}

export interface FieldCapacityAnalysis {
  fieldId: string;
  currentCapacity: number;
  maxCapacity: number;
  recommendedCapacity: number;
  limitingFactors: string[];
  recommendations: string[];
}

export interface CropSeasonCalendar {
  season: CropSeason;
  fields: {
    fieldId: string;
    fieldName: string;
    currentCrop: string | null;
    plannedCrop: string | null;
    plantingWindow: { start: Date; end: Date } | null;
    harvestWindow: { start: Date; end: Date } | null;
  }[];
  totalArea: number;
  utilizationPercent: number;
}

// ─── In-Memory Store (simulates database) ───────────────────────────────────

const farms = new Map<string, Farm>();
const fields = new Map<string, FarmField>();

// ─── Validation Helpers ─────────────────────────────────────────────────────

function validateCoordinates(coords: Coordinates): string[] {
  const errors: string[] = [];
  if (coords.latitude < -90 || coords.latitude > 90) {
    errors.push("Latitude must be between -90 and 90");
  }
  if (coords.longitude < -180 || coords.longitude > 180) {
    errors.push("Longitude must be between -180 and 180");
  }
  return errors;
}

function validateAddress(address: FarmAddress): string[] {
  const errors: string[] = [];
  if (!address.city?.trim()) errors.push("City is required");
  if (!address.state?.trim()) errors.push("State is required");
  if (!address.postalCode?.trim()) errors.push("Postal code is required");
  if (!address.country?.trim()) errors.push("Country is required");
  return errors;
}

function validateFieldInput(input: FieldCreateInput): string[] {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("Field name is required");
  if (input.area <= 0) errors.push("Field area must be greater than 0");
  if (!input.fieldType) errors.push("Field type is required");
  if (!input.soilType) errors.push("Soil type is required");
  if (input.elevation !== undefined && input.elevation < -430) {
    errors.push("Elevation cannot be below -430m (Dead Sea level)");
  }
  if (input.slope !== undefined && (input.slope < 0 || input.slope > 90)) {
    errors.push("Slope must be between 0 and 90 degrees");
  }
  return errors;
}

function calculatePolygonArea(coords: number[][]): number {
  if (coords.length < 3) return 0;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  return Math.abs(area / 2);
}

function getCurrentSeason(): CropSeason {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function calculateCentroid(coords: number[][]): Coordinates {
  if (coords.length === 0) return { latitude: 0, longitude: 0 };
  const sum = coords.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord[0],
      longitude: acc.longitude + coord[1],
    }),
    { latitude: 0, longitude: 0 }
  );
  return {
    latitude: sum.latitude / coords.length,
    longitude: sum.longitude / coords.length,
  };
}

function convertToHectares(area: number, unit: string): number {
  switch (unit) {
    case "hectares":
      return area;
    case "acres":
      return area * 0.404686;
    case "sqm":
      return area / 10000;
    default:
      return area;
  }
}

function generateAreaByType<T extends string>(
  fieldList: FarmField[],
  extractor: (f: FarmField) => T
): Record<T, number> {
  const result = {} as Record<T, number>;
  for (const field of fieldList) {
    const key = extractor(field);
    result[key] = (result[key] || 0) + convertToHectares(field.area, field.areaUnit);
  }
  return result;
}

// ─── Farm Service ───────────────────────────────────────────────────────────

export const FarmService = {
  /**
   * Create a new farm with validation and initial capacity analysis.
   */
  async createFarm(input: FarmCreateInput): Promise<Farm> {
    const errors: string[] = [];

    if (!input.name?.trim()) errors.push("Farm name is required");
    if (!input.owner?.trim()) errors.push("Owner is required");
    if (input.totalArea <= 0) errors.push("Total area must be greater than 0");
    errors.push(...validateCoordinates(input.location));
    if (input.address) errors.push(...validateAddress(input.address));

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join("; ")}`);
    }

    const now = new Date();
    const farm: Farm = {
      id: randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || "",
      owner: input.owner.trim(),
      organizationId: input.organizationId || "",
      location: input.location,
      address: input.address || {
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      totalArea: input.totalArea,
      areaUnit: input.areaUnit,
      timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: "active",
      fields: [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    farms.set(farm.id, farm);
    return farm;
  },

  /**
   * Get a single farm by ID with all fields loaded.
   */
  async getFarmById(farmId: string): Promise<Farm | null> {
    const farm = farms.get(farmId);
    if (!farm) return null;

    const farmFields = Array.from(fields.values()).filter((f) => f.farmId === farmId);
    return { ...farm, fields: farmFields };
  },

  /**
   * List farms with filtering, sorting, and pagination.
   */
  async listFarms(
    filter: FarmFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<FarmSummary>> {
    let results = Array.from(farms.values());

    // Apply filters
    if (filter.status) {
      results = results.filter((f) => f.status === filter.status);
    }
    if (filter.owner) {
      results = results.filter((f) => f.owner === filter.owner);
    }
    if (filter.organizationId) {
      results = results.filter((f) => f.organizationId === filter.organizationId);
    }
    if (filter.minArea !== undefined) {
      results = results.filter((f) => f.totalArea >= filter.minArea!);
    }
    if (filter.maxArea !== undefined) {
      results = results.filter((f) => f.totalArea <= filter.maxArea!);
    }
    if (filter.search) {
      const query = filter.search.toLowerCase();
      results = results.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.owner.toLowerCase().includes(query)
      );
    }
    if (filter.createdAfter) {
      results = results.filter((f) => f.createdAt >= filter.createdAfter!);
    }
    if (filter.createdBefore) {
      results = results.filter((f) => f.createdAt <= filter.createdBefore!);
    }

    // Sorting
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";
    results.sort((a: any, b: any) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = results.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    const paginated = results.slice(start, start + pagination.limit);

    const summaries: FarmSummary[] = paginated.map((f) => ({
      id: f.id,
      name: f.name,
      totalArea: f.totalArea,
      areaUnit: f.areaUnit,
      fieldCount: Array.from(fields.values()).filter((field) => field.farmId === f.id).length,
      status: f.status,
      owner: f.owner,
      location: f.location,
      createdAt: f.createdAt,
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
   * Update farm details.
   */
  async updateFarm(farmId: string, input: FarmUpdateInput): Promise<Farm> {
    const farm = farms.get(farmId);
    if (!farm) throw new Error(`Farm not found: ${farmId}`);

    if (input.location) {
      const errors = validateCoordinates(input.location);
      if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);
    }
    if (input.address) {
      const errors = validateAddress(input.address);
      if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);
    }

    const updated: Farm = {
      ...farm,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.totalArea !== undefined && { totalArea: input.totalArea }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.metadata !== undefined && { metadata: { ...farm.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    farms.set(farmId, updated);
    return updated;
  },

  /**
   * Soft-delete / archive a farm. Prevents deletion if active fields exist.
   */
  async deleteFarm(farmId: string, hard = false): Promise<boolean> {
    const farm = farms.get(farmId);
    if (!farm) throw new Error(`Farm not found: ${farmId}`);

    const activeFields = Array.from(fields.values()).filter(
      (f) => f.farmId === farmId && f.isActive
    );

    if (hard && activeFields.length > 0) {
      throw new Error(
        `Cannot delete farm with ${activeFields.length} active field(s). Deactivate all fields first.`
      );
    }

    if (hard) {
      // Remove all fields for this farm
      for (const [fieldId, field] of fields.entries()) {
        if (field.farmId === farmId) {
          fields.delete(fieldId);
        }
      }
      farms.delete(farmId);
    } else {
      farm.status = "archived";
      farm.updatedAt = new Date();
      farms.set(farmId, farm);
    }

    return true;
  },

  // ─── Field Management ────────────────────────────────────────────────────

  /**
   * Add a new field to a farm.
   */
  async createField(farmId: string, input: FieldCreateInput): Promise<FarmField> {
    const farm = farms.get(farmId);
    if (!farm) throw new Error(`Farm not found: ${farmId}`);

    const errors = validateFieldInput(input);
    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join("; ")}`);

    // Validate total farm area isn't exceeded
    const existingFields = Array.from(fields.values()).filter((f) => f.farmId === farmId);
    const totalFieldArea = existingFields.reduce(
      (sum, f) => sum + convertToHectares(f.area, f.areaUnit),
      0
    );
    const newFieldArea = convertToHectares(input.area, input.areaUnit || farm.areaUnit);
    const farmAreaInHectares = convertToHectares(farm.totalArea, farm.areaUnit);

    if (totalFieldArea + newFieldArea > farmAreaInHectares * 1.05) {
      throw new Error(
        `Adding this field would exceed farm capacity. Available: ${(farmAreaInHectares - totalFieldArea).toFixed(2)} ha, Requested: ${newFieldArea.toFixed(2)} ha`
      );
    }

    const now = new Date();
    const field: FarmField = {
      id: randomUUID(),
      farmId,
      name: input.name.trim(),
      fieldType: input.fieldType,
      area: input.area,
      areaUnit: input.areaUnit || farm.areaUnit,
      soilType: input.soilType,
      terrainType: input.terrainType || "flat",
      elevation: input.elevation || 0,
      slope: input.slope || 0,
      drainage: input.drainage || "moderate",
      irrigationSource: input.irrigationSource || "rainfed",
      boundary: input.boundary,
      isActive: true,
      currentCropId: undefined,
      plantingSeason: input.plantingSeason || getCurrentSeason(),
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    fields.set(field.id, field);
    return field;
  },

  /**
   * Get a single field by ID.
   */
  async getFieldById(fieldId: string): Promise<FarmField | null> {
    return fields.get(fieldId) || null;
  },

  /**
   * List fields with filtering and pagination.
   */
  async listFields(
    filter: FieldFilter = {},
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<FarmField>> {
    let results = Array.from(fields.values());

    if (filter.farmId) {
      results = results.filter((f) => f.farmId === filter.farmId);
    }
    if (filter.fieldType) {
      const types = Array.isArray(filter.fieldType) ? filter.fieldType : [filter.fieldType];
      results = results.filter((f) => types.includes(f.fieldType));
    }
    if (filter.soilType) {
      const types = Array.isArray(filter.soilType) ? filter.soilType : [filter.soilType];
      results = results.filter((f) => types.includes(f.soilType));
    }
    if (filter.isActive !== undefined) {
      results = results.filter((f) => f.isActive === filter.isActive);
    }
    if (filter.hasCrop !== undefined) {
      results = results.filter((f) =>
        filter.hasCrop ? !!f.currentCropId : !f.currentCropId
      );
    }
    if (filter.irrigationSource) {
      results = results.filter((f) => f.irrigationSource === filter.irrigationSource);
    }
    if (filter.minArea !== undefined) {
      results = results.filter(
        (f) => convertToHectares(f.area, f.areaUnit) >= filter.minArea!
      );
    }
    if (filter.maxArea !== undefined) {
      results = results.filter(
        (f) => convertToHectares(f.area, f.areaUnit) <= filter.maxArea!
      );
    }
    if (filter.search) {
      const query = filter.search.toLowerCase();
      results = results.filter((f) => f.name.toLowerCase().includes(query));
    }

    const total = results.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const start = (pagination.page - 1) * pagination.limit;
    const paginated = results.slice(start, start + pagination.limit);

    return {
      data: paginated,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };
  },

  /**
   * Update field properties.
   */
  async updateField(fieldId: string, input: FieldUpdateInput): Promise<FarmField> {
    const field = fields.get(fieldId);
    if (!field) throw new Error(`Field not found: ${fieldId}`);

    const updated: FarmField = {
      ...field,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.fieldType !== undefined && { fieldType: input.fieldType }),
      ...(input.area !== undefined && { area: input.area }),
      ...(input.soilType !== undefined && { soilType: input.soilType }),
      ...(input.terrainType !== undefined && { terrainType: input.terrainType }),
      ...(input.elevation !== undefined && { elevation: input.elevation }),
      ...(input.slope !== undefined && { slope: input.slope }),
      ...(input.drainage !== undefined && { drainage: input.drainage }),
      ...(input.irrigationSource !== undefined && { irrigationSource: input.irrigationSource }),
      ...(input.boundary !== undefined && { boundary: input.boundary }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.currentCropId !== undefined && {
        currentCropId: input.currentCropId === null ? undefined : input.currentCropId,
      }),
      ...(input.plantingSeason !== undefined && { plantingSeason: input.plantingSeason }),
      ...(input.metadata !== undefined && { metadata: { ...field.metadata, ...input.metadata } }),
      updatedAt: new Date(),
    };

    fields.set(fieldId, updated);
    return updated;
  },

  /**
   * Delete a field. Cannot delete active fields with a crop assigned.
   */
  async deleteField(fieldId: string): Promise<boolean> {
    const field = fields.get(fieldId);
    if (!field) throw new Error(`Field not found: ${fieldId}`);

    if (field.isActive && field.currentCropId) {
      throw new Error(
        "Cannot delete field with active crop. Harvest or unassign the crop first."
      );
    }

    fields.delete(fieldId);
    return true;
  },

  /**
   * Bulk operations on fields (activate, deactivate, set crop, etc.)
   */
  async bulkFieldOperation(operation: BulkFieldOperation): Promise<BulkFieldResult> {
    const succeeded: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const fieldId of operation.fieldIds) {
      try {
        const field = fields.get(fieldId);
        if (!field) {
          failed.push({ id: fieldId, error: "Field not found" });
          continue;
        }

        switch (operation.operation) {
          case "activate":
            field.isActive = true;
            break;
          case "deactivate":
            field.isActive = false;
            break;
          case "setCrop":
            field.currentCropId = (operation.params?.cropId as string) || undefined;
            break;
          case "updateSeason":
            field.plantingSeason = (operation.params?.season as CropSeason) || field.plantingSeason;
            break;
          case "delete":
            if (field.isActive && field.currentCropId) {
              failed.push({ id: fieldId, error: "Active field with crop" });
              continue;
            }
            fields.delete(fieldId);
            succeeded.push(fieldId);
            continue;
        }

        field.updatedAt = new Date();
        fields.set(fieldId, field);
        succeeded.push(fieldId);
      } catch (err) {
        failed.push({
          id: fieldId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return {
      succeeded,
      failed,
      totalProcessed: operation.fieldIds.length,
    };
  },

  // ─── Analytics & Capacity ────────────────────────────────────────────────

  /**
   * Comprehensive farm analytics with field breakdown and distribution.
   */
  async getFarmAnalytics(farmId: string): Promise<FarmAnalytics> {
    const farm = farms.get(farmId);
    if (!farm) throw new Error(`Farm not found: ${farmId}`);

    const farmFields = Array.from(fields.values()).filter((f) => f.farmId === farmId);
    const activeFields = farmFields.filter((f) => f.isActive);

    const areaByFieldType = generateAreaByType(farmFields, (f) => f.fieldType);
    const areaBySoilType = generateAreaByType(farmFields, (f) => f.soilType);
    const areaByIrrigationSource = generateAreaByType(farmFields, (f) => f.irrigationSource);

    const totalAreaUsed = farmFields.reduce(
      (sum, f) => sum + convertToHectares(f.area, f.areaUnit),
      0
    );
    const farmAreaInHectares = convertToHectares(farm.totalArea, farm.areaUnit);

    const fieldSizes = farmFields.map((f) => ({
      id: f.id,
      name: f.name,
      area: convertToHectares(f.area, f.areaUnit),
    }));
    fieldSizes.sort((a, b) => a.area - b.area);

    // Build crop distribution
    const cropMap = new Map<string, { name: string; fieldCount: number; area: number }>();
    for (const field of farmFields) {
      if (field.currentCropId) {
        const existing = cropMap.get(field.currentCropId) || {
          name: field.currentCropId,
          fieldCount: 0,
          area: 0,
        };
        existing.fieldCount += 1;
        existing.area += convertToHectares(field.area, field.areaUnit);
        cropMap.set(field.currentCropId, existing);
      }
    }

    const cropDistribution: CropDistribution[] = Array.from(cropMap.entries()).map(
      ([cropId, data]) => ({
        cropId,
        cropName: data.name,
        fieldCount: data.fieldCount,
        totalArea: data.area,
        percentageOfTotal: farmAreaInHectares > 0 ? (data.area / farmAreaInHectares) * 100 : 0,
      })
    );

    const currentSeason = getCurrentSeason();
    const fieldsInSeason = farmFields.filter(
      (f) => f.plantingSeason === currentSeason && f.isActive
    ).length;
    const fieldsPreparing = farmFields.filter(
      (f) => f.plantingSeason !== currentSeason && f.isActive && !f.currentCropId
    ).length;
    const fieldsFallow = farmFields.filter((f) => !f.isActive).length;

    return {
      farmId,
      totalFields: farmFields.length,
      activeFields: activeFields.length,
      totalArea: farmAreaInHectares,
      areaByFieldType,
      areaBySoilType,
      areaByIrrigationSource,
      averageFieldSize:
        farmFields.length > 0 ? totalAreaUsed / farmFields.length : 0,
      largestField: fieldSizes.length > 0 ? fieldSizes[fieldSizes.length - 1] : null,
      smallestField: fieldSizes.length > 0 ? fieldSizes[0] : null,
      utilizationRate: farmAreaInHectares > 0 ? (totalAreaUsed / farmAreaInHectares) * 100 : 0,
      capacityMetrics: this.calculateCapacity(farm, farmFields),
      cropDistribution,
      seasonalOverview: {
        currentSeason,
        fieldsInSeason,
        fieldsPreparing,
        fieldsFallow,
        upcomingPlantings: fieldsPreparing,
        expectedHarvests: activeFields.filter((f) => f.currentCropId).length,
      },
      generatedAt: new Date(),
    };
  },

  /**
   * Calculate detailed farm capacity metrics.
   */
  calculateCapacity(farm: Farm, farmFields: FarmField[]): FarmCapacity {
    const farmAreaInHectares = convertToHectares(farm.totalArea, farm.areaUnit);
    const usedArea = farmFields.reduce(
      (sum, f) => sum + convertToHectares(f.area, f.areaUnit),
      0
    );

    const byFieldTypeMap = new Map<FieldType, { capacity: number; used: number }>();
    const bySeasonMap = new Map<CropSeason, { capacity: number; planted: number }>();

    for (const field of farmFields) {
      const areaInHa = convertToHectares(field.area, field.areaUnit);

      // By field type
      const ftEntry = byFieldTypeMap.get(field.fieldType) || { capacity: 0, used: 0 };
      ftEntry.capacity += areaInHa;
      if (field.isActive && field.currentCropId) ftEntry.used += areaInHa;
      byFieldTypeMap.set(field.fieldType, ftEntry);

      // By season
      const sEntry = bySeasonMap.get(field.plantingSeason) || { capacity: 0, planted: 0 };
      sEntry.capacity += areaInHa;
      if (field.isActive && field.currentCropId) sEntry.planted += areaInHa;
      bySeasonMap.set(field.plantingSeason, sEntry);
    }

    return {
      totalCapacityHectares: farmAreaInHectares,
      usedCapacityHectares: usedArea,
      availableCapacityHectares: Math.max(0, farmAreaInHectares - usedArea),
      utilizationPercent: farmAreaInHectares > 0 ? (usedArea / farmAreaInHectares) * 100 : 0,
      byFieldType: Array.from(byFieldTypeMap.entries()).map(([fieldType, data]) => ({
        fieldType,
        ...data,
      })),
      bySeason: Array.from(bySeasonMap.entries()).map(([season, data]) => ({
        season,
        ...data,
      })),
    };
  },

  /**
   * Analyze field capacity and provide recommendations.
   */
  async analyzeFieldCapacity(fieldId: string): Promise<FieldCapacityAnalysis> {
    const field = fields.get(fieldId);
    if (!field) throw new Error(`Field not found: ${fieldId}`);

    const areaInHa = convertToHectares(field.area, field.areaUnit);
    const limitingFactors: string[] = [];
    const recommendations: string[] = [];

    // Evaluate drainage
    if (field.drainage === "poor") {
      limitingFactors.push("Poor drainage limits root growth and water absorption");
      recommendations.push("Consider installing subsurface drainage tiles");
      recommendations.push("Add organic matter to improve soil structure");
    } else if (field.drainage === "moderate") {
      recommendations.push("Monitor drainage during heavy rainfall events");
    }

    // Evaluate slope
    if (field.slope > 15) {
      limitingFactors.push("Steep slope increases erosion risk");
      recommendations.push("Implement terracing or contour farming");
      recommendations.push("Consider cover crops to reduce soil erosion");
    } else if (field.slope > 8) {
      recommendations.push("Use contour plowing to manage water runoff");
    }

    // Evaluate irrigation
    if (field.irrigationSource === "rainfed") {
      limitingFactors.push("Rainfed agriculture depends on unpredictable rainfall");
      recommendations.push("Consider installing drip irrigation for water efficiency");
      recommendations.push("Implement rainwater harvesting systems");
    }

    // Evaluate soil type
    if (field.soilType === "clay") {
      recommendations.push("Add gypsum to improve clay soil drainage");
      recommendations.push("Avoid working clay soil when wet");
    } else if (field.soilType === "sandy") {
      limitingFactors.push("Sandy soil has low nutrient and water retention");
      recommendations.push("Add compost and organic matter regularly");
      recommendations.push("Use mulch to reduce water evaporation");
    } else if (field.soilType === "salty" || field.soilType === "saline") {
      limitingFactors.push("High salinity affects crop growth");
      recommendations.push("Implement leaching irrigation to flush salts");
      recommendations.push("Select salt-tolerant crop varieties");
    }

    // General recommendations
    if (field.elevation > 1500) {
      limitingFactors.push("High elevation may have shorter growing season");
      recommendations.push("Select cold-hardy and short-season crop varieties");
    }

    const recommendedCapacity = limitingFactors.length === 0
      ? areaInHa
      : areaInHa * (1 - limitingFactors.length * 0.08);

    return {
      fieldId,
      currentCapacity: areaInHa,
      maxCapacity: areaInHa,
      recommendedCapacity: Math.max(0, recommendedCapacity),
      limitingFactors,
      recommendations,
    };
  },

  /**
   * Validate a geographic boundary polygon.
   */
  async validateBoundary(boundary: GeoBoundary): Promise<FarmBoundaryValidation> {
    const issues: string[] = [];

    if (!boundary.coordinates || boundary.coordinates.length === 0) {
      issues.push("Boundary coordinates are empty");
      return {
        isValid: false,
        area: 0,
        centroid: { latitude: 0, longitude: 0 },
        boundingBox: {
          min: { latitude: 0, longitude: 0 },
          max: { latitude: 0, longitude: 0 },
        },
        issues,
      };
    }

    const ring = boundary.coordinates[0];
    if (ring.length < 4) {
      issues.push("Polygon must have at least 3 vertices plus closing point");
    }

    // Check if polygon is closed
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      issues.push("Polygon boundary is not closed (first and last points differ)");
    }

    // Check for self-intersection (simplified check)
    for (let i = 0; i < ring.length - 1; i++) {
      const [lat, lon] = ring[i];
      if (lat < -90 || lat > 90) issues.push(`Invalid latitude at vertex ${i}: ${lat}`);
      if (lon < -180 || lon > 180) issues.push(`Invalid longitude at vertex ${i}: ${lon}`);
    }

    // Calculate bounding box
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const [lat, lon] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }

    const centroid = calculateCentroid(ring);
    const area = calculatePolygonArea(ring);

    return {
      isValid: issues.length === 0,
      area,
      centroid,
      boundingBox: {
        min: { latitude: minLat, longitude: minLon },
        max: { latitude: maxLat, longitude: maxLon },
      },
      issues,
    };
  },

  /**
   * Generate crop season calendar for a farm.
   */
  async getSeasonCalendar(farmId: string): Promise<CropSeasonCalendar> {
    const farm = farms.get(farmId);
    if (!farm) throw new Error(`Farm not found: ${farmId}`);

    const farmFields = Array.from(fields.values()).filter((f) => f.farmId === farmId);
    const currentSeason = getCurrentSeason();
    const now = new Date();

    const seasonFields = farmFields
      .filter((f) => f.plantingSeason === currentSeason)
      .map((f) => {
        const hasCrop = !!f.currentCropId;
        const plantingStart = new Date(now);
        plantingStart.setMonth(plantingStart.getMonth() - 1);
        const plantingEnd = new Date(now);
        plantingEnd.setMonth(plantingEnd.getMonth() + 2);
        const harvestStart = new Date(now);
        harvestStart.setMonth(harvestStart.getMonth() + 3);
        const harvestEnd = new Date(now);
        harvestEnd.setMonth(harvestEnd.getMonth() + 5);

        return {
          fieldId: f.id,
          fieldName: f.name,
          currentCrop: f.currentCropId || null,
          plannedCrop: null,
          plantingWindow: hasCrop
            ? null
            : { start: plantingStart, end: plantingEnd },
          harvestWindow: hasCrop
            ? { start: harvestStart, end: harvestEnd }
            : null,
        };
      });

    const totalAreaInSeason = seasonFields.reduce((sum, sf) => {
      const field = farmFields.find((f) => f.id === sf.fieldId);
      return sum + (field ? convertToHectares(field.area, field.areaUnit) : 0);
    }, 0);

    const farmAreaInHectares = convertToHectares(farm.totalArea, farm.areaUnit);

    return {
      season: currentSeason,
      fields: seasonFields,
      totalArea: totalAreaInSeason,
      utilizationPercent:
        farmAreaInHectares > 0
          ? (totalAreaInSeason / farmAreaInHectares) * 100
          : 0,
    };
  },

  /**
   * Get summary statistics across all farms for an organization.
   */
  async getOrganizationStats(organizationId: string): Promise<{
    totalFarms: number;
    activeFarms: number;
    totalAreaHectares: number;
    totalFields: number;
    activeFields: number;
    averageFarmSize: number;
    topOwners: { owner: string; farmCount: number; totalArea: number }[];
  }> {
    const orgFarms = Array.from(farms.values()).filter(
      (f) => f.organizationId === organizationId
    );
    const orgFarmIds = new Set(orgFarms.map((f) => f.id));
    const orgFields = Array.from(fields.values()).filter((f) => orgFarmIds.has(f.farmId));

    const ownerMap = new Map<string, { farmCount: number; totalArea: number }>();
    for (const farm of orgFarms) {
      const existing = ownerMap.get(farm.owner) || { farmCount: 0, totalArea: 0 };
      existing.farmCount += 1;
      existing.totalArea += convertToHectares(farm.totalArea, farm.areaUnit);
      ownerMap.set(farm.owner, existing);
    }

    const topOwners = Array.from(ownerMap.entries())
      .map(([owner, data]) => ({ owner, ...data }))
      .sort((a, b) => b.totalArea - a.totalArea)
      .slice(0, 10);

    const totalArea = orgFarms.reduce(
      (sum, f) => sum + convertToHectares(f.totalArea, f.areaUnit),
      0
    );

    return {
      totalFarms: orgFarms.length,
      activeFarms: orgFarms.filter((f) => f.status === "active").length,
      totalAreaHectares: totalArea,
      totalFields: orgFields.length,
      activeFields: orgFields.filter((f) => f.isActive).length,
      averageFarmSize: orgFarms.length > 0 ? totalArea / orgFarms.length : 0,
      topOwners,
    };
  },

  /**
   * Clear all data (for testing).
   */
  async clearAll(): Promise<void> {
    farms.clear();
    fields.clear();
  },

  /**
   * Get farm count.
   */
  async count(): Promise<number> {
    return farms.size;
  },

  /**
   * Get field count.
   */
  async fieldCount(): Promise<number> {
    return fields.size;
  },
};
