import { FarmService } from '@/services/farm.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateFarmDto, UpdateFarmDto, FarmQueryDto } from '@/dto/farm.dto';

describe('FarmService', () => {
  let farmService: FarmService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockFarm = {
    id: 'farm-1',
    name: 'Green Valley Farm',
    location: 'California, USA',
    latitude: 36.7783,
    longitude: -119.4179,
    area: 500,
    areaUnit: 'acres',
    soilType: 'loamy',
    ownerId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    crops: [],
    sensors: [],
    irrigationSystems: [],
  };

  const mockCreateFarmDto: CreateFarmDto = {
    name: 'Green Valley Farm',
    location: 'California, USA',
    latitude: 36.7783,
    longitude: -119.4179,
    area: 500,
    areaUnit: 'acres',
    soilType: 'loamy',
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    farmService = new FarmService(prisma as unknown as PrismaClient);
  });

  describe('createFarm', () => {
    it('should create a new farm successfully', async () => {
      prisma.farm.create.mockResolvedValue(mockFarm);

      const result = await farmService.createFarm('user-1', mockCreateFarmDto);

      expect(result).toEqual(mockFarm);
      expect(prisma.farm.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateFarmDto,
          ownerId: 'user-1',
        },
        include: {
          crops: true,
          sensors: true,
          irrigationSystems: true,
        },
      });
    });

    it('should throw error when creation fails', async () => {
      prisma.farm.create.mockRejectedValue(new Error('Database error'));

      await expect(
        farmService.createFarm('user-1', mockCreateFarmDto)
      ).rejects.toThrow('Failed to create farm');
    });

    it('should validate required fields', async () => {
      const invalidDto = { name: '' } as CreateFarmDto;

      await expect(
        farmService.createFarm('user-1', invalidDto)
      ).rejects.toThrow('Farm name is required');
    });
  });

  describe('getFarmById', () => {
    it('should return a farm by id', async () => {
      prisma.farm.findUnique.mockResolvedValue(mockFarm);

      const result = await farmService.getFarmById('farm-1');

      expect(result).toEqual(mockFarm);
      expect(prisma.farm.findUnique).toHaveBeenCalledWith({
        where: { id: 'farm-1' },
        include: {
          crops: {
            include: {
              cropType: true,
            },
          },
          sensors: true,
          irrigationSystems: true,
        },
      });
    });

    it('should return null for non-existent farm', async () => {
      prisma.farm.findUnique.mockResolvedValue(null);

      const result = await farmService.getFarmById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getFarmsByOwner', () => {
    it('should return all farms for an owner', async () => {
      prisma.farm.findMany.mockResolvedValue([mockFarm]);

      const result = await farmService.getFarmsByOwner('user-1');

      expect(result).toEqual([mockFarm]);
      expect(prisma.farm.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        include: {
          crops: true,
          sensors: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when owner has no farms', async () => {
      prisma.farm.findMany.mockResolvedValue([]);

      const result = await farmService.getFarmsByOwner('user-no-farms');

      expect(result).toEqual([]);
    });
  });

  describe('updateFarm', () => {
    it('should update farm successfully', async () => {
      const updateDto: UpdateFarmDto = {
        name: 'Updated Farm Name',
        area: 750,
      };

      const updatedFarm = { ...mockFarm, ...updateDto };
      prisma.farm.update.mockResolvedValue(updatedFarm);

      const result = await farmService.updateFarm('farm-1', 'user-1', updateDto);

      expect(result).toEqual(updatedFarm);
      expect(prisma.farm.update).toHaveBeenCalledWith({
        where: { id: 'farm-1' },
        data: updateDto,
        include: {
          crops: true,
          sensors: true,
          irrigationSystems: true,
        },
      });
    });

    it('should verify ownership before update', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        ...mockFarm,
        ownerId: 'user-other',
      });

      await expect(
        farmService.updateFarm('farm-1', 'user-1', { name: 'New Name' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-existent farm', async () => {
      prisma.farm.findUnique.mockResolvedValue(null);

      await expect(
        farmService.updateFarm('non-existent', 'user-1', { name: 'New Name' })
      ).rejects.toThrow('Farm not found');
    });
  });

  describe('deleteFarm', () => {
    it('should delete farm successfully', async () => {
      prisma.farm.findUnique.mockResolvedValue(mockFarm);
      prisma.farm.delete.mockResolvedValue(mockFarm);

      await farmService.deleteFarm('farm-1', 'user-1');

      expect(prisma.farm.delete).toHaveBeenCalledWith({
        where: { id: 'farm-1' },
      });
    });

    it('should verify ownership before deletion', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        ...mockFarm,
        ownerId: 'user-other',
      });

      await expect(
        farmService.deleteFarm('farm-1', 'user-1')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('searchFarms', () => {
    it('should search farms by query', async () => {
      const query: FarmQueryDto = {
        search: 'Valley',
        soilType: 'loamy',
        minArea: 100,
        maxArea: 1000,
        page: 1,
        limit: 10,
      };

      prisma.farm.findMany.mockResolvedValue([mockFarm]);
      prisma.farm.count.mockResolvedValue(1);

      const result = await farmService.searchFarms(query);

      expect(result.farms).toEqual([mockFarm]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle empty search results', async () => {
      const query: FarmQueryDto = {
        search: 'nonexistent',
        page: 1,
        limit: 10,
      };

      prisma.farm.findMany.mockResolvedValue([]);
      prisma.farm.count.mockResolvedValue(0);

      const result = await farmService.searchFarms(query);

      expect(result.farms).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      const query: FarmQueryDto = {
        page: 2,
        limit: 5,
      };

      prisma.farm.findMany.mockResolvedValue([]);
      prisma.farm.count.mockResolvedValue(12);

      const result = await farmService.searchFarms(query);

      expect(prisma.farm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getFarmStatistics', () => {
    it('should return farm statistics', async () => {
      prisma.farm.aggregate.mockResolvedValue({
        _count: { id: 5 },
        _sum: { area: 2500 },
        _avg: { area: 500 },
      });

      prisma.crop.count.mockResolvedValue(15);
      prisma.sensor.count.mockResolvedValue(8);

      const result = await farmService.getFarmStatistics('user-1');

      expect(result.totalFarms).toBe(5);
      expect(result.totalArea).toBe(2500);
      expect(result.averageArea).toBe(500);
      expect(result.totalCrops).toBe(15);
      expect(result.totalSensors).toBe(8);
    });
  });

  describe('getFarmByLocation', () => {
    it('should find farms near a location', async () => {
      const farms = [mockFarm];
      prisma.$queryRaw.mockResolvedValue(farms);

      const result = await farmService.getFarmByLocation(
        36.7783,
        -119.4179,
        50
      );

      expect(result).toEqual(farms);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });
});
