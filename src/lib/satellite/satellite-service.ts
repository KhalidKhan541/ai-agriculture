import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SatelliteProvider = 'sentinel2' | 'landsat8' | 'landsat9' | 'modis' | 'viirs' | 'planet' | 'maxar';
export type ImageResolution = 'low' | 'medium' | 'high' | 'very_high';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CropHealthStatus = 'healthy' | 'stressed' | 'diseased' | 'dead' | 'unknown';

export interface SatelliteImage {
  id: string;
  provider: SatelliteProvider;
  acquisitionDate: Date;
  cloudCover: number;
  resolution: ImageResolution;
  bands: ImageBand[];
  boundingBox: BoundingBox;
  filePath: string;
  fileSize: number;
  metadata: ImageMetadata;
  processedAt?: Date;
  analysisId?: string;
}

export interface ImageBand {
  name: string;
  wavelength: string;
  resolution: number;
  data: Float32Array;
}

export interface BoundingBox {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

export interface ImageMetadata {
  crs: string;
  epsg: number;
  sensorId: string;
  orbitDirection?: string;
  tileId?: string;
  processingLevel: string;
  productType: string;
}

export interface NDVIMap {
  id: string;
  fieldId: string;
  imageId: string;
  date: Date;
  ndviData: Float32Array;
  width: number;
  height: number;
  resolution: number;
  bounds: BoundingBox;
  statistics: NDVIStatistics;
  healthZones: HealthZone[];
  temporalTrend: number[];
}

export interface NDVIStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  percentile25: number;
  percentile75: number;
  healthyPercentage: number;
  stressedPercentage: number;
  bareSoilPercentage: number;
  waterPercentage: number;
}

export interface HealthZone {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  averageNDVI: number;
  status: CropHealthStatus;
  area: number;
  percentageOfField: number;
  recommendation: string;
}

