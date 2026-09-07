import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/farms';
import farmByIdHandler from '@/pages/api/farms/[id]';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    farm: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('/api/farms', () => {
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

  describe('GET /api/farms', () => {
    it('should return farms for authenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'farm-1',
          name: 'Green Valley Farm',
          location: 'California, USA',
          ownerId: 'user-1',
        },
      ]);

      const { req, res } = createMocks({ method: 'GET' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.farms).toHaveLength(1);
      expect(data.farms[0].name).toBe('Green Valley Farm');
    });

    it('should return 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({ method: 'GET' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should handle pagination', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.farm.count as jest.Mock).mockResolvedValue(25);

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2', limit: '10' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.page).toBe(2);
      expect(data.totalPages).toBe(3);
    });

    it('should filter by search term', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.farm.count as jest.Mock).mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'Valley' },
      });

      await handler(req, res);

      expect(prisma.farm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({
                  contains: 'Valley',
                  mode: 'insensitive',
                }),
              }),
            ]),
          }),
        })
      );
    });

    it('should handle database errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const { req, res } = createMocks({ method: 'GET' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('POST /api/farms', () => {
    it('should create a new farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.create as jest.Mock).mockResolvedValue({
        id: 'farm-new',
        name: 'New Farm',
        location: 'Texas, USA',
        latitude: 31.0,
        longitude: -100.0,
        area: 200,
        areaUnit: 'acres',
        soilType: 'clay',
        ownerId: 'user-1',
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'New Farm',
          location: 'Texas, USA',
          latitude: 31.0,
          longitude: -100.0,
          area: 200,
          areaUnit: 'acres',
          soilType: 'clay',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.name).toBe('New Farm');
      expect(data.ownerId).toBe('user-1');
    });

    it('should return 400 for invalid data', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '',
          location: '',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: { name: 'New Farm' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should validate required fields', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('required');
    });
  });
});

describe('/api/farms/[id]', () => {
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

  describe('GET /api/farms/[id]', () => {
    it('should return farm by id', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
        id: 'farm-1',
        name: 'Green Valley Farm',
        ownerId: 'user-1',
        crops: [],
        sensors: [],
        irrigationSystems: [],
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'farm-1' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.id).toBe('farm-1');
    });

    it('should return 404 for non-existent farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'non-existent' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });

    it('should return 403 for unauthorized access', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
        id: 'farm-1',
        name: 'Other Farm',
        ownerId: 'user-other',
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'farm-1' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('PUT /api/farms/[id]', () => {
    it('should update farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
        id: 'farm-1',
        name: 'Green Valley Farm',
        ownerId: 'user-1',
      });
      (prisma.farm.update as jest.Mock).mockResolvedValue({
        id: 'farm-1',
        name: 'Updated Farm',
        ownerId: 'user-1',
      });

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'farm-1' },
        body: { name: 'Updated Farm' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.name).toBe('Updated Farm');
    });

    it('should return 403 when updating other user farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
        id: 'farm-1',
        name: 'Other Farm',
        ownerId: 'user-other',
      });

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'farm-1' },
        body: { name: 'Hacked Farm' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('DELETE /api/farms/[id]', () => {
    it('should delete farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
        id: 'farm-1',
        name: 'Green Valley Farm',
        ownerId: 'user-1',
      });
      (prisma.farm.delete as jest.Mock).mockResolvedValue({
        id: 'farm-1',
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'farm-1' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(204);
    });

    it('should return 403 when deleting other user farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue({
        id: 'farm-1',
        name: 'Other Farm',
        ownerId: 'user-other',
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'farm-1' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });

    it('should return 404 for non-existent farm', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'non-existent' },
      });

      await farmByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });
});
