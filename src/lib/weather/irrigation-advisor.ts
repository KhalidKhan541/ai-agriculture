// ============================================================================
// AI Agriculture Platform - Smart Irrigation Advisor Service
// Weather+soil based irrigation recommendations, scheduling, optimization
// ============================================================================

import type {
  CropType,
  GrowthStage,
  SoilData,
  WeatherForecast,
  IrrigationSystemType,
  IrrigationAdvisorRequest,
  IrrigationAdvisorResult,
  IrrigationRecommendation,
  IrrigationSchedule,
  WaterBudget,
  MonitoringPlan,
  EfficiencyMetrics,
  IrrigationAlert,
  IrrigationScenario,
  HistoricalWeatherData,
  IrrigationConstraint,
} from '../../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface IrrigationAdvisorConfig {
  precisionLevel: 'standard' | 'high' | 'precision';
  waterCostDefault: number;
  maxScheduleDays: number;
  enableAIRecommendations: boolean;
}

const defaultConfig: IrrigationAdvisorConfig = {
  precisionLevel: 'high',
  waterCostDefault: 0.005,
  maxScheduleDays: 14,
  enableAIRecommendations: true,
};

let config: IrrigationAdvisorConfig = { ...defaultConfig };

export function configureIrrigationAdvisor(overrides: Partial<IrrigationAdvisorConfig>): void {
  config = { ...config, ...overrides };
}

// ---------------------------------------------------------------------------
// Crop Water Requirements Database
// ---------------------------------------------------------------------------

interface CropWaterProfile {
  cropType: CropType;
  kc: Record<GrowthStage, number>;
  rootingDepth: Record<GrowthStage, number>;
  depletionFraction: number;
  maxYieldFactor: number;
  sensitivityToSalinity: number;
  waterLogLevel: 'low' | 'moderate' | 'high';
  optimalSoilMoisture: [number, number];
  stressThreshold: number;
  permanentWiltingPoint: number;
  fieldCapacity: number;
}

