// ============================================================================
// AI Agriculture Platform - Yield Prediction Service
// Yield forecasting models, weather impact, soil factor analysis
// ============================================================================

import { generateText, extractJSON, type ChatMessage } from './provider';
import type {
  ProviderName,
  CropType,
  YieldPredictionRequest,
  YieldPredictionResult,
  YieldFactor,
  YieldScenario,
  YieldRecommendation,
  YieldRisk,
  YieldTimeline,
  SoilData,
  WeatherForecastData,
  HistoricalYield,
  FertilizerData,
  GrowthStage,
} from '../../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface YieldPredictionConfig {
  defaultProvider: ProviderName;
  fallbackProvider?: ProviderName;
  analysisTimeout: number;
  modelVersion: string;
  confidenceLevel: number;
}

const defaultConfig: YieldPredictionConfig = {
  defaultProvider: 'openai',
  analysisTimeout: 90000,
  modelVersion: '2.0',
  confidenceLevel: 0.95,
};

let config: YieldPredictionConfig = { ...defaultConfig };

export function configureYieldPrediction(overrides: Partial<YieldPredictionConfig>): void {
  config = { ...config, ...overrides };
}

// ---------------------------------------------------------------------------
// Yield Models Database
// ---------------------------------------------------------------------------

interface CropYieldModel {
  cropType: CropType;
  baseYieldPerHectare: number;
  unit: 'tons_per_hectare' | 'bushels_per_acre';
  optimalConditions: {
    temperatureRange: [number, number];
    precipitationRange: [number, number];
    phRange: [number, number];
    organicMatterRange: [number, number];
  };
  growthStageWeights: Record<GrowthStage, number>;
  stressTolerance: {
    drought: number;
    flood: number;
    heat: number;
    cold: number;
  };
  historicalBenchmarks: {
    globalAverage: number;
    topQuartile: number;
    topDecile: number;
  };
}