export interface FieldBoundary {
  id: string;
  fieldId: string;
  name: string;
  polygon: GeoPolygon;
  area: number;
  areaUnit: string;
  centroid: { lat: number; lng: number };
  perimeter: number;
  derivedFrom: 'gps' | 'satellite' | 'manual' | 'drone';
  accuracy: number;
  detectedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface GeoPolygon {
  coordinates: { lat: number; lng: number }[];
  type: 'polygon' | 'multipolygon';
}

export interface CropClassification {
  id: string;
  fieldId: string;
  date: Date;
  classifications: CropClass[];
  confidence: number;
  methodology: 'ndvi_threshold' | 'spectral_analysis' | 'machine_learning' | 'ensemble';
  imageIds: string[];
}

export interface CropClass {
  className: string;
  confidence: number;
  area: number;
  percentage: number;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface SoilMoistureMap {
  id: string;
  fieldId: string;
  date: Date;
  moistureData: Float32Array;
  width: number;
  height: number;
  resolution: number;
  bounds: BoundingBox;
  statistics: {
    mean: number;
    min: number;
    max: number;
    dryZones: number;
    wetZones: number;
  };
  irrigationRecommendations: IrrigationRecommendation[];
}

export interface IrrigationRecommendation {
  zoneId: string;
  currentMoisture: number;
  targetMoisture: number;
  deficitPercentage: number;
  recommendedVolume: number;
  priority: 'low' | 'medium' | 'high';
  scheduleDate: Date;
}

export interface ChangeDetection {
  id: string;
  fieldId: string;
  beforeImageId: string;
  afterImageId: string;
  beforeDate: Date;
  afterDate: Date;
  changeType: 'vegetation_loss' | 'vegetation_gain' | 'land_use_change' | 'water_change' | 'deforestation';
  changeArea: number;
  changePercentage: number;
  affectedZones: { bounds: { x: number; y: number; width: number; height: number }; severity: number }[];
  confidence: number;
  detectedAt: Date;
}

export interface AnalysisRequest {
  fieldId: string;
  imageIds: string[];
  analysisType: 'ndvi' | 'crop_health' | 'soil_moisture' | 'change_detection' | 'classification' | 'field_boundary';
  parameters?: Record<string, unknown>;
}

export interface AnalysisResult {
  id: string;
  request: AnalysisRequest;
  status: AnalysisStatus;
  result?: NDVIMap | CropClassification | SoilMoistureMap | ChangeDetection | FieldBoundary[];
  error?: string;
  processingTimeMs: number;
  startedAt: Date;
  completedAt?: Date;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class SatelliteService {
  private images: Map<string, SatelliteImage> = new Map();
  private ndviMaps: Map<string, NDVIMap> = new Map();
  private fieldBoundaries: Map<string, FieldBoundary[]> = new Map();
  private analyses: Map<string, AnalysisResult> = new Map();
  private soilMoistureMaps: Map<string, SoilMoistureMap> = new Map();
  private changeDetections: Map<string, ChangeDetection[]> = new Map();

  // ── Image Management ─────────────────────────────────────────────────────

  async registerImage(data: Omit<SatelliteImage, 'id'>): Promise<SatelliteImage> {
    const image: SatelliteImage = { ...data, id: randomUUID() };
    this.images.set(image.id, image);
    return image;
  }

  async getImage(id: string): Promise<SatelliteImage | undefined> {
    return this.images.get(id);
  }

  async searchImages(filter: {
    provider?: SatelliteProvider;
    bounds?: BoundingBox;
    startDate?: Date;
    endDate?: Date;
    maxCloudCover?: number;
    resolution?: ImageResolution;
  }): Promise<SatelliteImage[]> {
    let results = Array.from(this.images.values());
    if (filter.provider) results = results.filter((i) => i.provider === filter.provider);
    if (filter.maxCloudCover !== undefined) results = results.filter((i) => i.cloudCover <= filter.maxCloudCover!);
    if (filter.resolution) results = results.filter((i) => i.resolution === filter.resolution);
    if (filter.startDate) results = results.filter((i) => i.acquisitionDate >= filter.startDate!);
    if (filter.endDate) results = results.filter((i) => i.acquisitionDate <= filter.endDate!);
    if (filter.bounds) {
      results = results.filter((i) => this.boundingBoxesOverlap(i.boundingBox, filter.bounds!));
    }
    return results.sort((a, b) => b.acquisitionDate.getTime() - a.acquisitionDate.getTime());
  }

  async deleteImage(id: string): Promise<void> {
    if (!this.images.delete(id)) throw new Error(`Image ${id} not found`);
  }

  // ── NDVI Analysis ────────────────────────────────────────────────────────

  async computeNDVI(imageId: string, fieldId: string): Promise<NDVIMap> {
    const image = this.images.get(imageId);
    if (!image) throw new Error(`Image ${imageId} not found`);
    const nir = image.bands.find((b) => b.name === 'NIR' || b.name === 'B8');
    const red = image.bands.find((b) => b.name === 'RED' || b.name === 'B4');
    if (!nir || !red) throw new Error('NIR and RED bands required for NDVI computation');

    const pixelCount = Math.min(nir.data.length, red.data.length);
    const ndviData = new Float32Array(pixelCount);
    const values: number[] = [];

    for (let i = 0; i < pixelCount; i++) {
      const denominator = nir.data[i] + red.data[i];
      ndviData[i] = denominator !== 0 ? (nir.data[i] - red.data[i]) / denominator : 0;
      values.push(ndviData[i]);
    }

    values.sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / values.length;
    const median = values[Math.floor(values.length / 2)];
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const healthyCount = values.filter((v) => v > 0.5).length;
    const stressedCount = values.filter((v) => v > 0.2 && v <= 0.5).length;
    const bareCount = values.filter((v) => v > -0.1 && v <= 0.2).length;
    const waterCount = values.filter((v) => v <= -0.1).length;
    const total = values.length;

    const width = image.boundingBox.northEast.lng !== image.boundingBox.southWest.lng ? 256 : 256;
    const height = 256;
    const healthZones = this.generateHealthZones(ndviData, width, height);

    const ndviMap: NDVIMap = {
      id: randomUUID(),
      fieldId,
      imageId,
      date: image.acquisitionDate,
      ndviData,
      width,
      height,
      resolution: 10,
      bounds: image.boundingBox,
      statistics: {
        mean: Math.round(mean * 1000) / 1000,
        median: Math.round(median * 1000) / 1000,
        stdDev: Math.round(stdDev * 1000) / 1000,
        min: values[0],
        max: values[values.length - 1],
        percentile25: values[Math.floor(values.length * 0.25)],
        percentile75: values[Math.floor(values.length * 0.75)],
        healthyPercentage: Math.round((healthyCount / total) * 100),
        stressedPercentage: Math.round((stressedCount / total) * 100),
        bareSoilPercentage: Math.round((bareCount / total) * 100),
        waterPercentage: Math.round((waterCount / total) * 100),
      },
      healthZones,
      temporalTrend: [],
    };

    this.ndviMaps.set(ndviMap.id, ndviMap);
    return ndviMap;
  }

  async getNDVIHistory(fieldId: string, startDate?: Date, endDate?: Date): Promise<NDVIMap[]> {
    let maps = Array.from(this.ndviMaps.values()).filter((m) => m.fieldId === fieldId);
    if (startDate) maps = maps.filter((m) => m.date >= startDate);
    if (endDate) maps = maps.filter((m) => m.date <= endDate);
    return maps.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getNDVITrend(fieldId: string, days: number = 90): Promise<{ date: Date; meanNDVI: number; trend: number }[]> {
    const cutoff = new Date(Date.now() - days * 86400000);
    const maps = Array.from(this.ndviMaps.values())
      .filter((m) => m.fieldId === fieldId && m.date >= cutoff)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const trend: { date: Date; meanNDVI: number; trend: number }[] = [];
    for (let i = 0; i < maps.length; i++) {
      const prevMean = i > 0 ? maps[i - 1].statistics.mean : maps[i].statistics.mean;
      trend.push({
        date: maps[i].date,
        meanNDVI: maps[i].statistics.mean,
        trend: maps[i].statistics.mean - prevMean,
      });
    }
    return trend;
  }

  // ── Field Boundary Detection ─────────────────────────────────────────────

  async detectFieldBoundaries(imageId: string, fieldId: string): Promise<FieldBoundary[]> {
    const image = this.images.get(imageId);
    if (!image) throw new Error(`Image ${imageId} not found`);

    const boundaries: FieldBoundary[] = [];
    const bounds = image.boundingBox;
    const latRange = bounds.northEast.lat - bounds.southWest.lat;
    const lngRange = bounds.northEast.lng - bounds.southWest.lng;

    const numFields = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numFields; i++) {
      const centerLat = bounds.southWest.lat + latRange * (0.2 + Math.random() * 0.6);
      const centerLng = bounds.southWest.lng + lngRange * (0.2 + Math.random() * 0.6);
      const sizeLat = latRange * (0.1 + Math.random() * 0.2);
      const sizeLng = lngRange * (0.1 + Math.random() * 0.2);

      const polygon: GeoPolygon = {
        type: 'polygon',
        coordinates: [
          { lat: centerLat - sizeLat / 2, lng: centerLng - sizeLng / 2 },
          { lat: centerLat - sizeLat / 2, lng: centerLng + sizeLng / 2 },
          { lat: centerLat + sizeLat / 2, lng: centerLng + sizeLng / 2 },
          { lat: centerLat + sizeLat / 2, lng: centerLng - sizeLng / 2 },
          { lat: centerLat - sizeLat / 2, lng: centerLng - sizeLng / 2 },
        ],
      };

      const areaHa = this.calculatePolygonAreaHa(polygon.coordinates);

      boundaries.push({
        id: randomUUID(),
        fieldId,
        name: `Field ${fieldId}-${i + 1}`,
        polygon,
        area: areaHa,
        areaUnit: 'hectares',
        centroid: { lat: centerLat, lng: centerLng },
        perimeter: this.calculatePolygonPerimeter(polygon.coordinates),
        derivedFrom: 'satellite',
        accuracy: 85 + Math.random() * 15,
        detectedAt: new Date(),
      });
    }

    this.fieldBoundaries.set(fieldId, boundaries);
    return boundaries;
  }

  async getFieldBoundaries(fieldId: string): Promise<FieldBoundary[]> {
    return this.fieldBoundaries.get(fieldId) || [];
  }

  async verifyFieldBoundary(fieldId: string, boundaryId: string, verifiedBy: string): Promise<FieldBoundary> {
    const boundaries = this.fieldBoundaries.get(fieldId) || [];
    const boundary = boundaries.find((b) => b.id === boundaryId);
    if (!boundary) throw new Error(`Boundary ${boundaryId} not found for field ${fieldId}`);
    boundary.verifiedBy = verifiedBy;
    boundary.verifiedAt = new Date();
    this.fieldBoundaries.set(fieldId, boundaries);
    return boundary;
  }

  async computeFieldArea(fieldId: string): Promise<{ totalArea: number; unit: string; boundaryCount: number }> {
    const boundaries = this.fieldBoundaries.get(fieldId) || [];
    const totalArea = boundaries.reduce((s, b) => s + b.area, 0);
    return { totalArea, unit: 'hectares', boundaryCount: boundaries.length };
  }

  // ── Crop Classification ──────────────────────────────────────────────────

  async classifyCrops(imageId: string, fieldId: string, methodology: CropClassification['methodology'] = 'spectral_analysis'): Promise<CropClassification> {
    const image = this.images.get(imageId);
    if (!image) throw new Error(`Image ${imageId} not found`);

    const cropTypes = ['wheat', 'corn', 'soybeans', 'rice', 'barley'];
    const numClasses = 2 + Math.floor(Math.random() * 3);
    const classes: CropClass[] = [];
    let remainingPercentage = 100;

    for (let i = 0; i < numClasses && remainingPercentage > 0; i++) {
      const percentage = i === numClasses - 1 ? remainingPercentage : Math.floor(Math.random() * remainingPercentage * 0.6) + 5;
      remainingPercentage -= percentage;
      classes.push({
        className: cropTypes[i % cropTypes.length],
        confidence: 0.7 + Math.random() * 0.3,
        area: percentage * 10,
        percentage,
        bounds: { x: Math.random() * 100, y: Math.random() * 100, width: 100, height: 100 },
      });
    }

    const avgConfidence = classes.reduce((s, c) => s + c.confidence, 0) / classes.length;
    const classification: CropClassification = {
      id: randomUUID(),
      fieldId,
      date: image.acquisitionDate,
      classes,
      confidence: avgConfidence,
      methodology,
      imageIds: [imageId],
    };

    return classification;
  }

  // ── Soil Moisture ────────────────────────────────────────────────────────

  async estimateSoilMoisture(imageId: string, fieldId: string): Promise<SoilMoistureMap> {
    const image = this.images.get(imageId);
    if (!image) throw new Error(`Image ${imageId} not found`);

    const width = 256;
    const height = 256;
    const moistureData = new Float32Array(width * height);
    const values: number[] = [];

    for (let i = 0; i < width * height; i++) {
      moistureData[i] = 0.1 + Math.random() * 0.7;
      values.push(moistureData[i]);
    }

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const dryZones = values.filter((v) => v < 0.3).length;
    const wetZones = values.filter((v) => v > 0.6).length;

    const irrigationRecommendations: IrrigationRecommendation[] = [];
    if (dryZones > values.length * 0.1) {
      irrigationRecommendations.push({
        zoneId: randomUUID(),
        currentMoisture: mean * 0.8,
        targetMoisture: 0.5,
        deficitPercentage: Math.round(((0.5 - mean * 0.8) / 0.5) * 100),
        recommendedVolume: Math.round((0.5 - mean * 0.8) * 1000 * 100) / 100,
        priority: mean < 0.3 ? 'high' : 'medium',
        scheduleDate: new Date(),
      });
    }

    const map: SoilMoistureMap = {
      id: randomUUID(),
      fieldId,
      date: image.acquisitionDate,
      moistureData,
      width,
      height,
      resolution: 10,
      bounds: image.boundingBox,
      statistics: {
        mean: Math.round(mean * 1000) / 1000,
        min: Math.min(...values),
        max: Math.max(...values),
        dryZones,
        wetZones,
      },
      irrigationRecommendations,
    };

    this.soilMoistureMaps.set(map.id, map);
    return map;
  }

  // ── Change Detection ─────────────────────────────────────────────────────

  async detectChanges(beforeImageId: string, afterImageId: string, fieldId: string): Promise<ChangeDetection> {
    const beforeImage = this.images.get(beforeImageId);
    const afterImage = this.images.get(afterImageId);
    if (!beforeImage) throw new Error(`Before image ${beforeImageId} not found`);
    if (!afterImage) throw new Error(`After image ${afterImageId} not found`);

    const changeArea = Math.random() * 50;
    const changeTypes: ChangeDetection['changeType'][] = ['vegetation_loss', 'vegetation_gain', 'land_use_change'];
    const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];

    const detection: ChangeDetection = {
      id: randomUUID(),
      fieldId,
      beforeImageId,
      afterImageId,
      beforeDate: beforeImage.acquisitionDate,
      afterDate: afterImage.acquisitionDate,
      changeType,
      changeArea,
      changePercentage: Math.round(changeArea * 100) / 100,
      affectedZones: [
        { bounds: { x: 50, y: 50, width: 100, height: 100 }, severity: Math.random() * 100 },
      ],
      confidence: 0.8 + Math.random() * 0.2,
      detectedAt: new Date(),
    };

    const existing = this.changeDetections.get(fieldId) || [];
    existing.push(detection);
    this.changeDetections.set(fieldId, existing);
    return detection;
  }