const CROP_WATER_PROFILES: Record<CropType, CropWaterProfile> = {
  wheat: {
    cropType: 'wheat',
    kc: {
      seedling: 0.35,
      vegetative: 0.75,
      budding: 0.85,
      flowering: 1.15,
      fruiting: 1.05,
      ripening: 0.65,
      harvest_ready: 0.35,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 90,
      flowering: 120,
      fruiting: 120,
      ripening: 120,
      harvest_ready: 120,
      post_harvest: 0,
    },
    depletionFraction: 0.55,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 6.0,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [45, 75],
    stressThreshold: 40,
    permanentWiltingPoint: 15,
    fieldCapacity: 38,
  },
  corn: {
    cropType: 'corn',
    kc: {
      seedling: 0.3,
      vegetative: 0.75,
      budding: 1.15,
      flowering: 1.2,
      fruiting: 1.15,
      ripening: 0.75,
      harvest_ready: 0.45,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 100,
      flowering: 130,
      fruiting: 150,
      ripening: 150,
      harvest_ready: 150,
      post_harvest: 0,
    },
    depletionFraction: 0.55,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'high',
    optimalSoilMoisture: [50, 80],
    stressThreshold: 45,
    permanentWiltingPoint: 12,
    fieldCapacity: 35,
  },
  rice: {
    cropType: 'rice',
    kc: {
      seedling: 1.05,
      vegetative: 1.2,
      budding: 1.2,
      flowering: 1.2,
      fruiting: 1.15,
      ripening: 0.9,
      harvest_ready: 0.6,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 20,
      vegetative: 40,
      budding: 50,
      flowering: 60,
      fruiting: 60,
      ripening: 60,
      harvest_ready: 60,
      post_harvest: 0,
    },
    depletionFraction: 0.25,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 2.3,
    waterLogLevel: 'high',
    optimalSoilMoisture: [80, 100],
    stressThreshold: 70,
    permanentWiltingPoint: 0,
    fieldCapacity: 100,
  },
  soybean: {
    cropType: 'soybean',
    kc: {
      seedling: 0.35,
      vegetative: 0.65,
      budding: 0.85,
      flowering: 1.1,
      fruiting: 1.1,
      ripening: 0.75,
      harvest_ready: 0.45,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 50,
      budding: 75,
      flowering: 90,
      fruiting: 100,
      ripening: 100,
      harvest_ready: 100,
      post_harvest: 0,
    },
    depletionFraction: 0.5,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [45, 70],
    stressThreshold: 40,
    permanentWiltingPoint: 13,
    fieldCapacity: 33,
  },
  cotton: {
    cropType: 'cotton',
    kc: {
      seedling: 0.35,
      vegetative: 0.65,
      budding: 0.8,
      flowering: 1.15,
      fruiting: 1.2,
      ripening: 0.8,
      harvest_ready: 0.45,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 90,
      flowering: 120,
      fruiting: 150,
      ripening: 150,
      harvest_ready: 150,
      post_harvest: 0,
    },
    depletionFraction: 0.65,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [40, 70],
    stressThreshold: 35,
    permanentWiltingPoint: 12,
    fieldCapacity: 30,
  },
  potato: {
    cropType: 'potato',
    kc: {
      seedling: 0.4,
      vegetative: 0.75,
      budding: 0,
      flowering: 1.15,
      fruiting: 1.15,
      ripening: 0.85,
      harvest_ready: 0.55,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 20,
      vegetative: 40,
      budding: 50,
      flowering: 60,
      fruiting: 60,
      ripening: 60,
      harvest_ready: 60,
      post_harvest: 0,
    },
    depletionFraction: 0.35,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'high',
    optimalSoilMoisture: [60, 85],
    stressThreshold: 55,
    permanentWiltingPoint: 10,
    fieldCapacity: 30,
  },
  tomato: {
    cropType: 'tomato',
    kc: {
      seedling: 0.4,
      vegetative: 0.7,
      budding: 0,
      flowering: 1.05,
      fruiting: 1.15,
      ripening: 0.85,
      harvest_ready: 0.6,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 20,
      vegetative: 40,
      budding: 50,
      flowering: 70,
      fruiting: 80,
      ripening: 80,
      harvest_ready: 80,
      post_harvest: 0,
    },
    depletionFraction: 0.4,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 2.5,
    waterLogLevel: 'high',
    optimalSoilMoisture: [55, 85],
    stressThreshold: 50,
    permanentWiltingPoint: 11,
    fieldCapacity: 30,
  },
  maize: {
    cropType: 'maize',
    kc: {
      seedling: 0.3,
      vegetative: 0.75,
      budding: 1.15,
      flowering: 1.2,
      fruiting: 1.15,
      ripening: 0.75,
      harvest_ready: 0.45,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 100,
      flowering: 130,
      fruiting: 150,
      ripening: 150,
      harvest_ready: 150,
      post_harvest: 0,
    },
    depletionFraction: 0.55,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'high',
    optimalSoilMoisture: [50, 80],
    stressThreshold: 45,
    permanentWiltingPoint: 12,
    fieldCapacity: 35,
  },
  barley: {
    cropType: 'barley',
    kc: {
      seedling: 0.3,
      vegetative: 0.65,
      budding: 0,
      flowering: 1.1,
      fruiting: 1.05,
      ripening: 0.65,
      harvest_ready: 0.35,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 80,
      flowering: 100,
      fruiting: 100,
      ripening: 100,
      harvest_ready: 100,
      post_harvest: 0,
    },
    depletionFraction: 0.55,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 6.0,
    waterLogLevel: 'low',
    optimalSoilMoisture: [40, 70],
    stressThreshold: 35,
    permanentWiltingPoint: 14,
    fieldCapacity: 36,
  },
  sunflower: {
    cropType: 'sunflower',
    kc: {
      seedling: 0.35,
      vegetative: 0.6,
      budding: 0,
      flowering: 1.1,
      fruiting: 1.05,
      ripening: 0.7,
      harvest_ready: 0.4,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 25,
      vegetative: 50,
      budding: 80,
      flowering: 100,
      fruiting: 120,
      ripening: 120,
      harvest_ready: 120,
      post_harvest: 0,
    },
    depletionFraction: 0.55,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 4.0,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [40, 70],
    stressThreshold: 35,
    permanentWiltingPoint: 13,
    fieldCapacity: 34,
  },
  sugarcane: {
    cropType: 'sugarcane',
    kc: {
      seedling: 0.6,
      vegetative: 0.85,
      budding: 0,
      flowering: 0,
      fruiting: 0,
      ripening: 1.1,
      harvest_ready: 0.75,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 80,
      flowering: 100,
      fruiting: 120,
      ripening: 150,
      harvest_ready: 150,
      post_harvest: 0,
    },
    depletionFraction: 0.65,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'high',
    optimalSoilMoisture: [55, 85],
    stressThreshold: 50,
    permanentWiltingPoint: 10,
    fieldCapacity: 32,
  },
  coffee: {
    cropType: 'coffee',
    kc: {
      seedling: 0.4,
      vegetative: 0.65,
      budding: 0,
      flowering: 0.9,
      fruiting: 1.0,
      ripening: 0.8,
      harvest_ready: 0.55,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 80,
      flowering: 100,
      fruiting: 120,
      ripening: 120,
      harvest_ready: 120,
      post_harvest: 0,
    },
    depletionFraction: 0.4,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [50, 75],
    stressThreshold: 45,
    permanentWiltingPoint: 12,
    fieldCapacity: 35,
  },
  cocoa: {
    cropType: 'cocoa',
    kc: {
      seedling: 0.5,
      vegetative: 0.7,
      budding: 0,
      flowering: 0.95,
      fruiting: 1.0,
      ripening: 0.85,
      harvest_ready: 0.6,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 80,
      flowering: 100,
      fruiting: 120,
      ripening: 120,
      harvest_ready: 120,
      post_harvest: 0,
    },
    depletionFraction: 0.4,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [55, 80],
    stressThreshold: 50,
    permanentWiltingPoint: 12,
    fieldCapacity: 33,
  },
  tea: {
    cropType: 'tea',
    kc: {
      seedling: 0.5,
      vegetative: 0.75,
      budding: 0,
      flowering: 0.95,
      fruiting: 0.9,
      ripening: 0.7,
      harvest_ready: 0.5,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 20,
      vegetative: 40,
      budding: 50,
      flowering: 60,
      fruiting: 60,
      ripening: 60,
      harvest_ready: 60,
      post_harvest: 0,
    },
    depletionFraction: 0.35,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.5,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [60, 85],
    stressThreshold: 55,
    permanentWiltingPoint: 15,
    fieldCapacity: 40,
  },
  vegetable: {
    cropType: 'vegetable',
    kc: {
      seedling: 0.4,
      vegetative: 0.7,
      budding: 0,
      flowering: 1.0,
      fruiting: 1.1,
      ripening: 0.85,
      harvest_ready: 0.6,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 20,
      vegetative: 40,
      budding: 50,
      flowering: 60,
      fruiting: 60,
      ripening: 60,
      harvest_ready: 60,
      post_harvest: 0,
    },
    depletionFraction: 0.4,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 2.0,
    waterLogLevel: 'high',
    optimalSoilMoisture: [55, 80],
    stressThreshold: 50,
    permanentWiltingPoint: 12,
    fieldCapacity: 32,
  },
  fruit: {
    cropType: 'fruit',
    kc: {
      seedling: 0.4,
      vegetative: 0.65,
      budding: 0,
      flowering: 0.9,
      fruiting: 1.0,
      ripening: 0.8,
      harvest_ready: 0.55,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 30,
      vegetative: 60,
      budding: 80,
      flowering: 100,
      fruiting: 120,
      ripening: 120,
      harvest_ready: 120,
      post_harvest: 0,
    },
    depletionFraction: 0.4,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 1.7,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [50, 75],
    stressThreshold: 45,
    permanentWiltingPoint: 12,
    fieldCapacity: 35,
  },
  unknown: {
    cropType: 'unknown',
    kc: {
      seedling: 0.35,
      vegetative: 0.65,
      budding: 0.8,
      flowering: 1.0,
      fruiting: 1.0,
      ripening: 0.75,
      harvest_ready: 0.5,
      post_harvest: 0,
    },
    rootingDepth: {
      seedling: 25,
      vegetative: 50,
      budding: 70,
      flowering: 90,
      fruiting: 100,
      ripening: 100,
      harvest_ready: 100,
      post_harvest: 0,
    },
    depletionFraction: 0.5,
    maxYieldFactor: 1.0,
    sensitivityToSalinity: 2.0,
    waterLogLevel: 'moderate',
    optimalSoilMoisture: [45, 75],
    stressThreshold: 40,
    permanentWiltingPoint: 12,
    fieldCapacity: 33,
  },
};

