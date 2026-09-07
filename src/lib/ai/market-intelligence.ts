// ============================================================================
// AI Agriculture Platform - Market Intelligence Service
// Price forecasting, demand analysis, optimal harvest timing
// ============================================================================

import { generateText, extractJSON, type ChatMessage } from './provider';
import type {
  ProviderName,
  CropType,
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
} from '../../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface MarketIntelligenceConfig {
  defaultProvider: ProviderName;
  fallbackProvider?: ProviderName;
  analysisTimeout: number;
  dataRetentionDays: number;
  forecastHorizonDays: number;
}

const defaultConfig: MarketIntelligenceConfig = {
  defaultProvider: 'openai',
  analysisTimeout: 90000,
  dataRetentionDays: 365,
  forecastHorizonDays: 90,
};

let config: MarketIntelligenceConfig = { ...defaultConfig };

export function configureMarketIntelligence(overrides: Partial<MarketIntelligenceConfig>): void {
  config = { ...config, ...overrides };
}

// ---------------------------------------------------------------------------
// Market Data Store (simulated in-memory)
// ---------------------------------------------------------------------------

interface MarketDataPoint {
  cropType: CropType;
  region: string;
  market: string;
  price: number;
  currency: string;
  date: Date;
  volume: number;
  quality: string;
}

const marketDataStore: MarketDataPoint[] = [];

export function ingestMarketData(data: MarketDataPoint[]): void {
  marketDataStore.push(...data);
  if (marketDataStore.length > 10000) {
    marketDataStore.splice(0, marketDataStore.length - 10000);
  }
}

export function getMarketData(
  cropType: CropType,
  region?: string,
  days?: number
): MarketDataPoint[] {
  const cutoff = days ? Date.now() - days * 86400000 : 0;
  return marketDataStore.filter(
    (d) =>
      d.cropType === cropType &&
      (!region || d.region === region) &&
      new Date(d.date).getTime() >= cutoff
  );
}

// ---------------------------------------------------------------------------
// Regional Market Database
// ---------------------------------------------------------------------------

interface RegionalMarket {
  name: string;
  region: string;
  type: 'wholesale' | 'retail' | 'export' | 'commodity';
  crops: CropType[];
  currency: string;
  typicalPriceRange: Record<CropType, [number, number]>;
  demandMultiplier: number;
  seasonality: Record<string, number>;
}

