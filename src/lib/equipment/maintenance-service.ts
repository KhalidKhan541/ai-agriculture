import { randomUUID } from 'crypto';
import type { MaintenanceRecord, PartsUsed, PartsReplacement } from './equipment-service';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderStatus = 'created' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type InspectionResult = 'pass' | 'fail' | 'conditional' | 'pending';

export interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  equipmentName: string;
  maintenanceType: 'oil_change' | 'filter_replacement' | 'tire_rotation' | 'engine_service' | 'hydraulic_service' | 'electrical_check' | 'blade_sharpening' | 'calibration' | 'seasonal_prep' | 'annual_inspection' | 'custom';
  intervalHours: number;
  intervalDays: number;
  lastCompletedDate?: Date;
  lastCompletedHours?: number;
  nextDueDate: Date;
  nextDueHours: number;
  priority: MaintenancePriority;
  estimatedCost: number;
  estimatedDurationHours: number;
  requiredParts: string[];
  instructions: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  equipmentId: string;
  equipmentName: string;
  scheduleId?: string;
  type: 'preventive' | 'corrective' | 'predictive' | 'emergency' | 'inspection';
  priority: MaintenancePriority;
  status: WorkOrderStatus;
  title: string;
  description: string;
  assignedTo?: string;
  assignedTeam?: string;
  scheduledDate: Date;
  startedDate?: Date;
  completedDate?: Date;
  estimatedCost: number;
  actualCost: number;
  estimatedDurationHours: number;
  actualDurationHours: number;
  partsUsed: PartsUsed[];
  laborHours: number;
  laborCost: number;
  findings: string;
  recommendations: string[];
  attachments: string[];
  statusHistory: WorkOrderStatusChange[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderStatusChange {
  status: WorkOrderStatus;
  changedBy: string;
  changedAt: Date;
  notes: string;
}

export interface PartsInventoryItem {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  category: string;
  compatibleEquipment: string[];
  quantityOnHand: number;
  quantityReserved: number;
  quantityOnOrder: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  totalValue: number;
  supplier: string;
  supplierPartNumber: string;
  leadTimeDays: number;
  location: string;
  shelfLife?: number;
  lastRestockedDate?: Date;
  lastUsedDate?: Date;
  reorderPoint: number;
  autoReorder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartsOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: PartsOrderItem[];
  totalCost: number;
  shippingCost: number;
  tax: number;
  grandTotal: number;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  trackingNumber?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartsOrderItem {
  partId: string;
  partNumber: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Inspection {
  id: string;
  inspectionNumber: string;
  equipmentId: string;
  equipmentName: string;
  type: 'daily' | 'weekly' | 'monthly' | 'annual' | 'pre_operation' | 'safety' | 'custom';
  inspectorId: string;
  inspectorName: string;
  scheduledDate: Date;
  completedDate?: Date;
  result: InspectionResult;
  checklist: InspectionChecklistItem[];
  overallScore: number;
  notes: string;
  issuesFound: InspectionIssue[];
  attachments: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionChecklistItem {
  id: string;
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'na' | 'pending';
  notes: string;
  photoRequired: boolean;
  photoUrl?: string;
}

export interface InspectionIssue {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  workOrderId?: string;
  resolved: boolean;
  resolvedDate?: Date;
  resolvedBy?: string;
}

export interface MaintenanceAlert {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'overdue_service' | 'approaching_service' | 'high_hours' | 'cost_threshold' | 'inspection_due' | 'parts_low_stock';
  priority: MaintenancePriority;
  message: string;
  dueDate?: Date;
  dueHours?: number;
  currentHours?: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface MaintenanceCostReport {
  equipmentId?: string;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  preventiveCost: number;
  correctiveCost: number;
  emergencyCost: number;
  partsCost: number;
  laborCost: number;
  costByEquipment: { equipmentId: string; equipmentName: string; cost: number }[];
  costByCategory: { category: string; cost: number }[];
  monthlyBreakdown: { month: string; cost: number }[];
  averageCostPerHour: number;
  costTrend: 'increasing' | 'decreasing' | 'stable';
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class MaintenanceService {
  private schedules: Map<string, MaintenanceSchedule> = new Map();
  private workOrders: Map<string, WorkOrder> = new Map();
  private partsInventory: Map<string, PartsInventoryItem> = new Map();
  private partsOrders: Map<string, PartsOrder> = new Map();
  private inspections: Map<string, Inspection> = new Map();
  private alerts: Map<string, MaintenanceAlert> = new Map();

  // ── Maintenance Schedules ────────────────────────────────────────────────

  async createSchedule(data: Omit<MaintenanceSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceSchedule> {
    const now = new Date();
    const schedule: MaintenanceSchedule = { ...data, id: randomUUID(), createdAt: now, updatedAt: now };
    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const existing = this.schedules.get(id);
    if (!existing) throw new Error(`Schedule ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.schedules.set(id, updated);
    return updated;
  }

  async getSchedulesForEquipment(equipmentId: string): Promise<MaintenanceSchedule[]> {
    return Array.from(this.schedules.values()).filter((s) => s.equipmentId === equipmentId && s.isActive);
  }

  async getOverdueSchedules(): Promise<MaintenanceSchedule[]> {
    const now = new Date();
    return Array.from(this.schedules.values()).filter((s) => s.isActive && s.nextDueDate <= now);
  }

  async completeSchedule(scheduleId: string, cost: number, partsUsed: PartsUsed[]): Promise<MaintenanceSchedule> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) throw new Error(`Schedule ${scheduleId} not found`);
    const now = new Date();
    schedule.lastCompletedDate = now;
    schedule.lastCompletedHours = schedule.nextDueHours;
    schedule.nextDueDate = new Date(now.getTime() + schedule.intervalDays * 86400000);
    schedule.nextDueHours = schedule.nextDueHours + schedule.intervalHours;
    schedule.updatedAt = now;
    this.schedules.set(scheduleId, schedule);

    const workOrder = await this.createWorkOrder({
      equipmentId: schedule.equipmentId,
      equipmentName: schedule.equipmentName,
      scheduleId: schedule.id,
      type: 'preventive',
      priority: schedule.priority,
      title: `${schedule.maintenanceType.replace(/_/g, ' ')} - ${schedule.equipmentName}`,
      description: `Scheduled ${schedule.maintenanceType.replace(/_/g, ' ')} maintenance`,
      scheduledDate: now,
      estimatedCost: schedule.estimatedCost,
      actualCost: cost,
      estimatedDurationHours: schedule.estimatedDurationHours,
      actualDurationHours: schedule.estimatedDurationHours,
      partsUsed,
      laborHours: schedule.estimatedDurationHours,
      laborCost: schedule.estimatedDurationHours * 75,
      findings: 'Completed as scheduled',
      recommendations: [],
    });
    await this.updateWorkOrderStatus(workOrder.id, 'completed', 'system', 'Auto-completed from schedule');

    return schedule;
  }

  // ── Work Orders ──────────────────────────────────────────────────────────

  async createWorkOrder(data: Omit<WorkOrder, 'id' | 'orderNumber' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder> {
    const now = new Date();
    const orderNumber = `WO-${now.getFullYear()}-${String(this.workOrders.size + 1).padStart(6, '0')}`;
    const workOrder: WorkOrder = {
      ...data,
      id: randomUUID(),
      orderNumber,
      status: 'created',
      statusHistory: [{ status: 'created', changedBy: 'system', changedAt: now, notes: 'Work order created' }],
      createdAt: now,
      updatedAt: now,
    };
    this.workOrders.set(workOrder.id, workOrder);
    return workOrder;
  }

  async updateWorkOrderStatus(id: string, status: WorkOrderStatus, changedBy: string, notes: string = ''): Promise<WorkOrder> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) throw new Error(`Work order ${id} not found`);
    const now = new Date();
    workOrder.status = status;
    workOrder.statusHistory.push({ status, changedBy, changedAt: now, notes });
    if (status === 'in_progress' && !workOrder.startedDate) workOrder.startedDate = now;
    if (status === 'completed') {
      workOrder.completedDate = now;
      workOrder.actualDurationHours = workOrder.startedDate
        ? (now.getTime() - workOrder.startedDate.getTime()) / 3600000
        : workOrder.estimatedDurationHours;
    }
    workOrder.updatedAt = now;
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async listWorkOrders(filter?: {
    equipmentId?: string;
    status?: WorkOrderStatus;
    type?: WorkOrder['type'];
    priority?: MaintenancePriority;
    startDate?: Date;
    endDate?: Date;
  }): Promise<WorkOrder[]> {
    let results = Array.from(this.workOrders.values());
    if (filter?.equipmentId) results = results.filter((wo) => wo.equipmentId === filter.equipmentId);
    if (filter?.status) results = results.filter((wo) => wo.status === filter.status);
    if (filter?.type) results = results.filter((wo) => wo.type === filter.type);
    if (filter?.priority) results = results.filter((wo) => wo.priority === filter.priority);
    if (filter?.startDate) results = results.filter((wo) => wo.scheduledDate >= filter.startDate!);
    if (filter?.endDate) results = results.filter((wo) => wo.scheduledDate <= filter.endDate!);
    return results.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  async assignWorkOrder(id: string, assignee: string, team?: string): Promise<WorkOrder> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) throw new Error(`Work order ${id} not found`);
    workOrder.assignedTo = assignee;
    if (team) workOrder.assignedTeam = team;
    workOrder.status = 'assigned';
    workOrder.statusHistory.push({ status: 'assigned', changedBy: 'system', changedAt: new Date(), notes: `Assigned to ${assignee}` });
    workOrder.updatedAt = new Date();
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async addWorkOrderParts(id: string, parts: PartsUsed[]): Promise<WorkOrder> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) throw new Error(`Work order ${id} not found`);
    workOrder.partsUsed.push(...parts);
    workOrder.actualCost += parts.reduce((s, p) => s + p.totalCost, 0);
    workOrder.updatedAt = new Date();
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  // ── Parts Inventory ──────────────────────────────────────────────────────

  async addPart(data: Omit<PartsInventoryItem, 'id' | 'totalValue' | 'createdAt' | 'updatedAt'>): Promise<PartsInventoryItem> {
    const now = new Date();
    const part: PartsInventoryItem = {
      ...data,
      id: randomUUID(),
      totalValue: data.quantityOnHand * data.unitCost,
      createdAt: now,
      updatedAt: now,
    };
    this.partsInventory.set(part.id, part);
    return part;
  }

  async updatePart(id: string, updates: Partial<PartsInventoryItem>): Promise<PartsInventoryItem> {
    const existing = this.partsInventory.get(id);
    if (!existing) throw new Error(`Part ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, totalValue: (updates.quantityOnHand ?? existing.quantityOnHand) * (updates.unitCost ?? existing.unitCost), updatedAt: new Date() };
    this.partsInventory.set(id, updated);
    return updated;
  }

  async deductPartStock(partId: string, quantity: number): Promise<PartsInventoryItem> {
    const part = this.partsInventory.get(partId);
    if (!part) throw new Error(`Part ${partId} not found`);
    if (part.quantityOnHand - part.quantityReserved < quantity) throw new Error(`Insufficient stock for part ${part.partNumber}`);
    part.quantityOnHand -= quantity;
    part.totalValue = part.quantityOnHand * part.unitCost;
    part.lastUsedDate = new Date();
    part.updatedAt = new Date();
    this.partsInventory.set(partId, part);
    return part;
  }

  async reservePart(partId: string, quantity: number): Promise<PartsInventoryItem> {
    const part = this.partsInventory.get(partId);
    if (!part) throw new Error(`Part ${partId} not found`);
    if (part.quantityOnHand - part.quantityReserved < quantity) throw new Error(`Insufficient stock to reserve for part ${part.partNumber}`);
    part.quantityReserved += quantity;
    part.updatedAt = new Date();
    this.partsInventory.set(partId, part);
    return part;
  }

  async releasePartReservation(partId: string, quantity: number): Promise<PartsInventoryItem> {
    const part = this.partsInventory.get(partId);
    if (!part) throw new Error(`Part ${partId} not found`);
    part.quantityReserved = Math.max(0, part.quantityReserved - quantity);
    part.updatedAt = new Date();
    this.partsInventory.set(partId, part);
    return part;
  }

  async getLowStockParts(): Promise<PartsInventoryItem[]> {
    return Array.from(this.partsInventory.values()).filter((p) => p.quantityOnHand <= p.reorderPoint);
  }

  async searchParts(query: { name?: string; partNumber?: string; category?: string; compatibleWith?: string }): Promise<PartsInventoryItem[]> {
    let results = Array.from(this.partsInventory.values());
    if (query.name) results = results.filter((p) => p.name.toLowerCase().includes(query.name!.toLowerCase()));
    if (query.partNumber) results = results.filter((p) => p.partNumber.toLowerCase().includes(query.partNumber!.toLowerCase()));
    if (query.category) results = results.filter((p) => p.category === query.category);
    if (query.compatibleWith) results = results.filter((p) => p.compatibleEquipment.includes(query.compatibleWith!));
    return results;
  }

  // ── Parts Orders ─────────────────────────────────────────────────────────

  async createPartsOrder(data: Omit<PartsOrder, 'id' | 'orderNumber' | 'status' | 'createdAt' | 'updatedAt'>): Promise<PartsOrder> {
    const now = new Date();
    const orderNumber = `PO-${now.getFullYear()}-${String(this.partsOrders.size + 1).padStart(6, '0')}`;
    const order: PartsOrder = { ...data, id: randomUUID(), orderNumber, status: 'draft', createdAt: now, updatedAt: now };
    this.partsOrders.set(order.id, order);
    return order;
  }

  async updatePartsOrderStatus(id: string, status: PartsOrder['status']): Promise<PartsOrder> {
    const order = this.partsOrders.get(id);
    if (!order) throw new Error(`Parts order ${id} not found`);
    order.status = status;
    if (status === 'delivered') order.actualDeliveryDate = new Date();
    order.updatedAt = new Date();
    this.partsOrders.set(id, order);

    if (status === 'delivered') {
      for (const item of order.items) {
        const part = this.partsInventory.get(item.partId);
        if (part) {
          part.quantityOnHand += item.quantity;
          part.quantityOnOrder = Math.max(0, part.quantityOnOrder - item.quantity);
          part.quantityReserved = Math.max(0, part.quantityReserved - item.quantity);
          part.lastRestockedDate = new Date();
          part.totalValue = part.quantityOnHand * part.unitCost;
          part.updatedAt = new Date();
          this.partsInventory.set(item.partId, part);
        }
      }
    }
    return order;
  }

  // ── Inspections ──────────────────────────────────────────────────────────

  async createInspection(data: Omit<Inspection, 'id' | 'inspectionNumber' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Inspection> {
    const now = new Date();
    const inspectionNumber = `INSP-${now.getFullYear()}-${String(this.inspections.size + 1).padStart(6, '0')}`;
    const inspection: Inspection = { ...data, id: randomUUID(), inspectionNumber, status: 'scheduled', createdAt: now, updatedAt: now };
    this.inspections.set(inspection.id, inspection);
    return inspection;
  }

  async completeInspection(id: string, results: {
    checklist: InspectionChecklistItem[];
    overallScore: number;
    result: InspectionResult;
    notes: string;
    issuesFound: InspectionIssue[];
  }): Promise<Inspection> {
    const inspection = this.inspections.get(id);
    if (!inspection) throw new Error(`Inspection ${id} not found`);
    const now = new Date();
    inspection.checklist = results.checklist;
    inspection.overallScore = results.overallScore;
    inspection.result = results.result;
    inspection.notes = results.notes;
    inspection.issuesFound = results.issuesFound;
    inspection.completedDate = now;
    inspection.status = 'completed';
    inspection.updatedAt = now;
    this.inspections.set(id, inspection);

    for (const issue of results.issuesFound) {
      if (issue.severity === 'high' || issue.severity === 'critical') {
        const workOrder = await this.createWorkOrder({
          equipmentId: inspection.equipmentId,
          equipmentName: inspection.equipmentName,
          type: 'corrective',
          priority: issue.severity === 'critical' ? 'critical' : 'high',
          title: `Inspection Issue: ${issue.description}`,
          description: issue.description,
          scheduledDate: now,
          estimatedCost: 0,
          actualCost: 0,
          estimatedDurationHours: 4,
          actualDurationHours: 0,
          partsUsed: [],
          laborHours: 0,
          laborCost: 0,
          findings: issue.description,
          recommendations: [],
        });
        issue.workOrderId = workOrder.id;
      }
    }

    return inspection;
  }

  async getInspectionsForEquipment(equipmentId: string): Promise<Inspection[]> {
    return Array.from(this.inspections.values()).filter((i) => i.equipmentId === equipmentId);
  }

  async getOverdueInspections(): Promise<Inspection[]> {
    const now = new Date();
    return Array.from(this.inspections.values()).filter((i) => i.status === 'scheduled' && i.scheduledDate <= now);
  }

  // ── Alerts ───────────────────────────────────────────────────────────────

  async generateAlerts(): Promise<MaintenanceAlert[]> {
    const newAlerts: MaintenanceAlert[] = [];
    const now = new Date();

    const overdueSchedules = await this.getOverdueSchedules();
    for (const schedule of overdueSchedules) {
      const alert: MaintenanceAlert = {
        id: randomUUID(),
        equipmentId: schedule.equipmentId,
        equipmentName: schedule.equipmentName,
        type: 'overdue_service',
        priority: schedule.priority,
        message: `Overdue: ${schedule.maintenanceType.replace(/_/g, ' ')} for ${schedule.equipmentName}`,
        dueDate: schedule.nextDueDate,
        dueHours: schedule.nextDueHours,
        acknowledged: false,
        createdAt: now,
      };
      this.alerts.set(alert.id, alert);
      newAlerts.push(alert);
    }

    const approachingSchedules = Array.from(this.schedules.values()).filter((s) => {
      if (!s.isActive) return false;
      const daysUntilDue = (s.nextDueDate.getTime() - now.getTime()) / 86400000;
      return daysUntilDue > 0 && daysUntilDue <= 7;
    });
    for (const schedule of approachingSchedules) {
      const alert: MaintenanceAlert = {
        id: randomUUID(),
        equipmentId: schedule.equipmentId,
        equipmentName: schedule.equipmentName,
        type: 'approaching_service',
        priority: 'medium',
        message: `Upcoming: ${schedule.maintenanceType.replace(/_/g, ' ')} due in ${Math.ceil((schedule.nextDueDate.getTime() - now.getTime()) / 86400000)} days`,
        dueDate: schedule.nextDueDate,
        dueHours: schedule.nextDueHours,
        acknowledged: false,
        createdAt: now,
      };
      this.alerts.set(alert.id, alert);
      newAlerts.push(alert);
    }

    const lowStockParts = await this.getLowStockParts();
    for (const part of lowStockParts) {
      const alert: MaintenanceAlert = {
        id: randomUUID(),
        equipmentId: '',
        equipmentName: part.name,
        type: 'parts_low_stock',
        priority: part.quantityOnHand === 0 ? 'critical' : 'medium',
        message: `Low stock: ${part.name} (${part.partNumber}) - ${part.quantityOnHand} remaining`,
        acknowledged: false,
        createdAt: now,
      };
      this.alerts.set(alert.id, alert);
      newAlerts.push(alert);
    }

    return newAlerts;
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<MaintenanceAlert> {
    const alert = this.alerts.get(id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    this.alerts.set(id, alert);
    return alert;
  }

  async getActiveAlerts(): Promise<MaintenanceAlert[]> {
    return Array.from(this.alerts.values()).filter((a) => !a.acknowledged);
  }

  // ── Cost Reports ─────────────────────────────────────────────────────────

  async generateCostReport(equipmentId: string | undefined, startDate: Date, endDate: Date): Promise<MaintenanceCostReport> {
    let workOrders = Array.from(this.workOrders.values()).filter(
      (wo) => wo.status === 'completed' && wo.completedDate && wo.completedDate >= startDate && wo.completedDate <= endDate,
    );
    if (equipmentId) workOrders = workOrders.filter((wo) => wo.equipmentId === equipmentId);

    const totalCost = workOrders.reduce((s, wo) => s + wo.actualCost, 0);
    const preventiveCost = workOrders.filter((wo) => wo.type === 'preventive').reduce((s, wo) => s + wo.actualCost, 0);
    const correctiveCost = workOrders.filter((wo) => wo.type === 'corrective').reduce((s, wo) => s + wo.actualCost, 0);
    const emergencyCost = workOrders.filter((wo) => wo.type === 'emergency').reduce((s, wo) => s + wo.actualCost, 0);
    const partsCost = workOrders.reduce((s, wo) => s + wo.partsUsed.reduce((ps, p) => ps + p.totalCost, 0), 0);
    const laborCost = workOrders.reduce((s, wo) => s + wo.laborCost, 0);

    const equipmentCostMap: Map<string, { name: string; cost: number }> = new Map();
    workOrders.forEach((wo) => {
      const existing = equipmentCostMap.get(wo.equipmentId) || { name: wo.equipmentName, cost: 0 };
      existing.cost += wo.actualCost;
      equipmentCostMap.set(wo.equipmentId, existing);
    });
    const costByEquipment = Array.from(equipmentCostMap.entries()).map(([equipmentId, data]) => ({ equipmentId, equipmentName: data.name, cost: data.cost }));

    const categoryMap: Map<string, number> = new Map();
    workOrders.forEach((wo) => {
      categoryMap.set(wo.type, (categoryMap.get(wo.type) || 0) + wo.actualCost);
    });
    const costByCategory = Array.from(categoryMap.entries()).map(([category, cost]) => ({ category, cost }));

    const monthMap: Map<string, number> = new Map();
    workOrders.forEach((wo) => {
      if (wo.completedDate) {
        const key = wo.completedDate.toISOString().slice(0, 7);
        monthMap.set(key, (monthMap.get(key) || 0) + wo.actualCost);
      }
    });
    const monthlyBreakdown = Array.from(monthMap.entries()).map(([month, cost]) => ({ month, cost })).sort((a, b) => a.month.localeCompare(b.month));

    const totalHours = workOrders.reduce((s, wo) => s + wo.actualDurationHours, 0);
    const avgCostPerHour = totalHours > 0 ? totalCost / totalHours : 0;
    const costTrend = monthlyBreakdown.length >= 2
      ? monthlyBreakdown[monthlyBreakdown.length - 1].cost > monthlyBreakdown[0].cost ? 'increasing' : 'decreasing'
      : 'stable';

    return {
      equipmentId,
      startDate,
      endDate,
      totalCost,
      preventiveCost,
      correctiveCost,
      emergencyCost,
      partsCost,
      laborCost,
      costByEquipment,
      costByCategory,
      monthlyBreakdown,
      averageCostPerHour: Math.round(avgCostPerHour * 100) / 100,
      costTrend,
    };
  }
}
