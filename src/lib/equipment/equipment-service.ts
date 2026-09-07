import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EquipmentCategory = 'tractor' | 'harvester' | 'planter' | 'irrigation' | 'sprayer' | 'tillage' | 'transport' | 'storage' | 'processing' | 'drone' | 'sensor' | 'other';
export type EquipmentStatus = 'operational' | 'maintenance' | 'repair' | 'idle' | 'rented' | 'retired' | 'sold';
export type MaintenanceType = 'preventive' | 'corrective' | 'predictive' | 'emergency';
export type FuelType = 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'propane' | 'natural_gas';
export type UtilizationPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  year: number;
  serialNumber: string;
  assetTag: string;
  status: EquipmentStatus;
  location: EquipmentLocation;
  specifications: EquipmentSpecs;
  operationalData: OperationalData;
  maintenanceInfo: MaintenanceInfo;
  financialInfo: FinancialInfo;
  attachments: EquipmentAttachment[];
  documents: EquipmentDocument[];
  images: string[];
  assignedOperator?: string;
  lastInspection?: Date;
  nextInspection?: Date;
  insurancePolicy?: string;
  warrantyExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentLocation {
  farmId?: string;
  fieldId?: string;
  latitude: number;
  longitude: number;
  address?: string;
  lastUpdated: Date;
}

export interface EquipmentSpecs {
  enginePower?: number;
  enginePowerUnit: string;
  fuelType: FuelType;
  fuelCapacity?: number;
  workingWidth?: number;
  workingWidthUnit: string;
  hopperCapacity?: number;
  tankCapacity?: number;
  weight: number;
  weightUnit: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionsUnit: string;
  customSpecs: Record<string, string | number>;
}

export interface OperationalData {
  totalHours: number;
  currentYearHours: number;
  lastOperationDate?: Date;
  averageFuelConsumption: number;
  fuelConsumptionUnit: string;
  efficiency: number;
  utilizationRate: number;
  downtime: number;
  lastField?: string;
}

export interface MaintenanceInfo {
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  lastServiceType?: MaintenanceType;
  totalMaintenanceCost: number;
  hoursSinceLastService: number;
  serviceIntervalHours: number;
  maintenanceHistory: MaintenanceRecord[];
  partsReplacements: PartsReplacement[];
}

export interface FinancialInfo {
  purchasePrice: number;
  purchaseDate: Date;
  currentValue: number;
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
  depreciationRate: number;
  salvageValue: number;
  totalRevenue: number;
  totalOperatingCost: number;
  roi: number;
  insuranceCost: number;
  registrationFees: number;
}

export interface EquipmentAttachment {
  id: string;
  name: string;
  type: string;
  compatible: boolean;
  installed: boolean;
  installDate?: Date;
}

