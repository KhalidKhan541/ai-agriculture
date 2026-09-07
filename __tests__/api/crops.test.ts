import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/crops';
import cropByIdHandler from '@/pages/api/crops/[id]';
import cropGrowthHandler from '@/pages/api/crops/[id]/growth';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    crop: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    farm: {
      findUnique: jest.fn(),
    },
  },
}));

describe('/api/crops', () => {
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

  const mockCrop = {
    id: 'crop-1',
    name: 'Tomato Plot A',
    cropTypeId: 'type-1',
    farmId: 'farm-1',
    plantedDate: new Date('2024-03-01'),
    expectedHarvestDate: new Date('2024-05-20'),
    actualHarvestDate: null,
    status: 'ACTIVE',
    growthStage: 'FRUITING',
    area: 2.5,
    areaUnit: 'hectares',
    yieldEstimate: 15000,
    yieldUnit: 'kg',
    costPerUnit: 0.5,
    revenuePerUnit: 2.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    cropType: {
      id: 'type-1',
      name: 'Tomato',
    },
    farm: mockFarm,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/crops', () => {
    it('should return crops for authenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findMany as jest.Mock).mockResolvedValue([mockFarm]);
      (prisma.crop.findMany as jest.Mock).mockResolvedValue([mockCrop]);

      const { req, res } = createMocks({ method: 'GET' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.crops).toHaveLength(1);
    });

    it('should filter by farm id', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findMany as jest.Mock).mockResolvedValue([mockCrop]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { farmId: 'farm-1' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(prisma.crop.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            farmId: 'farm-1',
          }),
        })
      );
    });

    it('should filter by status', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findMany as jest.Mock).mockResolvedValue([mockFarm]);
      (prisma.crop.findMany as jest.Mock).mockResolvedValue([mockCrop]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { status: 'ACTIVE' },
      });

      await handler(req, res);

      expect(prisma.crop.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({ method: 'GET' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('POST /api/crops', () => {
    it('should create a new crop', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
      (prisma.cropType.findUnique as jest.Mock).mockResolvedValue({
        id: 'type-1',
        name: 'Tomato',
        growthCycleDays: 80,
      });
      (prisma.crop.create as jest.Mock).mockResolvedValue(mockCrop);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Tomato Plot A',
          cropTypeId: 'type-1',
          farmId: 'farm-1',
          plantedDate: '2024-03-01',
          area: 2.5,
          areaUnit: 'hectares',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.name).toBe('Tomato Plot A');
    });

    it('should return 400 for invalid data', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '',
          farmId: '',
        },
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
        method: 'POST',
        body: {
          name: 'Tomato Plot A',
          cropTypeId: 'type-1',
          farmId: 'farm-1',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });
});

describe('/api/crops/[id]', () => {
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

  describe('GET /api/crops/[id]', () => {
    it('should return crop by id', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue({
        ...mockCrop,
        tasks: [],
        observations: [],
        treatments: [],
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'crop-1' },
      });

      await cropByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.id).toBe('crop-1');
    });

    it('should return 404 for non-existent crop', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'non-existent' },
      });

      await cropByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });

    it('should return 403 for unauthorized access', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue({
        ...mockCrop,
        farm: { ...mockFarm, ownerId: 'user-other' },
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'crop-1' },
      });

      await cropByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('PUT /api/crops/[id]', () => {
    it('should update crop', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue(mockCrop);
      (prisma.crop.update as jest.Mock).mockResolvedValue({
        ...mockCrop,
        growthStage: 'FRUITING',
      });

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'crop-1' },
        body: { growthStage: 'FRUITING' },
      });

      await cropByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should return 403 when updating other user crop', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue({
        ...mockCrop,
        farm: { ...mockFarm, ownerId: 'user-other' },
      });

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'crop-1' },
        body: { growthStage: 'HARVESTED' },
      });

      await cropByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('DELETE /api/crops/[id]', () => {
    it('should delete crop', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue(mockCrop);
      (prisma.crop.delete as jest.Mock).mockResolvedValue({ id: 'crop-1' });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'crop-1' },
      });

      await cropByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(204);
    });

    it('should return 403 when deleting other user crop', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue({
        ...mockCrop,
        farm: { ...mockFarm, ownerId: 'user-other' },
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'crop-1' },
      });

      await cropByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });
});

describe('/api/crops/[id]/growth', () => {
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

  describe('PUT /api/crops/[id]/growth', () => {
    it('should update growth stage', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.crop.findUnique as jest.Mock).mockResolvedValue(mockCrop);
      (prisma.crop.update as jest.Mock).mockResolvedValue({
        ...mockCrop,
        growthStage: 'FRUITING',
      });
      (prisma.observation.create as jest.Mock).mockResolvedValue({
        id: 'obs-1',
        cropId: 'crop-1',
        type: 'GROWTH_STAGE_CHANGE',
      });

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'crop-1' },
        body: {
          growthStage: 'FRUITING',
          notes: 'Plant is flowering well',
        },
      });

      await cropGrowthHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(prisma.observation.create).toHaveBeenCalled();
    });

    it('should return 400 for invalid growth stage', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'crop-1' },
        body: {
          growthStage: 'INVALID_STAGE',
        },
      });

      await cropGrowthHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });
});