// ---------------------------------------------------------------------------
// Irrigation System Efficiency Database
// ---------------------------------------------------------------------------

interface IrrigationSystemProfile {
  type: IrrigationSystemType;
  applicationEfficiency: number;
  distributionUniformity: number;
  managementQuality: number;
  deepPercolationLoss: number;
  runoffLoss: number;
  evaporationLoss: number;
  typicalFlowRate: number;
  flowUnit: string;
  laborRequirement: 'low' | 'medium' | 'high';
  maintenanceRequirement: 'low' | 'medium' | 'high';
 适合soilTypes: string[];
}

const IRRIGATION_SYSTEMS: Record<IrrigationSystemType, IrrigationSystemProfile> = {
  drip: {
    type: 'drip',
    applicationEfficiency: 0.9,
    distributionUniformity: 0.85,
    managementQuality: 0.9,
    deepPercolationLoss: 0.05,
    runoffLoss: 0.02,
    evaporationLoss: 0.03,
    typicalFlowRate: 2,
    flowUnit: 'L/hr',
    laborRequirement: 'low',
    maintenanceRequirement: 'medium',
    适合soilTypes: ['sandy', 'loamy', 'clay', 'silty'],
  },
  sprinkler: {
    type: 'sprinkler',
    applicationEfficiency: 0.75,
    distributionUniformity: 0.75,
    managementQuality: 0.8,
    deepPercolationLoss: 0.1,
    runoffLoss: 0.08,
    evaporationLoss: 0.07,
    typicalFlowRate: 20,
    flowUnit: 'L/hr',
    laborRequirement: 'low',
    maintenanceRequirement: 'medium',
    适合soilTypes: ['sandy', 'loamy', 'clay', 'silty'],
  },
  center_pivot: {
    type: 'center_pivot',
    applicationEfficiency: 0.8,
    distributionUniformity: 0.8,
    managementQuality: 0.85,
    deepPercolationLoss: 0.08,
    runoffLoss: 0.05,
    evaporationLoss: 0.07,
    typicalFlowRate: 100,
    flowUnit: 'm³/hr',
    laborRequirement: 'low',
    maintenanceRequirement: 'medium',
    适合soilTypes: ['sandy', 'loamy'],
  },
  flood: {
    type: 'flood',
    applicationEfficiency: 0.5,
    distributionUniformity: 0.6,
    managementQuality: 0.6,
    deepPercolationLoss: 0.25,
    runoffLoss: 0.15,
    evaporationLoss: 0.1,
    typicalFlowRate: 500,
    flowUnit: 'm³/hr',
    laborRequirement: 'high',
    maintenanceRequirement: 'low',
    适合soilTypes: ['clay', 'loamy'],
  },
  furrow: {
    type: 'furrow',
    applicationEfficiency: 0.55,
    distributionUniformity: 0.65,
    managementQuality: 0.65,
    deepPercolationLoss: 0.2,
    runoffLoss: 0.15,
    evaporationLoss: 0.1,
    typicalFlowRate: 50,
    flowUnit: 'L/min',
    laborRequirement: 'high',
    maintenanceRequirement: 'low',
    适合soilTypes: ['loamy', 'clay', 'silty'],
  },
  subsurface: {
    type: 'subsurface',
    applicationEfficiency: 0.85,
    distributionUniformity: 0.8,
    managementQuality: 0.85,
    deepPercolationLoss: 0.08,
    runoffLoss: 0.01,
    evaporationLoss: 0.06,
    typicalFlowRate: 2,
    flowUnit: 'L/hr',
    laborRequirement: 'low',
    maintenanceRequirement: 'high',
    适合soilTypes: ['sandy', 'loamy'],
  },
  manual: {
    type: 'manual',
    applicationEfficiency: 0.6,
    distributionUniformity: 0.5,
    managementQuality: 0.7,
    deepPercolationLoss: 0.15,
    runoffLoss: 0.1,
    evaporationLoss: 0.15,
    typicalFlowRate: 10,
    flowUnit: 'L/min',
    laborRequirement: 'high',
    maintenanceRequirement: 'low',
    适合soilTypes: ['sandy', 'loamy', 'clay', 'silty', 'silty'],
  },
};

