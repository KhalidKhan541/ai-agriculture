// ============================================================================
// AI Agriculture Platform - AI & Weather Services Barrel Exports
// ============================================================================

// ---------------------------------------------------------------------------
// AI Provider
// ---------------------------------------------------------------------------

export {
  configureProvider,
  getProviderConfig,
  removeProvider,
  listProviders,
  getProviderStats,
  generateText,
  generateTextWithTemplate,
  generateTextWithFallback,
  streamText,
  extractJSON,
  processBatch,
  healthCheck,
  registerPromptTemplate,
  getPromptTemplate,
  buildPrompt,
  roundRobinStrategy,
  lowestLatencyStrategy,
  lowestErrorRateStrategy,
  AIProviderError,
  RateLimitError,
  ProviderNotConfiguredError,
} from './provider';

export type {
  ProviderName,
  AIProviderConfig,
  AIRequestOptions,
  AIResponse,
  AIStreamingChunk,
  ChatMessage,
  PromptTemplate,
  ProviderStrategy,
  BatchRequest,
  BatchResult,
} from '../../types';

// ---------------------------------------------------------------------------
// Crop Monitoring
// ---------------------------------------------------------------------------

export {
  configureCropMonitoring,
  calculateNDVI,
  classifyNDVI,
  analyzeNDVISeries,
  detectGrowthStage,
  assessHealthStatus,
  analyzeCropImage,
  performComprehensiveAnalysis,
  batchAnalyzeFields,
} from './crop-monitoring';

export type {
  NDVIMeasurement,
  NDVISeries,
  NDVIAlert,
  GrowthStageInput,
  CropAnalysisInput,
  ComprehensiveAnalysisRequest,
} from './crop-monitoring';

// ---------------------------------------------------------------------------
// Yield Prediction
// ---------------------------------------------------------------------------

export {
  configureYieldPrediction,
  predictYield,
  compareCropYields,
  generateSeasonalReport,
} from './yield-prediction';

// ---------------------------------------------------------------------------
// Pest Detection
// ---------------------------------------------------------------------------

export {
  configurePestDetection,
  identifyPest,
  batchDetectPests,
  analyzePestTrends,
  analyzeCostBenefit,
} from './pest-detection';

export type {
  PestTrendAnalysis,
  CostBenefitAnalysis,
} from './pest-detection';

// ---------------------------------------------------------------------------
// Market Intelligence
// ---------------------------------------------------------------------------

export {
  configureMarketIntelligence,
  getMarketIntelligence,
  ingestMarketData,
  getMarketData,
  createPriceAlert,
  checkPriceAlerts,
  compareMarkets,
  generateMarketReport,
} from './market-intelligence';

export type {
  PriceAlert,
  MarketReport,
} from './market-intelligence';

// ---------------------------------------------------------------------------
// Weather Service
// ---------------------------------------------------------------------------

export {
  configureWeatherService,
  getCurrentWeather,
  getHourlyForecast,
  getDailyForecast,
  getWeatherForecast,
  getHistoricalWeather,
  calculateWeatherStatistics,
  getWeatherAlerts,
  generateFarmingCalendar,
  compareLocations,
  geocode,
  reverseGeocode,
  clearWeatherCache,
  getCacheSize,
  WeatherServiceError,
} from './weather-service';

export type {
  GeocodingResult,
  FarmingSeason,
  LocationComparison,
} from './weather-service';

// ---------------------------------------------------------------------------
// Irrigation Advisor
// ---------------------------------------------------------------------------

export {
  configureIrrigationAdvisor,
  generateIrrigationRecommendation,
} from './irrigation-advisor';

// ---------------------------------------------------------------------------
// Convenience Re-exports from Types
// ---------------------------------------------------------------------------

export type {
  CropType,
  GrowthStage,
  HealthStatus,
  DiseaseType,
  NDVIData,
  CropHealthReport,
  DiseaseIdentification,
  TreatmentRecommendation,
  StressIndicator,
  CropRecommendation,
  ImageAnalysisResult,
  ImageAnomaly,
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
  PestDetectionRequest,
  PestDetectionResult,
  PestDetection,
  PestTreatmentPlan,
  TreatmentAction,
  PreventionMeasure,
  EconomicThreshold,
  MonitoringSchedule,
  PestImage,
  PestHistoryEntry,
  MarketIntelligenceRequest,
  MarketIntelligenceResult,
  MarketPrice,
  PriceForecast,
  DemandAnalysis,
  SupplyAnalysis,
  OptimalHarvestTiming,
  MarketRecommendation,
  CompetitionAnalysis,
  MarketRiskAssessment,
  WeatherServiceConfig,
  CurrentWeather,
  AirQualityData,
  WeatherForecast,
  HourlyForecast,
  DailyForecast,
  WeatherAlert,
  AgriculturalWeatherData,
  HistoricalWeatherData,
  WeatherStatistics,
  IrrigationAdvisorRequest,
  IrrigationAdvisorResult,
  IrrigationRecommendation,
  IrrigationSchedule,
  WaterBudget,
  MonitoringPlan,
  EfficiencyMetrics,
  IrrigationAlert,
  IrrigationScenario,
  IrrigationSystemType,
  IrrigationConstraint,
  ProviderName as AIProviderName,
} from '../../types';
