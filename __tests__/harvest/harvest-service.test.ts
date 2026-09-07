import { HarvestService } from '@/services/harvest.service';
import { PrismaClient, HarvestQuality } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateHarvestDto, UpdateHarvestDto } from '@/dto/harvest.dto';

describe('HarvestService', () => {
  let harvestService: HarvestService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockHarvest = {
    id: 'harvest-1',
    cropId: 'crop-1',
    farmId: 'farm-1',
    harvestDate: new Date('2024-05-20'),
    quantity: 12000,
    quantityUnit: 'kg',
    quality: HarvestQuality.GRADE_A,
    moistureContent: 14,
    temperature: 18,
    storageLocation: 'Barn A',
    soldQuantity: 8000,
    soldPrice: 2.5,
    soldCurrency: 'USD',
    buyer: 'FreshMart Co.',
    notes: 'Excellent harvest quality',
    images: ['harvest-1.jpg'],
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-20'),
    crop: {
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
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-05-20'),
      cropType: {
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
      },
    },
    farm: {
      id: 'farm-1',
      name: 'Green Valley Farm',
      ownerId: 'user-1',
    },
  };

  const mockCreateDto: CreateHarvestDto = {
    cropId: 'crop-1',
    farmId: 'farm-1',
    harvestDate: '2024-05-20',
    quantity: 12000,
    quantityUnit: 'kg',
    quality: HarvestQuality.GRADE_A,
    moistureContent: 14,
    temperature: 18,
    storageLocation: 'Barn A',
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    harvestService = new HarvestService(prisma as unknown as PrismaClient);
  });

  describe('createHarvest', () => {
    it('should create a harvest record', async () => {
      prisma.crop.findUnique.mockResolvedValue({
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
      });
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
      prisma.harvest.create.mockResolvedValue(mockHarvest);

      const result = await harvestService.createHarvest(
        'user-1',
        mockCreateDto
      );

      expect(result).toEqual(mockHarvest);
      expect(prisma.harvest.create).toHaveBeenCalled();
    });

    it('should validate quantity is positive', async () => {
      const invalidDto = { ...mockCreateDto, quantity: -100 };

      await expect(
        harvestService.createHarvest('user-1', invalidDto)
      ).rejects.toThrow('Quantity must be positive');
    });

    it('should validate moisture content range', async () => {
      const invalidDto = { ...mockCreateDto, moistureContent: 150 };

      await expect(
        harvestService.createHarvest('user-1', invalidDto)
      ).rejects.toThrow('Moisture content must be between 0 and 100%');
    });

    it('should update crop status to harvested', async () => {
      prisma.crop.findUnique.mockResolvedValue({
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
      });
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
      prisma.harvest.create.mockResolvedValue(mockHarvest);
      prisma.crop.update.mockResolvedValue({
        id: 'crop-1',
        name: 'Tomato Plot A',
        cropTypeId: 'type-1',
        farmId: 'farm-1',
        plantedDate: new Date('2024-03-01'),
        expectedHarvestDate: new Date('2024-05-20'),
        actualHarvestDate: new Date('2024-05-20'),
        status: 'HARVESTED',
        growthStage: 'HARVESTED',
        area: 2.5,
        areaUnit: 'hectares',
        yieldEstimate: 15000,
        yieldUnit: 'kg',
        costPerUnit: 0.5,
        revenuePerUnit: 2.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await harvestService.createHarvest('user-1', mockCreateDto);

      expect(prisma.crop.update).toHaveBeenCalledWith({
        where: { id: 'crop-1' },
        data: expect.objectContaining({
          actualHarvestDate: expect.any(Date),
          status: 'HARVESTED',
          growthStage: 'HARVESTED',
        }),
      });
    });

    it('should verify farm ownership', async () => {
      prisma.crop.findUnique.mockResolvedValue({
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
      });
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
        harvestService.createHarvest('user-1', mockCreateDto)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getHarvestById', () => {
    it('should return harvest with all relations', async () => {
      prisma.harvest.findUnique.mockResolvedValue(mockHarvest);

      const result = await harvestService.getHarvestById('harvest-1');

      expect(result).toEqual(mockHarvest);
      expect(prisma.harvest.findUnique).toHaveBeenCalledWith({
        where: { id: 'harvest-1' },
        include: {
          crop: {
            include: {
              cropType: true,
            },
          },
          farm: true,
        },
      });
    });
  });

  describe('getHarvestsByFarm', () => {
    it('should return harvests for a farm', async () => {
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
      prisma.harvest.findMany.mockResolvedValue([mockHarvest]);

      const result = await harvestService.getHarvestsByFarm(
        'farm-1',
        'user-1'
      );

      expect(result).toEqual([mockHarvest]);
    });

    it('should filter by date range', async () => {
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
      prisma.harvest.findMany.mockResolvedValue([mockHarvest]);

      const result = await harvestService.getHarvestsByFarm(
        'farm-1',
        'user-1',
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(result).toEqual([mockHarvest]);
    });
  });

  describe('updateHarvest', () => {
    it('should update harvest record', async () => {
      prisma.harvest.findUnique.mockResolvedValue(mockHarvest);
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

      const updateDto: UpdateHarvestDto = {
        soldQuantity: 10000,
        soldPrice: 2.8,
        buyer: 'FreshMart Co.',
      };

      const updated = { ...mockHarvest, ...updateDto };
      prisma.harvest.update.mockResolvedValue(updated);

      const result = await harvestService.updateHarvest(
        'harvest-1',
        'user-1',
        updateDto
      );

      expect(result).toEqual(updated);
    });
  });

  describe('deleteHarvest', () => {
    it('should delete harvest and restore crop status', async () => {
      prisma.harvest.findUnique.mockResolvedValue(mockHarvest);
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
      prisma.harvest.delete.mockResolvedValue(mockHarvest);
      prisma.crop.update.mockResolvedValue({
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
      });

      await harvestService.deleteHarvest('harvest-1', 'user-1');

      expect(prisma.crop.update).toHaveBeenCalled();
    });
  });

  describe('getHarvestAnalytics', () => {
    it('should return harvest analytics', async () => {
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
      prisma.harvest.findMany.mockResolvedValue([mockHarvest]);
      prisma.harvest.aggregate.mockResolvedValue({
        _count: { id: 1 },
        _sum: { quantity: 12000, soldQuantity: 8000 },
        _avg: { moistureContent: 14, soldPrice: 2.5 },
      });

      const result = await harvestService.getHarvestAnalytics(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('totalHarvests');
      expect(result).toHaveProperty('totalQuantity');
      expect(result).toHaveProperty('totalSold');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('averageYield');
      expect(result).toHaveProperty('qualityDistribution');
      expect(result).toHaveProperty('monthlyTrends');
    });
  });

  describe('getHarvestForecast', () => {
    it('should predict upcoming harvests', async () => {
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
      prisma.crop.findMany.mockResolvedValue([
        {
          id: 'crop-2',
          name: 'Corn Field',
          cropTypeId: 'type-2',
          farmId: 'farm-1',
          plantedDate: new Date('2024-04-01'),
          expectedHarvestDate: new Date('2024-08-01'),
          actualHarvestDate: null,
          status: 'ACTIVE',
          growthStage: 'VEGETATIVE',
          area: 5.0,
          areaUnit: 'hectares',
          yieldEstimate: 25000,
          yieldUnit: 'kg',
          costPerUnit: 0.3,
          revenuePerUnit: 1.8,
          createdAt: new Date(),
          updatedAt: new Date(),
          cropType: {
            id: 'type-2',
            name: 'Corn',
            scientificName: 'Zea mays',
            growthCycleDays: 120,
            optimalTempMin: 20,
            optimalTempMax: 30,
            optimalRainfall: 800,
            spacingCm: 25,
            waterNeed: 'high',
            category: 'grain',
          },
        },
      ]);

      const result = await harvestService.getHarvestForecast(
        'farm-1',
        'user-1'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('cropId');
      expect(result[0]).toHaveProperty('expectedDate');
      expect(result[0]).toHaveProperty('estimatedYield');
      expect(result[0]).toHaveProperty('confidence');
    });
  });
});