export interface EquipmentDocument {
  id: string;
  name: string;
  type: 'manual' | 'warranty' | 'insurance' | 'inspection' | 'repair_invoice' | 'other';
  url: string;
  uploadedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: MaintenanceType;
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  performedBy?: string;
  cost: number;
  partsUsed: PartsUsed[];
  laborHours: number;
  notes: string;
  nextServiceDate?: Date;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PartsUsed {
  partNumber: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
}

export interface PartsReplacement {
  id: string;
  equipmentId: string;
  partNumber: string;
  partName: string;
  previousValue: string;
  newValue: string;
  replacementDate: Date;
  cost: number;
  performedBy: string;
}

export interface UtilizationRecord {
  id: string;
  equipmentId: string;
  date: Date;
  hoursUsed: number;
  fieldId?: string;
  fieldArea?: number;
  fuelUsed: number;
  fuelUnit: string;
  productivity: number;
  productivityUnit: string;
  operator: string;
  notes: string;
  gpsData?: { lat: number; lng: number; timestamp: Date }[];
}

export interface UtilizationReport {
  equipmentId: string;
  period: UtilizationPeriod;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  totalDays: number;
  utilizationRate: number;
  averageDailyHours: number;
  totalFuelUsed: number;
  averageFuelEfficiency: number;
  totalAreaCovered: number;
  averageProductivity: number;
  costPerHour: number;
  revenuePerHour: number;
  downtimeHours: number;
  downtimePercentage: number;
  maintenanceHours: number;
  peakUtilizationDay: Date;
  lowUtilizationDay: Date;
  dailyBreakdown: DailyUtilization[];
}

export interface DailyUtilization {
  date: Date;
  hoursUsed: number;
  fuelUsed: number;
  areaCovered: number;
  productivity: number;
  status: 'active' | 'idle' | 'maintenance' | 'repair';
}

export interface FleetOverview {
  totalEquipment: number;
  operational: number;
  inMaintenance: number;
  idle: number;
  rented: number;
  totalValue: number;
  totalHours: number;
  averageUtilization: number;
  totalMaintenanceCost: number;
  upcomingMaintenance: MaintenanceRecord[];
  categoryBreakdown: { category: EquipmentCategory; count: number; utilization: number }[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class EquipmentService {
  private equipment: Map<string, Equipment> = new Map();
  private utilizationRecords: Map<string, UtilizationRecord[]> = new Map();
  private maintenanceRecords: Map<string, MaintenanceRecord[]> = new Map();

  // ── Equipment CRUD ───────────────────────────────────────────────────────

  async registerEquipment(data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'operationalData' | 'maintenanceInfo' | 'attachments' | 'documents'>): Promise<Equipment> {
    const now = new Date();
    const equipment: Equipment = {
      ...data,
      id: randomUUID(),
      operationalData: {
        totalHours: 0,
        currentYearHours: 0,
        averageFuelConsumption: 0,
        fuelConsumptionUnit: 'litres/hour',
        efficiency: 0,
        utilizationRate: 0,
        downtime: 0,
      },
      maintenanceInfo: {
        totalMaintenanceCost: 0,
        hoursSinceLastService: 0,
        serviceIntervalHours: 500,
        maintenanceHistory: [],
        partsReplacements: [],
      },
      attachments: [],
      documents: [],
      createdAt: now,
      updatedAt: now,
    };
    this.equipment.set(equipment.id, equipment);
    return equipment;
  }

  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
    const existing = this.equipment.get(id);
    if (!existing) throw new Error(`Equipment ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.equipment.set(id, updated);
    return updated;
  }

  async getEquipment(id: string): Promise<Equipment | undefined> {
    return this.equipment.get(id);
  }

  async listEquipment(filter?: { category?: EquipmentCategory; status?: EquipmentStatus; farmId?: string }): Promise<Equipment[]> {
    let results = Array.from(this.equipment.values());
    if (filter?.category) results = results.filter((e) => e.category === filter.category);
    if (filter?.status) results = results.filter((e) => e.status === filter.status);
    if (filter?.farmId) results = results.filter((e) => e.location.farmId === filter.farmId);
    return results;
  }

  async deleteEquipment(id: string): Promise<void> {
    if (!this.equipment.delete(id)) throw new Error(`Equipment ${id} not found`);
    this.utilizationRecords.delete(id);
    this.maintenanceRecords.delete(id);
  }

  // ── Equipment Status ─────────────────────────────────────────────────────

  async updateStatus(id: string, status: EquipmentStatus, location?: Partial<EquipmentLocation>): Promise<Equipment> {
    const equipment = this.equipment.get(id);
    if (!equipment) throw new Error(`Equipment ${id} not found`);
    equipment.status = status;
    equipment.updatedAt = new Date();
    if (location) {
      equipment.location = { ...equipment.location, ...location, lastUpdated: new Date() };
    }
    this.equipment.set(id, equipment);
    return equipment;
  }

  async transferEquipment(id: string, toFarmId: string, toFieldId?: string): Promise<Equipment> {
    const equipment = this.equipment.get(id);
    if (!equipment) throw new Error(`Equipment ${id} not found`);
    equipment.location.farmId = toFarmId;
    equipment.location.fieldId = toFieldId;
    equipment.location.lastUpdated = new Date();
    equipment.updatedAt = new Date();
    this.equipment.set(id, equipment);
    return equipment;
  }

  async assignOperator(id: string, operatorId: string): Promise<Equipment> {
    const equipment = this.equipment.get(id);
    if (!equipment) throw new Error(`Equipment ${id} not found`);
    equipment.assignedOperator = operatorId;
    equipment.updatedAt = new Date();
    this.equipment.set(id, equipment);
    return equipment;
  }

  // ── Utilization Tracking ─────────────────────────────────────────────────

  async recordUtilization(data: Omit<UtilizationRecord, 'id'>): Promise<UtilizationRecord> {
    const record: UtilizationRecord = { ...data, id: randomUUID() };
    const existing = this.utilizationRecords.get(data.equipmentId) || [];
    existing.push(record);
    existing.sort((a, b) => a.date.getTime() - b.date.getTime());
    this.utilizationRecords.set(data.equipmentId, existing);

    const equipment = this.equipment.get(data.equipmentId);
    if (equipment) {
      equipment.operationalData.totalHours += data.hoursUsed;
      equipment.operationalData.currentYearHours += data.hoursUsed;
      equipment.operationalData.lastOperationDate = data.date;
      equipment.operationalData.lastField = data.fieldId;
      this.equipment.set(data.equipmentId, equipment);
    }

    return record;
  }

  async getUtilizationRecords(equipmentId: string, startDate?: Date, endDate?: Date): Promise<UtilizationRecord[]> {
    let records = this.utilizationRecords.get(equipmentId) || [];
    if (startDate) records = records.filter((r) => r.date >= startDate);
    if (endDate) records = records.filter((r) => r.date <= endDate);
    return records;
  }

  async generateUtilizationReport(
    equipmentId: string,
    period: UtilizationPeriod,
    startDate: Date,
    endDate: Date,
  ): Promise<UtilizationReport> {
    const records = this.utilizationRecords.get(equipmentId) || [];
    const periodRecords = records.filter((r) => r.date >= startDate && r.date <= endDate);

    const dailyMap: Map<string, DailyUtilization> = new Map();
    periodRecords.forEach((r) => {
      const dateKey = r.date.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || {
        date: r.date,
        hoursUsed: 0,
        fuelUsed: 0,
        areaCovered: 0,
        productivity: 0,
        status: 'active' as const,
      };
      existing.hoursUsed += r.hoursUsed;
      existing.fuelUsed += r.fuelUsed;
      existing.areaCovered += r.fieldArea || 0;
      existing.productivity += r.productivity;
      dailyMap.set(dateKey, existing);
    });

    const dailyBreakdown = Array.from(dailyMap.values());
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
    const workingDays = dailyBreakdown.filter((d) => d.hoursUsed > 0).length;
    const totalHours = dailyBreakdown.reduce((s, d) => s + d.hoursUsed, 0);
    const totalFuel = dailyBreakdown.reduce((s, d) => s + d.fuelUsed, 0);
    const totalArea = dailyBreakdown.reduce((s, d) => s + d.areaCovered, 0);
    const equipment = this.equipment.get(equipmentId);
    const costPerHour = equipment ? (equipment.financialInfo.totalOperatingCost / Math.max(1, equipment.operationalData.totalHours)) : 0;
    const revenuePerHour = equipment ? (equipment.financialInfo.totalRevenue / Math.max(1, equipment.operationalData.totalHours)) : 0;

    const sortedDays = [...dailyBreakdown].sort((a, b) => b.hoursUsed - a.hoursUsed);

    return {
      equipmentId,
      period,
      startDate,
      endDate,
      totalHours,
      totalDays: workingDays,
      utilizationRate: totalDays > 0 ? Math.round((workingDays / totalDays) * 100) : 0,
      averageDailyHours: workingDays > 0 ? Math.round((totalHours / workingDays) * 100) / 100 : 0,
      totalFuelUsed: totalFuel,
      averageFuelEfficiency: totalHours > 0 ? Math.round((totalFuel / totalHours) * 100) / 100 : 0,
      totalAreaCovered: totalArea,
      averageProductivity: workingDays > 0 ? Math.round((dailyBreakdown.reduce((s, d) => s + d.productivity, 0) / workingDays) * 100) / 100 : 0,
      costPerHour: Math.round(costPerHour * 100) / 100,
      revenuePerHour: Math.round(revenuePerHour * 100) / 100,
      downtimeHours: totalDays * 24 - totalHours,
      downtimePercentage: Math.round(((totalDays * 24 - totalHours) / (totalDays * 24)) * 100),
      maintenanceHours: periodRecords.filter((r) => r.notes.toLowerCase().includes('maintenance')).reduce((s, r) => s + r.hoursUsed, 0),
      peakUtilizationDay: sortedDays[0]?.date || startDate,
      lowUtilizationDay: sortedDays[sortedDays.length - 1]?.date || startDate,
      dailyBreakdown,
    };
  }

  // ── Fleet Overview ───────────────────────────────────────────────────────

  async getFleetOverview(): Promise<FleetOverview> {
    const all = Array.from(this.equipment.values());
    const upcomingMaintenance = Array.from(this.maintenanceRecords.values())
      .flat()
      .filter((r) => r.status === 'scheduled' && r.scheduledDate >= new Date())
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
      .slice(0, 10);

    const categoryMap: Map<EquipmentCategory, { count: number; totalUtilization: number }> = new Map();
    all.forEach((e) => {
      const existing = categoryMap.get(e.category) || { count: 0, totalUtilization: 0 };
      existing.count++;
      existing.totalUtilization += e.operationalData.utilizationRate;
      categoryMap.set(e.category, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      utilization: data.count > 0 ? Math.round(data.totalUtilization / data.count) : 0,
    }));

    return {
      totalEquipment: all.length,
      operational: all.filter((e) => e.status === 'operational').length,
      inMaintenance: all.filter((e) => e.status === 'maintenance' || e.status === 'repair').length,
      idle: all.filter((e) => e.status === 'idle').length,
      rented: all.filter((e) => e.status === 'rented').length,
      totalValue: all.reduce((s, e) => s + e.financialInfo.currentValue, 0),
      totalHours: all.reduce((s, e) => s + e.operationalData.totalHours, 0),
      averageUtilization: all.length > 0 ? Math.round(all.reduce((s, e) => s + e.operationalData.utilizationRate, 0) / all.length) : 0,
      totalMaintenanceCost: all.reduce((s, e) => s + e.maintenanceInfo.totalMaintenanceCost, 0),
      upcomingMaintenance,
      categoryBreakdown,
    };
  }

  // ── Search ───────────────────────────────────────────────────────────────

  async searchEquipment(query: {
    name?: string;
    category?: EquipmentCategory;
    status?: EquipmentStatus;
    manufacturer?: string;
    minHours?: number;
    maxHours?: number;
    minYear?: number;
    maxYear?: number;
  }): Promise<Equipment[]> {
    let results = Array.from(this.equipment.values());
    if (query.name) results = results.filter((e) => e.name.toLowerCase().includes(query.name!.toLowerCase()));
    if (query.category) results = results.filter((e) => e.category === query.category);
    if (query.status) results = results.filter((e) => e.status === query.status);
    if (query.manufacturer) results = results.filter((e) => e.manufacturer.toLowerCase().includes(query.manufacturer!.toLowerCase()));
    if (query.minHours !== undefined) results = results.filter((e) => e.operationalData.totalHours >= query.minHours!);
    if (query.maxHours !== undefined) results = results.filter((e) => e.operationalData.totalHours <= query.maxHours!);
    if (query.minYear !== undefined) results = results.filter((e) => e.year >= query.minYear!);
    if (query.maxYear !== undefined) results = results.filter((e) => e.year <= query.maxYear!);
    return results;
  }
}
