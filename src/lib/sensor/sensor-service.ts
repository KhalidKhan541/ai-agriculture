import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SensorType = 'temperature' | 'humidity' | 'soil_moisture' | 'soil_ph' | 'soil_nitrogen' | 'soil_phosphorus' | 'soil_potassium' | 'light' | 'wind_speed' | 'wind_direction' | 'rainfall' | 'barometric' | 'co2' | 'oxygen' | 'electrical_conductivity' | 'leaf_wetness' | 'uv' | 'solar_radiation' | 'water_level' | 'flow_rate';
export type SensorStatus = 'active' | 'inactive' | 'low_battery' | 'error' | 'maintenance' | 'offline';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type DataAggregation = 'raw' | 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type Protocol = 'mqtt' | 'http' | 'coap' | 'lorawan' | 'zigbee' | 'bluetooth' | 'wifi' | 'cellular';

export interface IoTDevice {
  id: string;
  name: string;
  type: SensorType;
  model: string;
  manufacturer: string;
  serialNumber: string;
  firmwareVersion: string;
  status: SensorStatus;
  protocol: Protocol;
  location: DeviceLocation;
  configuration: DeviceConfiguration;
  calibration: CalibrationInfo;
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: Date;
  lastDataReceived?: Date;
  totalDataPoints: number;
  installationDate: Date;
  warrantyExpiry?: Date;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceLocation {
  fieldId?: string;
  zoneId?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  description?: string;
  indoors: boolean;
}

export interface DeviceConfiguration {
  samplingIntervalSeconds: number;
  reportingIntervalSeconds: number;
  threshold?: ThresholdConfig;
  powerMode: 'continuous' | 'periodic' | 'sleep';
  dataCompression: boolean;
  encryptionEnabled: boolean;
  customSettings: Record<string, unknown>;
}

export interface ThresholdConfig {
  min?: number;
  max?: number;
  alertOnBreach: boolean;
  debounceMinutes: number;
}

export interface CalibrationInfo {
  lastCalibrated: Date;
  nextCalibration: Date;
  calibrationPoints: { input: number; output: number }[];
  accuracy: number;
  driftRate: number;
}

export interface SensorData {
  id: string;
  deviceId: string;
  deviceName: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'uncertain' | 'bad';
  location: { lat: number; lng: number };
  batteryLevel?: number;
  signalStrength?: number;
  metadata?: Record<string, unknown>;
}

export interface AggregatedData {
  id: string;
  deviceId: string;
  sensorType: SensorType;
  aggregation: DataAggregation;
  periodStart: Date;
  periodEnd: Date;
  minimum: number;
  maximum: number;
  average: number;
  median: number;
  sum?: number;
  count: number;
  standardDeviation: number;
  unit: string;
}

export interface SensorAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  sensorType: SensorType;
  severity: AlertSeverity;
  type: 'threshold_breach' | 'device_offline' | 'low_battery' | 'high_drift' | 'data_anomaly' | 'maintenance_due';
  message: string;
  currentValue?: number;
  threshold?: { min?: number; max?: number };
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes: string;
}

export interface SensorRule {
  id: string;
  name: string;
  description: string;
  deviceId?: string;
  deviceIds?: string[];
  sensorType: SensorType;
  condition: RuleCondition;
  actions: RuleAction[];
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
  triggerCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'between' | 'outside';
  value: number;
  value2?: number;
  durationMinutes?: number;
}

export interface RuleAction {
  type: 'alert' | 'notification' | 'webhook' | 'email' | 'sms' | 'auto_irrigation' | 'log';
  target?: string;
  message?: string;
  config?: Record<string, unknown>;
}

export interface SensorDashboard {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  lowBatteryDevices: number;
  errorDevices: number;
  totalDataPointsToday: number;
  activeAlerts: number;
  unacknowledgedAlerts: number;
  sensorTypes: { type: SensorType; count: number; activeCount: number }[];
  fieldCoverage: { fieldId: string; deviceCount: number; types: SensorType[] }[];
  recentAlerts: SensorAlert[];
  dataVolume: { date: string; count: number }[];
}

export interface DataQuery {
  deviceId?: string;
  sensorType?: SensorType;
  fieldId?: string;
  startDate: Date;
  endDate: Date;
  aggregation?: DataAggregation;
  limit?: number;
  offset?: number;
}

