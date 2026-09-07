import { PestDetectionService } from '@/services/ai/pest-detection.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('PestDetectionService', () => {
  let pestService: PestDetectionService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockDetection = {
    id: 'detection-1',
    cropId: 'crop-1',
    imageUrl: 'https://example.com/pest-image.jpg',
    detectionDate: new Date('2024-07-15'),
    pests: [
      {
        name: 'Aphid',
        scientificName: 'Aphis gossypii',
        confidence: 0.92,
        severity: 'moderate',
        count: 45,
        location: { x: 0.3, y: 0.4 },
        damageType: 'sap-sucking',
        affectedArea: 15,
        affectedAreaUnit: '%',
      },
    ],
    overallRisk: 65,
    cropDamage: 12,
    affectedAreaPercent: 15,
    images: ['https://example.com/pest-image.jpg'],
    recommendations: [
      {
        action: 'Apply neem oil spray',
        product: 'Neem Oil Concentrate',
        dosage: '5ml per liter',
        timing: 'Early morning or evening',
        estimatedCost: 25,
        expectedEffectiveness: 85,
        organic: true,
      },
    ],
    createdAt: new Date('2024-07-15'),
    crop: {
      id: 'crop-1',
      name: 'Tomato Plot A',
      farm: {
        id: 'farm-1',
        ownerId: 'user-1',
      },
    },
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    pestService = new PestDetectionService(
      prisma as unknown as PrismaClient
    );
  });

  describe('detectPests', () => {
    it('should detect pests from image', async () => {
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
      prisma.pestDetection.create.mockResolvedValue(mockDetection);

      const result = await pestService.detectPests(
        'user-1',
        'crop-1',
        'https://example.com/pest-image.jpg'
      );

      expect(result).toHaveProperty('pests');
      expect(result).toHaveProperty('overallRisk');
      expect(result).toHaveProperty('recommendations');
      expect(result.pests.length).toBeGreaterThan(0);
      expect(result.pests[0]).toHaveProperty('name');
      expect(result.pests[0]).toHaveProperty('confidence');
      expect(result.pests[0]).toHaveProperty('severity');
    });

    it('should detect multiple pest types', async () => {
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
      prisma.pestDetection.create.mockResolvedValue({
        ...mockDetection,
        pests: [
          {
            name: 'Aphid',
            scientificName: 'Aphis gossypii',
            confidence: 0.92,
            severity: 'moderate',
            count: 45,
            location: { x: 0.3, y: 0.4 },
            damageType: 'sap-sucking',
            affectedArea: 15,
            affectedAreaUnit: '%',
          },
          {
            name: 'Whitefly',
            scientificName: 'Bemisia tabaci',
            confidence: 0.78,
            severity: 'low',
            count: 20,
            location: { x: 0.6, y: 0.7 },
            damageType: 'sap-sucking',
            affectedArea: 5,
            affectedAreaUnit: '%',
          },
        ],
      });

      const result = await pestService.detectPests(
        'user-1',
        'crop-1',
        'https://example.com/multi-pest-image.jpg'
      );

      expect(result.pests.length).toBe(2);
    });

    it('should return low risk when no pests detected', async () => {
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
      prisma.pestDetection.create.mockResolvedValue({
        ...mockDetection,
        pests: [],
        overallRisk: 5,
      });

      const result = await pestService.detectPests(
        'user-1',
        'crop-1',
        'https://example.com/clean-image.jpg'
      );

      expect(result.pests).toHaveLength(0);
      expect(result.overallRisk).toBeLessThan(20);
    });

    it('should validate image URL', async () => {
      await expect(
        pestService.detectPests('user-1', 'crop-1', 'invalid-url')
      ).rejects.toThrow('Invalid image URL');
    });

    it('should verify crop ownership', async () => {
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

      await expect(
        pestService.detectPests(
          'user-1',
          'crop-1',
          'https://example.com/image.jpg'
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getDetectionHistory', () => {
    it('should return pest detection history', async () => {
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
      prisma.pestDetection.findMany.mockResolvedValue([mockDetection]);

      const result = await pestService.getDetectionHistory(
        'farm-1',
        'user-1'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
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
      prisma.pestDetection.findMany.mockResolvedValue([mockDetection]);

      await pestService.getDetectionHistory(
        'farm-1',
        'user-1',
        new Date('2024-07-01'),
        new Date('2024-07-31')
      );

      expect(prisma.pestDetection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            detectionDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('getPestTrends', () => {
    it('should return pest detection trends', async () => {
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
      prisma.pestDetection.findMany.mockResolvedValue([
        mockDetection,
        { ...mockDetection, overallRisk: 80, affectedAreaPercent: 25 },
        { ...mockDetection, overallRisk: 45, affectedAreaPercent: 10 },
      ]);

      const result = await pestService.getPestTrends('farm-1', 'user-1');

      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('topPests');
      expect(result).toHaveProperty('seasonalPatterns');
      expect(result).toHaveProperty('predictions');
    });
  });

  describe('getTreatmentPlan', () => {
    it('should generate treatment plan for detected pests', async () => {
      prisma.pestDetection.findUnique.mockResolvedValue(mockDetection);
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

      const result = await pestService.getTreatmentPlan('detection-1');

      expect(result).toHaveProperty('treatments');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('organicOptions');
      expect(result.treatments.length).toBeGreaterThan(0);
      expect(result.treatments[0]).toHaveProperty('product');
      expect(result.treatments[0]).toHaveProperty('dosage');
      expect(result.treatments[0]).toHaveProperty('applicationMethod');
    });

    it('should include organic treatment options', async () => {
      prisma.pestDetection.findUnique.mockResolvedValue(mockDetection);
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

      const result = await pestService.getTreatmentPlan('detection-1');

      expect(result.organicOptions).toBeInstanceOf(Array);
      expect(result.organicOptions.length).toBeGreaterThan(0);
    });
  });

  describe('getPreventionStrategies', () => {
    it('should provide prevention strategies', async () => {
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
      prisma.pestDetection.findMany.mockResolvedValue([mockDetection]);

      const result = await pestService.getPreventionStrategies(
        'farm-1',
        'user-1'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('strategy');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('effectiveness');
      expect(result[0]).toHaveProperty('cost');
      expect(result[0]).toHaveProperty('implementationSteps');
    });
  });

  describe('reportPestSighting', () => {
    it('should report a manual pest sighting', async () => {
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
      prisma.pestSighting.create.mockResolvedValue({
        id: 'sighting-1',
        cropId: 'crop-1',
        reportedBy: 'user-1',
        pestName: 'Aphid',
        count: 50,
        severity: 'moderate',
        location: 'Field Section A',
        notes: 'Found on tomato leaves',
        images: ['sighting-1.jpg'],
        reportedAt: new Date(),
      });

      const result = await pestService.reportPestSighting('user-1', {
        cropId: 'crop-1',
        pestName: 'Aphid',
        count: 50,
        severity: 'moderate',
        location: 'Field Section A',
        notes: 'Found on tomato leaves',
        images: ['sighting-1.jpg'],
      });

      expect(result).toHaveProperty('id');
      expect(result.pestName).toBe('Aphid');
    });
  });
});