// ---------------------------------------------------------------------------
// Core Calculation Functions
// ---------------------------------------------------------------------------

function calculateET0(
  temp: number,
  humidity: number,
  windSpeed: number,
  solarRadiation: number
): number {
  const svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
  const avp = svp * (humidity / 100);
  const delta = (4098 * svp) / Math.pow(temp + 237.3, 2);
  const gamma = 0.0665;
  const netRadiation = solarRadiation * 0.75;
  const windFactor = 0.26 * (1 + 0.54 * windSpeed);

  const et0 = (0.408 * delta * netRadiation + gamma * windFactor * (svp - avp)) / (delta + gamma);
  return Math.max(0, et0);
}

function calculateCropWaterNeed(
  et0: number,
  kc: number,
  area: number,
  areaUnit: 'hectares' | 'acres'
): number {
  const etc = et0 * kc;
  const areaInHectares = areaUnit === 'hectares' ? area : area * 0.404686;
  return etc * areaInHectares;
}

function calculateSoilWaterBalance(
  soil: SoilData,
  cropProfile: CropWaterProfile,
  weather: WeatherForecast
): {
  currentAvailableWater: number;
  deficit: number;
  percentAvailable: number;
  daysUntilStress: number;
} {
  const rootDepth = cropProfile.rootingDepth.vegetative / 100;
  const soilWHC = (cropProfile.fieldCapacity - cropProfile.permanentWiltingPoint) / 100;
  const totalWaterCapacity = soilWHC * rootDepth * 1000;
  const currentAvailable = (soil.moisture - cropProfile.permanentWiltingPoint) / 100 * totalWaterCapacity;
  const depletionAmount = totalWaterCapacity * cropProfile.depletionFraction;
  const deficit = depletionAmount - currentAvailable;

  const dailyET = weather.hourly
    ? weather.hourly.slice(0, 24).reduce((sum, h) => sum + (h.evapotranspiration || 0), 0) / 24
    : 3;

  const daysUntilStress = deficit > 0 ? 0 : Math.floor(Math.abs(currentAvailable - depletionAmount) / Math.max(dailyET, 0.1));

  return {
    currentAvailableWater: Math.round(currentAvailable * 100) / 100,
    deficit: Math.max(0, Math.round(deficit * 100) / 100),
    percentAvailable: Math.round((currentAvailable / totalWaterCapacity) * 100),
    daysUntilStress: Math.max(0, daysUntilStress),
  };
}