export interface SensorHealthReport {
  deviceId: string;
  deviceName: string;
  status: SensorStatus;
  batteryHealth: number;
  signalQuality: number;
  dataQuality: number;
  calibrationDrift: number;
  uptimePercentage: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
  issues: string[];
  recommendations: string[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class SensorService {
  private devices: Map<string, IoTDevice> = new Map();
  private dataBuffer: Map<string, SensorData[]> = new Map();
  private aggregatedData: Map<string, AggregatedData[]> = new Map();
  private alerts: Map<string, SensorAlert> = new Map();
  private rules: Map<string, SensorRule> = new Map();

  private readonly DATA_RETENTION_DAYS = 90;
  private readonly BUFFER_FLUSH_INTERVAL = 60000;

  // ── Device Management ────────────────────────────────────────────────────

  async registerDevice(data: Omit<IoTDevice, 'id' | 'createdAt' | 'updatedAt' | 'totalDataPoints' | 'lastSeen'>): Promise<IoTDevice> {
    const now = new Date();
    const device: IoTDevice = {
      ...data,
      id: randomUUID(),
      totalDataPoints: 0,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    };
    this.devices.set(device.id, device);
    this.dataBuffer.set(device.id, []);
    return device;
  }

  async updateDevice(id: string, updates: Partial<IoTDevice>): Promise<IoTDevice> {
    const existing = this.devices.get(id);
    if (!existing) throw new Error(`Device ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.devices.set(id, updated);
    return updated;
  }

  async getDevice(id: string): Promise<IoTDevice | undefined> {
    return this.devices.get(id);
  }

  async listDevices(filter?: { type?: SensorType; status?: SensorStatus; fieldId?: string; protocol?: Protocol }): Promise<IoTDevice[]> {
    let results = Array.from(this.devices.values());
    if (filter?.type) results = results.filter((d) => d.type === filter.type);
    if (filter?.status) results = results.filter((d) => d.status === filter.status);
    if (filter?.fieldId) results = results.filter((d) => d.location.fieldId === filter.fieldId);
    if (filter?.protocol) results = results.filter((d) => d.protocol === filter.protocol);
    return results;
  }

  async removeDevice(id: string): Promise<void> {
    if (!this.devices.delete(id)) throw new Error(`Device ${id} not found`);
    this.dataBuffer.delete(id);
    this.aggregatedData.delete(id);
  }

  async updateDeviceStatus(id: string, status: SensorStatus): Promise<IoTDevice> {
    const device = this.devices.get(id);
    if (!device) throw new Error(`Device ${id} not found`);
    device.status = status;
    device.lastSeen = new Date();
    device.updatedAt = new Date();
    this.devices.set(id, device);

    if (status === 'offline' || status === 'error') {
      await this.createAlert(id, 'device_offline', 'warning', `Device ${device.name} is ${status}`);
    }
    return device;
  }

  async getDevicesNeedingCalibration(): Promise<IoTDevice[]> {
    const now = new Date();
    return Array.from(this.devices.values()).filter((d) => d.calibration.nextCalibration <= now);
  }

  async calibrateDevice(id: string, calibrationPoints: { input: number; output: number }[]): Promise<IoTDevice> {
    const device = this.devices.get(id);
    if (!device) throw new Error(`Device ${id} not found`);
    const now = new Date();
    device.calibration = {
      lastCalibrated: now,
      nextCalibration: new Date(now.getTime() + 90 * 86400000),
      calibrationPoints,
      accuracy: this.calculateCalibrationAccuracy(calibrationPoints),
      driftRate: 0,
    };
    device.updatedAt = now;
    this.devices.set(id, device);
    return device;
  }

  // ── Data Ingestion ───────────────────────────────────────────────────────

  async ingestData(data: Omit<SensorData, 'id' | 'timestamp'>): Promise<SensorData> {
    const device = this.devices.get(data.deviceId);
    if (!device) throw new Error(`Device ${data.deviceId} not found`);

    const now = new Date();
    const point: SensorData = { ...data, id: randomUUID(), timestamp: now };

    const buffer = this.dataBuffer.get(data.deviceId) || [];
    buffer.push(point);
    this.dataBuffer.set(data.deviceId, buffer);

    device.totalDataPoints++;
    device.lastDataReceived = now;
    device.lastSeen = now;
    device.status = 'active';
    this.devices.set(data.deviceId, device);

    await this.evaluateRules(point);
    return point;
  }

  async ingestBatch(dataPoints: Omit<SensorData, 'id' | 'timestamp'>[]): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;
    for (const dp of dataPoints) {
      try {
        await this.ingestData(dp);
        successful++;
      } catch {
        failed++;
      }
    }
    return { successful, failed };
  }

  async queryData(query: DataQuery): Promise<SensorData[]> {
    let results: SensorData[] = [];

    if (query.deviceId) {
      results = this.dataBuffer.get(query.deviceId) || [];
    } else {
      for (const buffer of this.dataBuffer.values()) {
        results.push(...buffer);
      }
    }

    results = results.filter((d) => d.timestamp >= query.startDate && d.timestamp <= query.endDate);
    if (query.sensorType) results = results.filter((d) => d.sensorType === query.sensorType);
    if (query.fieldId) {
      const fieldDeviceIds = Array.from(this.devices.values())
        .filter((d) => d.location.fieldId === query.fieldId)
        .map((d) => d.id);
      results = results.filter((d) => fieldDeviceIds.includes(d.deviceId));
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (query.offset) results = results.slice(query.offset);
    if (query.limit) results = results.slice(0, query.limit);

    return results;
  }

  async getLatestData(deviceId: string): Promise<SensorData | undefined> {
    const buffer = this.dataBuffer.get(deviceId) || [];
    return buffer.length ? buffer[buffer.length - 1] : undefined;
  }

  async getLatestDataForField(fieldId: string): Promise<Map<SensorType, SensorData>> {
    const result = new Map<SensorType, SensorData>();
    const fieldDevices = Array.from(this.devices.values()).filter((d) => d.location.fieldId === fieldId);

    for (const device of fieldDevices) {
      const latest = await this.getLatestData(device.id);
      if (latest && (!result.has(latest.sensorType) || latest.timestamp > result.get(latest.sensorType)!.timestamp)) {
        result.set(latest.sensorType, latest);
      }
    }
    return result;
  }

  // ── Data Aggregation ─────────────────────────────────────────────────────

  async aggregateData(deviceId: string, sensorType: SensorType, aggregation: DataAggregation, startDate: Date, endDate: Date): Promise<AggregatedData[]> {
    const rawData = (this.dataBuffer.get(deviceId) || []).filter(
      (d) => d.sensorType === sensorType && d.timestamp >= startDate && d.timestamp <= endDate,
    );

    if (!rawData.length) return [];

    const periodMs = { raw: 0, minute: 60000, hourly: 3600000, daily: 86400000, weekly: 604800000, monthly: 2592000000 }[aggregation];
    if (periodMs === 0) return rawData.map((d) => ({
      id: randomUUID(),
      deviceId,
      sensorType,
      aggregation,
      periodStart: d.timestamp,
      periodEnd: d.timestamp,
      minimum: d.value,
      maximum: d.value,
      average: d.value,
      median: d.value,
      count: 1,
      standardDeviation: 0,
      unit: d.unit,
    }));

    const buckets: Map<number, SensorData[]> = new Map();
    rawData.forEach((d) => {
      const bucketKey = Math.floor(d.timestamp.getTime() / periodMs) * periodMs;
      const existing = buckets.get(bucketKey) || [];
      existing.push(d);
      buckets.set(bucketKey, existing);
    });

    const aggregated: AggregatedData[] = [];
    for (const [bucketStart, points] of buckets) {
      const values = points.map((p) => p.value).sort((a, b) => a - b);
      const sum = values.reduce((s, v) => s + v, 0);
      const mean = sum / values.length;
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;

      aggregated.push({
        id: randomUUID(),
        deviceId,
        sensorType,
        aggregation,
        periodStart: new Date(bucketStart),
        periodEnd: new Date(bucketStart + periodMs),
        minimum: values[0],
        maximum: values[values.length - 1],
        average: Math.round(mean * 1000) / 1000,
        median: values[Math.floor(values.length / 2)],
        sum: sum,
        count: values.length,
        standardDeviation: Math.round(Math.sqrt(variance) * 1000) / 1000,
        unit: points[0].unit,
      });
    }

    const key = `${deviceId}-${sensorType}-${aggregation}`;
    this.aggregatedData.set(key, aggregated);
    return aggregated;
  }

  // ── Alerts ───────────────────────────────────────────────────────────────

  async createAlert(deviceId: string, type: SensorAlert['type'], severity: AlertSeverity, message: string, currentValue?: number, threshold?: { min?: number; max?: number }): Promise<SensorAlert> {
    const device = this.devices.get(deviceId);
    const alert: SensorAlert = {
      id: randomUUID(),
      deviceId,
      deviceName: device?.name || 'Unknown',
      sensorType: device?.type || 'temperature',
      severity,
      type,
      message,
      currentValue,
      threshold,
      triggeredAt: new Date(),
      notes: '',
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string, notes: string = ''): Promise<SensorAlert> {
    const alert = this.alerts.get(id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    alert.notes = notes;
    this.alerts.set(id, alert);
    return alert;
  }

  async resolveAlert(id: string, resolvedBy: string, notes: string = ''): Promise<SensorAlert> {
    const alert = this.alerts.get(id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.notes = notes;
    this.alerts.set(id, alert);
    return alert;
  }

  async getActiveAlerts(severity?: AlertSeverity): Promise<SensorAlert[]> {
    let results = Array.from(this.alerts.values()).filter((a) => !a.resolvedAt);
    if (severity) results = results.filter((a) => a.severity === severity);
    return results.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  async getDeviceAlerts(deviceId: string): Promise<SensorAlert[]> {
    return Array.from(this.alerts.values()).filter((a) => a.deviceId === deviceId);
  }

  // ── Rules Engine ─────────────────────────────────────────────────────────

  async createRule(data: Omit<SensorRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): Promise<SensorRule> {
    const now = new Date();
    const rule: SensorRule = { ...data, id: randomUUID(), triggerCount: 0, createdAt: now, updatedAt: now };
    this.rules.set(rule.id, rule);
    return rule;
  }

  async updateRule(id: string, updates: Partial<SensorRule>): Promise<SensorRule> {
    const existing = this.rules.get(id);
    if (!existing) throw new Error(`Rule ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.rules.set(id, updated);
    return updated;
  }

  async deleteRule(id: string): Promise<void> {
    if (!this.rules.delete(id)) throw new Error(`Rule ${id} not found`);
  }

  async listRules(): Promise<SensorRule[]> {
    return Array.from(this.rules.values());
  }

  private async evaluateRules(dataPoint: SensorData): Promise<void> {
    const rules = Array.from(this.rules.values()).filter(
      (r) => r.enabled && r.sensorType === dataPoint.sensorType && (r.deviceId === dataPoint.deviceId || r.deviceIds?.includes(dataPoint.deviceId)),
    );

    for (const rule of rules) {
      const triggered = this.evaluateCondition(rule.condition, dataPoint.value);
      if (triggered) {
        if (rule.cooldownMinutes && rule.lastTriggered) {
          const cooldownMs = rule.cooldownMinutes * 60000;
          if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) continue;
        }

        rule.lastTriggered = new Date();
        rule.triggerCount++;
        this.rules.set(rule.id, rule);

        for (const action of rule.actions) {
          await this.executeRuleAction(action, rule, dataPoint);
        }
      }
    }
  }

  private evaluateCondition(condition: RuleCondition, value: number): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.value;
      case 'lt': return value < condition.value;
      case 'gte': return value >= condition.value;
      case 'lte': return value <= condition.value;
      case 'eq': return value === condition.value;
      case 'neq': return value !== condition.value;
      case 'between': return value >= condition.value && value <= (condition.value2 || 0);
      case 'outside': return value < condition.value || value > (condition.value2 || 0);
      default: return false;
    }
  }

