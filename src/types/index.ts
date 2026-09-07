// ============================================================================
// AI Agriculture Platform - Shared Type Definitions
// ============================================================================

export type ProviderName = 'openai' | 'anthropic' | 'gemini';

export interface AIProviderConfig {
  name: ProviderName;
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

export interface AIResponse {
  content: string;
  provider: ProviderName;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

export interface AIStreamingChunk {
  delta: string;
  finishReason?: string;
  usage?: AIResponse['usage'];
}

// ============================================================================
// Crop Monitoring Types
// ============================================================================

export type CropType =
  | 'wheat'
  | 'corn'
  | 'rice'
  | 'soybean'
  | 'cotton'
  | 'potato'
  | 'tomato'
  | 'maize'
  | 'barley'
  | 'sunflower'
  | 'sugarcane'
  | 'coffee'
  | 'cocoa'
  | 'tea'
  | 'vegetable'
  | 'fruit'
  | 'unknown';

export type GrowthStage =
  | 'seedling'
  | 'vegetative'
  | 'budding'
  | 'flowering'
  | 'fruiting'
  | 'ripening'
  | 'harvest_ready'
  | 'post_harvest';

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export type DiseaseType =
  | 'fungal_infection'
  | 'bacterial_infection'
  | 'viral_infection'
  | 'nutrient_deficiency'
  | 'pest_damage'
  | 'environmental_stress'
  | 'unknown';

export interface NDVIData {
  value: number;
  classification: 'healthy' | 'stressed' | 'severely_stressed' | 'bare_soil' | 'water';
  timestamp: Date;
  latitude: number;
  longitude: number;
  source: 'satellite' | 'drone' | 'ground_sensor';
  resolution?: number;
}

export interface CropHealthReport {
  id: string;
  cropType: CropType;
  growthStage: GrowthStage;
  healthStatus: HealthStatus;
  healthScore: number;
  ndvi: NDVIData;
  diseases: DiseaseIdentification[];
  stressIndicators: StressIndicator[];
  recommendations: CropRecommendation[];
  imageAnalysis?: ImageAnalysisResult;
  confidence: number;
  analyzedAt: Date;
  location: { latitude: number; longitude: number };
}

export interface DiseaseIdentification {
  diseaseType: DiseaseType;
  name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  confidence: number;
  affectedAreaPercentage: number;
  symptoms: string[];
  treatment: TreatmentRecommendation[];
  spreadRisk: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
}

export interface TreatmentRecommendation {
  type: 'chemical' | 'biological' | 'cultural' | 'organic';
  name: string;
  description: string;
  dosage?: string;
  applicationMethod: string;
  timing: string;
  estimatedCost: number;
  effectiveness: number;
  safetyNotes: string[];
}

export interface StressIndicator {
  type: 'water' | 'nutrient' | 'temperature' | 'pest' | 'disease' | 'light';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  affectedAreaPercentage: number;
}

export interface CropRecommendation {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  action: string;
  reason: string;
  estimatedImpact: string;
  timeframe: string;
  estimatedCost?: number;
}

export interface ImageAnalysisResult {
  dominantColors: string[];
  vegetationCoverage: number;
  anomalies: ImageAnomaly[];
  overallQuality: number;
}

export interface ImageAnomaly {
  type: string;
  location: { x: number; y: number; width: number; height: number };
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

// ============================================================================
// Yield Prediction Types
// ============================================================================

export interface YieldPredictionRequest {
  cropType: CropType;
  fieldArea: number;
  fieldAreaUnit: 'hectares' | 'acres';
  plantingDate: Date;
  soilData?: SoilData;
  weatherData?: WeatherForecastData[];
  historicalYields?: HistoricalYield[];
  location: { latitude: number; longitude: number };
  irrigationType: 'rainfed' | 'drip' | 'sprinkler' | 'flood' | 'center_pivot';
  fertilizerUsage?: FertilizerData[];
  pestPressure?: number;
}

export interface SoilData {
  ph: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  temperature: number;
  texture: 'sandy' | 'loamy' | 'clay' | 'silty' | 'peaty' | 'chalky';
  depth: number;
  electricalConductivity?: number;
  cec?: number;
}

export interface WeatherForecastData {
  date: Date;
  temperature: { min: number; max: number; avg: number };
  humidity: number;
  precipitation: number;
  windSpeed: number;
  solarRadiation: number;
  evapotranspiration: number;
  cloudCover?: number;
  frostRisk?: boolean;
  heatStress?: boolean;
}

export interface HistoricalYield {
  year: number;
  yieldPerHectare: number;
  weatherSummary: {
    avgTemperature: number;
    totalPrecipitation: number;
    growingDegreeDays: number;
  };
  notes?: string;
}

export interface FertilizerData {
  type: 'nitrogen' | 'phosphorus' | 'potassium' | 'organic' | 'compound';
  applicationDate: Date;
  amount: number;
  unit: 'kg' | 'lbs' | 'tons';
}

export interface YieldPredictionResult {
  predictedYield: number;
  yieldUnit: 'tons_per_hectare' | 'bushels_per_acre';
  confidenceInterval: { lower: number; upper: number };
  confidence: number;
  factors: YieldFactor[];
  scenarios: YieldScenario[];
  recommendations: YieldRecommendation[];
  risks: YieldRisk[];
  timeline: YieldTimeline[];
  generatedAt: Date;
}

export interface YieldFactor {
  name: string;
  impact: number;
  contribution: number;
  trend: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface YieldScenario {
  name: string;
  probability: number;
  predictedYield: number;
  conditions: string;
  description: string;
}

export interface YieldRecommendation {
  category: 'irrigation' | 'fertilizer' | 'pest_management' | 'harvest_timing' | 'soil_management';
  action: string;
  expectedImpact: number;
  cost: number;
  roi: number;
  timeframe: string;
  priority: 'low' | 'medium' | 'high';
}

export interface YieldRisk {
  risk: string;
  probability: number;
  potentialImpact: number;
  mitigation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface YieldTimeline {
  stage: string;
  date: Date;
  expectedProgress: number;
  milestones: string[];
}

// ============================================================================
// Pest Detection Types
// ============================================================================

export interface PestDetectionRequest {
  images: PestImage[];
  cropType: CropType;
  location: { latitude: number; longitude: number };
  season: 'spring' | 'summer' | 'fall' | 'winter';
  previousPestHistory?: PestHistoryEntry[];
  neighboringCrops?: CropType[];
}

export interface PestImage {
  data: Buffer | string;
  format: 'jpeg' | 'png' | 'webp' | 'tiff';
  resolution: { width: number; height: number };
  captureDate: Date;
  region?: { x: number; y: number; width: number; height: number };
  magnification?: number;
}

export interface PestHistoryEntry {
  pestName: string;
  date: Date;
  severity: 'mild' | 'moderate' | 'severe';
  treatment?: string;
  effectiveness?: number;
}

export interface PestDetectionResult {
  detections: PestDetection[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  immediateActionRequired: boolean;
  treatmentPlan: PestTreatmentPlan;
  preventionMeasures: PreventionMeasure[];
  economicThreshold: EconomicThreshold;
  generatedAt: Date;
}

export interface PestDetection {
  pestName: string;
  commonName: string;
  scientificName: string;
  category: 'insect' | 'mite' | 'nematode' | 'pathogen' | 'weed' | 'rodent';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  confidence: number;
  affectedAreaPercentage: number;
  lifeStage: string;
  damageType: 'leaf' | 'root' | 'stem' | 'fruit' | 'seed' | 'vascular';
  description: string;
  identificationFeatures: string[];
  similarSpecies?: string[];
}

export interface PestTreatmentPlan {
  immediateActions: TreatmentAction[];
  shortTermActions: TreatmentAction[];
  longTermActions: TreatmentAction[];
  organicOptions: TreatmentAction[];
  chemicalOptions: TreatmentAction[];
  biologicalControls: TreatmentAction[];
  estimatedTotalCost: number;
  expectedRecoveryTime: string;
  monitoringSchedule: MonitoringSchedule[];
}

export interface TreatmentAction {
  name: string;
  description: string;
  type: 'chemical' | 'biological' | 'cultural' | 'organic' | 'mechanical';
  timing: string;
  applicationRate?: string;
  cost: number;
  effectiveness: number;
  environmentalImpact: 'low' | 'medium' | 'high';
  safetyPrecautions: string[];
  withholdPeriod?: string;
}

export interface PreventionMeasure {
  measure: string;
  timing: string;
  frequency: string;
  effectiveness: number;
  cost: number;
  description: string;
}

export interface EconomicThreshold {
  pestDensity: number;
  unit: string;
  cropValue: number;
  treatmentCost: number;
  actionThreshold: 'below' | 'at' | 'above';
  recommendation: string;
}

export interface MonitoringSchedule {
  date: Date;
  method: string;
  focus: string;
  notes?: string;
}

// ============================================================================
// Market Intelligence Types
// ============================================================================

export interface MarketIntelligenceRequest {
  cropType: CropType;
  quantity?: number;
  quality?: 'standard' | 'premium' | 'organic' | 'grade_a' | 'grade_b';
  location: { latitude: number; longitude: number; region?: string };
  harvestDate?: Date;
  storageCapacity?: number;
  transportationOptions?: string[];
  targetMarkets?: string[];
}

export interface MarketIntelligenceResult {
  currentPrices: MarketPrice[];
  priceForecast: PriceForecast[];
  demandAnalysis: DemandAnalysis;
  supplyAnalysis: SupplyAnalysis;
  optimalHarvestTiming: OptimalHarvestTiming;
  marketRecommendations: MarketRecommendation[];
  competitionAnalysis: CompetitionAnalysis;
  riskAssessment: MarketRiskAssessment;
  generatedAt: Date;
}

export interface MarketPrice {
  market: string;
  region: string;
  price: number;
  currency: string;
  unit: string;
  date: Date;
  trend: 'rising' | 'falling' | 'stable';
  volume?: number;
  quality?: string;
}

export interface PriceForecast {
  date: Date;
  predictedPrice: number;
  confidenceInterval: { lower: number; upper: number };
  trend: 'rising' | 'falling' | 'stable';
  factors: string[];
  confidence: number;
}

export interface DemandAnalysis {
  currentDemand: 'low' | 'moderate' | 'high' | 'very_high';
  seasonalPattern: string[];
  exportDemand: number;
  domesticDemand: number;
  industrialDemand: number;
  consumerTrends: string[];
  demandForecast: { period: string; demand: number }[];
}

export interface SupplyAnalysis {
  currentSupply: 'surplus' | 'balanced' | 'deficit';
  globalProduction: number;
  localProduction: number;
  importLevels: number;
  exportLevels: number;
  inventoryLevels: number;
  supplyForecast: { period: string; supply: number }[];
}

export interface OptimalHarvestTiming {
  recommendedDate: { start: Date; end: Date };
  priceWindow: 'current' | 'rising' | 'peak' | 'declining';
  expectedPriceAtHarvest: number;
  currentPrice: number;
  potentialGainLoss: number;
  factors: string[];
  alternatives: { date: { start: Date; end: Date }; reason: string; priceImpact: number }[];
}

export interface MarketRecommendation {
  action: 'sell_now' | 'hold' | 'store' | 'process' | 'export' | 'diversify';
  urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  reasoning: string;
  expectedBenefit: number;
  riskLevel: 'low' | 'medium' | 'high';
  targetMarket?: string;
  timeframe: string;
}

export interface CompetitionAnalysis {
  competitorCount: number;
  marketShare: number;
  differentiationFactors: string[];
  pricingPosition: 'below_market' | 'at_market' | 'above_market';
  qualityAdvantage: boolean;
  recommendations: string[];
}

export interface MarketRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  priceVolatility: number;
  demandVolatility: number;
  supplyChainRisk: number;
  weatherRisk: number;
  policyRisk: number;
  currencyRisk?: number;
  risks: { risk: string; probability: number; impact: number; mitigation: string }[];
}

// ============================================================================
// Weather Types
// ============================================================================

export interface WeatherServiceConfig {
  apiKey: string;
  baseUrl?: string;
  units: 'metric' | 'imperial';
  language: string;
  cacheDurationMinutes?: number;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  visibility: number;
  uvIndex: number;
  cloudCover: number;
  precipitation: number;
  precipitationType: 'none' | 'rain' | 'snow' | 'sleet' | 'hail' | 'thunderstorm';
  dewPoint: number;
  condition: string;
  icon: string;
  sunrise: Date;
  sunset: Date;
  moonPhase?: string;
  airQuality?: AirQualityData;
  timestamp: Date;
}

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  category: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

export interface WeatherForecast {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  agricultural: AgriculturalWeatherData;
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitationProbability: number;
  precipitationAmount: number;
  precipitationType: string;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  cloudCover: number;
  visibility: number;
  uvIndex: number;
  condition: string;
  icon: string;
  evapotranspiration?: number;
}

export interface DailyForecast {
  date: Date;
  temperature: { min: number; max: number; avg: number };
  feelsLike: { min: number; max: number };
  humidity: { min: number; max: number; avg: number };
  precipitation: { probability: number; amount: number; type: string };
  wind: { speed: number; direction: number; gust?: number };
  uvIndex: number;
  visibility: number;
  sunrise: Date;
  sunset: Date;
  moonPhase?: string;
  condition: string;
  icon: string;
  growingDegreeDays?: number;
  evapotranspiration?: number;
  frostRisk?: boolean;
  heatStressRisk?: boolean;
  droughtIndex?: number;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  event: string;
  headline: string;
  description: string;
  instruction: string;
  onset: Date;
  expires: Date;
  affectedAreas: string[];
  agriculturalImpact?: string;
}

export interface AgriculturalWeatherData {
  growingDegreeDays: number;
  accumulatedGDD: number;
  evapotranspiration: number;
  cropWaterNeed: number;
  irrigationRecommendation: string;
  frostRisk: { probability: number; temperature: number; time: Date }[];
  heatStressIndex: number;
  droughtIndex: number;
  soilMoisture: number;
  leafWetness: number;
  diseaseRisk: 'low' | 'moderate' | 'high' | 'very_high';
  pestRisk: 'low' | 'moderate' | 'high' | 'very_high';
}

export interface HistoricalWeatherData {
  date: Date;
  temperature: { min: number; max: number; avg: number };
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  solarRadiation: number;
  evapotranspiration: number;
  soilTemperature?: number;
  soilMoisture?: number;
  conditions: string;
}

export interface WeatherStatistics {
  period: { start: Date; end: Date };
  temperature: {
    avg: number;
    min: number;
    max: number;
    stdDev: number;
    anomaly: number;
  };
  precipitation: {
    total: number;
    days: number;
    maxDaily: number;
    anomaly: number;
  };
  humidity: { avg: number; min: number; max: number };
  wind: { avgSpeed: number; maxSpeed: number; prevailingDirection: number };
  solarRadiation: { total: number; avgDaily: number };
  growingDegreeDays: number;
  droughtIndex: number;
  freezeDays: number;
  heatDays: number;
}

// ============================================================================
// Irrigation Advisor Types
// ============================================================================

export interface IrrigationAdvisorRequest {
  fieldId: string;
  cropType: CropType;
  growthStage: GrowthStage;
  soilData: SoilData;
  weatherForecast: WeatherForecast;
  historicalWeather?: HistoricalWeatherData[];
  irrigationSystem: IrrigationSystemType;
  fieldArea: number;
  fieldAreaUnit: 'hectares' | 'acres';
  rootDepth: number;
  currentSoilMoisture?: number;
  lastIrrigationDate?: Date;
  lastIrrigationAmount?: number;
  waterSource?: 'well' | 'municipal' | 'river' | 'reservoir' | 'rainwater';
  waterCostPerUnit?: number;
  maxWaterAllocation?: number;
  constraints?: IrrigationConstraint[];
}

export type IrrigationSystemType =
  | 'drip'
  | 'sprinkler'
  | 'center_pivot'
  | 'flood'
  | 'furrow'
  | 'subsurface'
  | 'manual';

export interface IrrigationConstraint {
  type: 'water_availability' | 'budget' | 'labor' | 'equipment' | 'regulatory';
  description: string;
  limit: number;
  unit: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IrrigationAdvisorResult {
  recommendation: IrrigationRecommendation;
  schedule: IrrigationSchedule[];
  waterBudget: WaterBudget;
  monitoring: MonitoringPlan;
  efficiency: EfficiencyMetrics;
  alerts: IrrigationAlert[];
  alternativeScenarios: IrrigationScenario[];
  generatedAt: Date;
}

export interface IrrigationRecommendation {
  shouldIrrigate: boolean;
  urgency: 'immediate' | 'within_24h' | 'within_48h' | 'within_week' | 'not_needed';
  recommendedAmount: number;
  amountUnit: 'mm' | 'inches' | 'gallons' | 'liters' | 'acre_feet';
  duration: number;
  durationUnit: 'minutes' | 'hours';
  timing: { start: Date; end: Date; optimal: boolean }[];
  reasoning: string;
  expectedSoilMoisture: number;
  waterSavings?: number;
}

export interface IrrigationSchedule {
  date: Date;
  startTime: string;
  endTime: string;
  amount: number;
  unit: string;
  zone?: string;
  priority: 'high' | 'medium' | 'low';
  weatherDependent: boolean;
  weatherCondition?: string;
  notes?: string;
}

export interface WaterBudget {
  dailyNeed: number;
  weeklyNeed: number;
  seasonalNeed: number;
  unit: string;
  currentAllocation: number;
  remainingAllocation: number;
  costEstimate: number;
  costUnit: string;
  efficiency: number;
  recommendations: string[];
}

export interface MonitoringPlan {
  soilMoistureChecks: { frequency: string; method: string; depth: number[] }[];
  weatherMonitoring: { frequency: string; parameters: string[] }[];
  cropMonitoring: { frequency: string; indicators: string[] }[];
  adjustments: string[];
}

export interface EfficiencyMetrics {
  waterUseEfficiency: number;
  irrigationEfficiency: number;
  applicationEfficiency: number;
  distributionUniformity: number;
  recommendations: string[];
}

export interface IrrigationAlert {
  type: 'drought_stress' | 'over_irrigation' | 'nutrient_leaching' | 'waterlogging' | 'equipment_maintenance' | 'regulatory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
  deadline?: Date;
}

export interface IrrigationScenario {
  name: string;
  description: string;
  waterAmount: number;
  timing: string;
  expectedOutcome: string;
  cost: number;
  waterSavings: number;
  yieldImpact: number;
  recommendation: 'recommended' | 'acceptable' | 'not_recommended';
}
