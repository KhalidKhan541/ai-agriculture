import { IrrigationService } from '@/services/irrigation.service';
import { PrismaClient, IrrigationStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  CreateIrrigationSystemDto,
  UpdateIrrigationSystemDto,
  IrrigationScheduleDto,
} from '@/dto/irrigation.dto';

describe('IrrigationService', () => {
  let irrigationService: IrrigationService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockSystem = {
    id: 'irr-1',
    farmId: 'farm-1',
    name: 'Drip System - Zone A',
    type: 'drip',
    status: IrrigationStatus.ACTIVE,
    flowRate: 2.5,
    flowUnit: 'L/min',
    pressure: 2.0,
    pressureUnit: 'bar',
    zone: 'A',
    coverage: 50,
    coverageUnit: 'hectares',
    installDate: new Date('2024-01-01'),
    lastMaintenance: new Date('2024-06-01'),
    nextMaintenance: new Date('2024-12-01'),
    waterSource: 'well',
    seasonalAdjustment: 1.0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    schedules: [],
    readings: [],
    farm: {
      id: 'farm-1',
      name: 'Green Valley Farm',
      ownerId: 'user-1',
    },
  };

  const mockCreateDto: CreateIrrigationSystemDto = {
    farmId: 'farm-1',
    name: 'Drip System - Zone A',
    type: 'drip',
    flowRate: 2.5,
    flowUnit: 'L/min',
    pressure: 2.0,
    pressureUnit: 'bar',
    zone: 'A',
    coverage: 50,
    coverageUnit: 'hectares',
    waterSource: 'well',
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    irrigationService = new IrrigationService(
      prisma as unknown as PrismaClient
    );
  });

  describe('createSystem', () => {
    it('should create an irrigation system', async () => {
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
      prisma.irrigationSystem.create.mockResolvedValue(mockSystem);

      const result = await irrigationService.createSystem(
        'user-1',
        mockCreateDto
      );

      expect(result).toEqual(mockSystem);
      expect(prisma.irrigationSystem.create).toHaveBeenCalled();
    });

    it('should validate flow rate is positive', async () => {
      const invalidDto = { ...mockCreateDto, flowRate: -1 };

      await expect(
        irrigationService.createSystem('user-1', invalidDto)
      ).rejects.toThrow('Flow rate must be positive');
    });

    it('should validate pressure range', async () => {
      const invalidDto = { ...mockCreateDto, pressure: 15 };

      await expect(
        irrigationService.createSystem('user-1', invalidDto)
      ).rejects.toThrow('Pressure must be between 0 and 10 bar');
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
        irrigationService.createSystem('user-1', mockCreateDto)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getSystemsByFarm', () => {
    it('should return all systems for a farm', async () => {
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
      prisma.irrigationSystem.findMany.mockResolvedValue([mockSystem]);

      const result = await irrigationService.getSystemsByFarm(
        'farm-1',
        'user-1'
      );

      expect(result).toEqual([mockSystem]);
    });

    it('should filter by status', async () => {
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
      prisma.irrigationSystem.findMany.mockResolvedValue([mockSystem]);

      await irrigationService.getSystemsByFarm(
        'farm-1',
        'user-1',
        IrrigationStatus.ACTIVE
      );

      expect(prisma.irrigationSystem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: IrrigationStatus.ACTIVE,
          }),
        })
      );
    });
  });

  describe('updateSystem', () => {
    it('should update irrigation system', async () => {
      prisma.irrigationSystem.findUnique.mockResolvedValue(mockSystem);
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

      const updateDto: UpdateIrrigationSystemDto = {
        flowRate: 3.0,
        pressure: 2.5,
      };

      const updated = { ...mockSystem, ...updateDto };
      prisma.irrigationSystem.update.mockResolvedValue(updated);

      const result = await irrigationService.updateSystem(
        'irr-1',
        'user-1',
        updateDto
      );

      expect(result).toEqual(updated);
    });
  });

  describe('deleteSystem', () => {
    it('should delete irrigation system', async () => {
      prisma.irrigationSystem.findUnique.mockResolvedValue(mockSystem);
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
      prisma.irrigationSystem.delete.mockResolvedValue(mockSystem);

      await irrigationService.deleteSystem('irr-1', 'user-1');

      expect(prisma.irrigationSystem.delete).toHaveBeenCalledWith({
        where: { id: 'irr-1' },
      });
    });
  });

  describe('createSchedule', () => {
    it('should create an irrigation schedule', async () => {
      const scheduleDto: IrrigationScheduleDto = {
        systemId: 'irr-1',
        dayOfWeek: [1, 3, 5],
        startTime: '06:00',
        duration: 60,
        waterAmount: 500,
        waterUnit: 'liters',
        priority: 'medium',
        seasonal: false,
      };

      prisma.irrigationSystem.findUnique.mockResolvedValue(mockSystem);
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
      prisma.irrigationSchedule.create.mockResolvedValue({
        id: 'sched-1',
        systemId: 'irr-1',
        dayOfWeek: [1, 3, 5],
        startTime: '06:00',
        duration: 60,
        waterAmount: 500,
        waterUnit: 'liters',
        priority: 'medium',
        seasonal: false,
        enabled: true,
        createdAt: new Date(),
      });

      const result = await irrigationService.createSchedule(
        'user-1',
        scheduleDto
      );

      expect(result).toHaveProperty('id', 'sched-1');
      expect(result.enabled).toBe(true);
    });

    it('should validate schedule times', async () => {
      const invalidDto: IrrigationScheduleDto = {
        systemId: 'irr-1',
        dayOfWeek: [],
        startTime: '25:00',
        duration: -30,
        waterAmount: 500,
        waterUnit: 'liters',
        priority: 'medium',
        seasonal: false,
      };

      await expect(
        irrigationService.createSchedule('user-1', invalidDto)
      ).rejects.toThrow('Invalid schedule configuration');
    });
  });

  describe('getWaterUsage', () => {
    it('should calculate water usage for a period', async () => {
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
      prisma.irrigationReading.findMany.mockResolvedValue([
        {
          id: 'read-1',
          systemId: 'irr-1',
          timestamp: new Date('2024-07-01'),
          flowRate: 2.5,
          duration: 60,
          waterUsed: 150,
          pressure: 2.0,
          temperature: 25,
          humidity: 60,
          soilMoisture: 35,
          automated: true,
        },
      ]);

      const result = await irrigationService.getWaterUsage(
        'farm-1',
        'user-1',
        new Date('2024-07-01'),
        new Date('2024-07-31')
      );

      expect(result).toHaveProperty('totalWaterUsed');
      expect(result).toHaveProperty('dailyAverage');
      expect(result).toHaveProperty('peakDay');
      expect(result).toHaveProperty('efficiency');
    });
  });

  describe('optimizeIrrigation', () => {
    it('should provide optimization recommendations', async () => {
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
      prisma.irrigationSystem.findMany.mockResolvedValue([mockSystem]);
      prisma.irrigationReading.findMany.mockResolvedValue([]);
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

      const result = await irrigationService.optimizeIrrigation(
        'farm-1',
        'user-1'
      );

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('estimatedSavings');
      expect(result).toHaveProperty('optimalSchedule');
      expect(result).toHaveProperty('weatherConsiderations');
    });
  });

  describe('getSystemHealth', () => {
    it('should assess system health', async () => {
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
      prisma.irrigationSystem.findUnique.mockResolvedValue(mockSystem);
      prisma.irrigationReading.findMany.mockResolvedValue([]);

      const result = await irrigationService.getSystemHealth(
        'irr-1',
        'user-1'
      );

      expect(result).toHaveProperty('overallHealth');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('maintenanceNeeded');
      expect(result).toHaveProperty('efficiencyScore');
    });
  });
});