const REGIONAL_MARKETS: RegionalMarket[] = [
  {
    name: 'Chicago Board of Trade',
    region: 'midwest_us',
    type: 'commodity',
    crops: ['corn', 'soybean', 'wheat'],
    currency: 'USD',
    typicalPriceRange: {
      corn: [150, 300],
      soybean: [350, 600],
      wheat: [200, 400],
      rice: [0, 0],
      cotton: [0, 0],
      potato: [0, 0],
      tomato: [0, 0],
      maize: [150, 300],
      barley: [0, 0],
      sunflower: [0, 0],
      sugarcane: [0, 0],
      coffee: [0, 0],
      cocoa: [0, 0],
      tea: [0, 0],
      vegetable: [0, 0],
      fruit: [0, 0],
      unknown: [0, 0],
    },
    demandMultiplier: 1.0,
    seasonality: { spring: 1.1, summer: 0.9, fall: 1.2, winter: 1.0 },
  },
  {
    name: 'Mumbai Agricultural Market',
    region: 'south_asia',
    type: 'wholesale',
    crops: ['rice', 'wheat', 'cotton', 'sugarcane', 'tea'],
    currency: 'INR',
    typicalPriceRange: {
      rice: [2000, 4000],
      wheat: [1800, 3000],
      cotton: [4000, 7000],
      sugarcane: [200, 400],
      tea: [1000, 3000],
      corn: [1500, 2500],
      soybean: [3000, 5000],
      potato: [800, 2000],
      tomato: [500, 2000],
      maize: [1500, 2500],
      barley: [1200, 2000],
      sunflower: [3000, 5000],
      coffee: [5000, 10000],
      cocoa: [4000, 8000],
      vegetable: [500, 3000],
      fruit: [1000, 5000],
      unknown: [0, 0],
    },
    demandMultiplier: 1.2,
    seasonality: { spring: 1.0, summer: 0.8, fall: 1.3, winter: 1.1 },
  },
  {
    name: 'European Commodity Exchange',
    region: 'europe',
    type: 'commodity',
    crops: ['wheat', 'corn', 'barley', 'sunflower'],
    currency: 'EUR',
    typicalPriceRange: {
      wheat: [180, 350],
      corn: [160, 300],
      barley: [140, 260],
      sunflower: [300, 500],
      soybean: [350, 550],
      rice: [0, 0],
      cotton: [0, 0],
      potato: [0, 0],
      tomato: [0, 0],
      maize: [160, 300],
      sugarcane: [0, 0],
      coffee: [0, 0],
      cocoa: [0, 0],
      tea: [0, 0],
      vegetable: [0, 0],
      fruit: [0, 0],
      unknown: [0, 0],
    },
    demandMultiplier: 1.1,
    seasonality: { spring: 1.0, summer: 0.9, fall: 1.2, winter: 1.1 },
  },
  {
    name: 'São Paulo Commodity Exchange',
    region: 'south_america',
    type: 'commodity',
    crops: ['coffee', 'sugarcane', 'soybean', 'corn', 'cotton'],
    currency: 'BRL',
    typicalPriceRange: {
      coffee: [150, 400],
      sugarcane: [40, 80],
      soybean: [200, 400],
      corn: [100, 250],
      cotton: [150, 350],
      rice: [0, 0],
      wheat: [0, 0],
      potato: [0, 0],
      tomato: [0, 0],
      maize: [100, 250],
      barley: [0, 0],
      sunflower: [0, 0],
      cocoa: [0, 0],
      tea: [0, 0],
      vegetable: [0, 0],
      fruit: [0, 0],
      unknown: [0, 0],
    },
    demandMultiplier: 0.9,
    seasonality: { spring: 1.2, summer: 1.0, fall: 0.8, winter: 1.1 },
  },
  {
    name: 'Nairobi Fresh Produce Market',
    region: 'east_africa',
    type: 'wholesale',
    crops: ['tea', 'coffee', 'cocoa', 'vegetable', 'fruit'],
    currency: 'KES',
    typicalPriceRange: {
      tea: [200, 500],
      coffee: [300, 800],
      cocoa: [500, 1200],
      vegetable: [50, 300],
      fruit: [80, 400],
      wheat: [0, 0],
      corn: [0, 0],
      rice: [0, 0],
      soybean: [0, 0],
      cotton: [0, 0],
      potato: [0, 0],
      tomato: [0, 0],
      maize: [0, 0],
      barley: [0, 0],
      sunflower: [0, 0],
      sugarcane: [0, 0],
      unknown: [0, 0],
    },
    demandMultiplier: 0.8,
    seasonality: { spring: 1.0, summer: 1.1, fall: 0.9, winter: 1.0 },
  },
];

// ---------------------------------------------------------------------------
// Price History Analysis
// ---------------------------------------------------------------------------

interface PriceStats {
  current: number;
  average: number;
  min: number;
  max: number;
  stdDev: number;
  trend: 'rising' | 'falling' | 'stable';
  volatility: number;
  percentChange30d: number;
  percentChange90d: number;
}

