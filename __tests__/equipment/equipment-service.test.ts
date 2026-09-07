import { EquipmentService } from '@/services/equipment.service';
import { PrismaClient, EquipmentStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  MaintenanceLogDto,
} from '@/dto/equipment.dto';

describe('EquipmentService', () => {
  let equipmentService: EquipmentService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockEquipment = {
    id: 'equip-1',
    farmId: 'farm-1',
    name: 'John Deere 5075E',
    type: 'tractor',
    brand: 'John Deere',
    model: '5075E',
    serialNumber: 'JD-2024-001',
    year: 2024,
    status: EquipmentStatus.ACTIVE,
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 45000,
    currentValue: 42000,
    hourMeter: 250,
    fuelType: 'diesel',
    horsepower: 75,
    lastService: new Date('2024-06-01'),
    nextService: new Date('2024-09-01'),
    insurance: {
      provider: 'FarmGuard Insurance',
      policyNumber: 'FG-2024-001',
      expiryDate: new Date('2025-01-15'),
    },
    location: {
      latitude: 36.7783,
      longitude: -119.4179,
      lastUpdated: new Date('2024-07-15T10:00:00'),
    },
    images: ['tractor-1.jpg'],
    documents: ['manual.pdf', 'warranty.pdf'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-07-15'),
    farm: {
      id: 'farm-1',
      name: 'Green Valley Farm',
      ownerId: 'user-1',
    },
    maintenanceLogs: [],
    usageLogs: [],
  };

  const mockCreateDto: CreateEquipmentDto = {
    farmId: 'farm-1',
    name: 'John Deere 5075E',
    type: 'tractor',
    brand: 'John Deere',
    model: '5075E',
    serialNumber: 'JD-2024-001',
    year: 2024,
    purchaseDate: '2024-01-15',
    purchasePrice: 45000,
    fuelType: 'diesel',
    horsepower: 75,
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    equipmentService = new EquipmentService(
      prisma as unknown as PrismaClient
    );
  });

  describe('createEquipment', () => {
    it('should create equipment record', async () => {
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
      prisma.equipment.create.mockResolvedValue(mockEquipment);

      const result = await equipmentService.createEquipment(
        'user-1',
        mockCreateDto
      );

      expect(result).toEqual(mockEquipment);
      expect(prisma.equipment.create).toHaveBeenCalled();
    });

    it('should validate purchase price', async () => {
      const invalidDto = { ...mockCreateDto, purchasePrice: -1000 };

      await expect(
        equipmentService.createEquipment('user-1', invalidDto)
      ).rejects.toThrow('Purchase price must be positive');
    });

    it('should validate year', async () => {
      const invalidDto = { ...mockCreateDto, year: 1800 };

      await expect(
        equipmentService.createEquipment('user-1', invalidDto)
      ).rejects.toThrow('Invalid year');
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
        equipmentService.createEquipment('user-1', mockCreateDto)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getEquipmentById', () => {
    it('should return equipment with all details', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);

      const result = await equipmentService.getEquipmentById('equip-1');

      expect(result).toEqual(mockEquipment);
      expect(prisma.equipment.findUnique).toHaveBeenCalledWith({
        where: { id: 'equip-1' },
        include: {
          farm: true,
          maintenanceLogs: {
            orderBy: { serviceDate: 'desc' },
            take: 10,
          },
          usageLogs: {
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should return null for non-existent equipment', async () => {
      prisma.equipment.findUnique.mockResolvedValue(null);

      const result = await equipmentService.getEquipmentById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getEquipmentByFarm', () => {
    it('should return all equipment for a farm', async () => {
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
      prisma.equipment.findMany.mockResolvedValue([mockEquipment]);

      const result = await equipmentService.getEquipmentByFarm(
        'farm-1',
        'user-1'
      );

      expect(result).toEqual([mockEquipment]);
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
      prisma.equipment.findMany.mockResolvedValue([mockEquipment]);

      await equipmentService.getEquipmentByFarm(
        'farm-1',
        'user-1',
        EquipmentStatus.ACTIVE
      );

      expect(prisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EquipmentStatus.ACTIVE,
          }),
        })
      );
    });

    it('should filter by type', async () => {
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
      prisma.equipment.findMany.mockResolvedValue([mockEquipment]);

      await equipmentService.getEquipmentByFarm(
        'farm-1',
        'user-1',
        undefined,
        'tractor'
      );

      expect(prisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'tractor',
          }),
        })
      );
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment details', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);
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

      const updateDto: UpdateEquipmentDto = {
        status: EquipmentStatus.MAINTENANCE,
        hourMeter: 300,
        currentValue: 40000,
      };

      const updated = { ...mockEquipment, ...updateDto };
      prisma.equipment.update.mockResolvedValue(updated);

      const result = await equipmentService.updateEquipment(
        'equip-1',
        'user-1',
        updateDto
      );

      expect(result).toEqual(updated);
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);
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
      prisma.equipment.delete.mockResolvedValue(mockEquipment);

      await equipmentService.deleteEquipment('equip-1', 'user-1');

      expect(prisma.equipment.delete).toHaveBeenCalledWith({
        where: { id: 'equip-1' },
      });
    });
  });

  describe('logMaintenance', () => {
    it('should log a maintenance event', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);
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
      prisma.maintenanceLog.create.mockResolvedValue({
        id: 'maint-1',
        equipmentId: 'equip-1',
        type: 'scheduled',
        serviceDate: new Date('2024-07-15'),
        description: 'Regular oil change and filter replacement',
        cost: 150,
        performedBy: 'user-1',
        nextServiceDate: new Date('2024-10-15'),
        partsReplaced: ['Oil Filter', 'Air Filter'],
        notes: 'Engine running smoothly',
        createdAt: new Date('2024-07-15'),
      });

      const maintenanceDto: MaintenanceLogDto = {
        type: 'scheduled',
        serviceDate: '2024-07-15',
        description: 'Regular oil change and filter replacement',
        cost: 150,
        partsReplaced: ['Oil Filter', 'Air Filter'],
        nextServiceDate: '2024-10-15',
      };

      const result = await equipmentService.logMaintenance(
        'equip-1',
        'user-1',
        maintenanceDto
      );

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('scheduled');
      expect(result.cost).toBe(150);
    });

    it('should update equipment last service date', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);
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
      prisma.maintenanceLog.create.mockResolvedValue({
        id: 'maint-1',
        equipmentId: 'equip-1',
        type: 'scheduled',
        serviceDate: new Date('2024-07-15'),
        description: 'Regular oil change',
        cost: 150,
        performedBy: 'user-1',
        nextServiceDate: new Date('2024-10-15'),
        partsReplaced: [],
        notes: '',
        createdAt: new Date('2024-07-15'),
      });
      prisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        lastService: new Date('2024-07-15'),
      });

      await equipmentService.logMaintenance('equip-1', 'user-1', {
        type: 'scheduled',
        serviceDate: '2024-07-15',
        description: 'Regular oil change',
        cost: 150,
      });

      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: 'equip-1' },
        data: expect.objectContaining({
          lastService: expect.any(Date),
        }),
      });
    });

    it('should validate maintenance type', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);
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

      await expect(
        equipmentService.logMaintenance('equip-1', 'user-1', {
          type: 'invalid' as any,
          serviceDate: '2024-07-15',
          description: 'Test',
          cost: 100,
        })
      ).rejects.toThrow('Invalid maintenance type');
    });
  });

  describe('getMaintenanceSchedule', () => {
    it('should return upcoming maintenance tasks', async () => {
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
      prisma.equipment.findMany.mockResolvedValue([mockEquipment]);

      const result = await equipmentService.getMaintenanceSchedule(
        'farm-1',
        'user-1'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('equipmentId');
      expect(result[0]).toHaveProperty('equipmentName');
      expect(result[0]).toHaveProperty('nextServiceDate');
      expect(result[0]).toHaveProperty('daysUntilService');
      expect(result[0]).toHaveProperty('urgency');
    });

    it('should mark overdue maintenance as urgent', async () => {
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
      prisma.equipment.findMany.mockResolvedValue([
        {
          ...mockEquipment,
          nextService: new Date('2024-07-01'),
        },
      ]);

      const result = await equipmentService.getMaintenanceSchedule(
        'farm-1',
        'user-1'
      );

      expect(result[0].urgency).toBe('overdue');
    });
  });

  describe('getEquipmentUtilization', () => {
    it('should calculate equipment utilization', async () => {
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
      prisma.equipmentUsageLog.findMany.mockResolvedValue([
        {
          id: 'usage-1',
          equipmentId: 'equip-1',
          date: new Date('2024-07-15'),
          hoursUsed: 8,
          task: 'Plowing',
          field: 'Field A',
          fuelConsumed: 25,
          notes: '',
        },
      ]);

      const result = await equipmentService.getEquipmentUtilization(
        'equip-1',
        'user-1',
        new Date('2024-07-01'),
        new Date('2024-07-31')
      );

      expect(result).toHaveProperty('totalHoursUsed');
      expect(result).toHaveProperty('averageDailyHours');
      expect(result).toHaveProperty('fuelEfficiency');
      expect(result).toHaveProperty('taskBreakdown');
      expect(result).toHaveProperty('costPerHour');
    });
  });

  describe('getEquipmentCosts', () => {
    it('should calculate total equipment costs', async () => {
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
      prisma.equipment.findMany.mockResolvedValue([mockEquipment]);
      prisma.maintenanceLog.findMany.mockResolvedValue([
        {
          id: 'maint-1',
          equipmentId: 'equip-1',
          type: 'scheduled',
          serviceDate: new Date('2024-06-01'),
          description: 'Oil change',
          cost: 150,
          performedBy: 'user-1',
          nextServiceDate: new Date('2024-09-01'),
          partsReplaced: [],
          notes: '',
          createdAt: new Date('2024-06-01'),
        },
      ]);

      const result = await equipmentService.getEquipmentCosts(
        'farm-1',
        'user-1',
        2024
      );

      expect(result).toHaveProperty('totalPurchaseCost');
      expect(result).toHaveProperty('totalMaintenanceCost');
      expect(result).toHaveProperty('totalFuelCost');
      expect(result).toHaveProperty('depreciation');
      expect(result).toHaveProperty('costPerHectare');
      expect(result).toHaveProperty('monthlyBreakdown');
    });
  });
});
