import { CropMonitoringService } from '@/services/ai/crop-monitoring.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('CropMonitoringService', () => {
  let monitoringService: CropMonitoringService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockSensorData = {
    id: 'sensor-1',
    farmId: 'farm-1',
    name: 'Field Sensor A',
    type: 'multisensor',
    latitude: 36.7783,
    longitude: -119.4179,
    status: 'active',
    batteryLevel: 85,
    lastReading: new Date('2024-07-15T10:00:00'),
    readings: [
      {
        id: 'reading-1',
        sensorId: 'sensor-1',
        timestamp: new Date('2024-07-15T10:00:00'),
        temperature: 28,
        humidity: 65,
        soilMoisture: 35,
        lightIntensity: 850,
        co2: 400,
        windSpeed: 5,
        windDirection: 180,
        rainfall: 0,
        uvIndex: 7,
      },
    ],
    farm: {
      id: 'farm-1',
      name: 'Green Valley Farm',
      ownerId: 'user-1',
    },
  };

  const mockImageAnalysis = {
    id: 'analysis-1',
    cropId: 'crop-1',
    imageUrl: 'https://example.com/field-image.jpg',
    analysisDate: new Date('2024-07-15'),
    overallHealth: 82,
    issues: [
      {
        type: 'pest',
        severity: 'low',
        confidence: 0.85,
        description: 'Minor aphid presence detected',
        location: { x: 0.3, y: 0.4 },
        recommendation: 'Apply neem oil spray',
      },
    ],
    growthStage: 'fruiting',
    biomass: 4.2,
    ndvi: 0.72,
    canopyCover: 78,
    colorAnalysis: {
      greenness: 0.68,
      yellowness: 0.15,
      brownness: 0.05,
    },
    recommendations: [
      'Increase irrigation frequency',
      'Monitor for pest spread',
    ],
    createdAt: new Date('2024-07-15'),
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    monitoringService = new CropMonitoringService(
      prisma as unknown as PrismaClient
    );
  });

  describe('analyzeImage', () => {
    it('should analyze crop image and return health assessment', async () => {
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
      prisma.imageAnalysis.create.mockResolvedValue(mockImageAnalysis);

      const result = await monitoringService.analyzeImage(
        'user-1',
        'crop-1',
        'https://example.com/field-image.jpg'
      );

      expect(result).toHaveProperty('overallHealth');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');
      expect(result.overallHealth).toBeGreaterThanOrEqual(0);
      expect(result.overallHealth).toBeLessThanOrEqual(100);
    });

    it('should detect diseases from image', async () => {
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
      prisma.imageAnalysis.create.mockResolvedValue({
        ...mockImageAnalysis,
        issues: [
          {
            type: 'disease',
            severity: 'high',
            confidence: 0.92,
            description: 'Early blight detected',
            location: { x: 0.5, y: 0.6 },
            recommendation: 'Apply fungicide immediately',
          },
        ],
      });

      const result = await monitoringService.analyzeImage(
        'user-1',
        'crop-1',
        'https://example.com/diseased-image.jpg'
      );

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('disease');
      expect(result.issues[0].severity).toBe('high');
    });

    it('should validate image URL format', async () => {
      await expect(
        monitoringService.analyzeImage('user-1', 'crop-1', 'invalid-url')
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
        monitoringService.analyzeImage(
          'user-1',
          'crop-1',
          'https://example.com/image.jpg'
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getRealTimeMonitoring', () => {
    it('should return real-time sensor data for a farm', async () => {
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
      prisma.sensor.findMany.mockResolvedValue([mockSensorData]);

      const result = await monitoringService.getRealTimeMonitoring(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('sensors');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('summary');
      expect(result.sensors).toHaveLength(1);
      expect(result.sensors[0]).toHaveProperty('currentReadings');
      expect(result.sensors[0]).toHaveProperty('trends');
    });

    it('should generate alerts for critical conditions', async () => {
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
      prisma.sensor.findMany.mockResolvedValue([
        {
          ...mockSensorData,
          readings: [
            {
              id: 'reading-1',
              sensorId: 'sensor-1',
              timestamp: new Date('2024-07-15T10:00:00'),
              temperature: 45,
              humidity: 30,
              soilMoisture: 10,
              lightIntensity: 850,
              co2: 400,
              windSpeed: 5,
              windDirection: 180,
              rainfall: 0,
              uvIndex: 7,
            },
          ],
        },
      ]);

      const result = await monitoringService.getRealTimeMonitoring(
        'farm-1',
        'user-1'
      );

      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts[0]).toHaveProperty('severity');
      expect(result.alerts[0]).toHaveProperty('message');
      expect(result.alerts[0]).toHaveProperty('action');
    });
  });

  describe('getHealthTrends', () => {
    it('should return crop health trends over time', async () => {
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
      prisma.imageAnalysis.findMany.mockResolvedValue([
        { ...mockImageAnalysis, overallHealth: 75 },
        { ...mockImageAnalysis, overallHealth: 80 },
        { ...mockImageAnalysis, overallHealth: 82 },
      ]);

      const result = await monitoringService.getHealthTrends(
        'farm-1',
        'user-1',
        'crop-1'
      );

      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('dataPoints');
      expect(result).toHaveProperty('averageHealth');
      expect(result).toHaveProperty('predictedHealth');
      expect(result.trend).toBe('improving');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies in sensor data', async () => {
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
      prisma.sensorReading.findMany.mockResolvedValue([
        {
          id: 'reading-1',
          sensorId: 'sensor-1',
          timestamp: new Date('2024-07-15T10:00:00'),
          temperature: 28,
          humidity: 65,
          soilMoisture: 35,
          lightIntensity: 850,
          co2: 400,
          windSpeed: 5,
          windDirection: 180,
          rainfall: 0,
          uvIndex: 7,
        },
        {
          id: 'reading-2',
          sensorId: 'sensor-1',
          timestamp: new Date('2024-07-15T11:00:00'),
          temperature: 55,
          humidity: 20,
          soilMoisture: 5,
          lightIntensity: 850,
          co2: 800,
          windSpeed: 5,
          windDirection: 180,
          rainfall: 0,
          uvIndex: 7,
        },
      ]);

      const result = await monitoringService.detectAnomalies(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('anomalies');
      expect(result).toHaveProperty('summary');
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies[0]).toHaveProperty('type');
      expect(result.anomalies[0]).toHaveProperty('severity');
      expect(result.anomalies[0]).toHaveProperty('description');
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive monitoring report', async () => {
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
        },
      ]);
      prisma.imageAnalysis.findMany.mockResolvedValue([mockImageAnalysis]);
      prisma.sensor.findMany.mockResolvedValue([mockSensorData]);

      const result = await monitoringService.generateReport(
        'farm-1',
        'user-1',
        new Date('2024-07-01'),
        new Date('2024-07-31')
      );

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('cropHealth');
      expect(result).toHaveProperty('sensorData');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('generatedAt');
    });
  });

  describe('predictDiseaseRisk', () => {
    it('should predict disease risk based on conditions', async () => {
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
      prisma.sensorReading.findMany.mockResolvedValue([
        {
          id: 'reading-1',
          sensorId: 'sensor-1',
          timestamp: new Date('2024-07-15T10:00:00'),
          temperature: 28,
          humidity: 85,
          soilMoisture: 45,
          lightIntensity: 850,
          co2: 400,
          windSpeed: 5,
          windDirection: 180,
          rainfall: 0,
          uvIndex: 7,
        },
      ]);
      prisma.weatherForecast.findFirst.mockResolvedValue({
        id: 'weather-1',
        farmId: 'farm-1',
        date: new Date('2024-07-15'),
        temperature: 28,
        humidity: 85,
        rainfall: 0,
        windSpeed: 5,
        description: 'Humid',
        icon: 'cloudy',
        precipitationProbability: 60,
        uvIndex: 7,
        sunrise: new Date('2024-07-15T06:00:00'),
        sunset: new Date('2024-07-15T20:00:00'),
        alerts: [],
      });

      const result = await monitoringService.predictDiseaseRisk(
        'farm-1',
        'user-1',
        'crop-1'
      );

      expect(result).toHaveProperty('overallRisk');
      expect(result).toHaveProperty('diseases');
      expect(result).toHaveProperty('preventionMeasures');
      expect(result.overallRisk).toBeGreaterThanOrEqual(0);
      expect(result.overallRisk).toBeLessThanOrEqual(100);
    });
  });
});