const CROP_MODELS: Record<CropType, CropYieldModel> = {
  wheat: {
    cropType: 'wheat',
    baseYieldPerHectare: 3.5,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [15, 25],
      precipitationRange: [450, 650],
      phRange: [6.0, 7.5],
      organicMatterRange: [2.5, 4.0],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0.15,
      flowering: 0.25,
      fruiting: 0.2,
      ripening: 0.1,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.6, flood: 0.3, heat: 0.5, cold: 0.7 },
    historicalBenchmarks: { globalAverage: 3.5, topQuartile: 5.0, topDecile: 7.0 },
  },
  corn: {
    cropType: 'corn',
    baseYieldPerHectare: 9.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [20, 30],
      precipitationRange: [500, 800],
      phRange: [5.8, 7.0],
      organicMatterRange: [2.0, 3.5],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.25,
      budding: 0.15,
      flowering: 0.3,
      fruiting: 0.15,
      ripening: 0.08,
      harvest_ready: 0.02,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.5, flood: 0.3, heat: 0.6, cold: 0.3 },
    historicalBenchmarks: { globalAverage: 9.0, topQuartile: 12.0, topDecile: 15.0 },
  },
  rice: {
    cropType: 'rice',
    baseYieldPerHectare: 4.5,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [22, 32],
      precipitationRange: [1000, 2000],
      phRange: [5.5, 7.0],
      organicMatterRange: [2.0, 3.5],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0.15,
      flowering: 0.25,
      fruiting: 0.2,
      ripening: 0.1,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.3, flood: 0.7, heat: 0.5, cold: 0.3 },
    historicalBenchmarks: { globalAverage: 4.5, topQuartile: 6.5, topDecile: 9.0 },
  },
  soybean: {
    cropType: 'soybean',
    baseYieldPerHectare: 2.8,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [20, 30],
      precipitationRange: [450, 700],
      phRange: [6.0, 7.0],
      organicMatterRange: [2.5, 4.0],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0.15,
      flowering: 0.25,
      fruiting: 0.2,
      ripening: 0.1,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.5, flood: 0.3, heat: 0.5, cold: 0.5 },
    historicalBenchmarks: { globalAverage: 2.8, topQuartile: 3.8, topDecile: 5.0 },
  },
  cotton: {
    cropType: 'cotton',
    baseYieldPerHectare: 2.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [25, 35],
      precipitationRange: [500, 1000],
      phRange: [5.8, 7.0],
      organicMatterRange: [1.5, 3.0],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0.15,
      flowering: 0.25,
      fruiting: 0.2,
      ripening: 0.1,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.6, flood: 0.2, heat: 0.7, cold: 0.3 },
    historicalBenchmarks: { globalAverage: 2.0, topQuartile: 2.8, topDecile: 3.5 },
  },
  potato: {
    cropType: 'potato',
    baseYieldPerHectare: 20.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [15, 22],
      precipitationRange: [500, 700],
      phRange: [5.0, 6.0],
      organicMatterRange: [3.0, 5.0],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0,
      flowering: 0.2,
      fruiting: 0.3,
      ripening: 0.15,
      harvest_ready: 0.1,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.4, flood: 0.3, heat: 0.3, cold: 0.6 },
    historicalBenchmarks: { globalAverage: 20.0, topQuartile: 30.0, topDecile: 45.0 },
  },
  tomato: {
    cropType: 'tomato',
    baseYieldPerHectare: 60.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [20, 28],
      precipitationRange: [400, 600],
      phRange: [6.0, 6.8],
      organicMatterRange: [3.0, 5.0],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.15,
      budding: 0,
      flowering: 0.25,
      fruiting: 0.3,
      ripening: 0.15,
      harvest_ready: 0.1,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.4, flood: 0.3, heat: 0.5, cold: 0.3 },
    historicalBenchmarks: { globalAverage: 60.0, topQuartile: 80.0, topDecile: 100.0 },
  },
  maize: {
    cropType: 'maize',
    baseYieldPerHectare: 9.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [20, 30],
      precipitationRange: [500, 800],
      phRange: [5.8, 7.0],
      organicMatterRange: [2.0, 3.5],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.25,
      budding: 0.15,
      flowering: 0.3,
      fruiting: 0.15,
      ripening: 0.08,
      harvest_ready: 0.02,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.5, flood: 0.3, heat: 0.6, cold: 0.3 },
    historicalBenchmarks: { globalAverage: 9.0, topQuartile: 12.0, topDecile: 15.0 },
  },
  barley: {
    cropType: 'barley',
    baseYieldPerHectare: 3.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [12, 22],
      precipitationRange: [350, 550],
      phRange: [6.0, 7.5],
      organicMatterRange: [2.0, 3.5],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0,
      flowering: 0.25,
      fruiting: 0.2,
      ripening: 0.15,
      harvest_ready: 0.15,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.7, flood: 0.3, heat: 0.5, cold: 0.7 },
    historicalBenchmarks: { globalAverage: 3.0, topQuartile: 4.5, topDecile: 6.0 },
  },
  sunflower: {
    cropType: 'sunflower',
    baseYieldPerHectare: 2.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [20, 30],
      precipitationRange: [400, 650],
      phRange: [6.0, 7.5],
      organicMatterRange: [2.0, 3.5],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0,
      flowering: 0.3,
      fruiting: 0.25,
      ripening: 0.15,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.6, flood: 0.2, heat: 0.6, cold: 0.4 },
    historicalBenchmarks: { globalAverage: 2.0, topQuartile: 2.8, topDecile: 3.5 },
  },
  sugarcane: {
    cropType: 'sugarcane',
    baseYieldPerHectare: 70.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [25, 35],
      precipitationRange: [1500, 2500],
      phRange: [5.5, 7.5],
      organicMatterRange: [2.0, 3.5],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.4,
      budding: 0,
      flowering: 0,
      fruiting: 0,
      ripening: 0.3,
      harvest_ready: 0.25,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.5, flood: 0.4, heat: 0.7, cold: 0.2 },
    historicalBenchmarks: { globalAverage: 70.0, topQuartile: 90.0, topDecile: 120.0 },
  },
  coffee: {
    cropType: 'coffee',
    baseYieldPerHectare: 1.5,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [18, 24],
      precipitationRange: [1200, 2000],
      phRange: [5.0, 6.5],
      organicMatterRange: [3.0, 5.0],
    },
    growthStageWeights: {
      seedling: 0.1,
      vegetative: 0.3,
      budding: 0,
      flowering: 0.2,
      fruiting: 0.25,
      ripening: 0.1,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.4, flood: 0.3, heat: 0.3, cold: 0.5 },
    historicalBenchmarks: { globalAverage: 1.5, topQuartile: 2.5, topDecile: 4.0 },
  },
  cocoa: {
    cropType: 'cocoa',
    baseYieldPerHectare: 0.5,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [22, 30],
      precipitationRange: [1500, 2500],
      phRange: [5.0, 7.0],
      organicMatterRange: [3.0, 5.0],
    },
    growthStageWeights: {
      seedling: 0.1,
      vegetative: 0.3,
      budding: 0,
      flowering: 0.2,
      fruiting: 0.25,
      ripening: 0.1,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.3, flood: 0.3, heat: 0.4, cold: 0.4 },
    historicalBenchmarks: { globalAverage: 0.5, topQuartile: 0.8, topDecile: 1.2 },
  },
  tea: {
    cropType: 'tea',
    baseYieldPerHectare: 2.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [15, 25],
      precipitationRange: [1500, 2500],
      phRange: [4.5, 5.5],
      organicMatterRange: [3.0, 5.0],
    },
    growthStageWeights: {
      seedling: 0.1,
      vegetative: 0.5,
      budding: 0,
      flowering: 0.15,
      fruiting: 0.15,
      ripening: 0.05,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.4, flood: 0.3, heat: 0.4, cold: 0.5 },
    historicalBenchmarks: { globalAverage: 2.0, topQuartile: 3.0, topDecile: 4.5 },
  },
  vegetable: {
    cropType: 'vegetable',
    baseYieldPerHectare: 30.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [18, 28],
      precipitationRange: [400, 700],
      phRange: [6.0, 7.0],
      organicMatterRange: [3.0, 5.0],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0,
      flowering: 0.25,
      fruiting: 0.3,
      ripening: 0.15,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.4, flood: 0.3, heat: 0.4, cold: 0.5 },
    historicalBenchmarks: { globalAverage: 30.0, topQuartile: 45.0, topDecile: 60.0 },
  },
  fruit: {
    cropType: 'fruit',
    baseYieldPerHectare: 25.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [18, 28],
      precipitationRange: [500, 900],
      phRange: [5.5, 7.0],
      organicMatterRange: [2.5, 4.5],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0,
      flowering: 0.25,
      fruiting: 0.3,
      ripening: 0.15,
      harvest_ready: 0.05,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.4, flood: 0.3, heat: 0.4, cold: 0.5 },
    historicalBenchmarks: { globalAverage: 25.0, topQuartile: 35.0, topDecile: 50.0 },
  },
  unknown: {
    cropType: 'unknown',
    baseYieldPerHectare: 5.0,
    unit: 'tons_per_hectare',
    optimalConditions: {
      temperatureRange: [18, 28],
      precipitationRange: [500, 800],
      phRange: [6.0, 7.0],
      organicMatterRange: [2.5, 4.0],
    },
    growthStageWeights: {
      seedling: 0.05,
      vegetative: 0.2,
      budding: 0.1,
      flowering: 0.2,
      fruiting: 0.2,
      ripening: 0.15,
      harvest_ready: 0.1,
      post_harvest: 0,
    },
    stressTolerance: { drought: 0.5, flood: 0.3, heat: 0.5, cold: 0.5 },
    historicalBenchmarks: { globalAverage: 5.0, topQuartile: 7.0, topDecile: 10.0 },
  },
};

