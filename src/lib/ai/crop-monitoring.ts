// ============================================================================
// AI Agriculture Platform - Crop Monitoring & Health Analysis Service
// NDVI analysis, growth stage detection, disease identification
// ============================================================================

import { generateText, extractJSON, type ChatMessage, type AIRequestOptions } from './provider';
import type {
  ProviderName,
  CropType,
  GrowthStage,
  HealthStatus,
  NDVIData,
  CropHealthReport,
  DiseaseIdentification,
  StressIndicator,
  CropRecommendation,
  ImageAnalysisResult,
  ImageAnomaly,
} from '../../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface CropMonitoringConfig {
  defaultProvider: ProviderName;
  fallbackProvider?: ProviderName;
  analysisTimeout: number;
  confidenceThreshold: number;
  maxImageSize: number;
  enableSatelliteAnalysis: boolean;
  enableDroneAnalysis: boolean;
  enableGroundSensorAnalysis: boolean;
}

const defaultConfig: CropMonitoringConfig = {
  defaultProvider: 'openai',
  analysisTimeout: 60000,
  confidenceThreshold: 0.7,
  maxImageSize: 10 * 1024 * 1024,
  enableSatelliteAnalysis: true,
  enableDroneAnalysis: true,
  enableGroundSensorAnalysis: true,
};

let config: CropMonitoringConfig = { ...defaultConfig };

export function configureCropMonitoring(overrides: Partial<CropMonitoringConfig>): void {
  config = { ...config, ...overrides };
}

// ---------------------------------------------------------------------------
// NDVI Calculation & Analysis
// ---------------------------------------------------------------------------

export interface NDVIMeasurement {
  nir: number;
  red: number;
  green?: number;
  blue?: number;
  timestamp: Date;
  location: { latitude: number; longitude: number };
  source: NDVIData['source'];
  resolution?: number;
  cloudCover?: number;
}

export function calculateNDVI(measurement: NDVIMeasurement): NDVIData {
  const { nir, red } = measurement;
  if (nir + red === 0) {
    return {
      value: 0,
      classification: 'bare_soil',
      timestamp: measurement.timestamp,
      latitude: measurement.location.latitude,
      longitude: measurement.location.longitude,
      source: measurement.source,
      resolution: measurement.resolution,
    };
  }

  const ndviValue = (nir - red) / (nir + red);
  const classification = classifyNDVI(ndviValue);

  return {
    value: Math.round(ndviValue * 1000) / 1000,
    classification,
    timestamp: measurement.timestamp,
    latitude: measurement.location.latitude,
    longitude: measurement.location.longitude,
    source: measurement.source,
    resolution: measurement.resolution,
  };
}

export function classifyNDVI(value: number): NDVIData['classification'] {
  if (value < 0.1) return 'bare_soil';
  if (value < 0.2) return 'water';
  if (value < 0.4) return 'severely_stressed';
  if (value < 0.6) return 'stressed';
  return 'healthy';
}

export interface NDVISeries {
  measurements: NDVIData[];
  trend: 'improving' | 'declining' | 'stable';
  averageValue: number;
  volatility: number;
  alerts: NDVIAlert[];
}

export interface NDVIAlert {
  type: 'declining_health' | 'sudden_drop' | 'stagnation' | 'seasonal_anomaly';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: Date;
  ndviValue: number;
}

export function analyzeNDVISeries(measurements: NDVIData[]): NDVISeries {
  if (measurements.length === 0) {
    return {
      measurements: [],
      trend: 'stable',
      averageValue: 0,
      volatility: 0,
      alerts: [],
    };
  }

  const sorted = [...measurements].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const values = sorted.map((m) => m.value);
  const averageValue = values.reduce((a, b) => a + b, 0) / values.length;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - averageValue, 2), 0) / values.length;
  const volatility = Math.sqrt(variance);

  const trend = calculateNDVITrend(values);

  const alerts = detectNDVIAnomalies(sorted);

  return {
    measurements: sorted,
    trend,
    averageValue: Math.round(averageValue * 1000) / 1000,
    volatility: Math.round(volatility * 1000) / 1000,
    alerts,
  };
}

function calculateNDVITrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 3) return 'stable';

  const recentWindow = Math.min(5, Math.floor(values.length / 3));
  const olderWindow = Math.min(5, Math.floor(values.length / 3));

  const recentAvg = values.slice(-recentWindow).reduce((a, b) => a + b, 0) / recentWindow;
  const olderAvg = values.slice(0, olderWindow).reduce((a, b) => a + b, 0) / olderWindow;

  const change = recentAvg - olderAvg;
  if (change > 0.05) return 'improving';
  if (change < -0.05) return 'declining';
  return 'stable';
}