// ---------------------------------------------------------------------------
// Main Irrigation Advisor
// ---------------------------------------------------------------------------

export function generateIrrigationRecommendation(
  request: IrrigationAdvisorRequest
): IrrigationAdvisorResult {
  const cropProfile = CROP_WATER_PROFILES[request.cropType] || CROP_WATER_PROFILES.unknown;
  const systemProfile = IRRIGATION_SYSTEMS[request.irrigationSystem] || IRRIGATION_SYSTEMS.drip;

  const weather = request.weatherForecast;
  const currentTemp = weather.current.temperature;
  const currentHumidity = weather.current.humidity;
  const currentWind = weather.current.windSpeed;

  const avgSolarRadiation = weather.hourly
    ? weather.hourly.slice(0, 24).reduce((sum, h) => sum + (h.cloudCover ? 25 * (1 - h.cloudCover / 100) : 15), 0) / 24
    : 15;

  const et0 = calculateET0(currentTemp, currentHumidity, currentWind, avgSolarRadiation);
  const kc = cropProfile.kc[request.growthStage];
  const etc = et0 * kc;

  const waterBalance = request.soilData
    ? calculateSoilWaterBalance(request.soilData, cropProfile, weather)
    : { currentAvailableWater: 0, deficit: 5, percentAvailable: 50, daysUntilStress: 3 };

  const areaInHectares =
    request.fieldAreaUnit === 'hectares' ? request.fieldArea : request.fieldArea * 0.404686;

  const upcomingPrecip = weather.daily
    ? weather.daily.slice(0, 3).reduce((sum, d) => sum + d.precipitation.amount, 0)
    : 0;

  const netWaterNeed = Math.max(0, etc - upcomingPrecip / 3);
  const grossWaterNeed = netWaterNeed / systemProfile.applicationEfficiency;

  const shouldIrrigate = waterBalance.deficit > 0 || waterBalance.percentAvailable < cropProfile.optimalSoilMoisture[0];
  let urgency: IrrigationRecommendation['urgency'] = 'not_needed';

  if (shouldIrrigate) {
    if (waterBalance.daysUntilStress <= 1) urgency = 'immediate';
    else if (waterBalance.daysUntilStress <= 2) urgency = 'within_24h';
    else if (waterBalance.daysUntilStress <= 4) urgency = 'within_48h';
    else urgency = 'within_week';
  }

  const amountMM = grossWaterNeed * 1000;
  const durationMinutes = Math.round((grossWaterNeed * areaInHectares * 10000) / (systemProfile.typicalFlowRate * (systemProfile.flowUnit === 'L/hr' ? 1 / 60 : 1)));

  const timing = generateIrrigationTiming(weather);

  const recommendation: IrrigationRecommendation = {
    shouldIrrigate,
    urgency,
    recommendedAmount: Math.round(amountMM * 10) / 10,
    amountUnit: 'mm',
    duration: Math.max(15, Math.round(durationMinutes / 15) * 15),
    durationUnit: 'minutes',
    timing,
    reasoning: generateIrrigationReasoning(waterBalance, etc, upcomingPrecip, cropProfile),
    expectedSoilMoisture: Math.min(100, waterBalance.percentAvailable + Math.round((amountMM / 10) * 50)),
    waterSavings: shouldIrrigate ? Math.round(grossWaterNeed * 0.15 * 100) : undefined,
  };

  const schedule = generateIrrigationSchedule(request, recommendation, weather, cropProfile);

  const waterBudget = generateWaterBudget(request, grossWaterNeed, systemProfile, cropProfile);

  const monitoring = generateMonitoringPlan(request, cropProfile);

  const efficiency = calculateEfficiencyMetrics(systemProfile, waterBalance, cropProfile);

  const alerts = generateIrrigationAlerts(request, waterBalance, weather, cropProfile);

  const alternativeScenarios = generateAlternativeScenarios(request, grossWaterNeed, cropProfile, systemProfile);

  return {
    recommendation,
    schedule,
    waterBudget,
    monitoring,
    efficiency,
    alerts,
    alternativeScenarios,
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Supporting Generators
// ---------------------------------------------------------------------------

function generateIrrigationTiming(
  weather: WeatherForecast
): { start: Date; end: Date; optimal: boolean }[] {
  const now = new Date();
  const timings: { start: Date; end: Date; optimal: boolean }[] = [];

  const dawn = new Date(now);
  dawn.setHours(5, 0, 0, 0);
  const dawnEnd = new Date(now);
  dawnEnd.setHours(9, 0, 0, 0);
  timings.push({ start: dawn, end: dawnEnd, optimal: true });

  const evening = new Date(now);
  evening.setHours(17, 0, 0, 0);
  const eveningEnd = new Date(now);
  eveningEnd.setHours(21, 0, 0, 0);
  timings.push({ start: evening, end: eveningEnd, optimal: true });

  const midday = new Date(now);
  midday.setHours(10, 0, 0, 0);
  const middayEnd = new Date(now);
  middayEnd.setHours(16, 0, 0, 0);
  timings.push({ start: midday, end: middayEnd, optimal: false });

  return timings;
}

function generateIrrigationReasoning(
  waterBalance: { percentAvailable: number; deficit: number; daysUntilStress: number },
  etc: number,
  upcomingPrecip: number,
  profile: CropWaterProfile
): string {
  const reasons: string[] = [];

  if (waterBalance.percentAvailable < profile.optimalSoilMoisture[0]) {
    reasons.push(
      `Soil moisture at ${waterBalance.percentAvailable}% is below optimal range (${profile.optimalSoilMoisture[0]}-${profile.optimalSoilMoisture[1]}%)`
    );
  }

  if (waterBalance.deficit > 0) {
    reasons.push(`Water deficit of ${waterBalance.deficit.toFixed(1)}mm detected`);
  }

  if (waterBalance.daysUntilStress <= 2) {
    reasons.push(`Crop stress expected within ${waterBalance.daysUntilStress} days without irrigation`);
  }

  reasons.push(`Daily crop water requirement: ${etc.toFixed(1)}mm`);

  if (upcomingPrecip > 5) {
    reasons.push(`Expected precipitation of ${upcomingPrecip.toFixed(1)}mm may reduce irrigation need`);
  }

  return reasons.join('. ') + '.';
}

function generateIrrigationSchedule(
  request: IrrigationAdvisorRequest,
  recommendation: IrrigationRecommendation,
  weather: WeatherForecast,
  profile: CropWaterProfile
): IrrigationSchedule[] {
  const schedule: IrrigationSchedule[] = [];
  if (!recommendation.shouldIrrigate) return schedule;

  const now = new Date();
  const startHour = 5;
  const durationHours = Math.ceil(recommendation.duration / 60);

  for (let day = 0; day < Math.min(config.maxScheduleDays, 7); day++) {
    const date = new Date(now.getTime() + day * 86400000);

    if (day === 0) {
      schedule.push({
        date,
        startTime: `${startHour}:00`,
        endTime: `${startHour + durationHours}:00`,
        amount: recommendation.recommendedAmount,
        unit: recommendation.amountUnit,
        priority: 'high',
        weatherDependent: false,
        notes: 'Initial irrigation to address current deficit',
      });
    } else if (weather.daily && day < weather.daily.length) {
      const dayForecast = weather.daily[day];
      const precipProbability = dayForecast.precipitation.probability;

      if (precipProbability < 30) {
        schedule.push({
          date,
          startTime: `${startHour}:00`,
          endTime: `${startHour + Math.ceil(durationHours * 0.7)}:00`,
          amount: Math.round(recommendation.recommendedAmount * 0.7 * 10) / 10,
          unit: recommendation.amountUnit,
          priority: 'medium',
          weatherDependent: true,
          weatherCondition: `Precipitation probability: ${precipProbability}%`,
          notes: day === 1 ? 'Follow-up irrigation' : undefined,
        });
      } else if (precipProbability > 60) {
        schedule.push({
          date,
          startTime: '06:00',
          endTime: '07:00',
          amount: 0,
          unit: recommendation.amountUnit,
          priority: 'low',
          weatherDependent: true,
          weatherCondition: `High precipitation probability (${precipProbability}%) - irrigation suspended`,
          notes: 'Rain expected - monitoring only',
        });
      }
    }
  }

  return schedule;
}

function generateWaterBudget(
  request: IrrigationAdvisorRequest,
  dailyNeed: number,
  systemProfile: IrrigationSystemProfile,
  cropProfile: CropWaterProfile
): WaterBudget {
  const areaInHectares =
    request.fieldAreaUnit === 'hectares' ? request.fieldArea : request.fieldArea * 0.404686;

  const dailyNeedVolume = dailyNeed * areaInHectares * 10000;
  const weeklyNeed = dailyNeed * 7;
  const seasonalNeed = dailyNeed * 120;

  const currentAllocation = request.maxWaterAllocation || dailyNeed * 30;
  const waterCost = request.waterCostPerUnit || config.waterCostDefault;
  const costEstimate = dailyNeedVolume * waterCost;

  const recommendations: string[] = [];
  if (systemProfile.applicationEfficiency < 0.7) {
    recommendations.push('Consider upgrading to a more efficient irrigation system');
  }
  if (dailyNeed > 8) {
    recommendations.push('High water demand - consider deficit irrigation strategies');
  }

  return {
    dailyNeed: Math.round(dailyNeed * 100) / 100,
    weeklyNeed: Math.round(weeklyNeed * 100) / 100,
    seasonalNeed: Math.round(seasonalNeed * 100) / 100,
    unit: 'mm',
    currentAllocation: Math.round(currentAllocation * 100) / 100,
    remainingAllocation: Math.round((currentAllocation - seasonalNeed) * 100) / 100,
    costEstimate: Math.round(costEstimate),
    costUnit: request.waterCostPerUnit ? 'per unit' : 'USD',
    efficiency: systemProfile.applicationEfficiency,
    recommendations,
  };
}

function generateMonitoringPlan(
  request: IrrigationAdvisorRequest,
  profile: CropWaterProfile
): MonitoringPlan {
  return {
    soilMoistureChecks: [
      {
        frequency: 'Daily during critical growth stages, every 2-3 days otherwise',
        method: 'Tensiometer or soil moisture sensor at root zone depth',
        depth: [profile.rootingDepth.vegetative * 0.3, profile.rootingDepth.vegetative * 0.6, profile.rootingDepth.vegetative],
      },
      {
        frequency: 'Weekly',
        method: 'Manual soil feel test',
        depth: [30, 60],
      },
    ],
    weatherMonitoring: [
      {
        frequency: 'Daily',
        parameters: ['Temperature', 'Humidity', 'Precipitation', 'Wind speed', 'Solar radiation'],
      },
      {
        frequency: 'Hourly during irrigation',
        parameters: ['Wind speed', 'Temperature', 'Relative humidity'],
      },
    ],
    cropMonitoring: [
      {
        frequency: '2-3 times per week',
        indicators: [
          'Leaf color and turgor',
          'Stem diameter variation',
          'Canopy temperature',
          'Growth rate',
        ],
      },
      {
        frequency: 'Weekly',
        indicators: [
          'Chlorophyll content (SPAD)',
          'Leaf water potential',
          'Root development',
        ],
      },
    ],
    adjustments: [
      'Adjust irrigation frequency based on soil moisture trends',
      'Modify amounts based on actual ET measurements',
      'Account for rainfall events in scheduling',
      'Monitor for signs of over-irrigation (waterlogging, nutrient leaching)',
    ],
  };
}

function calculateEfficiencyMetrics(
  systemProfile: IrrigationSystemProfile,
  waterBalance: { percentAvailable: number },
  profile: CropWaterProfile
): EfficiencyMetrics {
  const waterUseEfficiency = systemProfile.applicationEfficiency * systemProfile.distributionUniformity;
  const applicationEfficiency = systemProfile.applicationEfficiency;
  const distributionUniformity = systemProfile.distributionUniformity;

  const recommendations: string[] = [];
  if (distributionUniformity < 0.7) {
    recommendations.push('Improve uniformity by checking emitter/block nozzles');
  }
  if (applicationEfficiency < 0.7) {
    recommendations.push('Reduce deep percolation by matching irrigation to root zone depth');
  }

  return {
    waterUseEfficiency: Math.round(waterUseEfficiency * 100) / 100,
    irrigationEfficiency: systemProfile.applicationEfficiency,
    applicationEfficiency,
    distributionUniformity,
    recommendations,
  };
}

function generateIrrigationAlerts(
  request: IrrigationAdvisorRequest,
  waterBalance: { percentAvailable: number; deficit: number; daysUntilStress: number },
  weather: WeatherForecast,
  profile: CropWaterProfile
): IrrigationAlert[] {
  const alerts: IrrigationAlert[] = [];

  if (waterBalance.percentAvailable < profile.permanentWiltingPoint + 5) {
    alerts.push({
      type: 'drought_stress',
      severity: 'critical',
      message: 'Soil moisture approaching permanent wilting point. Immediate irrigation required.',
      action: 'Apply maximum irrigation amount immediately',
    });
  } else if (waterBalance.percentAvailable < profile.stressThreshold) {
    alerts.push({
      type: 'drought_stress',
      severity: 'high',
      message: 'Soil moisture below stress threshold. Crop yield may be affected.',
      action: 'Schedule irrigation within 24 hours',
    });
  }

  if (waterBalance.percentAvailable > 90) {
    alerts.push({
      type: 'over_irrigation',
      severity: 'medium',
      message: 'Soil moisture near field capacity. Risk of waterlogging.',
      action: 'Skip next irrigation and monitor drainage',
    });
  }

  if (weather.current.precipitation > 20) {
    alerts.push({
      type: 'waterlogging',
      severity: 'medium',
      message: 'Heavy precipitation detected. Check field drainage.',
      action: 'Inspect drainage systems and skip irrigation',
    });
  }

  const frostRisk = weather.daily?.some((d) => d.frostRisk);
  if (frostRisk) {
    alerts.push({
      type: 'regulatory',
      severity: 'low',
      message: 'Frost risk detected. Consider protective irrigation.',
      action: 'Monitor temperature and prepare frost protection measures',
    });
  }

  return alerts;
}

function generateAlternativeScenarios(
  request: IrrigationAdvisorRequest,
  baseAmount: number,
  profile: CropWaterProfile,
  systemProfile: IrrigationSystemProfile
): IrrigationScenario[] {
  const areaInHectares =
    request.fieldAreaUnit === 'hectares' ? request.fieldArea : request.fieldArea * 0.404686;
  const waterCost = request.waterCostPerUnit || config.waterCostDefault;

  return [
    {
      name: 'Full Irrigation',
      description: 'Meet 100% of crop water requirement',
      waterAmount: baseAmount,
      timing: 'Every 2-3 days',
      expectedOutcome: 'Maximum yield potential',
      cost: Math.round(baseAmount * areaInHectares * 10000 * waterCost),
      waterSavings: 0,
      yieldImpact: 0,
      recommendation: 'recommended',
    },
    {
      name: 'Deficit Irrigation (80%)',
      description: 'Apply 80% of crop water requirement',
      waterAmount: baseAmount * 0.8,
      timing: 'Every 2-3 days',
      expectedOutcome: 'Slight yield reduction (5-10%) with 20% water savings',
      cost: Math.round(baseAmount * 0.8 * areaInHectares * 10000 * waterCost),
      waterSavings: Math.round(baseAmount * 0.2 * areaInHectares * 10000),
      yieldImpact: -7,
      recommendation: 'acceptable',
    },
    {
      name: 'Regulated Deficit Irrigation (60%)',
      description: 'Apply 60% of crop water requirement during vegetative stage',
      waterAmount: baseAmount * 0.6,
      timing: 'Every 3-4 days',
      expectedOutcome: 'Moderate yield reduction (15-25%) with 40% water savings',
      cost: Math.round(baseAmount * 0.6 * areaInHectares * 10000 * waterCost),
      waterSavings: Math.round(baseAmount * 0.4 * areaInHectares * 10000),
      yieldImpact: -20,
      recommendation: 'acceptable',
    },
    {
      name: 'Rainfed Only',
      description: 'Rely entirely on natural precipitation',
      waterAmount: 0,
      timing: 'N/A',
      expectedOutcome: 'Significant yield reduction (40-60%) depending on rainfall',
      cost: 0,
      waterSavings: Math.round(baseAmount * areaInHectares * 10000),
      yieldImpact: -50,
      recommendation: 'not_recommended',
    },
  ];
}