// ---------------------------------------------------------------------------
// Statistical Yield Model (Non-AI Baseline)
// ---------------------------------------------------------------------------

interface YieldModelFactors {
  soilScore: number;
  weatherScore: number;
  managementScore: number;
  historicalScore: number;
  pestScore: number;
}

function calculateSoilScore(soil: SoilData, model: CropYieldModel): number {
  let score = 0;

  const [phMin, phMax] = model.optimalConditions.phRange;
  const phMid = (phMin + phMax) / 2;
  const phDist = Math.abs(soil.ph - phMid) / ((phMax - phMin) / 2);
  score += Math.max(0, 1 - phDist) * 0.25;

  const [omMin, omMax] = model.optimalConditions.organicMatterRange;
  const omMid = (omMin + omMax) / 2;
  const omDist = Math.abs(soil.organicMatter - omMid) / ((omMax - omMin) / 2);
  score += Math.max(0, 1 - omDist) * 0.2;

  const nScore = Math.min(soil.nitrogen / 200, 1);
  score += nScore * 0.2;

  const pScore = Math.min(soil.phosphorus / 50, 1);
  score += pScore * 0.15;

  const kScore = Math.min(soil.potassium / 200, 1);
  score += kScore * 0.1;

  const moistureScore = soil.moisture > 20 && soil.moisture < 80 ? 1 : 0.5;
  score += moistureScore * 0.1;

  return Math.min(score, 1);
}

