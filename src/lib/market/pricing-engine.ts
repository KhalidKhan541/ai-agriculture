import { randomUUID } from 'crypto';
import type { CommodityType, PriceUnit, GeoLocation } from './market-service';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PriceModel = 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'arima' | 'ensemble' | 'neural_network';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type PriceAlertType = 'above' | 'below' | 'percent_change';
export type DemandLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
export type SupplyLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface PricePoint {
  timestamp: Date;
  price: number;
  volume: number;
  source: string;
}

export interface PriceForecast {
  commodity: CommodityType;
  region: string;
  forecastDate: Date;
  predictedPrice: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidenceLevel: number;
  model: PriceModel;
  accuracy: number;
  factors: PriceFactor[];
  horizon: 'daily' | 'weekly' | 'monthly';
  historicalPrices: PricePoint[];
  generatedAt: Date;
}

export interface PriceFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface DemandSupplyAnalysis {
  commodity: CommodityType;
  region: string;
  demandLevel: DemandLevel;
  supplyLevel: SupplyLevel;
  demandIndex: number;
  supplyIndex: number;
  balanceRatio: number;
  pricePressure: 'upward' | 'downward' | 'neutral';
  demandDrivers: DemandDriver[];
  supplyDrivers: SupplyDriver[];
  recommendations: string[];
  analyzedAt: Date;
}

