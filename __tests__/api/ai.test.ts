import { createMocks } from 'node-mocks-http';
import monitoringHandler from '@/pages/api/ai/monitoring';
import predictionHandler from '@/pages/api/ai/predictions';
import pestHandler from '@/pages/api/ai/pest-detection';
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
    crop: {
      findUnique: jest.fn(),
    },
    sensor: {
      findMany: jest.fn(),
    },
    sensorReading: {
      findMany: jest.fn(),
    },
    imageAnalysis: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    yieldPrediction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    pestDetection: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/services/ai/crop-monitoring', () => ({
  CropMonitoringService: jest.fn().mockImplementation(() => ({
    analyzeImage: jest.fn().mockResolvedValue({
      overallHealth: 82,
      issues: [],
      recommendations: ['Monitor regularly'],
    }),
    getRealTimeMonitoring: jest.fn().mockResolvedValue({
      sensors: [],
      alerts: [],
      summary: { averageHealth: 85 },
    }),
    detectAnomalies: jest.fn().mockResolvedValue({
      anomalies: [],
      summary: { totalAnomalies: 0 },
    }),
  })),
}));

jest.mock('@/services/ai/yield-prediction', () => ({
  YieldPredictionService: jest.fn().mockImplementation(() => ({
    predictYield: jest.fn().mockResolvedValue({
      predictedYield: 14500,
      confidence: 0.88,
      factors: {},
      recommendations: ['Maintain irrigation'],
    }),
    getPredictionHistory: jest.fn().mockResolvedValue([]),
    getFarmYieldOverview: jest.fn().mockResolvedValue({
      totalPredictedYield: 30000,
      crops: [],
    }),
  })),
}));

jest.mock('@/services/ai/pest-detection', () => ({
  PestDetectionService: jest.fn().mockImplementation(() => ({
    detectPests: jest.fn().mockResolvedValue({
      pests: [],
      overallRisk: 5,
      recommendations: [],
    }),
    getDetectionHistory: jest.fn().mockResolvedValue([]),
    getTreatmentPlan: jest.fn().mockResolvedValue({
      treatments: [],
      totalCost: 0,
    }),
  })),
}));

describe('/api/ai/monitoring', () => {
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

  describe('POST /api/ai/monitoring', () => {
    it('should analyze crop image', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue({
        id: 'crop-1',
        name: 'Tomato Plot A',
        farmId: 'farm-1',
        farm: mockFarm,
      });
      (prisma.imageAnalysis.create as jest.Mock).mockResolvedValue({
        id: 'analysis-1',
        cropId: 'crop-1',
        overallHealth: 82,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cropId: 'crop-1',
          imageUrl: 'https://example.com/image.jpg',
        },
      });

      await monitoringHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.overallHealth).toBe(82);
    });

    it('should return 400 for missing parameters', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      });

      await monitoringHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cropId: 'crop-1',
          imageUrl: 'https://example.com/image.jpg',
        },
      });

      await monitoringHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('GET /api/ai/monitoring', () => {
    it('should return real-time monitoring data', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await monitoringHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});

describe('/api/ai/predictions', () => {
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

  describe('POST /api/ai/predictions', () => {
    it('should predict yield for a crop', async () => {
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
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue({
        id: 'crop-1',
        name: 'Tomato Plot A',
        farmId: 'farm-1',
        farm: {
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
        },
      });
      (prisma.yieldPrediction.create as jest.Mock).mockResolvedValue({
        id: 'pred-1',
        cropId: 'crop-1',
        predictedYield: 14500,
        confidence: 0.88,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { cropId: 'crop-1' },
      });

      await predictionHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.predictedYield).toBe(14500);
      expect(data.confidence).toBe(0.88);
    });

    it('should return 400 for missing cropId', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      });

      await predictionHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: { cropId: 'crop-1' },
      });

      await predictionHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('GET /api/ai/predictions', () => {
    it('should return prediction history', async () => {
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
      (prisma.yieldPrediction.findMany as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await predictionHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should filter by cropId', async () => {
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
      (prisma.yieldPrediction.findMany as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1', cropId: 'crop-1' },
      });

      await predictionHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});

describe('/api/ai/pest-detection', () => {
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

  describe('POST /api/ai/pest-detection', () => {
    it('should detect pests from image', async () => {
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
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue({
        id: 'crop-1',
        name: 'Tomato Plot A',
        farmId: 'farm-1',
        farm: {
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
        },
      });
      (prisma.pestDetection.create as jest.Mock).mockResolvedValue({
        id: 'detection-1',
        cropId: 'crop-1',
        pests: [],
        overallRisk: 5,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cropId: 'crop-1',
          imageUrl: 'https://example.com/pest-image.jpg',
        },
      });

      await pestHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.overallRisk).toBe(5);
    });

    it('should return 400 for missing parameters', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      });

      await pestHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          cropId: 'crop-1',
          imageUrl: 'https://example.com/pest-image.jpg',
        },
      });

      await pestHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('GET /api/ai/pest-detection', () => {
    it('should return pest detection history', async () => {
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
      (prisma.pestDetection.findMany as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await pestHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should filter by date range', async () => {
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
      (prisma.pestDetection.findMany as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          farmId: 'farm-1',
          startDate: '2024-07-01',
          endDate: '2024-07-31',
        },
      });

      await pestHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });
});