function calculateWeatherScore(
  weather: WeatherForecastData[],
  model: CropYieldModel
): number {
  if (weather.length === 0) return 0.5;

  let score = 0;
  const [tMin, tMax] = model.optimalConditions.temperatureRange;
  const [pMin, pMax] = model.optimalConditions.precipitationRange;

  const avgTemp =
    weather.reduce((sum, w) => sum + w.temperature.avg, 0) / weather.length;
  const tempMid = (tMin + tMax) / 2;
  const tempDist = Math.abs(avgTemp - tempMid) / ((tMax - tMin) / 2);
  score += Math.max(0, 1 - tempDist) * 0.3;

  const totalPrecip = weather.reduce((sum, w) => sum + w.precipitation, 0);
  const precipMid = (pMin + pMax) / 2;
  const precipDist = Math.abs(totalPrecip - precipMid) / ((pMax - pMin) / 2);
  score += Math.max(0, 1 - precipDist) * 0.25;

  const avgHumidity = weather.reduce((sum, w) => sum + w.humidity, 0) / weather.length;
  const humidityScore = avgHumidity > 40 && avgHumidity < 85 ? 1 : 0.6;
  score += humidityScore * 0.15;

  const avgSolar = weather.reduce((sum, w) => sum + w.solarRadiation, 0) / weather.length;
  const solarScore = avgSolar > 15 && avgSolar < 30 ? 1 : 0.7;
  score += solarScore * 0.15;

  const frostDays = weather.filter((w) => w.frostRisk).length;
  const frostPenalty = frostDays * 0.05;
  score += Math.max(0, 0.15 - frostPenalty);

  return Math.min(score, 1);
}

function calculateManagementScore(request: YieldPredictionRequest): number {
  let score = 0.5;

  const irrigationBonus: Record<string, number> = {
    drip: 0.2,
    sprinkler: 0.15,
    center_pivot: 0.15,
    flood: 0.05,
    rainfed: 0,
  };
  score += irrigationBonus[request.irrigationType] || 0;

  if (request.fertilizerUsage && request.fertilizerUsage.length > 0) {
    score += Math.min(request.fertilizerUsage.length * 0.05, 0.15);
  }

  if (request.pestPressure !== undefined) {
    score -= request.pestPressure * 0.2;
  }

  return Math.max(0, Math.min(score, 1));
}

function calculateHistoricalScore(historical: HistoricalYield[]): number {
  if (historical.length === 0) return 0.5;

  const recent = historical.slice(-5);
  const avgYield = recent.reduce((sum, h) => sum + h.yieldPerHectare, 0) / recent.length;

  const variance =
    recent.reduce((sum, h) => sum + Math.pow(h.yieldPerHectare - avgYield, 2), 0) /
    recent.length;
  const consistency = Math.max(0, 1 - Math.sqrt(variance) / avgYield);

  const trend =
    recent.length >= 2
      ? recent[recent.length - 1].yieldPerHectare - recent[0].yieldPerHectare
      : 0;
  const trendScore = trend > 0 ? Math.min(trend / avgYield + 0.5, 1) : 0.5 + trend / avgYield;

  return consistency * 0.6 + trendScore * 0.4;
}

function calculatePestScore(
  pestPressure: number | undefined,
  weather: WeatherForecastData[]
): number {
  if (pestPressure !== undefined) {
    return Math.max(0, 1 - pestPressure);
  }

  if (weather.length === 0) return 0.7;

  const avgTemp = weather.reduce((sum, w) => sum + w.temperature.avg, 0) / weather.length;
  const avgHumidity = weather.reduce((sum, w) => sum + w.humidity, 0) / weather.length;

  let risk = 0;
  if (avgTemp > 25 && avgTemp < 35) risk += 0.3;
  if (avgHumidity > 70) risk += 0.3;

  return Math.max(0.2, 1 - risk);
}

// ---------------------------------------------------------------------------
// Main Prediction Engine
// ---------------------------------------------------------------------------

