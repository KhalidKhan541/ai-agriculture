import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/weather';
import forecastHandler from '@/pages/api/weather/forecast';
import alertsHandler from '@/pages/api/weather/alerts';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    farm: {
      findUnique: jest.fn(),
    },
    weatherForecast: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    weatherAlert: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/services/weather', () => ({
  WeatherService: jest.fn().mockImplementation(() => ({
    getCurrentWeather: jest.fn().mockResolvedValue({
      temperature: 28,
      humidity: 65,
      windSpeed: 10,
      description: 'Partly cloudy',
      alerts: [],
    }),
    getForecast: jest.fn().mockResolvedValue([
      { date: '2024-07-15', temperature: 28 },
      { date: '2024-07-16', temperature: 30 },
    ]),
    getWeatherAlerts: jest.fn().mockResolvedValue([]),
  })),
}));

describe('/api/weather', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    },
  };

  const mockFarm = {
    id: 'farm-1',
    name: 'Green Valley Farm',
    ownerId: 'user-1',
    location: 'California',
    latitude: 36.7783,
    longitude: -119.4179,
    area: 500,
    areaUnit: 'acres',
    soilType: 'loamy',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/weather', () => {
    it('should return current weather for a farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.temperature).toBe(28);
      expect(data.humidity).toBe(65);
    });

    it('should return 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should return 400 when farmId is missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return 403 for unauthorized farm access', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
        ...mockFarm,
        ownerId: 'user-other',
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });

    it('should return 404 for non-existent farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'non-existent' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });

    it('should handle weather service errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockRejectedValue(
        new Error('Weather API error')
      );

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });
});

describe('/api/weather/forecast', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/weather/forecast', () => {
    it('should return weather forecast', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
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

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1', days: '7' },
      });

      await forecastHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.forecast).toBeInstanceOf(Array);
    });

    it('should default to 7 days forecast', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
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

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await forecastHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should validate days parameter', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
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

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1', days: '30' },
      });

      await forecastHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should cap days at 14', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
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

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1', days: '30' },
      });

      await forecastHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});

describe('/api/weather/alerts', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/weather/alerts', () => {
    it('should return weather alerts', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
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
      (prisma.weatherAlert.findMany as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await alertsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.alerts).toBeInstanceOf(Array);
    });

    it('should filter by severity', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
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
      (prisma.weatherAlert.findMany as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1', severity: 'high' },
      });

      await alertsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});
