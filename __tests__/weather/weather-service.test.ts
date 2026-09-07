import { WeatherService } from '@/services/weather.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('WeatherService', () => {
  let weatherService: WeatherService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockForecast = {
    id: 'weather-1',
    farmId: 'farm-1',
    date: new Date('2024-07-15'),
    temperature: 28,
    temperatureMin: 22,
    temperatureMax: 34,
    humidity: 65,
    rainfall: 0,
    windSpeed: 10,
    windDirection: 180,
    description: 'Partly cloudy',
    icon: 'partly-cloudy',
    precipitationProbability: 20,
    uvIndex: 7,
    visibility: 10,
    pressure: 1013,
    dewPoint: 20,
    feelsLike: 30,
    sunrise: new Date('2024-07-15T06:00:00'),
    sunset: new Date('2024-07-15T20:00:00'),
    alerts: [],
    hourly: [
      {
        hour: 0,
        temperature: 24,
        humidity: 75,
        rainfall: 0,
        windSpeed: 5,
      },
      {
        hour: 6,
        temperature: 22,
        humidity: 80,
        rainfall: 0,
        windSpeed: 3,
      },
      {
        hour: 12,
        temperature: 30,
        humidity: 55,
        rainfall: 0,
        windSpeed: 12,
      },
      {
        hour: 18,
        temperature: 26,
        humidity: 65,
        rainfall: 0,
        windSpeed: 8,
      },
    ],
    farm: {
      id: 'farm-1',
      name: 'Green Valley Farm',
      ownerId: 'user-1',
    },
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    weatherService = new WeatherService(prisma as unknown as PrismaClient);
  });

  describe('getCurrentWeather', () => {
    it('should return current weather for a farm', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findFirst.mockResolvedValue(mockForecast);

      const result = await weatherService.getCurrentWeather(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('humidity');
      expect(result).toHaveProperty('windSpeed');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('alerts');
    });

    it('should include agricultural metrics', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findFirst.mockResolvedValue(mockForecast);

      const result = await weatherService.getCurrentWeather(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('evapotranspiration');
      expect(result).toHaveProperty('frostRisk');
      expect(result).toHaveProperty('heatStress');
      expect(result).toHaveProperty('irrigationNeed');
    });

    it('should verify farm ownership', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-other',
        name: 'Other Farm',
        location: 'Texas',
        latitude: 31.0,
        longitude: -100.0,
        area: 200,
        areaUnit: 'acres',
        soilType: 'clay',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        weatherService.getCurrentWeather('farm-1', 'user-1')
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-existent farm', async () => {
      prisma.farm.findUnique.mockResolvedValue(null);

      await expect(
        weatherService.getCurrentWeather('non-existent', 'user-1')
      ).rejects.toThrow('Farm not found');
    });
  });

  describe('getForecast', () => {
    it('should return weather forecast for multiple days', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findMany.mockResolvedValue([
        mockForecast,
        { ...mockForecast, date: new Date('2024-07-16'), temperature: 30 },
        { ...mockForecast, date: new Date('2024-07-17'), temperature: 26 },
      ]);

      const result = await weatherService.getForecast('farm-1', 'user-1', 3);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('temperature');
    });

    it('should include hourly data', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findMany.mockResolvedValue([mockForecast]);

      const result = await weatherService.getForecast('farm-1', 'user-1', 1);

      expect(result[0]).toHaveProperty('hourly');
      expect(result[0].hourly).toBeInstanceOf(Array);
    });
  });

  describe('getWeatherAlerts', () => {
    it('should return active weather alerts', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherAlert.findMany.mockResolvedValue([
        {
          id: 'alert-1',
          farmId: 'farm-1',
          type: 'HEAT_WAVE',
          severity: 'high',
          title: 'Heat Wave Warning',
          description: 'Temperatures expected to exceed 40°C',
          startDate: new Date('2024-07-15'),
          endDate: new Date('2024-07-17'),
          recommendations: [
            'Increase irrigation',
            'Provide shade for livestock',
            'Harvest early morning',
          ],
          createdAt: new Date('2024-07-14'),
        },
      ]);

      const result = await weatherService.getWeatherAlerts(
        'farm-1',
        'user-1'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('severity');
      expect(result[0]).toHaveProperty('recommendations');
    });

    it('should return empty array when no alerts', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherAlert.findMany.mockResolvedValue([]);

      const result = await weatherService.getWeatherAlerts(
        'farm-1',
        'user-1'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getHistoricalWeather', () => {
    it('should return historical weather data', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findMany.mockResolvedValue([
        mockForecast,
        { ...mockForecast, date: new Date('2024-07-14'), temperature: 26 },
        { ...mockForecast, date: new Date('2024-07-13'), temperature: 25 },
      ]);

      const result = await weatherService.getHistoricalWeather(
        'farm-1',
        'user-1',
        new Date('2024-07-01'),
        new Date('2024-07-15')
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('statistics');
      expect(result.statistics).toHaveProperty('averageTemp');
      expect(result.statistics).toHaveProperty('totalRainfall');
      expect(result.statistics).toHaveProperty('averageHumidity');
    });

    it('should calculate growing degree days', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findMany.mockResolvedValue([
        { ...mockForecast, temperature: 28, temperatureMin: 22, temperatureMax: 34 },
        { ...mockForecast, temperature: 30, temperatureMin: 24, temperatureMax: 36 },
      ]);

      const result = await weatherService.getHistoricalWeather(
        'farm-1',
        'user-1',
        new Date('2024-07-01'),
        new Date('2024-07-15')
      );

      expect(result).toHaveProperty('growingDegreeDays');
      expect(result.growingDegreeDays).toBeGreaterThan(0);
    });
  });

  describe('getIrrigationRecommendations', () => {
    it('should provide weather-based irrigation recommendations', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findMany.mockResolvedValue([
        { ...mockForecast, rainfall: 0, humidity: 40 },
        { ...mockForecast, rainfall: 0, humidity: 35 },
      ]);
      prisma.soilTest.findFirst.mockResolvedValue({
        id: 'soil-1',
        farmId: 'farm-1',
        testDate: new Date(),
        ph: 6.8,
        nitrogen: 45,
        phosphorus: 35,
        potassium: 180,
        organicMatter: 3.2,
        moisture: 20,
        temperature: 18,
        electricalConductivity: 1.2,
        texture: 'loam',
        drainage: 'moderate',
        testedBy: 'user-1',
        labName: 'AgriLab',
        notes: '',
        depth: '30cm',
        location: { lat: 36.7783, lng: -119.4179 },
        createdAt: new Date(),
      });

      const result = await weatherService.getIrrigationRecommendations(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('waterDeficit');
      expect(result).toHaveProperty('nextRainExpected');
      expect(result).toHaveProperty('urgency');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend no irrigation when rain expected', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findMany.mockResolvedValue([
        { ...mockForecast, rainfall: 15, humidity: 85 },
        { ...mockForecast, rainfall: 20, humidity: 90 },
      ]);
      prisma.soilTest.findFirst.mockResolvedValue({
        id: 'soil-1',
        farmId: 'farm-1',
        testDate: new Date(),
        ph: 6.8,
        nitrogen: 45,
        phosphorus: 35,
        potassium: 180,
        organicMatter: 3.2,
        moisture: 35,
        temperature: 18,
        electricalConductivity: 1.2,
        texture: 'loam',
        drainage: 'moderate',
        testedBy: 'user-1',
        labName: 'AgriLab',
        notes: '',
        depth: '30cm',
        location: { lat: 36.7783, lng: -119.4179 },
        createdAt: new Date(),
      });

      const result = await weatherService.getIrrigationRecommendations(
        'farm-1',
        'user-1'
      );

      expect(result.urgency).toBe('low');
    });
  });

  describe('getClimateAnalysis', () => {
    it('should provide climate analysis for a farm', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.weatherForecast.findMany.mockResolvedValue([]);

      const result = await weatherService.getClimateAnalysis(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('climateZone');
      expect(result).toHaveProperty('growingSeason');
      expect(result).toHaveProperty('averageTemperatures');
      expect(result).toHaveProperty('rainfallPattern');
      expect(result).toHaveProperty('frostDates');
      expect(result).toHaveProperty('suitableCrops');
    });
  });
});