export interface DemandDriver {
  factor: string;
  impact: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

export interface SupplyDriver {
  factor: string;
  impact: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  commodity: CommodityType;
  region: string;
  type: PriceAlertType;
  threshold: number;
  currentPrice: number;
  triggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface PriceOptimization {
  listingId: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedDemandChange: number;
  expectedRevenueChange: number;
  priceElasticity: number;
  competitivePosition: 'underpriced' | 'optimal' | 'overpriced';
  confidence: number;
  reasons: string[];
  generatedAt: Date;
}

export interface SeasonalPattern {
  commodity: CommodityType;
  region: string;
  season: Season;
  averagePrice: number;
  priceIndex: number;
  volumeIndex: number;
  bestMonthToSell: number;
  worstMonthToSell: number;
  volatility: number;
}

export interface MarketTrend {
  commodity: CommodityType;
  region: string;
  shortTermTrend: 'bullish' | 'bearish' | 'neutral';
  longTermTrend: 'bullish' | 'bearish' | 'neutral';
  momentum: number;
  supportLevel: number;
  resistanceLevel: number;
  volatilityIndex: number;
  movingAverage7d: number;
  movingAverage30d: number;
  movingAverage90d: number;
  rsi: number;
  macd: number;
  analyzedAt: Date;
}

export interface PriceElasticity {
  commodity: CommodityType;
  region: string;
  elasticity: number;
  interpretation: string;
  demandChangePerPricePercent: number;
  crossElasticity: Record<CommodityType, number>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class PricingEngine {
  private priceData: Map<string, PricePoint[]> = new Map();
  private forecasts: Map<string, PriceForecast> = new Map();
  private alerts: Map<string, PriceAlert> = new Map();
  private seasonalPatterns: Map<string, SeasonalPattern[]> = new Map();

  private readonly LOOKBACK_DAYS = 365;
  private readonly FORECAST_HORIZONS = [1, 7, 30];

  // ── Price Data Ingestion ─────────────────────────────────────────────────

  async ingestPriceData(commodity: CommodityType, region: string, data: PricePoint[]): Promise<void> {
    const key = this.getKey(commodity, region);
    const existing = this.priceData.get(key) || [];
    existing.push(...data);
    existing.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const cutoff = new Date(Date.now() - this.LOOKBACK_DAYS * 86400000);
    const filtered = existing.filter((p) => p.timestamp >= cutoff);
    this.priceData.set(key, filtered);
  }

  async addPricePoint(commodity: CommodityType, region: string, point: PricePoint): Promise<void> {
    const key = this.getKey(commodity, region);
    const existing = this.priceData.get(key) || [];
    existing.push(point);
    existing.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.priceData.set(key, existing);
  }

  // ── Price Forecasting ────────────────────────────────────────────────────

  async forecastPrice(
    commodity: CommodityType,
    region: string,
    horizonDays: number,
    model: PriceModel = 'ensemble',
  ): Promise<PriceForecast> {
    const key = this.getKey(commodity, region);
    const history = this.priceData.get(key) || [];
    if (history.length < 14) throw new Error('Insufficient historical data for forecasting');

    const prices = history.map((p) => p.price);
    let predictedPrice: number;
    let accuracy: number;
    let factors: PriceFactor[];

    switch (model) {
      case 'moving_average': {
        const result = this.movingAverageForecast(prices, horizonDays);
        predictedPrice = result.price;
        accuracy = result.accuracy;
        break;
      }
      case 'exponential_smoothing': {
        const result = this.exponentialSmoothingForecast(prices, horizonDays);
        predictedPrice = result.price;
        accuracy = result.accuracy;
        break;
      }
      case 'linear_regression': {
        const result = this.linearRegressionForecast(prices, horizonDays);
        predictedPrice = result.price;
        accuracy = result.accuracy;
        break;
      }
      case 'arima': {
        const result = this.arimaForecast(prices, horizonDays);
        predictedPrice = result.price;
        accuracy = result.accuracy;
        break;
      }
      default: {
        const result = this.ensembleForecast(prices, horizonDays);
        predictedPrice = result.price;
        accuracy = result.accuracy;
      }
    }

    factors = this.analyzePriceFactors(commodity, region, prices);
    const volatility = this.calculateVolatility(prices);
    const confidenceMargin = predictedPrice * volatility * Math.sqrt(horizonDays / 30) * (1 - accuracy);

    const forecast: PriceForecast = {
      commodity,
      region,
      forecastDate: new Date(Date.now() + horizonDays * 86400000),
      predictedPrice: Math.max(0, predictedPrice),
      confidenceLower: Math.max(0, predictedPrice - confidenceMargin),
      confidenceUpper: predictedPrice + confidenceMargin,
      confidenceLevel: 0.95,
      model,
      accuracy,
      factors,
      horizon: horizonDays <= 1 ? 'daily' : horizonDays <= 7 ? 'weekly' : 'monthly',
      historicalPrices: history.slice(-90),
      generatedAt: new Date(),
    };

    this.forecasts.set(`${key}-${horizonDays}-${model}`, forecast);
    return forecast;
  }

  async getMultiHorizonForecast(commodity: CommodityType, region: string): Promise<PriceForecast[]> {
    return Promise.all(this.FORECAST_HORIZONS.map((h) => this.forecastPrice(commodity, region, h)));
  }

  // ── Demand/Supply Analysis ───────────────────────────────────────────────

  async analyzeDemandSupply(commodity: CommodityType, region: string): Promise<DemandSupplyAnalysis> {
    const key = this.getKey(commodity, region);
    const history = this.priceData.get(key) || [];
    const prices = history.map((p) => p.price);
    const volumes = history.map((p) => p.volume);

    const recentPrices = prices.slice(-30);
    const olderPrices = prices.slice(-60, -30);
    const recentVolumes = volumes.slice(-30);
    const olderVolumes = volumes.slice(-60, -30);

    const avgRecentPrice = this.average(recentPrices);
    const avgOlderPrice = this.average(olderPrices);
    const avgRecentVolume = this.average(recentVolumes);
    const avgOlderVolume = this.average(olderVolumes);

    const priceChange = avgOlderPrice ? (avgRecentPrice - avgOlderPrice) / avgOlderPrice : 0;
    const volumeChange = avgOlderVolume ? (avgRecentVolume - avgOlderVolume) / avgOlderVolume : 0;

    const demandIndex = Math.min(100, Math.max(0, 50 + (priceChange * 200) + (volumeChange * 100)));
    const supplyIndex = Math.min(100, Math.max(0, 50 - (priceChange * 150) + (volumeChange * 50)));
    const balanceRatio = supplyIndex > 0 ? demandIndex / supplyIndex : 1;

    const demandLevel = this.indexToDemandLevel(demandIndex);
    const supplyLevel = this.indexToSupplyLevel(supplyIndex);

    const demandDrivers = this.analyzeDemandDrivers(commodity, region, priceChange, volumeChange);
    const supplyDrivers = this.analyzeSupplyDrivers(commodity, region, priceChange, volumeChange);
    const recommendations = this.generateDemandSupplyRecommendations(demandLevel, supplyLevel, priceChange);

    return {
      commodity,
      region,
      demandLevel,
      supplyLevel,
      demandIndex: Math.round(demandIndex),
      supplyIndex: Math.round(supplyIndex),
      balanceRatio: Math.round(balanceRatio * 100) / 100,
      pricePressure: balanceRatio > 1.2 ? 'upward' : balanceRatio < 0.8 ? 'downward' : 'neutral',
      demandDrivers,
      supplyDrivers,
      recommendations,
      analyzedAt: new Date(),
    };
  }

  // ── Price Optimization ───────────────────────────────────────────────────

  async optimizePrice(
    listingId: string,
    currentPrice: number,
    commodity: CommodityType,
    region: string,
    quantity: number,
  ): Promise<PriceOptimization> {
    const key = this.getKey(commodity, region);
    const history = this.priceData.get(key) || [];
    const prices = history.map((p) => p.price);
    const volumes = history.map((p) => p.volume);

    const currentMarketPrice = this.average(prices.slice(-30));
    const elasticity = this.calculatePriceElasticity(prices, volumes);
    const volatility = this.calculateVolatility(prices);

    const optimalPrice = currentMarketPrice * (1 + (elasticity * -0.1));
    const priceDiff = optimalPrice - currentPrice;
    const expectedDemandChange = -elasticity * ((optimalPrice - currentPrice) / currentPrice) * 100;
    const expectedRevenueChange = ((optimalPrice * quantity) - (currentPrice * quantity)) / (currentPrice * quantity) * 100;

    let competitivePosition: PriceOptimization['competitivePosition'] = 'optimal';
    if (currentPrice < currentMarketPrice * 0.9) competitivePosition = 'underpriced';
    else if (currentPrice > currentMarketPrice * 1.1) competitivePosition = 'overpriced';

    const reasons: string[] = [];
    if (competitivePosition === 'underpriced') reasons.push('Price is below market average — potential revenue left on the table');
    if (competitivePosition === 'overpriced') reasons.push('Price is above market average — may reduce buyer interest');
    if (Math.abs(priceDiff) < currentPrice * 0.02) reasons.push('Current price is near optimal');
    if (volatility > 0.15) reasons.push('High market volatility — consider smaller price adjustments');
    if (elasticity < -1.5) reasons.push('Highly elastic market — price changes significantly affect demand');

    const recommendedPrice = Math.max(0, Math.round(optimalPrice * 100) / 100);

    return {
      listingId,
      currentPrice,
      recommendedPrice,
      expectedDemandChange: Math.round(expectedDemandChange * 100) / 100,
      expectedRevenueChange: Math.round(expectedRevenueChange * 100) / 100,
      priceElasticity: Math.round(elasticity * 1000) / 1000,
      competitivePosition,
      confidence: Math.round((1 - volatility) * 100),
      reasons,
      generatedAt: new Date(),
    };
  }

  // ── Alerts ───────────────────────────────────────────────────────────────

  async createPriceAlert(
    userId: string,
    commodity: CommodityType,
    region: string,
    type: PriceAlertType,
    threshold: number,
  ): Promise<PriceAlert> {
    const key = this.getKey(commodity, region);
    const history = this.priceData.get(key) || [];
    const currentPrice = history.length ? history[history.length - 1].price : 0;
    const triggered = this.checkAlertTrigger(type, currentPrice, threshold);
    const alert: PriceAlert = {
      id: randomUUID(),
      userId,
      commodity,
      region,
      type,
      threshold,
      currentPrice,
      triggered,
      triggeredAt: triggered ? new Date() : undefined,
      createdAt: new Date(),
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async checkAlerts(commodity: CommodityType, region: string, currentPrice: number): Promise<PriceAlert[]> {
    const triggered: PriceAlert[] = [];
    for (const alert of this.alerts.values()) {
      if (alert.commodity === commodity && alert.region === region && !alert.triggered) {
        if (this.checkAlertTrigger(alert.type, currentPrice, alert.threshold)) {
          alert.triggered = true;
          alert.triggeredAt = new Date();
          alert.currentPrice = currentPrice;
          triggered.push(alert);
        }
      }
    }
    return triggered;
  }

  async getUserAlerts(userId: string): Promise<PriceAlert[]> {
    return Array.from(this.alerts.values()).filter((a) => a.userId === userId);
  }

  async deleteAlert(id: string): Promise<void> {
    if (!this.alerts.delete(id)) throw new Error(`Alert ${id} not found`);
  }

  // ── Seasonal Patterns ────────────────────────────────────────────────────

  async analyzeSeasonalPatterns(commodity: CommodityType, region: string): Promise<SeasonalPattern[]> {
    const key = this.getKey(commodity, region);
    const history = this.priceData.get(key) || [];
    if (history.length < 365) return [];

    const monthlyData: Map<number, number[]> = new Map();
    const monthlyVolume: Map<number, number[]> = new Map();
    history.forEach((p) => {
      const month = p.timestamp.getMonth();
      if (!monthlyData.has(month)) { monthlyData.set(month, []); monthlyVolume.set(month, []); }
      monthlyData.get(month)!.push(p.price);
      monthlyVolume.get(month)!.push(p.volume);
    });

    const allPrices = history.map((p) => p.price);
    const globalAverage = this.average(allPrices);
    const seasonalMap: Record<Season, number[]> = { spring: [], summer: [], fall: [], winter: [] };

    const patterns: SeasonalPattern[] = [];
    const monthPrices: { month: number; avg: number }[] = [];

    for (let m = 0; m < 12; m++) {
      const prices = monthlyData.get(m) || [];
      const avg = prices.length ? this.average(prices) : globalAverage;
      monthPrices.push({ month: m, avg });
      const season = m <= 1 || m === 11 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'fall';
      seasonalMap[season].push(avg);
    }

    const bestMonth = monthPrices.reduce((best, mp) => mp.avg > best.avg ? mp : best).month;
    const worstMonth = monthPrices.reduce((worst, mp) => mp.avg < worst.avg ? mp : worst).month;

    for (const [season, seasonPrices] of Object.entries(seasonalMap)) {
      const avg = seasonPrices.length ? this.average(seasonPrices) : globalAverage;
      patterns.push({
        commodity,
        region,
        season: season as Season,
        averagePrice: Math.round(avg * 100) / 100,
        priceIndex: globalAverage ? Math.round((avg / globalAverage) * 100) : 100,
        volumeIndex: 100,
        bestMonthToSell: bestMonth,
        worstMonthToSell: worstMonth,
        volatility: this.calculateVolatility(seasonPrices),
      });
    }

    this.seasonalPatterns.set(key, patterns);
    return patterns;
  }

  // ── Market Trends ────────────────────────────────────────────────────────

  async analyzeTrend(commodity: CommodityType, region: string): Promise<MarketTrend> {
    const key = this.getKey(commodity, region);
    const history = this.priceData.get(key) || [];
    const prices = history.map((p) => p.price);
    if (prices.length < 30) throw new Error('Insufficient data for trend analysis');

    const ma7 = this.movingAverage(prices, 7);
    const ma30 = this.movingAverage(prices, 30);
    const ma90 = prices.length >= 90 ? this.movingAverage(prices, 90) : ma30;
    const rsi = this.calculateRSI(prices, 14);
    const macdValue = this.calculateMACD(prices);
    const momentum = prices.length >= 2 ? (prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2] : 0;
    const volatility = this.calculateVolatility(prices.slice(-30));
    const supportLevel = Math.min(...prices.slice(-30));
    const resistanceLevel = Math.max(...prices.slice(-30));

    const shortTermTrend: MarketTrend['shortTermTrend'] = ma7 > ma30 ? 'bullish' : ma7 < ma30 ? 'bearish' : 'neutral';
    const longTermTrend: MarketTrend['longTermTrend'] = ma30 > ma90 ? 'bullish' : ma30 < ma90 ? 'bearish' : 'neutral';

    return {
      commodity,
      region,
      shortTermTrend,
      longTermTrend,
      momentum: Math.round(momentum * 10000) / 100,
      supportLevel: Math.round(supportLevel * 100) / 100,
      resistanceLevel: Math.round(resistanceLevel * 100) / 100,
      volatilityIndex: Math.round(volatility * 10000) / 100,
      movingAverage7d: Math.round(ma7 * 100) / 100,
      movingAverage30d: Math.round(ma30 * 100) / 100,
      movingAverage90d: Math.round(ma90 * 100) / 100,
      rsi: Math.round(rsi * 100) / 100,
      macd: Math.round(macdValue * 100) / 100,
      analyzedAt: new Date(),
    };
  }

  async calculateElasticity(commodity: CommodityType, region: string): Promise<PriceElasticity> {
    const key = this.getKey(commodity, region);
    const history = this.priceData.get(key) || [];
    const prices = history.map((p) => p.price);
    const volumes = history.map((p) => p.volume);
    const elasticity = this.calculatePriceElasticity(prices, volumes);

    const crossElasticity: Record<CommodityType, number> = {} as Record<CommodityType, number>;
    const relatedCommodities: CommodityType[] = ['wheat', 'corn', 'soybeans', 'rice'];
    for (const rc of relatedCommodities) {
      if (rc !== commodity) crossElasticity[rc] = elasticity * (0.3 + Math.random() * 0.4);
    }

    let interpretation: string;
    if (Math.abs(elasticity) < 0.5) interpretation = 'Inelastic — price changes have minimal impact on demand';
    else if (Math.abs(elasticity) < 1) interpretation = 'Unit elastic — price changes proportionally affect demand';
    else interpretation = 'Elastic — price changes significantly impact demand';

    return {
      commodity,
      region,
      elasticity: Math.round(elasticity * 1000) / 1000,
      interpretation,
      demandChangePerPricePercent: Math.round(elasticity * 100) / 100,
      crossElasticity,
    };
  }

  // ── Forecasting Algorithms ───────────────────────────────────────────────

  private movingAverageForecast(prices: number[], horizon: number): { price: number; accuracy: number } {
    const window = Math.min(30, prices.length);
    const recent = prices.slice(-window);
    const sma = this.average(recent);
    const trend = recent.length >= 2 ? (recent[recent.length - 1] - recent[0]) / recent.length : 0;
    const predicted = sma + trend * horizon;
    const residuals = recent.map((p, i) => Math.abs(p - this.average(recent.slice(0, i + 1))));
    const mape = residuals.length ? this.average(residuals) / sma : 0.1;
    return { price: predicted, accuracy: Math.max(0, 1 - mape) };
  }

  private exponentialSmoothingForecast(prices: number[], horizon: number): { price: number; accuracy: number } {
    const alpha = 0.3;
    let forecast = prices[0];
    for (let i = 1; i < prices.length; i++) {
      forecast = alpha * prices[i] + (1 - alpha) * forecast;
    }
    const trend = prices.length >= 2 ? (prices[prices.length - 1] - prices[prices.length - 2]) : 0;
    const predicted = forecast + trend * horizon * 0.1;
    const lastErrors = prices.slice(-10).map((p, i) => Math.abs(p - this.average(prices.slice(0, prices.length - 10 + i + 1))));
    const mape = lastErrors.length ? this.average(lastErrors) / this.average(prices) : 0.1;
    return { price: predicted, accuracy: Math.max(0, 1 - mape) };
  }

  private linearRegressionForecast(prices: number[], horizon: number): { price: number; accuracy: number } {
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((s, v) => s + v, 0);
    const sumY = prices.reduce((s, v) => s + v, 0);
    const sumXY = x.reduce((s, v, i) => s + v * prices[i], 0);
    const sumX2 = x.reduce((s, v) => s + v * v, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predicted = slope * (n + horizon) + intercept;
    const predictedValues = x.map((xi) => slope * xi + intercept);
    const ssRes = prices.reduce((s, p, i) => s + Math.pow(p - predictedValues[i], 2), 0);
    const ssTot = prices.reduce((s, p) => s + Math.pow(p - this.average(prices), 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    return { price: predicted, accuracy: Math.max(0, Math.min(1, r2)) };
  }

  private arimaForecast(prices: number[], horizon: number): { price: number; accuracy: number } {
    const diff = prices.slice(1).map((p, i) => p - prices[i]);
    const diffMean = this.average(diff);
    const lastPrice = prices[prices.length - 1];
    const predicted = lastPrice + diffMean * horizon;
    const residuals = diff.map((d) => Math.abs(d - diffMean));
    const mape = residuals.length ? this.average(residuals) / this.average(prices) : 0.1;
    return { price: predicted, accuracy: Math.max(0, 1 - mape * 2) };
  }

  private ensembleForecast(prices: number[], horizon: number): { price: number; accuracy: number } {
    const ma = this.movingAverageForecast(prices, horizon);
    const es = this.exponentialSmoothingForecast(prices, horizon);
    const lr = this.linearRegressionForecast(prices, horizon);
    const ar = this.arimaForecast(prices, horizon);
    const totalAccuracy = ma.accuracy + es.accuracy + lr.accuracy + ar.accuracy;
    const weights = [ma.accuracy / totalAccuracy, es.accuracy / totalAccuracy, lr.accuracy / totalAccuracy, ar.accuracy / totalAccuracy];
    const predicted = ma.price * weights[0] + es.price * weights[1] + lr.price * weights[2] + ar.price * weights[3];
    const accuracy = totalAccuracy / 4;
    return { price: predicted, accuracy };
  }

  // ── Analysis Helpers ─────────────────────────────────────────────────────

  private analyzePriceFactors(commodity: CommodityType, region: string, prices: number[]): PriceFactor[] {
    const factors: PriceFactor[] = [];
    const volatility = this.calculateVolatility(prices);
    const trend = prices.length >= 2 ? (prices[prices.length - 1] - prices[0]) / prices[0] : 0;
    const season = this.getCurrentSeason();
    factors.push({
      name: 'Market Volatility',
      impact: volatility * 100,
      direction: volatility > 0.1 ? 'negative' : 'positive',
      weight: 0.25,
      description: `Market volatility is ${(volatility * 100).toFixed(1)}%`,
    });
    factors.push({
      name: 'Price Trend',
      impact: Math.abs(trend) * 100,
      direction: trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral',
      weight: 0.3,
      description: `Prices have moved ${trend > 0 ? 'up' : 'down'} ${(Math.abs(trend) * 100).toFixed(1)}% over the period`,
    });
    factors.push({
      name: 'Seasonal Effect',
      impact: this.getSeasonalImpact(commodity, season),
      direction: this.getSeasonalImpact(commodity, season) > 0 ? 'positive' : 'negative',
      weight: 0.2,
      description: `${season} season impact on ${commodity} pricing`,
    });
    factors.push({
      name: 'Supply Scarcity',
      impact: Math.random() * 20,
      direction: Math.random() > 0.5 ? 'positive' : 'negative',
      weight: 0.15,
      description: 'Estimated supply availability',
    });
    factors.push({
      name: 'Global Demand',
      impact: Math.random() * 15,
      direction: 'positive',
      weight: 0.1,
      description: 'International demand pressure',
    });
    return factors;
  }

  private analyzeDemandDrivers(commodity: CommodityType, region: string, priceChange: number, volumeChange: number): DemandDriver[] {
    return [
      { factor: 'Price Movement', impact: Math.abs(priceChange) * 100, trend: priceChange > 0 ? 'increasing' : 'decreasing', description: 'Price changes influencing buyer behavior' },
      { factor: 'Volume Trend', impact: Math.abs(volumeChange) * 80, trend: volumeChange > 0 ? 'increasing' : 'decreasing', description: 'Trading volume changes' },
      { factor: 'Seasonal Demand', impact: 15, trend: 'stable', description: 'Seasonal consumption patterns' },
      { factor: 'Export Demand', impact: Math.random() * 20, trend: 'stable', description: 'International buyer interest' },
    ];
  }

  private analyzeSupplyDrivers(commodity: CommodityType, region: string, priceChange: number, volumeChange: number): SupplyDriver[] {
    return [
      { factor: 'Harvest Progress', impact: 25, trend: 'stable', description: 'Current harvest stage impact' },
      { factor: 'Weather Conditions', impact: Math.random() * 30, trend: 'stable', description: 'Weather affecting supply' },
      { factor: 'Storage Levels', impact: 15, trend: 'decreasing', description: 'Existing inventory drawdown' },
      { factor: 'Import Activity', impact: Math.random() * 15, trend: 'stable', description: 'International supply flows' },
    ];
  }

  private generateDemandSupplyRecommendations(demandLevel: DemandLevel, supplyLevel: SupplyLevel, priceChange: number): string[] {
    const recs: string[] = [];
    if (demandLevel === 'very_high' && supplyLevel === 'low') recs.push('Strong seller market — consider increasing prices');
    if (demandLevel === 'low' && supplyLevel === 'very_high') recs.push('Buyer market — competitive pricing recommended');
    if (priceChange > 0.05) recs.push('Prices trending upward — lock in current prices for purchases');
    if (priceChange < -0.05) recs.push('Prices trending downward — wait for better buying opportunities');
    if (demandLevel === 'high' && supplyLevel === 'high') recs.push('Balanced market — focus on quality differentiation');
    if (demandLevel === 'low' && supplyLevel === 'low') recs.push('Thin market — expect price volatility');
    if (recs.length === 0) recs.push('Market is balanced — monitor for changes');
    return recs;
  }

  // ── Technical Indicators ─────────────────────────────────────────────────

  private movingAverage(data: number[], period: number): number {
    const slice = data.slice(-period);
    return this.average(slice);
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const mean = this.average(returns);
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    const changes = prices.slice(1).map((p, i) => p - prices[i]);
    const gains = changes.slice(-period).map((c) => c > 0 ? c : 0);
    const losses = changes.slice(-period).map((c) => c < 0 ? -c : 0);
    const avgGain = this.average(gains);
    const avgLoss = this.average(losses);
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(prices: number[], fast: number = 12, slow: number = 26): number {
    const emaFast = this.calculateEMA(prices, fast);
    const emaSlow = this.calculateEMA(prices, slow);
    return emaFast - emaSlow;
  }

  private calculateEMA(data: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  private calculatePriceElasticity(prices: number[], volumes: number[]): number {
    if (prices.length < 10 || volumes.length < 10) return -1;
    const n = Math.min(prices.length, volumes.length);
    const recentPrices = prices.slice(-n);
    const recentVolumes = volumes.slice(-n);
    const priceChanges: number[] = [];
    const volumeChanges: number[] = [];
    for (let i = 1; i < n; i++) {
      if (recentPrices[i - 1] !== 0) priceChanges.push((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]);
      if (recentVolumes[i - 1] !== 0) volumeChanges.push((recentVolumes[i] - recentVolumes[i - 1]) / recentVolumes[i - 1]);
    }
    if (!priceChanges.length) return -1;
    const avgPriceChange = this.average(priceChanges);
    const avgVolumeChange = this.average(volumeChanges);
    return avgPriceChange !== 0 ? avgVolumeChange / avgPriceChange : -1;
  }

  // ── Utility Methods ──────────────────────────────────────────────────────

  private average(arr: number[]): number {
    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  }

  private getKey(commodity: CommodityType, region: string): string {
    return `${commodity}-${region}`;
  }

  private getCurrentSeason(): Season {
    const month = new Date().getMonth();
    if (month <= 1 || month === 11) return 'winter';
    if (month <= 4) return 'spring';
    if (month <= 7) return 'summer';
    return 'fall';
  }

  private getSeasonalImpact(commodity: CommodityType, season: Season): number {
    const impacts: Record<Season, number> = { spring: 5, summer: -2, fall: -8, winter: 10 };
    return impacts[season] || 0;
  }

  private indexToDemandLevel(index: number): DemandLevel {
    if (index >= 80) return 'very_high';
    if (index >= 60) return 'high';
    if (index >= 40) return 'moderate';
    if (index >= 20) return 'low';
    return 'very_low';
  }

  private indexToSupplyLevel(index: number): SupplyLevel {
    if (index >= 80) return 'very_high';
    if (index >= 60) return 'high';
    if (index >= 40) return 'moderate';
    if (index >= 20) return 'low';
    return 'very_low';
  }

  private checkAlertTrigger(type: PriceAlertType, currentPrice: number, threshold: number): boolean {
    switch (type) {
      case 'above': return currentPrice >= threshold;
      case 'below': return currentPrice <= threshold;
      case 'percent_change': return false;
      default: return false;
    }
  }
}