function calculatePriceStats(prices: MarketPrice[]): PriceStats {
  if (prices.length === 0) {
    return {
      current: 0,
      average: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      trend: 'stable',
      volatility: 0,
      percentChange30d: 0,
      percentChange90d: 0,
    };
  }

  const sorted = [...prices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const values = sorted.map((p) => p.price);
  const current = values[0];
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const volatility = average > 0 ? stdDev / average : 0;

  const recent30 = values.slice(0, Math.min(30, values.length));
  const older30 = values.slice(
    Math.min(30, values.length),
    Math.min(60, values.length)
  );

  const recentAvg30 = recent30.reduce((a, b) => a + b, 0) / (recent30.length || 1);
  const olderAvg30 = older30.length > 0 ? older30.reduce((a, b) => a + b, 0) / older30.length : recentAvg30;

  const recent90 = values.slice(0, Math.min(90, values.length));
  const older90 = values.slice(
    Math.min(90, values.length),
    Math.min(180, values.length)
  );
  const recentAvg90 = recent90.reduce((a, b) => a + b, 0) / (recent90.length || 1);
  const olderAvg90 = older90.length > 0 ? older90.reduce((a, b) => a + b, 0) / older90.length : recentAvg90;

  const percentChange30d = olderAvg30 > 0 ? ((recentAvg30 - olderAvg30) / olderAvg30) * 100 : 0;
  const percentChange90d = olderAvg90 > 0 ? ((recentAvg90 - olderAvg90) / olderAvg90) * 100 : 0;

  let trend: PriceStats['trend'] = 'stable';
  if (percentChange30d > 5) trend = 'rising';
  else if (percentChange30d < -5) trend = 'falling';

  return { current, average, min, max, stdDev, trend, volatility, percentChange30d, percentChange90d };
}

// ---------------------------------------------------------------------------
// AI-Powered Market Intelligence
// ---------------------------------------------------------------------------

const MARKET_INTELLIGENCE_SYSTEM_PROMPT = `You are an expert agricultural market analyst with deep knowledge of global commodity markets, supply chains, and trade patterns.
You analyze market data, weather impacts, geopolitical factors, and consumer trends to provide actionable market intelligence.
Always provide structured JSON responses with detailed analysis, forecasts, and recommendations.
Be specific about price movements, timing, and risk factors.`;

function buildMarketIntelligencePrompt(
  request: MarketIntelligenceRequest,
  currentPrices: MarketPrice[],
  priceStats: PriceStats,
  region: RegionalMarket | undefined
): string {
  const parts = [
    'Provide comprehensive market intelligence for:',
    '',
    `**Crop Type:** ${request.cropType}`,
    `**Location:** ${request.location.latitude}, ${request.location.longitude}`,
  ];

  if (request.quantity) parts.push(`**Quantity:** ${request.quantity} units`);
  if (request.quality) parts.push(`**Quality Grade:** ${request.quality}`);
  if (request.harvestDate) parts.push(`**Expected Harvest:** ${request.harvestDate.toISOString().split('T')[0]}`);

  if (currentPrices.length > 0) {
    parts.push(
      '',
      '**Current Market Data:**',
      `- Current Price: ${priceStats.current}`,
      `- 30-day Average: ${priceStats.average.toFixed(2)}`,
      `- Price Range: ${priceStats.min} - ${priceStats.max}`,
      `- 30-day Change: ${priceStats.percentChange30d.toFixed(1)}%`,
      `- 90-day Change: ${priceStats.percentChange90d.toFixed(1)}%`,
      `- Trend: ${priceStats.trend}`,
      `- Volatility: ${(priceStats.volatility * 100).toFixed(1)}%`
    );
  }

  if (region) {
    parts.push(
      '',
      '**Market Context:**',
      `- Primary Market: ${region.name}`,
      `- Region: ${region.region}`,
      `- Market Type: ${region.type}`,
      `- Demand Multiplier: ${region.demandMultiplier}x`
    );
  }

  if (request.targetMarkets && request.targetMarkets.length > 0) {
    parts.push(`- Target Markets: ${request.targetMarkets.join(', ')}`);
  }

  parts.push(
    '',
    'Provide comprehensive market intelligence in the following JSON format:',
    '```json',
    JSON.stringify(
      {
        currentPrices: [
          {
            market: 'market name',
            region: 'region',
            price: 'number',
            currency: 'string',
            unit: 'string',
            date: 'ISO date',
            trend: 'rising|falling|stable',
            volume: 'number',
            quality: 'string',
          },
        ],
        priceForecast: [
          {
            date: 'ISO date',
            predictedPrice: 'number',
            confidenceInterval: { lower: 'number', upper: 'number' },
            trend: 'rising|falling|stable',
            factors: ['factor1', 'factor2'],
            confidence: 'number (0-1)',
          },
        ],
        demandAnalysis: {
          currentDemand: 'low|moderate|high|very_high',
          seasonalPattern: ['pattern1', 'pattern2'],
          exportDemand: 'number',
          domesticDemand: 'number',
          industrialDemand: 'number',
          consumerTrends: ['trend1', 'trend2'],
          demandForecast: [{ period: 'string', demand: 'number' }],
        },
        supplyAnalysis: {
          currentSupply: 'surplus|balanced|deficit',
          globalProduction: 'number',
          localProduction: 'number',
          importLevels: 'number',
          exportLevels: 'number',
          inventoryLevels: 'number',
          supplyForecast: [{ period: 'string', supply: 'number' }],
        },
        optimalHarvestTiming: {
          recommendedDate: { start: 'ISO date', end: 'ISO date' },
          priceWindow: 'current|rising|peak|declining',
          expectedPriceAtHarvest: 'number',
          currentPrice: 'number',
          potentialGainLoss: 'number',
          factors: ['factor1'],
          alternatives: [
            {
              date: { start: 'ISO date', end: 'ISO date' },
              reason: 'string',
              priceImpact: 'number',
            },
          ],
        },
        marketRecommendations: [
          {
            action: 'sell_now|hold|store|process|export|diversify',
            urgency: 'immediate|short_term|medium_term|long_term',
            reasoning: 'string',
            expectedBenefit: 'number',
            riskLevel: 'low|medium|high',
            targetMarket: 'string',
            timeframe: 'string',
          },
        ],
        competitionAnalysis: {
          competitorCount: 'number',
          marketShare: 'number',
          differentiationFactors: ['factor1'],
          pricingPosition: 'below_market|at_market|above_market',
          qualityAdvantage: 'boolean',
          recommendations: ['rec1'],
        },
        riskAssessment: {
          overallRisk: 'low|medium|high|critical',
          priceVolatility: 'number',
          demandVolatility: 'number',
          supplyChainRisk: 'number',
          weatherRisk: 'number',
          policyRisk: 'number',
          currencyRisk: 'number',
          risks: [
            {
              risk: 'string',
              probability: 'number (0-1)',
              impact: 'number (0-1)',
              mitigation: 'string',
            },
          ],
        },
        summary: 'executive summary',
      },
      null,
      2
    ),
    '```',
  );

  return parts.join('\n');
}

export async function getMarketIntelligence(
  request: MarketIntelligenceRequest,
  provider?: ProviderName
): Promise<MarketIntelligenceResult> {
  const providerName = provider || config.defaultProvider;

  const region = REGIONAL_MARKETS.find(
    (m) => m.region === request.location.region || m.crops.includes(request.cropType)
  );

  const existingData = getMarketData(
    request.cropType,
    region?.region,
    config.dataRetentionDays
  );

  const currentPrices: MarketPrice[] = existingData.length > 0
    ? existingData.slice(-30).map((d) => ({
        market: d.market,
        region: d.region,
        price: d.price,
        currency: d.currency,
        unit: 'per ton',
        date: new Date(d.date),
        trend: 'stable' as const,
        volume: d.volume,
        quality: d.quality,
      }))
    : generateSyntheticPrices(request.cropType, region);

  const priceStats = calculatePriceStats(currentPrices);

  const messages: ChatMessage[] = [
    { role: 'system', content: MARKET_INTELLIGENCE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildMarketIntelligencePrompt(request, currentPrices, priceStats, region),
    },
  ];

  const response = await generateText(providerName, messages, {
    temperature: 0.3,
    maxTokens: 4096,
  });

  const result = extractJSON<Partial<MarketIntelligenceResult>>(response);

  return {
    currentPrices: result.currentPrices || currentPrices,
    priceForecast: result.priceForecast || generateDefaultPriceForecast(request.cropType, priceStats),
    demandAnalysis: result.demandAnalysis || generateDefaultDemandAnalysis(request.cropType),
    supplyAnalysis: result.supplyAnalysis || generateDefaultSupplyAnalysis(request.cropType),
    optimalHarvestTiming: result.optimalHarvestTiming || generateDefaultHarvestTiming(request, priceStats),
    marketRecommendations: result.marketRecommendations || generateDefaultRecommendations(request, priceStats),
    competitionAnalysis: result.competitionAnalysis || generateDefaultCompetitionAnalysis(request),
    riskAssessment: result.riskAssessment || generateDefaultRiskAssessment(request, priceStats),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Synthetic Data Generators
// ---------------------------------------------------------------------------

function generateSyntheticPrices(
  cropType: CropType,
  region: RegionalMarket | undefined
): MarketPrice[] {
  const prices: MarketPrice[] = [];
  const basePrice = region?.typicalPriceRange[cropType]?.[0] || 200;
  const range = (region?.typicalPriceRange[cropType]?.[1] || 400) - basePrice;

  for (let i = 30; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const noise = (Math.random() - 0.5) * range * 0.2;
    const trend = Math.sin(i / 10) * range * 0.1;
    const price = basePrice + range * 0.5 + noise + trend;

    prices.push({
      market: region?.name || 'Global Market',
      region: region?.region || 'global',
      price: Math.round(price * 100) / 100,
      currency: region?.currency || 'USD',
      unit: 'per ton',
      date,
      trend: i === 0 ? 'stable' : price > (basePrice + range * 0.5) ? 'rising' : 'falling',
      volume: Math.floor(Math.random() * 10000) + 1000,
      quality: 'standard',
    });
  }

  return prices;
}

function generateDefaultPriceForecast(
  cropType: CropType,
  stats: PriceStats
): PriceForecast[] {
  const forecasts: PriceForecast[] = [];
  const basePrice = stats.current || stats.average;

  for (let i = 1; i <= 90; i += 7) {
    const date = new Date(Date.now() + i * 86400000);
    const seasonalFactor = 1 + Math.sin((i / 365) * 2 * Math.PI) * 0.1;
    const trendFactor = stats.trend === 'rising' ? 1 + i * 0.001 : stats.trend === 'falling' ? 1 - i * 0.001 : 1;
    const noise = (Math.random() - 0.5) * stats.volatility * basePrice;
    const predictedPrice = basePrice * seasonalFactor * trendFactor + noise;
    const confidence = Math.max(0.3, 0.9 - i * 0.008);

    forecasts.push({
      date,
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      confidenceInterval: {
        lower: Math.round(predictedPrice * (1 - (1 - confidence) * 0.5) * 100) / 100,
        upper: Math.round(predictedPrice * (1 + (1 - confidence) * 0.5) * 100) / 100,
      },
      trend: predictedPrice > basePrice * 1.05 ? 'rising' : predictedPrice < basePrice * 0.95 ? 'falling' : 'stable',
      factors: ['Seasonal patterns', 'Historical trends', 'Market sentiment'],
      confidence,
    });
  }

  return forecasts;
}

function generateDefaultDemandAnalysis(cropType: CropType): DemandAnalysis {
  return {
    currentDemand: 'moderate',
    seasonalPattern: ['High demand during planting season', 'Moderate during growing', 'Peak at harvest'],
    exportDemand: 40,
    domesticDemand: 50,
    industrialDemand: 10,
    consumerTrends: ['Increasing organic demand', 'Health-conscious consumers', 'Sustainable sourcing'],
    demandForecast: [
      { period: 'Q1', demand: 100 },
      { period: 'Q2', demand: 85 },
      { period: 'Q3', demand: 120 },
      { period: 'Q4', demand: 110 },
    ],
  };
}

function generateDefaultSupplyAnalysis(cropType: CropType): SupplyAnalysis {
  return {
    currentSupply: 'balanced',
    globalProduction: 500000,
    localProduction: 50000,
    importLevels: 10000,
    exportLevels: 20000,
    inventoryLevels: 30000,
    supplyForecast: [
      { period: 'Q1', supply: 95 },
      { period: 'Q2', supply: 105 },
      { period: 'Q3', supply: 130 },
      { period: 'Q4', supply: 100 },
    ],
  };
}

function generateDefaultHarvestTiming(
  request: MarketIntelligenceRequest,
  stats: PriceStats
): OptimalHarvestTiming {
  const now = new Date();
  const harvestDate = request.harvestDate || new Date(now.getTime() + 30 * 86400000);

  return {
    recommendedDate: {
      start: harvestDate,
      end: new Date(harvestDate.getTime() + 14 * 86400000),
    },
    priceWindow: stats.trend,
    expectedPriceAtHarvest: stats.current * (stats.trend === 'rising' ? 1.05 : stats.trend === 'falling' ? 0.95 : 1),
    currentPrice: stats.current,
    potentialGainLoss: stats.current * 0.05,
    factors: ['Current market trend', 'Seasonal patterns', 'Supply outlook'],
    alternatives: [
      {
        date: {
          start: new Date(harvestDate.getTime() - 7 * 86400000),
          end: harvestDate,
        },
        reason: 'Early harvest to capture current prices',
        priceImpact: -0.02,
      },
      {
        date: {
          start: new Date(harvestDate.getTime() + 14 * 86400000),
          end: new Date(harvestDate.getTime() + 21 * 86400000),
        },
        reason: 'Delay harvest for potential price increase',
        priceImpact: 0.03,
      },
    ],
  };
}

function generateDefaultRecommendations(
  request: MarketIntelligenceRequest,
  stats: PriceStats
): MarketRecommendation[] {
  const recommendations: MarketRecommendation[] = [];

  if (stats.trend === 'rising') {
    recommendations.push({
      action: 'hold',
      urgency: 'short_term',
      reasoning: 'Prices are trending upward. Holding for better prices is advisable.',
      expectedBenefit: stats.current * 0.05,
      riskLevel: 'medium',
      timeframe: '2-4 weeks',
    });
  } else if (stats.trend === 'falling') {
    recommendations.push({
      action: 'sell_now',
      urgency: 'immediate',
      reasoning: 'Prices are declining. Selling now minimizes losses.',
      expectedBenefit: 0,
      riskLevel: 'low',
      timeframe: 'Immediately',
    });
  } else {
    recommendations.push({
      action: 'hold',
      urgency: 'medium_term',
      reasoning: 'Market is stable. Monitor for better opportunities.',
      expectedBenefit: stats.current * 0.02,
      riskLevel: 'low',
      timeframe: '1-3 months',
    });
  }

  if (stats.volatility > 0.2) {
    recommendations.push({
      action: 'store',
      urgency: 'medium_term',
      reasoning: 'High volatility detected. Storing allows flexibility to sell at peak.',
      expectedBenefit: stats.current * 0.08,
      riskLevel: 'medium',
      timeframe: '1-2 months',
    });
  }

  recommendations.push({
    action: 'diversify',
    urgency: 'long_term',
    reasoning: 'Diversify crop portfolio to reduce market risk exposure.',
    expectedBenefit: 0,
    riskLevel: 'low',
    timeframe: 'Next growing season',
  });

  return recommendations;
}

function generateDefaultCompetitionAnalysis(
  request: MarketIntelligenceRequest
): CompetitionAnalysis {
  return {
    competitorCount: 150,
    marketShare: 2.5,
    differentiationFactors: ['Quality grade', 'Organic certification', 'Local sourcing'],
    pricingPosition: 'at_market',
    qualityAdvantage: false,
    recommendations: [
      'Focus on quality differentiation',
      'Build direct relationships with buyers',
      'Explore premium market segments',
    ],
  };
}

function generateDefaultRiskAssessment(
  request: MarketIntelligenceRequest,
  stats: PriceStats
): MarketRiskAssessment {
  return {
    overallRisk: stats.volatility > 0.3 ? 'high' : stats.volatility > 0.15 ? 'medium' : 'low',
    priceVolatility: stats.volatility,
    demandVolatility: 0.15,
    supplyChainRisk: 0.2,
    weatherRisk: 0.25,
    policyRisk: 0.1,
    currencyRisk: request.location.region === 'global' ? 0.15 : 0,
    risks: [
      {
        risk: 'Price volatility',
        probability: stats.volatility,
        impact: 0.7,
        mitigation: 'Use forward contracts and hedging strategies',
      },
      {
        risk: 'Supply chain disruption',
        probability: 0.2,
        impact: 0.5,
        mitigation: 'Diversify transportation and storage options',
      },
      {
        risk: 'Weather-related yield impact',
        probability: 0.25,
        impact: 0.6,
        mitigation: 'Crop insurance and drought-resistant varieties',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Price Alert System
// ---------------------------------------------------------------------------

export interface PriceAlert {
  id: string;
  cropType: CropType;
  targetPrice: number;
  direction: 'above' | 'below';
  region: string;
  active: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  callback?: string;
}

const priceAlerts: PriceAlert[] = [];

export function createPriceAlert(
  cropType: CropType,
  targetPrice: number,
  direction: 'above' | 'below',
  region: string = 'global',
  callback?: string
): PriceAlert {
  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    cropType,
    targetPrice,
    direction,
    region,
    active: true,
    createdAt: new Date(),
    callback,
  };
  priceAlerts.push(alert);
  return alert;
}

export function checkPriceAlerts(currentPrices: MarketPrice[]): PriceAlert[] {
  const triggered: PriceAlert[] = [];

  for (const alert of priceAlerts) {
    if (!alert.active) continue;

    const relevantPrices = currentPrices.filter(
      (p) => p.cropType === alert.cropType && (alert.region === 'global' || p.region === alert.region)
    );

    if (relevantPrices.length === 0) continue;

    const latestPrice = relevantPrices[relevantPrices.length - 1].price;

    if (alert.direction === 'above' && latestPrice >= alert.targetPrice) {
      alert.active = false;
      alert.triggeredAt = new Date();
      triggered.push(alert);
    } else if (alert.direction === 'below' && latestPrice <= alert.targetPrice) {
      alert.active = false;
      alert.triggeredAt = new Date();
      triggered.push(alert);
    }
  }

  return triggered;
}

// ---------------------------------------------------------------------------
// Market Comparison Report
// ---------------------------------------------------------------------------

export async function compareMarkets(
  cropType: CropType,
  regions: string[],
  provider?: ProviderName
): Promise<{
  comparison: { region: string; price: number; trend: string; recommendation: string }[];
  bestMarket: string;
  priceSpread: number;
}> {
  const comparison = regions.map((region) => {
    const market = REGIONAL_MARKETS.find((m) => m.region === region);
    const prices = getMarketData(cropType, region, 30);
    const stats = calculatePriceStats(
      prices.map((p) => ({
        market: p.market,
        region: p.region,
        price: p.price,
        currency: p.currency,
        unit: 'per ton',
        date: new Date(p.date),
        trend: 'stable' as const,
      }))
    );

    const basePrice = market?.typicalPriceRange[cropType]?.[0] || 200;
    const price = stats.current || basePrice;

    return {
      region,
      price,
      trend: stats.trend,
      recommendation:
        stats.trend === 'rising' ? 'Buy now before prices increase' :
        stats.trend === 'falling' ? 'Wait for lower prices' :
        'Prices stable, good time to trade',
    };
  });

  comparison.sort((a, b) => b.price - a.price);

  const bestMarket = comparison[0]?.region || regions[0];
  const priceSpread = comparison.length >= 2
    ? ((comparison[0].price - comparison[comparison.length - 1].price) / comparison[comparison.length - 1].price) * 100
    : 0;

  return { comparison, bestMarket, priceSpread: Math.round(priceSpread * 100) / 100 };
}

// ---------------------------------------------------------------------------
// Export Utility
// ---------------------------------------------------------------------------

export interface MarketReport {
  cropType: CropType;
  generatedAt: Date;
  executiveSummary: string;
  priceOverview: PriceStats;
  forecasts: PriceForecast[];
  recommendations: MarketRecommendation[];
  risks: MarketRiskAssessment;
}

export async function generateMarketReport(
  request: MarketIntelligenceRequest,
  provider?: ProviderName
): Promise<MarketReport> {
  const intelligence = await getMarketIntelligence(request, provider);

  const prices = intelligence.currentPrices;
  const stats = calculatePriceStats(prices);

  const executiveSummary = `Market analysis for ${request.cropType}: Current price is ${stats.current} (${stats.trend} trend, ${(stats.volatility * 100).toFixed(1)}% volatility). ` +
    `${intelligence.demandAnalysis.currentDemand} demand with ${intelligence.supplyAnalysis.currentSupply} supply. ` +
    `Recommended action: ${intelligence.marketRecommendations[0]?.action || 'hold'}.`;

  return {
    cropType: request.cropType,
    generatedAt: new Date(),
    executiveSummary,
    priceOverview: stats,
    forecasts: intelligence.priceForecast,
    recommendations: intelligence.marketRecommendations,
    risks: intelligence.riskAssessment,
  };
}
