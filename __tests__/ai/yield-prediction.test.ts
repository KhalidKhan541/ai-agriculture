import { YieldPredictionService } from '@/services/ai/yield-prediction.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('YieldPredictionService', () => {
  let yieldService: YieldPredictionService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockCropData = {
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
      scientificName: 'Solanum lycopersicum',
      growthCycleDays: 80,
      optimalTempMin: 18,
      optimalTempMax: 29,
      optimalRainfall: 600,
      spacingCm: 60,
      waterNeed: 'medium',
      category: 'vegetable',
    },
    farm: {
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
    },
  };

  const mockPrediction = {
    id: 'pred-1',
    cropId: 'crop-1',
    predictedYield: 14500,
    yieldUnit: 'kg',
    confidence: 0.88,
    factors: {
      weather: { impact: 0.15, description: 'Favorable weather conditions' },
      soil: { impact: 0.25, description: 'Good soil health' },
      irrigation: { impact: 0.2, description: 'Adequate water supply' },
      pest: { impact: -0.05, description: 'Minor pest pressure' },
      historical: { impact: 0.3, description: 'Consistent with past yields' },
    },
    recommendations: [
      'Maintain current irrigation schedule',
      'Monitor for late-season diseases',
    ],
    confidenceInterval: { lower: 12000, upper: 17000 },
    createdAt: new Date('2024-07-15'),
    crop: mockCropData,
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    yieldService = new YieldPredictionService(
      prisma as unknown as PrismaClient
    );
  });

  describe('predictYield', () => {
    it('should predict yield for a crop', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCropData);
      prisma.farm.findUnique.mockResolvedValue(mockCropData.farm);
      prisma.weatherForecast.findMany.mockResolvedValue([]);
      prisma.sensorReading.findMany.mockResolvedValue([]);
      prisma.soilTest.findFirst.mockResolvedValue({
        id: 'soil-1',
        farmId: 'farm-1',
        testDate: new Date(),
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
        labName: 'AgriLab',
        notes: '',
        depth: '30cm',
        location: { lat: 36.7783, lng: -119.4179 },
        createdAt: new Date(),
      });
      prisma.harvest.findMany.mockResolvedValue([]);
      prisma.yieldPrediction.create.mockResolvedValue(mockPrediction);

      const result = await yieldService.predictYield('user-1', 'crop-1');

      expect(result).toHaveProperty('predictedYield');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(result.predictedYield).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include confidence interval', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCropData);
      prisma.farm.findUnique.mockResolvedValue(mockCropData.farm);
      prisma.weatherForecast.findMany.mockResolvedValue([]);
      prisma.sensorReading.findMany.mockResolvedValue([]);
      prisma.soilTest.findFirst.mockResolvedValue({
        id: 'soil-1',
        farmId: 'farm-1',
        testDate: new Date(),
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
        labName: 'AgriLab',
        notes: '',
        depth: '30cm',
        location: { lat: 36.7783, lng: -119.4179 },
        createdAt: new Date(),
      });
      prisma.harvest.findMany.mockResolvedValue([]);
      prisma.yieldPrediction.create.mockResolvedValue(mockPrediction);

      const result = await yieldService.predictYield('user-1', 'crop-1');

      expect(result.confidenceInterval).toHaveProperty('lower');
      expect(result.confidenceInterval).toHaveProperty('upper');
      expect(result.confidenceInterval.lower).toBeLessThan(
        result.confidenceInterval.upper
      );
    });

    it('should consider weather factors', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCropData);
      prisma.farm.findUnique.mockResolvedValue(mockCropData.farm);
      prisma.weatherForecast.findMany.mockResolvedValue([
        {
          id: 'w1',
          farmId: 'farm-1',
          date: new Date('2024-07-15'),
          temperature: 28,
          humidity: 65,
          rainfall: 5,
          windSpeed: 10,
          description: 'Sunny',
          icon: 'sun',
          precipitationProbability: 20,
          uvIndex: 7,
          sunrise: new Date(),
          sunset: new Date(),
          alerts: [],
        },
      ]);
      prisma.sensorReading.findMany.mockResolvedValue([]);
      prisma.soilTest.findFirst.mockResolvedValue({
        id: 'soil-1',
        farmId: 'farm-1',
        testDate: new Date(),
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
        labName: 'AgriLab',
        notes: '',
        depth: '30cm',
        location: { lat: 36.7783, lng: -119.4179 },
        createdAt: new Date(),
      });
      prisma.harvest.findMany.mockResolvedValue([]);
      prisma.yieldPrediction.create.mockResolvedValue(mockPrediction);

      const result = await yieldService.predictYield('user-1', 'crop-1');

      expect(result.factors.weather).toHaveProperty('impact');
      expect(result.factors.weather).toHaveProperty('description');
    });

    it('should verify crop ownership', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCropData);
      prisma.farm.findUnique.mockResolvedValue({
        ...mockCropData.farm,
        ownerId: 'user-other',
      });

      await expect(
        yieldService.predictYield('user-1', 'crop-1')
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-existent crop', async () => {
      prisma.crop.findUnique.mockResolvedValue(null);

      await expect(
        yieldService.predictYield('user-1', 'non-existent')
      ).rejects.toThrow('Crop not found');
    });
  });

  describe('getPredictionHistory', () => {
    it('should return prediction history for a crop', async () => {
      prisma.crop.findUnique.mockResolvedValue(mockCropData);
      prisma.farm.findUnique.mockResolvedValue(mockCropData.farm);
      prisma.yieldPrediction.findMany.mockResolvedValue([
        mockPrediction,
        { ...mockPrediction, predictedYield: 14000, confidence: 0.85 },
      ]);

      const result = await yieldService.getPredictionHistory(
        'user-1',
        'crop-1'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('predictedYield');
      expect(result[0]).toHaveProperty('confidence');
    });
  });

  describe('compareWithActual', () => {
    it('should compare prediction with actual harvest', async () => {
      prisma.yieldPrediction.findUnique.mockResolvedValue(mockPrediction);
      prisma.harvest.findFirst.mockResolvedValue({
        id: 'harvest-1',
        cropId: 'crop-1',
        farmId: 'farm-1',
        harvestDate: new Date('2024-05-20'),
        quantity: 14800,
        quantityUnit: 'kg',
        quality: 'GRADE_A',
        moistureContent: 14,
        temperature: 18,
        storageLocation: 'Barn A',
        soldQuantity: 14000,
        soldPrice: 2.5,
        soldCurrency: 'USD',
        buyer: 'FreshMart',
        notes: '',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await yieldService.compareWithActual('pred-1');

      expect(result).toHaveProperty('predicted');
      expect(result).toHaveProperty('actual');
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('deviation');
      expect(result.predicted).toBe(14500);
      expect(result.actual).toBe(14800);
    });
  });

  describe('getFarmYieldOverview', () => {
    it('should return yield overview for all crops on a farm', async () => {
      prisma.farm.findUnique.mockResolvedValue(mockCropData.farm);
      prisma.crop.findMany.mockResolvedValue([mockCropData]);
      prisma.yieldPrediction.findMany.mockResolvedValue([mockPrediction]);
      prisma.harvest.findMany.mockResolvedValue([]);

      const result = await yieldService.getFarmYieldOverview(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('totalPredictedYield');
      expect(result).toHaveProperty('crops');
      expect(result).toHaveProperty('overallConfidence');
      expect(result).toHaveProperty('topPerformingCrops');
      expect(result).toHaveProperty('underperformingCrops');
    });
  });

  describe('generateYieldReport', () => {
    it('should generate comprehensive yield report', async () => {
      prisma.farm.findUnique.mockResolvedValue(mockCropData.farm);
      prisma.crop.findMany.mockResolvedValue([mockCropData]);
      prisma.yieldPrediction.findMany.mockResolvedValue([mockPrediction]);
      prisma.harvest.findMany.mockResolvedValue([]);
      prisma.weatherForecast.findMany.mockResolvedValue([]);

      const result = await yieldService.generateYieldReport(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('executive');
      expect(result).toHaveProperty('cropDetails');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('generatedAt');
    });
  });

  describe('updatePredictionModel', () => {
    it('should update model with new harvest data', async () => {
      prisma.harvest.findMany.mockResolvedValue([
        {
          id: 'harvest-1',
          cropId: 'crop-1',
          farmId: 'farm-1',
          harvestDate: new Date('2024-05-20'),
          quantity: 14800,
          quantityUnit: 'kg',
          quality: 'GRADE_A',
          moistureContent: 14,
          temperature: 18,
          storageLocation: 'Barn A',
          soldQuantity: 14000,
          soldPrice: 2.5,
          soldCurrency: 'USD',
          buyer: 'FreshMart',
          notes: '',
          images: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          crop: mockCropData,
        },
      ]);

      const result = await yieldService.updatePredictionModel('farm-1');

      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('accuracy');
      expect(result.updated).toBe(true);
    });
  });
});
