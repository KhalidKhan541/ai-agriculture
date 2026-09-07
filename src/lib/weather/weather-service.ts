// ============================================================================
// AI Agriculture Platform - Weather Service
// Weather data, forecasts, alerts, historical analysis, agricultural metrics
// ============================================================================

import type {
  WeatherServiceConfig,
  CurrentWeather,
  WeatherForecast,
  HourlyForecast,
  DailyForecast,
  WeatherAlert,
  AgriculturalWeatherData,
  HistoricalWeatherData,
  WeatherStatistics,
  AirQualityData,
} from '../../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const defaultConfig: WeatherServiceConfig = {
  apiKey: '',
  baseUrl: 'https://api.openweathermap.org/data/2.5',
  units: 'metric',
  language: 'en',
  cacheDurationMinutes: 15,
};

let config: WeatherServiceConfig = { ...defaultConfig };

export function configureWeatherService(overrides: Partial<WeatherServiceConfig>): void {
  config = { ...config, ...overrides };
}

// ---------------------------------------------------------------------------
// Cache Layer
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMinutes?: number): void {
  const ttl = (ttlMinutes || config.cacheDurationMinutes || 15) * 60 * 1000;
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

export class WeatherServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(`[WeatherService] ${message}`);
    this.name = 'WeatherServiceError';
  }
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

async function weatherFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!config.apiKey) {
    throw new WeatherServiceError('NO_API_KEY', 'Weather API key is not configured');
  }

  const url = new URL(`${config.baseUrl}${endpoint}`);
  url.searchParams.set('appid', config.apiKey);
  url.searchParams.set('units', config.units);
  url.searchParams.set('lang', config.language);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const cacheKey = url.toString();
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new WeatherServiceError(
      'API_ERROR',
      `Weather API returned ${response.status}: ${body}`,
      response.status
    );
  }

  const data = (await response.json()) as T;
  setCache(cacheKey, data);
  return data;
}

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------

export interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export async function geocode(query: string): Promise<GeocodingResult[]> {
  const data = await weatherFetch<any[]>(
    'https://api.openweathermap.org/geo/1.0/direct',
    { q: query, limit: '5' }
  );

  return data.map((item: any) => ({
    name: item.name,
    lat: item.lat,
    lon: item.lon,
    country: item.country,
    state: item.state,
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  const data = await weatherFetch<any>(
    'https://api.openweathermap.org/geo/1.0/reverse',
    { lat: lat.toString(), lon: lon.toString(), limit: '1' }
  );

  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  const item = Array.isArray(data) ? data[0] : data;

  return {
    name: item.name,
    lat: item.lat,
    lon: item.lon,
    country: item.country,
    state: item.state,
  };
}

// ---------------------------------------------------------------------------
// Current Weather
// ---------------------------------------------------------------------------

interface OWCurrentWeather {
  coord: { lon: number; lat: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  rain?: { '1h'?: number; '3h'?: number };
  snow?: { '1h'?: number; '3h'?: number };
  dt: number;
  timezone: number;
  sys: { country: string; sunrise: number; sunset: number };
  id: number;
  name: string;
  cod: number;
}

export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<CurrentWeather> {
  const data = await weatherFetch<OWCurrentWeather>('/weather', {
    lat: lat.toString(),
    lon: lon.toString(),
  });

  const precipitation1h = data.rain?.['1h'] || data.snow?.['1h'] || 0;
  const precipitationType = data.rain?.['1h']
    ? 'rain'
    : data.snow?.['1h']
      ? 'snow'
      : 'none';

  const uvIndex = await getUVIndex(lat, lon);

  return {
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    windDirection: data.wind.deg,
    windGust: data.wind.gust,
    visibility: data.visibility,
    uvIndex,
    cloudCover: data.clouds.all,
    precipitation: precipitation1h,
    precipitationType: precipitationType as CurrentWeather['precipitationType'],
    dewPoint: calculateDewPoint(data.main.temp, data.main.humidity),
    condition: data.weather[0]?.description || 'Unknown',
    icon: data.weather[0]?.icon || '01d',
    sunrise: new Date(data.sys.sunrise * 1000),
    sunset: new Date(data.sys.sunset * 1000),
    timestamp: new Date(data.dt * 1000),
  };
}

async function getUVIndex(lat: number, lon: number): Promise<number> {
  try {
    const data = await weatherFetch<any>('/uvi', {
      lat: lat.toString(),
      lon: lon.toString(),
    });
    return data.value || 0;
  } catch {
    return 0;
  }
}

function calculateDewPoint(temp: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

// ---------------------------------------------------------------------------
// Hourly Forecast
// ---------------------------------------------------------------------------

interface OWHourlyForecast {
  list: {
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: { id: number; main: string; description: string; icon: string }[];
    clouds: { all: number };
    wind: { speed: number; deg: number; gust?: number };
    visibility: number;
    pop: number;
    rain?: { '3h'?: number };
    snow?: { '3h'?: number };
    dt_txt: string;
  }[];
  city: {
    name: string;
    country: string;
    timezone: number;
  };
}

export async function getHourlyForecast(
  lat: number,
  lon: number,
  hours: number = 48
): Promise<HourlyForecast[]> {
  const data = await weatherFetch<OWHourlyForecast>('/forecast', {
    lat: lat.toString(),
    lon: lon.toString(),
    cnt: Math.min(hours, 40).toString(),
  });

  return data.list.map((item) => ({
    time: new Date(item.dt * 1000),
    temperature: item.main.temp,
    feelsLike: item.main.feels_like,
    humidity: item.main.humidity,
    precipitationProbability: Math.round(item.pop * 100),
    precipitationAmount: (item.rain?.['3h'] || item.snow?.['3h'] || 0) / 3,
    precipitationType: item.rain?.['3h'] ? 'rain' : item.snow?.['3h'] ? 'snow' : 'none',
    windSpeed: item.wind.speed,
    windDirection: item.wind.deg,
    windGust: item.wind.gust,
    cloudCover: item.clouds.all,
    visibility: item.visibility,
    uvIndex: 0,
    condition: item.weather[0]?.description || 'Unknown',
    icon: item.weather[0]?.icon || '01d',
    evapotranspiration: estimateEvapotranspiration(item.main.temp, item.main.humidity, item.wind.speed),
  }));
}

function estimateEvapotranspiration(temp: number, humidity: number, windSpeed: number): number {
  const svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
  const avp = svp * (humidity / 100);
  const netRadiation = 15;
  const windFactor = 0.26 * (1 + 0.54 * windSpeed);
  return Math.max(0, (0.408 * netRadiation * (svp - avp) + windFactor * (svp - avp)) / (svp + 0.5));
}

// ---------------------------------------------------------------------------
// Daily Forecast
// ---------------------------------------------------------------------------

interface OWOneCallWeather {
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: { id: number; main: string; description: string; icon: string }[];
  };
  hourly: {
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: { id: number; main: string; description: string; icon: string }[];
    pop: number;
    rain?: { '1h'?: number };
    snow?: { '1h'?: number };
  }[];
  daily: {
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    summary: string;
    temp: { day: number; min: number; max: number; night: number; eve: number; morn: number };
    feels_like: { day: number; night: number; eve: number; morn: number };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: { id: number; main: string; description: string; icon: string }[];
    clouds: number;
    pop: number;
    rain?: number;
    snow?: number;
    uvi: number;
  }[];
  alerts?: {
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags: string[];
  }[];
}

export async function getDailyForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<DailyForecast[]> {
  const data = await weatherFetch<OWOneCallWeather>(
    'https://api.openweathermap.org/data/3.0/onecall',
    {
      lat: lat.toString(),
      lon: lon.toString(),
      exclude: 'minutely',
    }
  );

  return data.daily.slice(0, days).map((day) => {
    const avgTemp = (day.temp.min + day.temp.max) / 2;
    const evapotranspiration = estimateEvapotranspiration(avgTemp, day.humidity, day.wind_speed);
    const gdd = calculateGrowingDegreeDays(day.temp.min, day.temp.max, 10);
    const frostRisk = day.temp.min <= 2;
    const heatStressRisk = day.temp.max >= 35;

    return {
      date: new Date(day.dt * 1000),
      temperature: { min: day.temp.min, max: day.temp.max, avg: avgTemp },
      feelsLike: {
        min: day.feels_like.night,
        max: day.feels_like.day,
      },
      humidity: { min: day.humidity, max: day.humidity, avg: day.humidity },
      precipitation: {
        probability: Math.round(day.pop * 100),
        amount: day.rain || day.snow || 0,
        type: day.rain ? 'rain' : day.snow ? 'snow' : 'none',
      },
      wind: { speed: day.wind_speed, direction: day.wind_deg, gust: day.wind_gust },
      uvIndex: day.uvi,
      visibility: 10000,
      sunrise: new Date(day.sunrise * 1000),
      sunset: new Date(day.sunset * 1000),
      moonPhase: getMoonPhaseName(day.moon_phase),
      condition: day.weather[0]?.description || 'Unknown',
      icon: day.weather[0]?.icon || '01d',
      growingDegreeDays: gdd,
      evapotranspiration,
      frostRisk,
      heatStressRisk,
      droughtIndex: calculateDroughtIndex(day.humidity, day.rain || 0, day.uvi),
    };
  });
}

function calculateGrowingDegreeDays(min: number, max: number, baseTemp: number): number {
  const avgTemp = (min + max) / 2;
  return Math.max(0, avgTemp - baseTemp);
}

function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

function calculateDroughtIndex(humidity: number, precipitation: number, uvIndex: number): number {
  const humidityFactor = Math.max(0, 1 - humidity / 100);
  const precipFactor = Math.max(0, 1 - precipitation / 50);
  const uvFactor = Math.min(uvIndex / 11, 1);
  return Math.round((humidityFactor * 0.4 + precipFactor * 0.4 + uvFactor * 0.2) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Full Weather Forecast (Combined)
// ---------------------------------------------------------------------------

export async function getWeatherForecast(
  lat: number,
  lon: number
): Promise<WeatherForecast> {
  const current = await getCurrentWeather(lat, lon);
  const hourlyData = await getHourlyForecast(lat, lon, 48);
  const dailyData = await getDailyForecast(lat, lon, 7);
  const alerts = await getWeatherAlerts(lat, lon);
  const agricultural = calculateAgriculturalWeatherData(current, dailyData, lat, lon);

  return {
    current,
    hourly: hourlyData,
    daily: dailyData,
    alerts,
    agricultural,
  };
}

// ---------------------------------------------------------------------------
// Weather Alerts
// ---------------------------------------------------------------------------

export async function getWeatherAlerts(
  lat: number,
  lon: number
): Promise<WeatherAlert[]> {
  try {
    const data = await weatherFetch<OWOneCallWeather>(
      'https://api.openweathermap.org/data/3.0/onecall',
      { lat: lat.toString(), lon: lon.toString(), exclude: 'minutely,hourly,daily' }
    );

    if (!data.alerts) return [];

    return data.alerts.map((alert, idx) => ({
      id: `alert-${idx}-${Date.now()}`,
      type: 'warning' as const,
      severity: determineAlertSeverity(alert.event),
      event: alert.event,
      headline: alert.event,
      description: alert.description,
      instruction: 'Follow local authorities guidance',
      onset: new Date(alert.start * 1000),
      expires: new Date(alert.end * 1000),
      affectedAreas: [],
      agriculturalImpact: assessAgriculturalImpact(alert.event),
    }));
  } catch {
    return [];
  }
}

function determineAlertSeverity(event: string): WeatherAlert['severity'] {
  const lower = event.toLowerCase();
  if (lower.includes('tornado') || lower.includes('hurricane') || lower.includes('typhoon'))
    return 'extreme';
  if (lower.includes('thunderstorm') || lower.includes('flood') || lower.includes('blizzard'))
    return 'severe';
  if (lower.includes('warning') || lower.includes('watch')) return 'moderate';
  return 'minor';
}

function assessAgriculturalImpact(event: string): string {
  const lower = event.toLowerCase();
  if (lower.includes('frost') || lower.includes('freeze'))
    return 'High risk of crop damage. Protect sensitive crops immediately.';
  if (lower.includes('flood'))
    return 'Risk of waterlogging and root damage. Ensure drainage systems are operational.';
  if (lower.includes('drought'))
    return 'Increased irrigation needs. Monitor soil moisture closely.';
  if (lower.includes('heat'))
    return 'Heat stress risk for crops and livestock. Increase irrigation frequency.';
  if (lower.includes('wind'))
    return 'Potential for crop lodging. Secure tall crops and structures.';
  if (lower.includes('hail'))
    return 'High risk of physical crop damage. Consider protective measures.';
  if (lower.includes('thunderstorm'))
    return 'Possible heavy rain and wind. Monitor field conditions.';
  return 'Monitor weather conditions and adjust agricultural operations as needed.';
}

// ---------------------------------------------------------------------------
// Agricultural Weather Data Calculation
// ---------------------------------------------------------------------------

function calculateAgriculturalWeatherData(
  current: CurrentWeather,
  daily: DailyForecast[],
  lat: number,
  lon: number
): AgriculturalWeatherData {
  const avgTemp = daily.length > 0
    ? daily.reduce((sum, d) => sum + d.temperature.avg, 0) / daily.length
    : current.temperature;

  const accumulatedGDD = daily.reduce((sum, d) => sum + (d.growingDegreeDays || 0), 0);
  const avgET = daily.length > 0
    ? daily.reduce((sum, d) => sum + (d.evapotranspiration || 0), 0) / daily.length
    : 0;

  const frostRisk = daily
    .filter((d) => d.frostRisk)
    .map((d) => ({
      probability: 0.8,
      temperature: d.temperature.min,
      time: d.sunrise,
    }));

  const heatStressIndex = avgTemp > 35 ? (avgTemp - 35) / 15 : 0;
  const droughtIndex = daily.length > 0
    ? daily.reduce((sum, d) => sum + (d.droughtIndex || 0), 0) / daily.length
    : 0;

  const soilMoisture = estimateSoilMoisture(
    current.humidity,
    daily.reduce((sum, d) => sum + d.precipitation.amount, 0),
    avgET
  );

  const leafWetness = estimateLeafWetness(
    current.humidity,
    current.precipitation,
    current.temperature,
    current.windSpeed
  );

  const diseaseRisk = assessDiseaseRisk(leafWetness, avgTemp, current.humidity);
  const pestRisk = assessPestRisk(avgTemp, current.humidity, daily.length > 0 ? daily[0].precipitation.amount : 0);

  return {
    growingDegreeDays: calculateGrowingDegreeDays(
      daily.length > 0 ? daily[0].temperature.min : current.temperature - 5,
      daily.length > 0 ? daily[0].temperature.max : current.temperature + 5,
      10
    ),
    accumulatedGDD,
    evapotranspiration: avgET,
    cropWaterNeed: Math.max(0, avgET * 1.2),
    irrigationRecommendation: generateIrrigationRecommendation(soilMoisture, avgET, daily),
    frostRisk,
    heatStressIndex: Math.round(heatStressIndex * 100) / 100,
    droughtIndex: Math.round(droughtIndex * 100) / 100,
    soilMoisture: Math.round(soilMoisture * 100),
    leafWetness: Math.round(leafWetness * 100),
    diseaseRisk,
    pestRisk,
  };
}

function estimateSoilMoisture(humidity: number, precipitation: number, et: number): number {
  const precipInput = Math.min(precipitation / 10, 1);
  const humidityInput = humidity / 100;
  const etLoss = Math.min(et / 10, 1);
  return Math.max(0, Math.min(1, (precipInput * 0.4 + humidityInput * 0.4 + 0.3) - etLoss * 0.2));
}

function estimateLeafWetness(
  humidity: number,
  precipitation: number,
  temp: number,
  windSpeed: number
): number {
  let score = 0;
  if (humidity > 80) score += 0.4;
  else if (humidity > 60) score += 0.2;
  if (precipitation > 0) score += 0.3;
  if (temp > 5 && temp < 30) score += 0.15;
  if (windSpeed < 5) score += 0.15;
  return Math.min(score, 1);
}

function assessDiseaseRisk(leafWetness: number, temp: number, humidity: number): AgriculturalWeatherData['diseaseRisk'] {
  let score = 0;
  if (leafWetness > 0.7) score += 0.4;
  else if (leafWetness > 0.4) score += 0.2;
  if (temp > 15 && temp < 30) score += 0.3;
  if (humidity > 70) score += 0.3;

  if (score >= 0.7) return 'very_high';
  if (score >= 0.5) return 'high';
  if (score >= 0.3) return 'moderate';
  return 'low';
}

function assessPestRisk(temp: number, humidity: number, precipitation: number): AgriculturalWeatherData['pestRisk'] {
  let score = 0;
  if (temp > 20 && temp < 35) score += 0.4;
  if (humidity > 50 && humidity < 85) score += 0.3;
  if (precipitation > 0 && precipitation < 20) score += 0.2;
  if (temp > 25 && humidity > 60) score += 0.1;

  if (score >= 0.7) return 'very_high';
  if (score >= 0.5) return 'high';
  if (score >= 0.3) return 'moderate';
  return 'low';
}

function generateIrrigationRecommendation(
  soilMoisture: number,
  et: number,
  daily: DailyForecast[]
): string {
  const upcomingPrecip = daily.slice(0, 3).reduce((sum, d) => sum + d.precipitation.amount, 0);

  if (soilMoisture < 0.3 && upcomingPrecip < 5) {
    return 'Irrigation needed within 24-48 hours. Soil moisture is critically low.';
  }
  if (soilMoisture < 0.5 && upcomingPrecip < 10) {
    return 'Consider irrigation within 3-5 days. Soil moisture is below optimal.';
  }
  if (upcomingPrecip > 20) {
    return 'No irrigation needed. Significant rainfall expected.';
  }
  if (soilMoisture > 0.7) {
    return 'No irrigation needed. Soil moisture is adequate.';
  }
  return 'Monitor soil moisture. Current levels are acceptable.';
}

// ---------------------------------------------------------------------------
// Historical Weather Data
// ---------------------------------------------------------------------------

export async function getHistoricalWeather(
  lat: number,
  lon: number,
  startDate: Date,
  endDate: Date
): Promise<HistoricalWeatherData[]> {
  const start = Math.floor(startDate.getTime() / 1000);
  const end = Math.floor(endDate.getTime() / 1000);

  const data = await weatherFetch<any>(
    'https://api.openweathermap.org/data/3.0/onecall/timemachine',
    {
      lat: lat.toString(),
      lon: lon.toString(),
      dt: start.toString(),
    }
  );

  const hourly = data.data || [];
  const dailyMap = new Map<string, any[]>();

  for (const hour of hourly) {
    const dateKey = new Date(hour.dt * 1000).toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) || [];
    existing.push(hour);
    dailyMap.set(dateKey, existing);
  }

  const results: HistoricalWeatherData[] = [];
  for (const [dateStr, hours] of dailyMap) {
    const temps = hours.map((h: any) => h.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;

    const humidities = hours.map((h: any) => h.humidity);
    const avgHumidity = humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length;

    const winds = hours.map((h: any) => h.wind_speed);
    const avgWind = winds.reduce((a: number, b: number) => a + b, 0) / winds.length;

    const precip = hours.reduce(
      (sum: number, h: any) => sum + (h.rain?.['1h'] || 0),
      0
    );

    results.push({
      date: new Date(dateStr),
      temperature: { min: minTemp, max: maxTemp, avg: avgTemp },
      humidity: avgHumidity,
      precipitation: precip,
      windSpeed: avgWind,
      windDirection: hours[0]?.wind_deg || 0,
      pressure: hours[0]?.pressure || 1013,
      solarRadiation: estimateSolarRadiation(avgTemp, hours[0]?.clouds || 50),
      evapotranspiration: estimateEvapotranspiration(avgTemp, avgHumidity, avgWind),
      conditions: hours[0]?.weather?.[0]?.description || 'Unknown',
    });
  }

  return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function estimateSolarRadiation(temp: number, cloudCover: number): number {
  const baseRadiation = 25;
  const cloudFactor = 1 - (cloudCover / 100) * 0.75;
  return baseRadiation * cloudFactor;
}

// ---------------------------------------------------------------------------
// Weather Statistics
// ---------------------------------------------------------------------------

export function calculateWeatherStatistics(
  data: HistoricalWeatherData[]
): WeatherStatistics {
  if (data.length === 0) {
    return {
      period: { start: new Date(), end: new Date() },
      temperature: { avg: 0, min: 0, max: 0, stdDev: 0, anomaly: 0 },
      precipitation: { total: 0, days: 0, maxDaily: 0, anomaly: 0 },
      humidity: { avg: 0, min: 0, max: 0 },
      wind: { avgSpeed: 0, maxSpeed: 0, prevailingDirection: 0 },
      solarRadiation: { total: 0, avgDaily: 0 },
      growingDegreeDays: 0,
      droughtIndex: 0,
      freezeDays: 0,
      heatDays: 0,
    };
  }

  const temps = data.map((d) => d.temperature.avg);
  const minTemps = data.map((d) => d.temperature.min);
  const maxTemps = data.map((d) => d.temperature.max);
  const humidities = data.map((d) => d.humidity);
  const winds = data.map((d) => d.windSpeed);
  const precips = data.map((d) => d.precipitation);

  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const tempVariance = temps.reduce((sum, t) => sum + Math.pow(t - avgTemp, 2), 0) / temps.length;

  const totalPrecip = precips.reduce((a, b) => a + b, 0);
  const precipDays = precips.filter((p) => p > 0.1).length;
  const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
  const avgWind = winds.reduce((a, b) => a + b, 0) / winds.length;
  const gdd = data.reduce((sum, d) => sum + Math.max(0, d.temperature.avg - 10), 0);

  const freezeDays = minTemps.filter((t) => t <= 0).length;
  const heatDays = maxTemps.filter((t) => t >= 35).length;

  const avgSolar = data.reduce((sum, d) => sum + d.solarRadiation, 0) / data.length;

  const windDirs = data.map((d) => d.windDirection);
  const prevailingDir = calculatePrevailingDirection(windDirs);

  const droughtIndex = calculateDroughtIndexFromData(humidities, precips);

  return {
    period: {
      start: data[0].date,
      end: data[data.length - 1].date,
    },
    temperature: {
      avg: Math.round(avgTemp * 10) / 10,
      min: Math.round(Math.min(...minTemps) * 10) / 10,
      max: Math.round(Math.max(...maxTemps) * 10) / 10,
      stdDev: Math.round(Math.sqrt(tempVariance) * 10) / 10,
      anomaly: 0,
    },
    precipitation: {
      total: Math.round(totalPrecip * 10) / 10,
      days: precipDays,
      maxDaily: Math.round(Math.max(...precips) * 10) / 10,
      anomaly: 0,
    },
    humidity: {
      avg: Math.round(avgHumidity),
      min: Math.round(Math.min(...humidities)),
      max: Math.round(Math.max(...humidities)),
    },
    wind: {
      avgSpeed: Math.round(avgWind * 10) / 10,
      maxSpeed: Math.round(Math.max(...winds) * 10) / 10,
      prevailingDirection: prevailingDir,
    },
    solarRadiation: {
      total: Math.round(avgSolar * data.length),
      avgDaily: Math.round(avgSolar * 10) / 10,
    },
    growingDegreeDays: Math.round(gdd),
    droughtIndex: Math.round(droughtIndex * 100) / 100,
    freezeDays,
    heatDays,
  };
}

function calculatePrevailingDirection(directions: number[]): number {
  if (directions.length === 0) return 0;
  let sumSin = 0;
  let sumCos = 0;
  for (const dir of directions) {
    const rad = (dir * Math.PI) / 180;
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }
  let avgRad = Math.atan2(sumSin / directions.length, sumCos / directions.length);
  if (avgRad < 0) avgRad += 2 * Math.PI;
  return Math.round((avgRad * 180) / Math.PI);
}

function calculateDroughtIndexFromData(humidity: number[], precipitation: number[]): number {
  const avgHumidity = humidity.reduce((a, b) => a + b, 0) / humidity.length;
  const totalPrecip = precipitation.reduce((a, b) => a + b, 0);
  const avgPrecip = totalPrecip / (precipitation.length || 1);

  const humidScore = Math.max(0, 1 - avgHumidity / 100);
  const precipScore = Math.max(0, 1 - avgPrecip / 10);

  return humidScore * 0.5 + precipScore * 0.5;
}

// ---------------------------------------------------------------------------
// Farming Calendar & Seasonal Analysis
// ---------------------------------------------------------------------------

export interface FarmingSeason {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  start: Date;
  end: Date;
  avgTemperature: number;
  totalPrecipitation: number;
  growingDegreeDays: number;
  frostFreeDays: number;
 适合crops: string[];
}

export function generateFarmingCalendar(
  historicalData: HistoricalWeatherData[]
): FarmingSeason[] {
  if (historicalData.length === 0) return [];

  const monthlyData = new Map<number, HistoricalWeatherData[]>();
  for (const d of historicalData) {
    const month = new Date(d.date).getMonth();
    const existing = monthlyData.get(month) || [];
    existing.push(d);
    monthlyData.set(month, existing);
  }

  const seasons: FarmingSeason[] = [];
  const seasonMonths: Record<string, number[]> = {
    spring: [2, 3, 4],
    summer: [5, 6, 7],
    fall: [8, 9, 10],
    winter: [11, 0, 1],
  };

  for (const [season, months] of Object.entries(seasonMonths)) {
    const seasonData = months.flatMap((m) => monthlyData.get(m) || []);
    if (seasonData.length === 0) continue;

    const temps = seasonData.map((d) => d.temperature.avg);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const totalPrecip = seasonData.reduce((sum, d) => sum + d.precipitation, 0);
    const gdd = seasonData.reduce((sum, d) => sum + Math.max(0, d.temperature.avg - 10), 0);
    const frostFreeDays = seasonData.filter((d) => d.temperature.min > 0).length;

    seasons.push({
      season: season as FarmingSeason['season'],
      start: new Date(seasonData[0].date),
      end: new Date(seasonData[seasonData.length - 1].date),
      avgTemperature: Math.round(avgTemp * 10) / 10,
      totalPrecipitation: Math.round(totalPrecip * 10) / 10,
      growingDegreeDays: Math.round(gdd),
      frostFreeDays,
      适合crops: suggestCropsForSeason(season, avgTemp, totalPrecip),
    });
  }

  return seasons;
}

function suggestCropsForSeason(season: string, avgTemp: number, precip: number): string[] {
  const suggestions: string[] = [];

  if (season === 'spring') {
    if (avgTemp > 10 && avgTemp < 25) suggestions.push('wheat', 'barley', 'peas', 'lettuce');
    if (avgTemp > 15) suggestions.push('corn', 'soybean', 'cotton');
  } else if (season === 'summer') {
    if (avgTemp > 20) suggestions.push('corn', 'tomato', 'pepper', 'melon');
    if (avgTemp > 25) suggestions.push('rice', 'sugarcane', 'sunflower');
    if (precip < 100) suggestions.push('drought-resistant varieties');
  } else if (season === 'fall') {
    if (avgTemp > 10) suggestions.push('wheat', 'rye', 'turnip', 'kale');
    if (avgTemp > 15) suggestions.push('late-season vegetables');
  } else {
    if (avgTemp > 0 && avgTemp < 10) suggestions.push('winter wheat', 'garlic', 'onion');
    if (avgTemp < 0) suggestions.push('cover crops', 'green manure');
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Weather Comparison (Multi-location)
// ---------------------------------------------------------------------------

export interface LocationComparison {
  lat: number;
  lon: number;
  locationName: string;
  current: CurrentWeather;
  agricultural: AgriculturalWeatherData;
  suitabilityScore: number;
  bestFor: string[];
}

export async function compareLocations(
  locations: { lat: number; lon: number; name?: string }[]
): Promise<LocationComparison[]> {
  const results: LocationComparison[] = [];

  for (const loc of locations) {
    try {
      const current = await getCurrentWeather(loc.lat, loc.lon);
      const forecast = await getDailyForecast(loc.lat, loc.lon, 7);
      const agricultural = calculateAgriculturalWeatherData(current, forecast, loc.lat, loc.lon);

      const suitabilityScore = calculateSuitabilityScore(current, agricultural);
      const bestFor = suggestBestCrops(current, agricultural);

      results.push({
        lat: loc.lat,
        lon: loc.lon,
        locationName: loc.name || `${loc.lat}, ${loc.lon}`,
        current,
        agricultural,
        suitabilityScore,
        bestFor,
      });
    } catch (err) {
      console.error(`Failed to get weather for ${loc.name || loc.lat}:`, err);
    }
  }

  return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

function calculateSuitabilityScore(
  current: CurrentWeather,
  agricultural: AgriculturalWeatherData
): number {
  let score = 0;

  if (current.temperature >= 15 && current.temperature <= 30) score += 0.25;
  else if (current.temperature >= 5 && current.temperature <= 35) score += 0.15;

  if (current.humidity >= 40 && current.humidity <= 70) score += 0.2;
  else if (current.humidity >= 30 && current.humidity <= 80) score += 0.1;

  if (agricultural.soilMoisture >= 40 && agricultural.soilMoisture <= 70) score += 0.2;
  else if (agricultural.soilMoisture >= 30 && agricultural.soilMoisture <= 80) score += 0.1;

  if (agricultural.diseaseRisk === 'low') score += 0.15;
  else if (agricultural.diseaseRisk === 'moderate') score += 0.1;

  if (agricultural.heatStressIndex < 0.3) score += 0.1;
  if (agricultural.frostRisk.length === 0) score += 0.1;

  return Math.round(score * 100) / 100;
}

function suggestBestCrops(
  current: CurrentWeather,
  agricultural: AgriculturalWeatherData
): string[] {
  const crops: string[] = [];
  const temp = current.temperature;
  const moisture = agricultural.soilMoisture;

  if (temp >= 15 && temp <= 25 && moisture >= 40) {
    crops.push('wheat', 'barley', 'lettuce', 'peas');
  }
  if (temp >= 20 && temp <= 30 && moisture >= 30) {
    crops.push('corn', 'soybean', 'tomato');
  }
  if (temp >= 25 && temp <= 35 && moisture >= 50) {
    crops.push('rice', 'cotton', 'sugarcane');
  }
  if (temp >= 10 && temp <= 20) {
    crops.push('potato', 'carrot', 'beet');
  }

  return crops.length > 0 ? crops : ['general crops'];
}

// ---------------------------------------------------------------------------
// Utility Exports
// ---------------------------------------------------------------------------

export function clearWeatherCache(): void {
  clearCache();
}

export function getCacheSize(): number {
  return cache.size;
}