function statisticalYieldPrediction(
  request: YieldPredictionRequest,
  model: CropYieldModel
): { predictedYield: number; factors: YieldModelFactors; confidence: number } {
  const soilScore = request.soilData ? calculateSoilScore(request.soilData, model) : 0.5;
  const weatherScore = request.weatherData
    ? calculateWeatherScore(request.weatherData, model)
    : 0.5;
  const managementScore = calculateManagementScore(request);
  const historicalScore = request.historicalYields
    ? calculateHistoricalScore(request.historicalYields)
    : 0.5;
  const pestScore = calculatePestScore(request.pestPressure, request.weatherData || []);

  const factors: YieldModelFactors = {
    soilScore,
    weatherScore,
    managementScore,
    historicalScore,
    pestScore,
  };

  const weights = { soil: 0.25, weather: 0.25, management: 0.2, historical: 0.2, pest: 0.1 };
  const weightedScore =
    soilScore * weights.soil +
    weatherScore * weights.weather +
    managementScore * weights.management +
    historicalScore * weights.historical +
    pestScore * weights.pest;

  const predictedYield = model.baseYieldPerHectare * weightedScore * 2;

  const hasAllData = request.soilData && request.weatherData && request.historicalYields;
  const confidence = hasAllData ? 0.75 + weightedScore * 0.15 : 0.5 + weightedScore * 0.2;

  return { predictedYield, factors, confidence };
}

// ---------------------------------------------------------------------------
// AI-Enhanced Prediction
// ---------------------------------------------------------------------------

const YIELD_PREDICTION_SYSTEM_PROMPT = `You are an expert agricultural yield prediction AI. 
You analyze soil data, weather patterns, crop conditions, and historical yields to predict crop output.
Provide detailed, data-driven predictions with confidence intervals and actionable recommendations.
Always respond with valid JSON. Be precise with numbers and provide reasoning for predictions.`;

function buildYieldPredictionPrompt(
  request: YieldPredictionRequest,
  statisticalResult: { predictedYield: number; factors: YieldModelFactors; confidence: number }
): string {
  const parts = [
    'Predict crop yield based on the following data:',
    '',
    `**Crop Type:** ${request.cropType}`,
    `**Field Area:** ${request.fieldArea} ${request.fieldAreaUnit}`,
    `**Planting Date:** ${request.plantingDate.toISOString().split('T')[0]}`,
    `**Irrigation Type:** ${request.irrigationType}`,
    `**Location:** ${request.location.latitude}, ${request.location.longitude}`,
    '',
  ];

  if (request.soilData) {
    parts.push(
      '**Soil Data:**',
      `- pH: ${request.soilData.ph}`,
      `- Organic Matter: ${request.soilData.organicMatter}%`,
      `- Nitrogen: ${request.soilData.nitrogen} ppm`,
      `- Phosphorus: ${request.soilData.phosphorus} ppm`,
      `- Potassium: ${request.soilData.potassium} ppm`,
      `- Moisture: ${request.soilData.moisture}%`,
      `- Texture: ${request.soilData.texture}`,
      `- Depth: ${request.soilData.depth} cm`,
      ''
    );
  }

  if (request.weatherData && request.weatherData.length > 0) {
    parts.push('**Weather Forecast Data:**');
    for (const w of request.weatherData.slice(0, 14)) {
      parts.push(
        `- ${new Date(w.date).toISOString().split('T')[0]}: ${w.temperature.min}-${w.temperature.max}°C, precip: ${w.precipitation}mm, humidity: ${w.humidity}%`
      );
    }
    parts.push('');
  }

  if (request.historicalYields && request.historicalYields.length > 0) {
    parts.push('**Historical Yields:**');
    for (const h of request.historicalYields) {
      parts.push(`- ${h.year}: ${h.yieldPerHectare} tons/ha`);
    }
    parts.push('');
  }

  parts.push(
    `**Statistical Model Prediction:** ${statisticalResult.predictedYield.toFixed(2)} tons/ha`,
    `**Factor Scores:**`,
    `- Soil: ${(statisticalResult.factors.soilScore * 100).toFixed(0)}%`,
    `- Weather: ${(statisticalResult.factors.weatherScore * 100).toFixed(0)}%`,
    `- Management: ${(statisticalResult.factors.managementScore * 100).toFixed(0)}%`,
    `- Historical: ${(statisticalResult.factors.historicalScore * 100).toFixed(0)}%`,
    `- Pest Pressure: ${(statisticalResult.factors.pestScore * 100).toFixed(0)}%`,
    '',
    'Provide a comprehensive yield prediction with:',
    '1. Adjusted yield prediction considering all factors',
    '2. Confidence interval (lower and upper bounds)',
    '3. Key yield factors with impact analysis',
    '4. Multiple scenarios (optimistic, expected, pessimistic)',
    '5. Actionable recommendations to improve yield',
    '6. Risk assessment with mitigation strategies',
    '7. Timeline with key milestones',
    '',
    `Respond in this JSON format:`,
    '```json',
    JSON.stringify(
      {
        predictedYield: 'number',
        confidenceInterval: { lower: 'number', upper: 'number' },
        confidence: 'number (0-1)',
        factors: [
          {
            name: 'string',
            impact: 'number (-1 to 1)',
            contribution: 'number (0 to 1)',
            trend: 'positive|negative|neutral',
            description: 'string',
          },
        ],
        scenarios: [
          {
            name: 'string',
            probability: 'number (0-1)',
            predictedYield: 'number',
            conditions: 'string',
            description: 'string',
          },
        ],
        recommendations: [
          {
            category: 'irrigation|fertilizer|pest_management|harvest_timing|soil_management',
            action: 'string',
            expectedImpact: 'number (tons/ha)',
            cost: 'number',
            roi: 'number',
            timeframe: 'string',
            priority: 'low|medium|high',
          },
        ],
        risks: [
          {
            risk: 'string',
            probability: 'number (0-1)',
            potentialImpact: 'number (tons/ha)',
            mitigation: 'string',
            severity: 'low|medium|high|critical',
          },
        ],
        timeline: [
          {
            stage: 'string',
            date: 'ISO date string',
            expectedProgress: 'number (0-100)',
            milestones: ['string'],
          },
        ],
      },
      null,
      2
    ),
    '```',
  );

  return parts.join('\n');
}