function detectNDVIAnomalies(series: NDVIData[]): NDVIAlert[] {
  const alerts: NDVIAlert[] = [];
  if (series.length < 3) return alerts;

  const values = series.map((m) => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  );

  for (let i = 1; i < series.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const drop = prev - curr;

    if (drop > 0.15 && drop > 2 * stdDev) {
      alerts.push({
        type: 'sudden_drop',
        severity: 'high',
        message: `NDVI dropped from ${prev.toFixed(3)} to ${curr.toFixed(3)} between measurements`,
        date: new Date(series[i].timestamp),
        ndviValue: curr,
      });
    }
  }

  const lastFive = values.slice(-5);
  const allDecreasing = lastFive.every((v, i) => i === 0 || v < lastFive[i - 1]);
  if (allDecreasing && lastFive.length >= 4) {
    alerts.push({
      type: 'declining_health',
      severity: 'medium',
      message: 'NDVI has been consistently declining over recent measurements',
      date: new Date(series[series.length - 1].timestamp),
      ndviValue: lastFive[lastFive.length - 1],
    });
  }

  const lastThree = values.slice(-3);
  const variance = lastThree.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / lastThree.length;
  if (variance < 0.001 && lastThree.length === 3) {
    alerts.push({
      type: 'stagnation',
      severity: 'low',
      message: 'NDVI has stagnated - crop growth may have halted',
      date: new Date(series[series.length - 1].timestamp),
      ndviValue: lastThree[lastThree.length - 1],
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Growth Stage Detection
// ---------------------------------------------------------------------------

export interface GrowthStageInput {
  cropType: CropType;
  plantingDate: Date;
  currentNDVI: number;
  daysSincePlanting: number;
  temperatureAccumulation: number;
  photoperiodHours?: number;
  imageFeatures?: string[];
}

const GROWTH_STAGE_THRESHOLDS: Record<
  CropType,
  { stage: GrowthStage; minDays: number; maxDays: number; minGDD: number; maxGDD: number; ndviRange: [number, number] }[]
> = {
  wheat: [
    { stage: 'seedling', minDays: 0, maxDays: 21, minGDD: 0, maxGDD: 200, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 21, maxDays: 90, minGDD: 200, maxGDD: 800, ndviRange: [0.3, 0.7] },
    { stage: 'budding', minDays: 90, maxDays: 120, minGDD: 800, maxGDD: 1100, ndviRange: [0.6, 0.8] },
    { stage: 'flowering', minDays: 120, maxDays: 150, minGDD: 1100, maxGDD: 1500, ndviRange: [0.7, 0.85] },
    { stage: 'fruiting', minDays: 150, maxDays: 180, minGDD: 1500, maxGDD: 1900, ndviRange: [0.65, 0.8] },
    { stage: 'ripening', minDays: 180, maxDays: 210, minGDD: 1900, maxGDD: 2200, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 210, maxDays: 240, minGDD: 2200, maxGDD: 2500, ndviRange: [0.35, 0.55] },
  ],
  corn: [
    { stage: 'seedling', minDays: 0, maxDays: 14, minGDD: 0, maxGDD: 150, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 14, maxDays: 60, minGDD: 150, maxGDD: 700, ndviRange: [0.3, 0.75] },
    { stage: 'budding', minDays: 60, maxDays: 75, minGDD: 700, maxGDD: 900, ndviRange: [0.7, 0.85] },
    { stage: 'flowering', minDays: 75, maxDays: 90, minGDD: 900, maxGDD: 1100, ndviRange: [0.75, 0.9] },
    { stage: 'fruiting', minDays: 90, maxDays: 120, minGDD: 1100, maxGDD: 1500, ndviRange: [0.7, 0.85] },
    { stage: 'ripening', minDays: 120, maxDays: 140, minGDD: 1500, maxGDD: 1800, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 140, maxDays: 160, minGDD: 1800, maxGDD: 2100, ndviRange: [0.35, 0.55] },
  ],
  rice: [
    { stage: 'seedling', minDays: 0, maxDays: 30, minGDD: 0, maxGDD: 300, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 30, maxDays: 70, minGDD: 300, maxGDD: 700, ndviRange: [0.3, 0.7] },
    { stage: 'budding', minDays: 70, maxDays: 85, minGDD: 700, maxGDD: 900, ndviRange: [0.6, 0.8] },
    { stage: 'flowering', minDays: 85, maxDays: 100, minGDD: 900, maxGDD: 1100, ndviRange: [0.7, 0.85] },
    { stage: 'fruiting', minDays: 100, maxDays: 120, minGDD: 1100, maxGDD: 1400, ndviRange: [0.65, 0.8] },
    { stage: 'ripening', minDays: 120, maxDays: 140, minGDD: 1400, maxGDD: 1700, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 140, maxDays: 160, minGDD: 1700, maxGDD: 2000, ndviRange: [0.35, 0.55] },
  ],
  soybean: [
    { stage: 'seedling', minDays: 0, maxDays: 15, minGDD: 0, maxGDD: 150, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 15, maxDays: 45, minGDD: 150, maxGDD: 500, ndviRange: [0.3, 0.7] },
    { stage: 'budding', minDays: 45, maxDays: 60, minGDD: 500, maxGDD: 700, ndviRange: [0.6, 0.8] },
    { stage: 'flowering', minDays: 60, maxDays: 80, minGDD: 700, maxGDD: 950, ndviRange: [0.7, 0.85] },
    { stage: 'fruiting', minDays: 80, maxDays: 110, minGDD: 950, maxGDD: 1300, ndviRange: [0.65, 0.8] },
    { stage: 'ripening', minDays: 110, maxDays: 130, minGDD: 1300, maxGDD: 1600, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 130, maxDays: 150, minGDD: 1600, maxGDD: 1900, ndviRange: [0.35, 0.55] },
  ],
  cotton: [
    { stage: 'seedling', minDays: 0, maxDays: 21, minGDD: 0, maxGDD: 200, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 21, maxDays: 60, minGDD: 200, maxGDD: 700, ndviRange: [0.3, 0.7] },
    { stage: 'budding', minDays: 60, maxDays: 75, minGDD: 700, maxGDD: 900, ndviRange: [0.6, 0.8] },
    { stage: 'flowering', minDays: 75, maxDays: 100, minGDD: 900, maxGDD: 1200, ndviRange: [0.7, 0.85] },
    { stage: 'fruiting', minDays: 100, maxDays: 140, minGDD: 1200, maxGDD: 1700, ndviRange: [0.65, 0.8] },
    { stage: 'ripening', minDays: 140, maxDays: 170, minGDD: 1700, maxGDD: 2100, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 170, maxDays: 200, minGDD: 2100, maxGDD: 2500, ndviRange: [0.35, 0.55] },
  ],
  potato: [
    { stage: 'seedling', minDays: 0, maxDays: 14, minGDD: 0, maxGDD: 150, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 14, maxDays: 45, minGDD: 150, maxGDD: 500, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 45, maxDays: 60, minGDD: 500, maxGDD: 700, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 60, maxDays: 80, minGDD: 700, maxGDD: 950, ndviRange: [0.6, 0.8] },
    { stage: 'ripening', minDays: 80, maxDays: 100, minGDD: 950, maxGDD: 1200, ndviRange: [0.45, 0.65] },
    { stage: 'harvest_ready', minDays: 100, maxDays: 120, minGDD: 1200, maxGDD: 1400, ndviRange: [0.3, 0.5] },
  ],
  tomato: [
    { stage: 'seedling', minDays: 0, maxDays: 14, minGDD: 0, maxGDD: 120, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 14, maxDays: 40, minGDD: 120, maxGDD: 450, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 40, maxDays: 60, minGDD: 450, maxGDD: 700, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 60, maxDays: 90, minGDD: 700, maxGDD: 1100, ndviRange: [0.6, 0.8] },
    { stage: 'ripening', minDays: 90, maxDays: 110, minGDD: 1100, maxGDD: 1400, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 110, maxDays: 130, minGDD: 1400, maxGDD: 1700, ndviRange: [0.4, 0.6] },
  ],
  maize: [
    { stage: 'seedling', minDays: 0, maxDays: 14, minGDD: 0, maxGDD: 150, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 14, maxDays: 55, minGDD: 150, maxGDD: 650, ndviRange: [0.3, 0.75] },
    { stage: 'budding', minDays: 55, maxDays: 70, minGDD: 650, maxGDD: 850, ndviRange: [0.7, 0.85] },
    { stage: 'flowering', minDays: 70, maxDays: 85, minGDD: 850, maxGDD: 1050, ndviRange: [0.75, 0.9] },
    { stage: 'fruiting', minDays: 85, maxDays: 115, minGDD: 1050, maxGDD: 1400, ndviRange: [0.7, 0.85] },
    { stage: 'ripening', minDays: 115, maxDays: 135, minGDD: 1400, maxGDD: 1700, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 135, maxDays: 155, minGDD: 1700, maxGDD: 2000, ndviRange: [0.35, 0.55] },
  ],
  barley: [
    { stage: 'seedling', minDays: 0, maxDays: 18, minGDD: 0, maxGDD: 180, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 18, maxDays: 70, minGDD: 180, maxGDD: 650, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 70, maxDays: 100, minGDD: 650, maxGDD: 1000, ndviRange: [0.7, 0.85] },
    { stage: 'ripening', minDays: 100, maxDays: 130, minGDD: 1000, maxGDD: 1400, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 130, maxDays: 155, minGDD: 1400, maxGDD: 1700, ndviRange: [0.35, 0.55] },
  ],
  sunflower: [
    { stage: 'seedling', minDays: 0, maxDays: 14, minGDD: 0, maxGDD: 150, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 14, maxDays: 45, minGDD: 150, maxGDD: 550, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 45, maxDays: 70, minGDD: 550, maxGDD: 850, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 70, maxDays: 100, minGDD: 850, maxGDD: 1200, ndviRange: [0.6, 0.8] },
    { stage: 'ripening', minDays: 100, maxDays: 120, minGDD: 1200, maxGDD: 1500, ndviRange: [0.45, 0.65] },
    { stage: 'harvest_ready', minDays: 120, maxDays: 140, minGDD: 1500, maxGDD: 1800, ndviRange: [0.35, 0.5] },
  ],
  sugarcane: [
    { stage: 'seedling', minDays: 0, maxDays: 60, minGDD: 0, maxGDD: 800, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 60, maxDays: 240, minGDD: 800, maxGDD: 3500, ndviRange: [0.3, 0.75] },
    { stage: 'ripening', minDays: 240, maxDays: 330, minGDD: 3500, maxGDD: 5000, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 330, maxDays: 365, minGDD: 5000, maxGDD: 5800, ndviRange: [0.4, 0.6] },
  ],
  coffee: [
    { stage: 'seedling', minDays: 0, maxDays: 90, minGDD: 0, maxGDD: 1000, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 90, maxDays: 365, minGDD: 1000, maxGDD: 4500, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 365, maxDays: 400, minGDD: 4500, maxGDD: 5000, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 400, maxDays: 540, minGDD: 5000, maxGDD: 7000, ndviRange: [0.6, 0.8] },
    { stage: 'harvest_ready', minDays: 540, maxDays: 580, minGDD: 7000, maxGDD: 7500, ndviRange: [0.45, 0.65] },
  ],
  cocoa: [
    { stage: 'seedling', minDays: 0, maxDays: 180, minGDD: 0, maxGDD: 2000, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 180, maxDays: 730, minGDD: 2000, maxGDD: 9000, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 730, maxDays: 900, minGDD: 9000, maxGDD: 11000, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 900, maxDays: 1095, minGDD: 11000, maxGDD: 14000, ndviRange: [0.6, 0.8] },
    { stage: 'harvest_ready', minDays: 1095, maxDays: 1150, minGDD: 14000, maxGDD: 15000, ndviRange: [0.45, 0.65] },
  ],
  tea: [
    { stage: 'seedling', minDays: 0, maxDays: 60, minGDD: 0, maxGDD: 600, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 60, maxDays: 540, minGDD: 600, maxGDD: 6000, ndviRange: [0.3, 0.75] },
    { stage: 'flowering', minDays: 540, maxDays: 600, minGDD: 6000, maxGDD: 7000, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 600, maxDays: 720, minGDD: 7000, maxGDD: 9000, ndviRange: [0.6, 0.8] },
    { stage: 'harvest_ready', minDays: 720, maxDays: 750, minGDD: 9000, maxGDD: 9500, ndviRange: [0.5, 0.7] },
  ],
  vegetable: [
    { stage: 'seedling', minDays: 0, maxDays: 14, minGDD: 0, maxGDD: 120, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 14, maxDays: 40, minGDD: 120, maxGDD: 400, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 40, maxDays: 60, minGDD: 400, maxGDD: 650, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 60, maxDays: 85, minGDD: 650, maxGDD: 950, ndviRange: [0.6, 0.8] },
    { stage: 'ripening', minDays: 85, maxDays: 100, minGDD: 950, maxGDD: 1200, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 100, maxDays: 120, minGDD: 1200, maxGDD: 1400, ndviRange: [0.4, 0.6] },
  ],
  fruit: [
    { stage: 'seedling', minDays: 0, maxDays: 30, minGDD: 0, maxGDD: 300, ndviRange: [0.1, 0.25] },
    { stage: 'vegetative', minDays: 30, maxDays: 180, minGDD: 300, maxGDD: 2500, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 180, maxDays: 240, minGDD: 2500, maxGDD: 3500, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 240, maxDays: 300, minGDD: 3500, maxGDD: 4500, ndviRange: [0.6, 0.8] },
    { stage: 'ripening', minDays: 300, maxDays: 340, minGDD: 4500, maxGDD: 5200, ndviRange: [0.5, 0.7] },
    { stage: 'harvest_ready', minDays: 340, maxDays: 365, minGDD: 5200, maxGDD: 5800, ndviRange: [0.4, 0.6] },
  ],
  unknown: [
    { stage: 'seedling', minDays: 0, maxDays: 14, minGDD: 0, maxGDD: 150, ndviRange: [0.1, 0.3] },
    { stage: 'vegetative', minDays: 14, maxDays: 60, minGDD: 150, maxGDD: 700, ndviRange: [0.3, 0.7] },
    { stage: 'flowering', minDays: 60, maxDays: 90, minGDD: 700, maxGDD: 1100, ndviRange: [0.65, 0.85] },
    { stage: 'fruiting', minDays: 90, maxDays: 120, minGDD: 1100, maxGDD: 1500, ndviRange: [0.6, 0.8] },
    { stage: 'ripening', minDays: 120, maxDays: 145, minGDD: 1500, maxGDD: 1800, ndviRange: [0.45, 0.65] },
    { stage: 'harvest_ready', minDays: 145, maxDays: 170, minGDD: 1800, maxGDD: 2100, ndviRange: [0.35, 0.55] },
  ],
};

export function detectGrowthStage(input: GrowthStageInput): {
  stage: GrowthStage;
  confidence: number;
  nextStageEstimate: Date | null;
  daysToNextStage: number | null;
} {
  const thresholds = GROWTH_STAGE_THRESHOLDS[input.cropType] || GROWTH_STAGE_THRESHOLDS.unknown;

  const scored = thresholds.map((t) => {
    let score = 0;
    let factors = 0;

    if (input.daysSincePlanting >= t.minDays && input.daysSincePlanting <= t.maxDays) {
      const dayMid = (t.minDays + t.maxDays) / 2;
      const dayDist = Math.abs(input.daysSincePlanting - dayMid) / ((t.maxDays - t.minDays) / 2);
      score += (1 - dayDist) * 0.4;
    }
    factors += 0.4;

    if (input.temperatureAccumulation >= t.minGDD && input.temperatureAccumulation <= t.maxGDD) {
      const gddMid = (t.minGDD + t.maxGDD) / 2;
      const gddDist = Math.abs(input.temperatureAccumulation - gddMid) / ((t.maxGDD - t.minGDD) / 2);
      score += (1 - gddDist) * 0.35;
    }
    factors += 0.35;

    if (input.currentNDVI >= t.ndviRange[0] && input.currentNDVI <= t.ndviRange[1]) {
      const ndviMid = (t.ndviRange[0] + t.ndviRange[1]) / 2;
      const ndviDist =
        Math.abs(input.currentNDVI - ndviMid) / ((t.ndviRange[1] - t.ndviRange[0]) / 2);
      score += (1 - ndviDist) * 0.25;
    }
    factors += 0.25;

    return { ...t, score: score / factors };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  const confidence = Math.min(best.score, 1);

  const currentIdx = thresholds.findIndex((t) => t.stage === best.stage);
  const nextThreshold = currentIdx < thresholds.length - 1 ? thresholds[currentIdx + 1] : null;

  let nextStageEstimate: Date | null = null;
  let daysToNextStage: number | null = null;

  if (nextThreshold) {
    daysToNextStage = Math.max(0, nextThreshold.minDays - input.daysSincePlanting);
    nextStageEstimate = new Date(Date.now() + daysToNextStage * 24 * 60 * 60 * 1000);
  }

  return {
    stage: best.stage,
    confidence: Math.round(confidence * 100) / 100,
    nextStageEstimate,
    daysToNextStage,
  };
}

// ---------------------------------------------------------------------------
// Health Status Assessment
// ---------------------------------------------------------------------------

export function assessHealthStatus(
  ndviValue: number,
  growthStage: GrowthStage,
  stressIndicators: StressIndicator[],
  diseases: DiseaseIdentification[]
): { status: HealthStatus; score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const ndviHealth = mapNDVIToHealth(ndviValue, growthStage);
  breakdown.ndvi = ndviHealth.score;

  const stressImpact = calculateStressImpact(stressIndicators);
  breakdown.stress = stressImpact;

  const diseaseImpact = calculateDiseaseImpact(diseases);
  breakdown.diseases = diseaseImpact;

  const overallScore =
    ndviHealth.score * 0.4 + (1 - stressImpact) * 0.3 + (1 - diseaseImpact) * 0.3;

  const roundedScore = Math.round(overallScore * 100) / 100;
  let status: HealthStatus;

  if (roundedScore >= 0.8) status = 'excellent';
  else if (roundedScore >= 0.6) status = 'good';
  else if (roundedScore >= 0.4) status = 'fair';
  else if (roundedScore >= 0.2) status = 'poor';
  else status = 'critical';

  return { status, score: roundedScore, breakdown };
}

function mapNDVIToHealth(
  ndvi: number,
  stage: GrowthStage
): { score: number; label: string } {
  const stageMultipliers: Record<GrowthStage, number> = {
    seedling: 0.7,
    vegetative: 1.0,
    budding: 0.95,
    flowering: 0.9,
    fruiting: 0.85,
    ripening: 0.75,
    harvest_ready: 0.65,
    post_harvest: 0.5,
  };

  const multiplier = stageMultipliers[stage] || 1.0;

  if (ndvi >= 0.7) return { score: Math.min(1.0, 0.9 * multiplier + 0.1), label: 'excellent' };
  if (ndvi >= 0.5) return { score: 0.75 * multiplier, label: 'good' };
  if (ndvi >= 0.3) return { score: 0.5 * multiplier, label: 'fair' };
  if (ndvi >= 0.15) return { score: 0.25 * multiplier, label: 'poor' };
  return { score: 0.1, label: 'critical' };
}

function calculateStressImpact(indicators: StressIndicator[]): number {
  if (indicators.length === 0) return 0;

  const severityWeights: Record<string, number> = {
    mild: 0.1,
    moderate: 0.3,
    severe: 0.6,
  };

  let totalImpact = 0;
  for (const indicator of indicators) {
    const weight = severityWeights[indicator.severity] || 0.1;
    const areaFraction = indicator.affectedAreaPercentage / 100;
    totalImpact += weight * areaFraction;
  }

  return Math.min(totalImpact, 1);
}

function calculateDiseaseImpact(diseases: DiseaseIdentification[]): number {
  if (diseases.length === 0) return 0;

  const severityWeights: Record<string, number> = {
    mild: 0.15,
    moderate: 0.35,
    severe: 0.65,
    critical: 0.9,
  };

  let totalImpact = 0;
  for (const disease of diseases) {
    const weight = severityWeights[disease.severity] || 0.15;
    const areaFraction = disease.affectedAreaPercentage / 100;
    totalImpact += weight * areaFraction;
  }

  return Math.min(totalImpact, 1);
}

// ---------------------------------------------------------------------------
// AI-Powered Image Analysis
// ---------------------------------------------------------------------------

const CROP_ANALYSIS_SYSTEM_PROMPT = `You are an expert agricultural AI assistant specializing in crop health analysis. 
You analyze images of crops to identify diseases, pests, nutrient deficiencies, and growth patterns.
Always provide structured JSON responses with detailed analysis including:
- Health status assessment
- Disease identification (if any)
- Growth stage detection
- Stress indicators
- Actionable recommendations
Be precise, evidence-based, and consider regional agricultural patterns.`;

interface CropAnalysisInput {
  imageData: string;
  cropType: CropType;
  location: { latitude: number; longitude: number };
  plantingDate?: Date;
  recentWeather?: string;
  soilType?: string;
  previousTreatments?: string[];
}

export async function analyzeCropImage(
  input: CropAnalysisInput,
  provider?: ProviderName
): Promise<CropHealthReport> {
  const providerName = provider || config.defaultProvider;

  const userPrompt = buildImageAnalysisPrompt(input);

  const messages: ChatMessage[] = [
    { role: 'system', content: CROP_ANALYSIS_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const response = await generateText(providerName, messages, {
    temperature: 0.3,
    maxTokens: 4096,
  });

  const analysis = extractJSON<CropAnalysisResult>(response);

  return mapToCropHealthReport(analysis, input);
}

function buildImageAnalysisPrompt(input: CropAnalysisInput): string {
  const parts = [
    'Analyze this crop image for health assessment:',
    '',
    `**Crop Type:** ${input.cropType}`,
    `**Location:** ${input.location.latitude}, ${input.location.longitude}`,
  ];

  if (input.plantingDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(input.plantingDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    parts.push(`**Planting Date:** ${input.plantingDate.toISOString().split('T')[0]} (${daysSince} days ago)`);
  }

  if (input.recentWeather) parts.push(`**Recent Weather:** ${input.recentWeather}`);
  if (input.soilType) parts.push(`**Soil Type:** ${input.soilType}`);
  if (input.previousTreatments?.length) {
    parts.push(`**Previous Treatments:** ${input.previousTreatments.join(', ')}`);
  }

  parts.push(
    '',
    'Provide a comprehensive analysis in the following JSON format:',
    '```json',
    JSON.stringify(
      {
        healthScore: 'number (0-1)',
        healthStatus: 'excellent|good|fair|poor|critical',
        growthStage: 'seedling|vegetative|budding|flowering|fruiting|ripening|harvest_ready',
        ndviEstimate: 'number (0-1)',
        diseases: [
          {
            name: 'string',
            type: 'fungal|bacterial|viral|nutrient_deficiency|pest_damage|environmental_stress',
            severity: 'mild|moderate|severe|critical',
            confidence: 'number (0-1)',
            affectedAreaPercentage: 'number (0-100)',
            symptoms: ['string'],
          },
        ],
        stressIndicators: [
          {
            type: 'water|nutrient|temperature|pest|disease|light',
            severity: 'mild|moderate|severe',
            description: 'string',
            affectedAreaPercentage: 'number (0-100)',
          },
        ],
        recommendations: [
          {
            priority: 'low|medium|high|urgent',
            category: 'string',
            action: 'string',
            reason: 'string',
            estimatedImpact: 'string',
            timeframe: 'string',
          },
        ],
        imageAnalysis: {
          dominantColors: ['string'],
          vegetationCoverage: 'number (0-100)',
          anomalies: [
            {
              type: 'string',
              location: { x: 'number', y: 'number', width: 'number', height: 'number' },
              severity: 'mild|moderate|severe',
              description: 'string',
            },
          ],
        },
        overallConfidence: 'number (0-1)',
      },
      null,
      2
    ),
    '```',
  );

  return parts.join('\n');
}

interface CropAnalysisResult {
  healthScore: number;
  healthStatus: HealthStatus;
  growthStage: GrowthStage;
  ndviEstimate: number;
  diseases: {
    name: string;
    type: DiseaseIdentification['diseaseType'];
    severity: DiseaseIdentification['severity'];
    confidence: number;
    affectedAreaPercentage: number;
    symptoms: string[];
  }[];
  stressIndicators: {
    type: StressIndicator['type'];
    severity: StressIndicator['severity'];
    description: string;
    affectedAreaPercentage: number;
  }[];
  recommendations: {
    priority: CropRecommendation['priority'];
    category: string;
    action: string;
    reason: string;
    estimatedImpact: string;
    timeframe: string;
  }[];
  imageAnalysis?: {
    dominantColors: string[];
    vegetationCoverage: number;
    anomalies: ImageAnomaly[];
  };
  overallConfidence: number;
}

function mapToCropHealthReport(
  analysis: CropAnalysisResult,
  input: CropAnalysisInput
): CropHealthReport {
  return {
    id: crypto.randomUUID(),
    cropType: input.cropType,
    growthStage: analysis.growthStage,
    healthStatus: analysis.healthStatus,
    healthScore: analysis.healthScore,
    ndvi: {
      value: analysis.ndviEstimate,
      classification: classifyNDVI(analysis.ndviEstimate),
      timestamp: new Date(),
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      source: 'satellite',
    },
    diseases: analysis.diseases.map((d) => ({
      diseaseType: d.type,
      name: d.name,
      severity: d.severity,
      confidence: d.confidence,
      affectedAreaPercentage: d.affectedAreaPercentage,
      symptoms: d.symptoms,
      treatment: [],
      spreadRisk: d.severity === 'critical' ? 'critical' : d.severity === 'severe' ? 'high' : d.severity === 'moderate' ? 'medium' : 'low',
      detectedAt: new Date(),
    })),
    stressIndicators: analysis.stressIndicators.map((s) => ({
      type: s.type,
      severity: s.severity,
      description: s.description,
      affectedAreaPercentage: s.affectedAreaPercentage,
    })),
    recommendations: analysis.recommendations.map((r) => ({
      priority: r.priority,
      category: r.category,
      action: r.action,
      reason: r.reason,
      estimatedImpact: r.estimatedImpact,
      timeframe: r.timeframe,
    })),
    imageAnalysis: analysis.imageAnalysis
      ? {
          dominantColors: analysis.imageAnalysis.dominantColors,
          vegetationCoverage: analysis.imageAnalysis.vegetationCoverage,
          anomalies: analysis.imageAnalysis.anomalies,
          overallQuality: analysis.healthScore,
        }
      : undefined,
    confidence: analysis.overallConfidence,
    analyzedAt: new Date(),
    location: input.location,
  };
}

// ---------------------------------------------------------------------------
// Comprehensive Crop Health Analysis (Orchestrator)
// ---------------------------------------------------------------------------

export interface ComprehensiveAnalysisRequest {
  cropType: CropType;
  location: { latitude: number; longitude: number };
  plantingDate: Date;
  imageData?: string;
  ndviMeasurements?: NDVIData[];
  soilData?: { ph: number; moisture: number; temperature: number; nutrients: string };
  recentWeather?: string;
  previousIssues?: string[];
  irrigationType?: string;
}

export async function performComprehensiveAnalysis(
  request: ComprehensiveAnalysisRequest,
  provider?: ProviderName
): Promise<CropHealthReport> {
  const providerName = provider || config.defaultProvider;
  const daysSincePlanting = Math.floor(
    (Date.now() - new Date(request.plantingDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentNDVI = 0.5;
  let ndviSeries: NDVIData[] = [];

  if (request.ndviMeasurements && request.ndviMeasurements.length > 0) {
    ndviSeries = request.ndviMeasurements;
    currentNDVI = request.ndviMeasurements[request.ndviMeasurements.length - 1].value;
  }

  const growthInput: GrowthStageInput = {
    cropType: request.cropType,
    plantingDate: request.plantingDate,
    currentNDVI,
    daysSincePlanting: daysSincePlanting,
    temperatureAccumulation: daysSincePlanting * 15,
  };

  const growthResult = detectGrowthStage(growthInput);

  let imageReport: CropHealthReport | null = null;
  if (request.imageData) {
    imageReport = await analyzeCropImage(
      {
        imageData: request.imageData,
        cropType: request.cropType,
        location: request.location,
        plantingDate: request.plantingDate,
        recentWeather: request.recentWeather,
        previousTreatments: request.previousIssues,
      },
      providerName
    );
  }

  const systemPrompt = `You are an expert crop health advisor. Based on the provided data, generate a comprehensive crop health report with treatment recommendations. Respond in valid JSON.`;

  const analysisData = {
    cropType: request.cropType,
    daysSincePlanting,
    growthStage: growthResult.stage,
    ndvi: currentNDVI,
    ndviTrend: ndviSeries.length > 1 ? analyzeNDVISeries(ndviSeries).trend : 'stable',
    soilData: request.soilData || 'not available',
    weather: request.recentWeather || 'not available',
    previousIssues: request.previousIssues || [],
    imageAnalysis: imageReport
      ? {
          healthScore: imageReport.healthScore,
          diseases: imageReport.diseases,
          stressIndicators: imageReport.stressIndicators,
        }
      : 'no image analysis',
  };

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Generate a comprehensive crop health report for:\n${JSON.stringify(analysisData, null, 2)}\n\nProvide detailed JSON with healthScore, healthStatus, diseases, stressIndicators, recommendations, and confidence.`,
    },
  ];

  const response = await generateText(providerName, messages, {
    temperature: 0.3,
    maxTokens: 4096,
  });

  const aiResult = extractJSON<Partial<CropAnalysisResult>>(response);

  const stressIndicators: StressIndicator[] = [
    ...(aiResult.stressIndicators || []).map((s) => ({
      type: s.type as StressIndicator['type'],
      severity: s.severity as StressIndicator['severity'],
      description: s.description,
      affectedAreaPercentage: s.affectedAreaPercentage,
    })),
  ];

  const diseases: DiseaseIdentification[] = [
    ...(aiResult.diseases || []).map((d) => ({
      diseaseType: d.type as DiseaseType,
      name: d.name,
      severity: d.severity as DiseaseIdentification['severity'],
      confidence: d.confidence,
      affectedAreaPercentage: d.affectedAreaPercentage,
      symptoms: d.symptoms,
      treatment: [],
      spreadRisk: (d.severity === 'critical' ? 'critical' : d.severity === 'severe' ? 'high' : 'medium') as DiseaseIdentification['spreadRisk'],
      detectedAt: new Date(),
    })),
  ];

  const health = assessHealthStatus(currentNDVI, growthResult.stage, stressIndicators, diseases);

  return {
    id: crypto.randomUUID(),
    cropType: request.cropType,
    growthStage: growthResult.stage,
    healthStatus: aiResult.healthStatus || health.status,
    healthScore: aiResult.healthScore || health.score,
    ndvi: {
      value: currentNDVI,
      classification: classifyNDVI(currentNDVI),
      timestamp: new Date(),
      latitude: request.location.latitude,
      longitude: request.location.longitude,
      source: 'satellite',
    },
    diseases,
    stressIndicators,
    recommendations: (aiResult.recommendations || []).map((r) => ({
      priority: r.priority as CropRecommendation['priority'],
      category: r.category,
      action: r.action,
      reason: r.reason,
      estimatedImpact: r.estimatedImpact,
      timeframe: r.timeframe,
    })),
    confidence: aiResult.overallConfidence || health.score,
    analyzedAt: new Date(),
    location: request.location,
  };
}

// ---------------------------------------------------------------------------
// Batch Analysis
// ---------------------------------------------------------------------------

export async function batchAnalyzeFields(
  fields: ComprehensiveAnalysisRequest[],
  concurrency: number = 3,
  provider?: ProviderName
): Promise<{ fieldIndex: number; report: CropHealthReport; error?: string }[]> {
  const results: { fieldIndex: number; report: CropHealthReport; error?: string }[] = [];
  const queue = fields.map((f, i) => ({ field: f, index: i }));

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        const report = await performComprehensiveAnalysis(item.field, provider);
        results.push({ fieldIndex: item.index, report });
      } catch (err) {
        results.push({
          fieldIndex: item.index,
          error: (err as Error).message,
          report: {
            id: crypto.randomUUID(),
            cropType: item.field.cropType,
            growthStage: 'vegetative',
            healthStatus: 'critical',
            healthScore: 0,
            ndvi: {
              value: 0,
              classification: 'bare_soil',
              timestamp: new Date(),
              latitude: item.field.location.latitude,
              longitude: item.field.location.longitude,
              source: 'satellite',
            },
            diseases: [],
            stressIndicators: [],
            recommendations: [],
            confidence: 0,
            analyzedAt: new Date(),
            location: item.field.location,
          },
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, fields.length) }, () => processNext());
  await Promise.all(workers);

  return results.sort((a, b) => a.fieldIndex - b.fieldIndex);
}
