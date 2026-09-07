import { SoilService } from '@/services/soil.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CreateSoilTestDto, SoilAnalysisDto } from '@/dto/soil.dto';

describe('SoilService', () => {
  let soilService: SoilService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockSoilTest = {
    id: 'soil-1',
    farmId: 'farm-1',
    testDate: new Date('2024-03-15'),
    ph: 6.8,
    nitrogen: 45,
    phosphorus: 35,
    potassium: 180,
    organicMatter: 3.2,
    moisture: 28,
    temperature: 18,
    electricalConductivity: 1.2,
    texture: 'loam',
    drainage: 'moderate',
    testedBy: 'user-1',
    labName: 'AgriLab Pro',
    notes: 'Good overall soil health',
    depth: '30cm',
    location: { lat: 36.7783, lng: -119.4179 },
    createdAt: new Date('2024-03-15'),
    farm: {
      id: 'farm-1',
      name: 'Green Valley Farm',
      ownerId: 'user-1',
    },
  };

  const mockCreateDto: CreateSoilTestDto = {
    farmId: 'farm-1',
    testDate: '2024-03-15',
    ph: 6.8,
    nitrogen: 45,
    phosphorus: 35,
    potassium: 180,
    organicMatter: 3.2,
    moisture: 28,
    temperature: 18,
    electricalConductivity: 1.2,
    texture: 'loam',
    drainage: 'moderate',
    depth: '30cm',
    location: { lat: 36.7783, lng: -119.4179 },
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    soilService = new SoilService(prisma as unknown as PrismaClient);
  });

  describe('createSoilTest', () => {
    it('should create a soil test successfully', async () => {
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
      prisma.soilTest.create.mockResolvedValue(mockSoilTest);

      const result = await soilService.createSoilTest('user-1', mockCreateDto);

      expect(result).toEqual(mockSoilTest);
      expect(prisma.soilTest.create).toHaveBeenCalled();
    });

    it('should validate pH range', async () => {
      const invalidDto = { ...mockCreateDto, ph: 15 };

      await expect(
        soilService.createSoilTest('user-1', invalidDto)
      ).rejects.toThrow('pH must be between 0 and 14');
    });

    it('should validate nutrient levels', async () => {
      const invalidDto = { ...mockCreateDto, nitrogen: -10 };

      await expect(
        soilService.createSoilTest('user-1', invalidDto)
      ).rejects.toThrow('Nitrogen level cannot be negative');
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
        soilService.createSoilTest('user-1', mockCreateDto)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getSoilTestsByFarm', () => {
    it('should return all soil tests for a farm', async () => {
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
      prisma.soilTest.findMany.mockResolvedValue([mockSoilTest]);

      const result = await soilService.getSoilTestsByFarm('farm-1', 'user-1');

      expect(result).toEqual([mockSoilTest]);
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
      prisma.soilTest.findMany.mockResolvedValue([mockSoilTest]);

      const result = await soilService.getSoilTestsByFarm(
        'farm-1',
        'user-1',
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(result).toEqual([mockSoilTest]);
    });
  });

  describe('getLatestSoilTest', () => {
    it('should return the latest soil test for a farm', async () => {
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
      prisma.soilTest.findFirst.mockResolvedValue(mockSoilTest);

      const result = await soilService.getLatestSoilTest('farm-1', 'user-1');

      expect(result).toEqual(mockSoilTest);
      expect(prisma.soilTest.findFirst).toHaveBeenCalledWith({
        where: { farmId: 'farm-1' },
        orderBy: { testDate: 'desc' },
      });
    });
  });

  describe('analyzeSoil', () => {
    it('should provide comprehensive soil analysis', async () => {
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
      prisma.soilTest.findFirst.mockResolvedValue(mockSoilTest);

      const result = await soilService.analyzeSoil('farm-1', 'user-1');

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('phStatus');
      expect(result).toHaveProperty('nutrientStatus');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('suitableCrops');
      expect(result).toHaveProperty('warnings');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should identify nutrient deficiencies', async () => {
      const deficientSoil = {
        ...mockSoilTest,
        nitrogen: 10,
        phosphorus: 5,
        potassium: 50,
      };
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
      prisma.soilTest.findFirst.mockResolvedValue(deficientSoil);

      const result = await soilService.analyzeSoil('farm-1', 'user-1');

      expect(result.nutrientStatus.nitrogen).toBe('deficient');
      expect(result.nutrientStatus.phosphorus).toBe('deficient');
      expect(result.nutrientStatus.potassium).toBe('deficient');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify nutrient excess', async () => {
      const excessSoil = {
        ...mockSoilTest,
        nitrogen: 80,
        phosphorus: 60,
        potassium: 350,
      };
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
      prisma.soilTest.findFirst.mockResolvedValue(excessSoil);

      const result = await soilService.analyzeSoil('farm-1', 'user-1');

      expect(result.nutrientStatus.nitrogen).toBe('excess');
      expect(result.nutrientStatus.phosphorus).toBe('excess');
      expect(result.nutrientStatus.potassium).toBe('excess');
    });

    it('should throw error for farm without soil tests', async () => {
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
      prisma.soilTest.findFirst.mockResolvedValue(null);

      await expect(
        soilService.analyzeSoil('farm-1', 'user-1')
      ).rejects.toThrow('No soil tests found');
    });
  });

  describe('getSoilTrends', () => {
    it('should return soil parameter trends over time', async () => {
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
      prisma.soilTest.findMany.mockResolvedValue([
        { ...mockSoilTest, testDate: new Date('2024-01-01'), ph: 6.2, nitrogen: 30 },
        { ...mockSoilTest, testDate: new Date('2024-03-15'), ph: 6.8, nitrogen: 45 },
        { ...mockSoilTest, testDate: new Date('2024-06-15'), ph: 7.0, nitrogen: 50 },
      ]);

      const result = await soilService.getSoilTrends('farm-1', 'user-1');

      expect(result).toHaveProperty('ph');
      expect(result).toHaveProperty('nitrogen');
      expect(result).toHaveProperty('phosphorus');
      expect(result).toHaveProperty('potassium');
      expect(result).toHaveProperty('dates');
      expect(result.ph.trend).toBe('increasing');
    });

    it('should detect decreasing trends', async () => {
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
      prisma.soilTest.findMany.mockResolvedValue([
        { ...mockSoilTest, testDate: new Date('2024-01-01'), organicMatter: 4.5 },
        { ...mockSoilTest, testDate: new Date('2024-03-15'), organicMatter: 3.8 },
        { ...mockSoilTest, testDate: new Date('2024-06-15'), organicMatter: 3.2 },
      ]);

      const result = await soilService.getSoilTrends('farm-1', 'user-1');

      expect(result.organicMatter.trend).toBe('decreasing');
      expect(result.organicMatter.changePercent).toBeLessThan(0);
    });
  });

  describe('compareSoilTests', () => {
    it('should compare two soil tests', async () => {
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
      prisma.soilTest.findUnique
        .mockResolvedValueOnce({ ...mockSoilTest, ph: 6.2, nitrogen: 30 })
        .mockResolvedValueOnce({ ...mockSoilTest, ph: 6.8, nitrogen: 45 });

      const result = await soilService.compareSoilTests(
        'farm-1',
        'user-1',
        'soil-1',
        'soil-2'
      );

      expect(result).toHaveProperty('differences');
      expect(result).toHaveProperty('improvements');
      expect(result).toHaveProperty('degradations');
      expect(result.differences.ph.change).toBe(0.6);
    });
  });

  describe('getSoilRecommendations', () => {
    it('should provide actionable recommendations', async () => {
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
      prisma.soilTest.findFirst.mockResolvedValue({
        ...mockSoilTest,
        ph: 5.5,
        nitrogen: 15,
      });

      const result = await soilService.getSoilRecommendations('farm-1', 'user-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('action');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('estimatedCost');
      expect(result[0]).toHaveProperty('expectedImpact');
    });
  });
});