export async function predictYield(
  request: YieldPredictionRequest,
  provider?: ProviderName
): Promise<YieldPredictionResult> {
  const providerName = provider || config.defaultProvider;
  const model = CROP_MODELS[request.cropType] || CROP_MODELS.unknown;

  const statisticalResult = statisticalYieldPrediction(request, model);

  const messages: ChatMessage[] = [
    { role: 'system', content: YIELD_PREDICTION_SYSTEM_PROMPT },
    { role: 'user', content: buildYieldPredictionPrompt(request, statisticalResult) },
  ];

  const response = await generateText(providerName, messages, {
    temperature: 0.2,
    maxTokens: 4096,
  });

  const aiResult = extractJSON<Partial<YieldPredictionResult>>(response);

  const areaMultiplier =
    request.fieldAreaUnit === 'hectares' ? 1 : request.fieldAreaUnit === 'acres' ? 0.404686 : 1;

  const finalYield = aiResult.predictedYield || statisticalResult.predictedYield;
  const confidence = aiResult.confidence || statisticalResult.confidence;

  const factors: YieldFactor[] =
    aiResult.factors ||
    Object.entries(statisticalResult.factors).map(([key, value]) => ({
      name: key,
      impact: value - 0.5,
      contribution: value,
      trend: (value > 0.6 ? 'positive' : value < 0.4 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
      description: `${key.replace(/([A-Z])/g, ' $1').trim()} factor`,
    }));

  const scenarios: YieldScenario[] = aiResult.scenarios || [
    {
      name: 'Optimistic',
      probability: 0.2,
      predictedYield: finalYield * 1.2,
      conditions: 'Favorable weather, optimal management',
      description: 'Best case scenario with ideal conditions',
    },
    {
      name: 'Expected',
      probability: 0.6,
      predictedYield: finalYield,
      conditions: 'Normal weather, standard management',
      description: 'Most likely outcome based on current data',
    },
    {
      name: 'Pessimistic',
      probability: 0.2,
      predictedYield: finalYield * 0.8,
      conditions: 'Adverse weather or pest pressure',
      description: 'Worst case scenario with significant challenges',
    },
  ];

  const recommendations: YieldRecommendation[] =
    aiResult.recommendations ||
    generateDefaultRecommendations(statisticalResult.factors, request);

  const risks: YieldRisk[] =
    aiResult.risks ||
    generateDefaultRisks(request, statisticalResult.factors);

  const plantingDate = new Date(request.plantingDate);
  const timeline: YieldTimeline[] =
    aiResult.timeline ||
    generateDefaultTimeline(request.cropType, plantingDate, finalYield);

  return {
    predictedYield: Math.round(finalYield * 100) / 100,
    yieldUnit: model.unit,
    confidenceInterval: aiResult.confidenceInterval || {
      lower: Math.round(finalYield * (1 - (1 - confidence) * 0.5) * 100) / 100,
      upper: Math.round(finalYield * (1 + (1 - confidence) * 0.5) * 100) / 100,
    },
    confidence: Math.round(confidence * 100) / 100,
    factors,
    scenarios,
    recommendations,
    risks,
    timeline,
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Default Generators
// ---------------------------------------------------------------------------

function generateDefaultRecommendations(
  factors: YieldModelFactors,
  request: YieldPredictionRequest
): YieldRecommendation[] {
  const recommendations: YieldRecommendation[] = [];

  if (factors.soilScore < 0.6) {
    recommendations.push({
      category: 'soil_management',
      action: 'Conduct comprehensive soil testing and amend accordingly',
      expectedImpact: 0.5,
      cost: 200,
      roi: 3.5,
      timeframe: '2-4 weeks',
      priority: 'high',
    });
  }

  if (factors.weatherScore < 0.6) {
    recommendations.push({
      category: 'irrigation',
      action: 'Implement supplemental irrigation system',
      expectedImpact: 0.8,
      cost: 500,
      roi: 2.5,
      timeframe: '1-2 weeks',
      priority: 'high',
    });
  }

  if (factors.pestScore < 0.7) {
    recommendations.push({
      category: 'pest_management',
      action: 'Implement integrated pest management program',
      expectedImpact: 0.4,
      cost: 150,
      roi: 4.0,
      timeframe: '1-3 weeks',
      priority: 'medium',
    });
  }

  if (request.irrigationType === 'rainfed') {
    recommendations.push({
      category: 'irrigation',
      action: 'Consider transitioning to drip or sprinkler irrigation',
      expectedImpact: 1.2,
      cost: 2000,
      roi: 2.0,
      timeframe: '1-3 months',
      priority: 'medium',
    });
  }

  recommendations.push({
    category: 'harvest_timing',
    action: 'Optimize harvest timing based on crop maturity indicators',
    expectedImpact: 0.3,
    cost: 50,
    roi: 8.0,
    timeframe: 'At harvest',
    priority: 'low',
  });

  return recommendations;
}

function generateDefaultRisks(
  request: YieldPredictionRequest,
  factors: YieldModelFactors
): YieldRisk[] {
  const risks: YieldRisk[] = [];

  if (request.weatherData) {
    const extremeWeather = request.weatherData.filter(
      (w) => w.frostRisk || w.heatStress
    );
    if (extremeWeather.length > 0) {
      risks.push({
        risk: 'Extreme weather events during critical growth stages',
        probability: Math.min(extremeWeather.length / request.weatherData.length + 0.2, 0.9),
        potentialImpact: -1.5,
        mitigation: 'Implement protective measures (covers, irrigation, windbreaks)',
        severity: 'high',
      });
    }
  }

  if (factors.pestScore < 0.6) {
    risks.push({
      risk: 'Significant pest or disease outbreak',
      probability: 1 - factors.pestScore,
      potentialImpact: -1.0,
      mitigation: 'Regular scouting and proactive pest management',
      severity: 'medium',
    });
  }

  if (!request.irrigationType || request.irrigationType === 'rainfed') {
    risks.push({
      risk: 'Drought stress during critical growth periods',
      probability: 0.4,
      potentialImpact: -2.0,
      mitigation: 'Install irrigation system or improve water retention',
      severity: 'high',
    });
  }

  risks.push({
    risk: 'Market price volatility affecting profitability',
    probability: 0.5,
    potentialImpact: 0,
    mitigation: 'Consider forward contracts or crop insurance',
    severity: 'medium',
  });

  return risks;
}

function generateDefaultTimeline(
  cropType: CropType,
  plantingDate: Date,
  predictedYield: number
): YieldTimeline[] {
  const baseDays = 90;
  const timeline: YieldTimeline[] = [
    {
      stage: 'Establishment',
      date: new Date(plantingDate.getTime() + baseDays * 0.2 * 86400000),
      expectedProgress: 15,
      milestones: ['Germination', 'Seedling emergence', 'Early root development'],
    },
    {
      stage: 'Vegetative Growth',
      date: new Date(plantingDate.getTime() + baseDays * 0.4 * 86400000),
      expectedProgress: 40,
      milestones: ['Leaf expansion', 'Stem elongation', 'Canopy development'],
    },
    {
      stage: 'Reproductive',
      date: new Date(plantingDate.getTime() + baseDays * 0.65 * 86400000),
      expectedProgress: 70,
      milestones: ['Flowering', 'Pollination', 'Grain fill initiation'],
    },
    {
      stage: 'Maturation',
      date: new Date(plantingDate.getTime() + baseDays * 0.85 * 86400000),
      expectedProgress: 90,
      milestones: ['Grain fill completion', 'Moisture decline', 'Maturity indicators'],
    },
    {
      stage: 'Harvest',
      date: new Date(plantingDate.getTime() + baseDays * 86400000),
      expectedProgress: 100,
      milestones: ['Optimal harvest window', 'Post-harvest handling', 'Storage'],
    },
  ];

  return timeline;
}

// ---------------------------------------------------------------------------
// Multi-Crop Comparative Analysis
// ---------------------------------------------------------------------------

export async function compareCropYields(
  requests: YieldPredictionRequest[],
  provider?: ProviderName
): Promise<{
  rankings: { cropType: CropType; predictedYield: number; rank: number; roi: number }[];
  bestChoice: CropType;
  analysis: string;
}> {
  const results = await Promise.all(requests.map((r) => predictYield(r, provider)));

  const rankings = results
    .map((r, i) => ({
      cropType: requests[i].cropType,
      predictedYield: r.predictedYield,
      rank: 0,
      roi:
        r.recommendations.reduce((sum, rec) => sum + rec.expectedImpact, 0) /
        Math.max(
          1,
          r.recommendations.reduce((sum, rec) => sum + rec.cost, 0)
        ),
    }))
    .sort((a, b) => b.predictedYield - a.predictedYield)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const bestChoice = rankings[0].cropType;

  return {
    rankings,
    bestChoice,
    analysis: `Based on predictive modeling, ${bestChoice} shows the highest yield potential at ${rankings[0].predictedYield.toFixed(2)} tons/ha across the analyzed conditions.`,
  };
}

// ---------------------------------------------------------------------------
// Seasonal Yield Report
// ---------------------------------------------------------------------------

export async function generateSeasonalReport(
  request: YieldPredictionRequest,
  additionalFactors: {
    laborAvailability?: number;
    equipmentAvailability?: number;
    budget?: number;
    marketPrices?: { crop: string; price: number }[];
  } = {},
  provider?: ProviderName
): Promise<{
  summary: string;
  yieldPrediction: YieldPredictionResult;
  financialProjection: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    breakEvenYield: number;
    roi: number;
  };
  actionPlan: { phase: string; actions: string[]; timeline: string }[];
}> {
  const yieldPrediction = await predictYield(request, provider);

  const areaInHectares =
    request.fieldAreaUnit === 'hectares'
      ? request.fieldArea
      : request.fieldArea * 0.404686;

  const totalYield = yieldPrediction.predictedYield * areaInHectares;

  const marketPrice =
    additionalFactors.marketPrices?.find((m) => m.crop === request.cropType)?.price || 200;

  const totalRevenue = totalYield * marketPrice;
  const estimatedCosts = areaInHectares * 800;
  const netProfit = totalRevenue - estimatedCosts;
  const breakEvenYield = estimatedCosts / marketPrice / areaInHectares;

  const financialProjection = {
    totalRevenue: Math.round(totalRevenue),
    totalCosts: Math.round(estimatedCosts),
    netProfit: Math.round(netProfit),
    breakEvenYield: Math.round(breakEvenYield * 100) / 100,
    roi: Math.round((netProfit / estimatedCosts) * 100) / 100,
  };

  const actionPlan = [
    {
      phase: 'Pre-Planting',
      actions: [
        'Conduct soil testing and amendments',
        'Select certified seed variety',
        'Plan irrigation system',
      ],
      timeline: '4-6 weeks before planting',
    },
    {
      phase: 'Planting',
      actions: [
        'Optimize planting density',
        'Apply starter fertilizer',
        'Install monitoring equipment',
      ],
      timeline: 'Planting window',
    },
    {
      phase: 'Growing Season',
      actions: [
        'Monitor crop health via satellite/drone',
        'Implement pest management',
        'Adjust irrigation based on weather',
      ],
      timeline: 'Throughout growing season',
    },
    {
      phase: 'Harvest',
      actions: [
        'Monitor maturity indicators',
        'Optimize harvest timing',
        'Arrange storage and transportation',
      ],
      timeline: '2-4 weeks before harvest',
    },
  ];

  return {
    summary: `Projected yield of ${yieldPrediction.predictedYield.toFixed(2)} tons/ha across ${areaInHectares.toFixed(1)} hectares, generating an estimated net profit of $${financialProjection.netProfit.toLocaleString()} with ${financialProjection.roi.toFixed(1)}x ROI.`,
    yieldPrediction,
    financialProjection,
    actionPlan,
  };
}
