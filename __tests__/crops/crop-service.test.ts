import { CropService } from '@/services/crop.service';
import { PrismaClient, CropStatus, GrowthStage } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateCropDto, UpdateCropDto } from '@/dto/crop.dto';

describe('CropService', () => {
  let cropService: CropService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockCropType = {
    id: 'type-1',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    growthCycleDays: 80,
    optimalTempMin: 18,
    optimalTempMax: 29,
    optimalRainfall: 600,
    spacingCm: 60,
    waterNeed: 'medium',
    category: 'vegetable',
  };

  const mockCrop = {
    id: 'crop-1',
    name: 'Tomato Plot A',
    cropTypeId: 'type-1',
    farmId: 'farm-1',
    plantedDate: new Date('2024-03-01'),
    expectedHarvestDate: new Date('2024-05-20'),
    actualHarvestDate: null,
    status: CropStatus.ACTIVE,
    growthStage: GrowthStage.FLOWERING,
    area: 2.5,
    areaUnit: 'hectares',
    yieldEstimate: 15000,
    yieldUnit: 'kg',
    costPerUnit: 0.5,
    revenuePerUnit: 2.5,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-04-15'),
    cropType: mockCropType,
    farm: {
      id: 'farm-1',
      name: 'Green Valley Farm',
      ownerId: 'user-1',
    },
    tasks: [],
    observations: [],
    treatments: [],
  };

  const mockCreateCropDto: CreateCropDto = {
    name: 'Tomato Plot A',
    cropTypeId: 'type-1',
    farmId: 'farm-1',
    plantedDate: '2024-03-01',
    area: 2.5,
    areaUnit: 'hectares',
    yieldEstimate: 15000,
    yieldUnit: 'kg',
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    cropService = new CropService(prisma as unknown as PrismaClient);
  });

  describe('createCrop', () => {
    it('should create a new crop successfully', async () => {
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
      prisma.cropType.findUnique.mockResolvedValue(mockCropType);
      prisma.crop.create.mockResolvedValue(mockCrop);

      const result = await cropService.createCrop('user-1', mockCreateCropDto);

      expect(result).toEqual(mockCrop);
      expect(prisma.crop.create).toHaveBeenCalled();
    });

    it('should throw error for non-existent farm', async () => {
      prisma.farm.findUnique.mockResolvedValue(null);

      await expect(
        cropService.createCrop('user-1', mockCreateCropDto)
      ).rejects.toThrow('Farm not found');
    });

    it('should throw error for non-existent crop type', async () => {
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
      prisma.cropType.findUnique.mockResolvedValue(null);

      await expect(
        cropService.createCrop('user-1', mockCreateCropDto)
      ).rejects.toThrow('Crop type not found');
    });

    it('should verify farm ownership before creation', async () => {
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
        cropService.createCrop('user-1', mockCreateCropDto)
      ).rejects.toThrow('Unauthorized');
    });

    it('should calculate expected harvest date from growth cycle', async () => {
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
      prisma.cropType.findUnique.mockResolvedValue(mockCropType);
      prisma.crop.create.mockResolvedValue(mockCrop);

      const dtoWithPlantingDate = {
        ...mockCreateCropDto,
        plantedDate: '2024-03-01',
      };

      await cropService.createCrop('user-1', dtoWithPlantingDate);

      expect(prisma.crop.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expectedHarvestDate: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('getCropById', () => {
    it('should return a crop with all relations', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCrop);

      const result = await cropService.getCropById('crop-1');

      expect(result).toEqual(mockCrop);
      expect(prisma.crop.findUnique).toHaveBeenCalledWith({
        where: { id: 'crop-1' },
        include: {
          cropType: true,
          farm: true,
          tasks: {
            orderBy: { dueDate: 'asc' },
            take: 10,
          },
          observations: {
            orderBy: { observedAt: 'desc' },
            take: 5,
          },
          treatments: {
            orderBy: { appliedAt: 'desc' },
            take: 5,
          },
        },
      });
    });

    it('should return null for non-existent crop', async () => {
      prisma.crop.findUnique.mockResolvedValue(null);

      const result = await cropService.getCropById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCropsByFarm', () => {
    it('should return all crops for a farm', async () => {
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
      prisma.crop.findMany.mockResolvedValue([mockCrop]);

      const result = await cropService.getCropsByFarm('farm-1', 'user-1');

      expect(result).toEqual([mockCrop]);
      expect(prisma.crop.findMany).toHaveBeenCalledWith({
        where: {
          farmId: 'farm-1',
          farm: { ownerId: 'user-1' },
        },
        include: {
          cropType: true,
        },
        orderBy: { plantedDate: 'desc' },
      });
    });

    it('should filter crops by status', async () => {
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
      prisma.crop.findMany.mockResolvedValue([mockCrop]);

      const result = await cropService.getCropsByFarm(
        'farm-1',
        'user-1',
        CropStatus.ACTIVE
      );

      expect(result).toEqual([mockCrop]);
      expect(prisma.crop.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: CropStatus.ACTIVE,
          }),
        })
      );
    });
  });

  describe('updateCrop', () => {
    it('should update crop successfully', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCrop);
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

      const updateDto: UpdateCropDto = {
        growthStage: GrowthStage.FRUITING,
        yieldEstimate: 18000,
      };

      const updatedCrop = { ...mockCrop, ...updateDto };
      prisma.crop.update.mockResolvedValue(updatedCrop);

      const result = await cropService.updateCrop('crop-1', 'user-1', updateDto);

      expect(result).toEqual(updatedCrop);
    });

    it('should throw error when crop not found', async () => {
      prisma.crop.findUnique.mockResolvedValue(null);

      await expect(
        cropService.updateCrop('non-existent', 'user-1', { growthStage: GrowthStage.FRUITING })
      ).rejects.toThrow('Crop not found');
    });
  });

  describe('deleteCrop', () => {
    it('should delete crop successfully', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCrop);
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
      prisma.crop.delete.mockResolvedValue(mockCrop);

      await cropService.deleteCrop('crop-1', 'user-1');

      expect(prisma.crop.delete).toHaveBeenCalledWith({
        where: { id: 'crop-1' },
      });
    });

    it('should verify ownership before deletion', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCrop);
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
        cropService.deleteCrop('crop-1', 'user-1')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateGrowthStage', () => {
    it('should update growth stage and create observation', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCrop);
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
      prisma.crop.update.mockResolvedValue({
        ...mockCrop,
        growthStage: GrowthStage.FRUITING,
      });
      prisma.observation.create.mockResolvedValue({
        id: 'obs-1',
        cropId: 'crop-1',
        type: 'GROWTH_STAGE_CHANGE',
        notes: 'Growth stage updated from FLOWERING to FRUITING',
        observedAt: new Date(),
        observedBy: 'user-1',
        images: [],
      });

      const result = await cropService.updateGrowthStage(
        'crop-1',
        'user-1',
        GrowthStage.FRUITING
      );

      expect(result.growthStage).toBe(GrowthStage.FRUITING);
      expect(prisma.observation.create).toHaveBeenCalled();
    });
  });

  describe('getCropHealthScore', () => {
    it('should calculate crop health score based on multiple factors', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCrop);
      prisma.observation.findMany.mockResolvedValue([]);
      prisma.treatment.findMany.mockResolvedValue([]);

      const result = await cropService.getCropHealthScore('crop-1');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('getCropTimeline', () => {
    it('should return timeline of crop events', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCrop);
      prisma.observation.findMany.mockResolvedValue([
        {
          id: 'obs-1',
          cropId: 'crop-1',
          type: 'PLANTING',
          notes: 'Seeds planted',
          observedAt: new Date('2024-03-01'),
          observedBy: 'user-1',
          images: [],
        },
      ]);
      prisma.treatment.findMany.mockResolvedValue([
        {
          id: 'treat-1',
          cropId: 'crop-1',
          type: 'FERTILIZER',
          product: 'NPK 10-10-10',
          dosage: '50kg/ha',
          appliedAt: new Date('2024-03-15'),
          appliedBy: 'user-1',
          notes: 'First fertilizer application',
        },
      ]);
      prisma.task.findMany.mockResolvedValue([
        {
          id: 'task-1',
          cropId: 'crop-1',
          type: 'WATERING',
          title: 'Regular watering',
          description: 'Water all tomato plots',
          dueDate: new Date('2024-04-01'),
          completed: true,
          completedAt: new Date('2024-04-01'),
        },
      ]);

      const result = await cropService.getCropTimeline('crop-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('event');
      expect(result[0]).toHaveProperty('type');
    });
  });
});