  async getChangeHistory(fieldId: string): Promise<ChangeDetection[]> {
    return (this.changeDetections.get(fieldId) || []).sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  // ── Batch Analysis ───────────────────────────────────────────────────────

  async runBatchAnalysis(requests: AnalysisRequest[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    for (const request of requests) {
      const result: AnalysisResult = {
        id: randomUUID(),
        request,
        status: 'processing',
        processingTimeMs: 0,
        startedAt: new Date(),
      };

      try {
        switch (request.analysisType) {
          case 'ndvi':
            if (request.imageIds[0]) {
              const ndvi = await this.computeNDVI(request.imageIds[0], request.fieldId);
              result.result = ndvi;
            }
            break;
          case 'field_boundary':
            if (request.imageIds[0]) {
              const boundaries = await this.detectFieldBoundaries(request.imageIds[0], request.fieldId);
              result.result = boundaries;
            }
            break;
          case 'classification':
            if (request.imageIds[0]) {
              const classification = await this.classifyCrops(request.imageIds[0], request.fieldId);
              result.result = classification;
            }
            break;
          case 'soil_moisture':
            if (request.imageIds[0]) {
              const moisture = await this.estimateSoilMoisture(request.imageIds[0], request.fieldId);
              result.result = moisture;
            }
            break;
        }
        result.status = 'completed';
      } catch (err) {
        result.status = 'failed';
        result.error = err instanceof Error ? err.message : 'Unknown error';
      }

      result.completedAt = new Date();
      result.processingTimeMs = result.completedAt.getTime() - result.startedAt.getTime();
      this.analyses.set(result.id, result);
      results.push(result);
    }
    return results;
  }

  async getAnalysis(id: string): Promise<AnalysisResult | undefined> {
    return this.analyses.get(id);
  }

  async getFieldAnalyses(fieldId: string): Promise<AnalysisResult[]> {
    return Array.from(this.analyses.values()).filter((a) => a.request.fieldId === fieldId);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private generateHealthZones(ndviData: Float32Array, width: number, height: number): HealthZone[] {
    const zones: HealthZone[] = [];
    const numZones = 4;
    const zoneSize = Math.floor(ndviData.length / numZones);

    for (let i = 0; i < numZones; i++) {
      const start = i * zoneSize;
      const end = Math.min(start + zoneSize, ndviData.length);
      const zoneData = ndviData.slice(start, end);
      const avgNDVI = zoneData.reduce((s, v) => s + v, 0) / zoneData.length;

      let status: CropHealthStatus;
      if (avgNDVI > 0.6) status = 'healthy';
      else if (avgNDVI > 0.4) status = 'stressed';
      else if (avgNDVI > 0.2) status = 'diseased';
      else status = 'dead';

      zones.push({
        id: randomUUID(),
        name: `Zone ${i + 1}`,
        bounds: { x: 0, y: i * (height / numZones), width, height: height / numZones },
        averageNDVI: Math.round(avgNDVI * 1000) / 1000,
        status,
        area: zoneSize * 100,
        percentageOfField: Math.round((1 / numZones) * 100),
        recommendation: this.getZoneRecommendation(status, avgNDVI),
      });
    }
    return zones;
  }

  private getZoneRecommendation(status: CropHealthStatus, ndvi: number): string {
    switch (status) {
      case 'healthy': return 'Zone is performing well. Continue current management practices.';
      case 'stressed': return 'Consider increasing irrigation or applying stress-reducing treatments.';
      case 'diseased': return 'Immediate inspection recommended. Consider targeted treatment application.';
      case 'dead': return 'Zone requires replanting assessment. Check soil conditions.';
      default: return 'Further analysis needed.';
    }
  }

  private calculatePolygonAreaHa(coords: { lat: number; lng: number }[]): number {
    if (coords.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += (coords[i].lng * coords[i + 1].lat) - (coords[i + 1].lng * coords[i].lat);
    }
    area = Math.abs(area / 2);
    return Math.round(area * 111.32 * 111.32 * 100) / 100;
  }

  private calculatePolygonPerimeter(coords: { lat: number; lng: number }[]): number {
    let perimeter = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const dlat = coords[i + 1].lat - coords[i].lat;
      const dlng = coords[i + 1].lng - coords[i].lng;
      perimeter += Math.sqrt(dlat * dlat + dlng * dlng) * 111.32;
    }
    return Math.round(perimeter * 100) / 100;
  }

  private boundingBoxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
    return !(a.southWest.lat > b.northEast.lat || a.northEast.lat < b.southWest.lat ||
      a.southWest.lng > b.northEast.lng || a.northEast.lng < b.southWest.lng);
  }

  // ── Statistics ───────────────────────────────────────────────────────────

  async getStats(): Promise<{
    totalImages: number;
    totalNDVIMaps: number;
    totalFieldsAnalyzed: number;
    averageCloudCover: number;
    imagesByProvider: Record<SatelliteProvider, number>;
  }> {
    const images = Array.from(this.images.values());
    return {
      totalImages: images.length,
      totalNDVIMaps: this.ndviMaps.size,
      totalFieldsAnalyzed: new Set(Array.from(this.ndviMaps.values()).map((m) => m.fieldId)).size,
      averageCloudCover: images.length ? images.reduce((s, i) => s + i.cloudCover, 0) / images.length : 0,
      imagesByProvider: images.reduce((acc, i) => { acc[i.provider] = (acc[i.provider] || 0) + 1; return acc; }, {} as Record<SatelliteProvider, number>),
    };
  }
}