  private async executeRuleAction(action: RuleAction, rule: SensorRule, dataPoint: SensorData): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.createAlert(
          dataPoint.deviceId,
          'threshold_breach',
          'warning',
          action.message || `Rule "${rule.name}" triggered: ${dataPoint.value}${dataPoint.unit}`,
          dataPoint.value,
        );
        break;
      case 'notification':
        break;
      case 'webhook':
        break;
      case 'email':
        break;
      case 'sms':
        break;
      case 'log':
        break;
    }
  }

  // ── Dashboard & Health ───────────────────────────────────────────────────

  async getDashboard(fieldId?: string): Promise<SensorDashboard> {
    let devices = Array.from(this.devices.values());
    if (fieldId) devices = devices.filter((d) => d.location.fieldId === fieldId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    let totalDataToday = 0;
    for (const buffer of this.dataBuffer.values()) {
      totalDataToday += buffer.filter((d) => d.timestamp >= todayStart).length;
    }

    const activeAlerts = Array.from(this.alerts.values()).filter((a) => !a.resolvedAt);
    const typeMap: Map<SensorType, { count: number; activeCount: number }> = new Map();
    devices.forEach((d) => {
      const existing = typeMap.get(d.type) || { count: 0, activeCount: 0 };
      existing.count++;
      if (d.status === 'active') existing.activeCount++;
      typeMap.set(d.type, existing);
    });

    const fieldMap: Map<string, { deviceCount: number; types: Set<SensorType> }> = new Map();
    devices.forEach((d) => {
      if (d.location.fieldId) {
        const existing = fieldMap.get(d.location.fieldId) || { deviceCount: 0, types: new Set() };
        existing.deviceCount++;
        existing.types.add(d.type);
        fieldMap.set(d.location.fieldId, existing);
      }
    });

    return {
      totalDevices: devices.length,
      activeDevices: devices.filter((d) => d.status === 'active').length,
      offlineDevices: devices.filter((d) => d.status === 'offline').length,
      lowBatteryDevices: devices.filter((d) => d.batteryLevel !== undefined && d.batteryLevel < 20).length,
      errorDevices: devices.filter((d) => d.status === 'error').length,
      totalDataPointsToday: totalDataToday,
      activeAlerts: activeAlerts.length,
      unacknowledgedAlerts: activeAlerts.filter((a) => !a.acknowledgedAt).length,
      sensorTypes: Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data })),
      fieldCoverage: Array.from(fieldMap.entries()).map(([fieldId, data]) => ({ fieldId, deviceCount: data.deviceCount, types: Array.from(data.types) })),
      recentAlerts: activeAlerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()).slice(0, 10),
      dataVolume: [],
    };
  }

  async getDeviceHealth(deviceId: string): Promise<SensorHealthReport | undefined> {
    const device = this.devices.get(deviceId);
    if (!device) return undefined;

    const buffer = this.dataBuffer.get(deviceId) || [];
    const recentData = buffer.filter((d) => d.timestamp >= new Date(Date.now() - 7 * 86400000));
    const goodQuality = recentData.filter((d) => d.quality === 'good').length;
    const dataQuality = recentData.length ? (goodQuality / recentData.length) * 100 : 0;

    const now = new Date();
    const totalMs = now.getTime() - device.installationDate.getTime();
    const offlineMs = recentData.length === 0 ? totalMs : 0;
    const uptimePercentage = totalMs > 0 ? ((totalMs - offlineMs) / totalMs) * 100 : 100;

    const issues: string[] = [];
    const recommendations: string[] = [];
    if (device.batteryLevel !== undefined && device.batteryLevel < 20) {
      issues.push('Low battery level');
      recommendations.push('Replace or recharge battery soon');
    }
    if (device.calibration.nextCalibration <= now) {
      issues.push('Calibration overdue');
      recommendations.push('Schedule device calibration');
    }
    if (dataQuality < 90) {
      issues.push('Data quality below threshold');
      recommendations.push('Check sensor and connectivity');
    }

    return {
      deviceId,
      deviceName: device.name,
      status: device.status,
      batteryHealth: device.batteryLevel || 100,
      signalQuality: device.signalStrength || 100,
      dataQuality: Math.round(dataQuality),
      calibrationDrift: device.calibration.driftRate,
      uptimePercentage: Math.round(uptimePercentage),
      lastMaintenance: device.calibration.lastCalibrated,
      nextMaintenance: device.calibration.nextCalibration,
      issues,
      recommendations,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private calculateCalibrationAccuracy(points: { input: number; output: number }[]): number {
    if (points.length < 2) return 100;
    const errors = points.map((p) => Math.abs(p.input - p.output));
    const avgError = errors.reduce((s, e) => s + e, 0) / errors.length;
    return Math.max(0, 100 - avgError * 10);
  }

  async cleanupOldData(days: number = this.DATA_RETENTION_DAYS): Promise<number> {
    const cutoff = new Date(Date.now() - days * 86400000);
    let removed = 0;
    for (const [deviceId, buffer] of this.dataBuffer) {
      const before = buffer.length;
      const filtered = buffer.filter((d) => d.timestamp >= cutoff);
      this.dataBuffer.set(deviceId, filtered);
      removed += before - filtered.length;
    }
    return removed;
  }
}
