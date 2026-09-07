import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DroneStatus = 'available' | 'in_flight' | 'charging' | 'maintenance' | 'offline';
export type FlightStatus = 'planned' | 'active' | 'paused' | 'completed' | 'aborted' | 'failed';
export type FlightPattern = 'grid' | 'crosshatch' | 'circular' | 'perimeter' | 'custom' | ' waypoint';
export type ImageMode = 'rgb' | 'multispectral' | 'thermal' | 'ndvi' | 'all';
export type ScanType = 'full_field' | 'zone_scan' | 'targeted' | 'corridor' | '3d_mapping';

export interface Drone {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: DroneStatus;
  batteryLevel: number;
  batteryHealth: number;
  maxFlightTimeMinutes: number;
  maxRangeKm: number;
  maxAltitudeM: number;
  maxSpeedKmh: number;
  payloadCapacityKg: number;
  cameraCapabilities: CameraCapability[];
  sensors: DroneSensor[];
  location: { lat: number; lng: number; altitude: number };
  totalFlightHours: number;
  totalFlights: number;
  lastFlightDate?: Date;
  maintenanceInfo: {
    lastService: Date;
    nextService: Date;
    totalMaintenanceCost: number;
  };
  registrationNumber: string;
  insuranceExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CameraCapability {
  type: ImageMode;
  resolution: string;
  fieldOfView: number;
  focalLength: number;
  spectralBands: string[];
}

export interface DroneSensor {
  type: string;
  model: string;
  accuracy: number;
  range: string;
}

export interface FlightPlan {
  id: string;
  planNumber: string;
  droneId: string;
  droneName: string;
  fieldId: string;
  fieldName: string;
  pattern: FlightPattern;
  scanType: ScanType;
  imageMode: ImageMode;
  waypoints: Waypoint[];
  altitude: number;
  speed: number;
  overlapPercentage: number;
  sideOverlapPercentage: number;
  estimatedDurationMinutes: number;
  estimatedDistanceKm: number;
  estimatedImageCount: number;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: FlightStatus;
  createdBy: string;
  notes: string;
  weatherRequirements: WeatherRequirements;
  safetyChecks: SafetyCheck[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Waypoint {
  id: string;
  sequence: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  gimbalPitch: number;
  action?: WaypointAction;
  waitTime: number;
}

export interface WaypointAction {
  type: 'take_photo' | 'start_recording' | 'stop_recording' | 'rotate_gimbal' | 'hover';
  parameters: Record<string, unknown>;
}

export interface WeatherRequirements {
  maxWindSpeedKmh: number;
  maxPrecipitationMm: number;
  maxTemperatureC: number;
  minTemperatureC: number;
  minVisibilityKm: number;
  maxCloudCoverPercent: number;
}

export interface SafetyCheck {
  id: string;
  name: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: Date;
  notes: string;
}

export interface FlightRecord {
  id: string;
  flightNumber: string;
  planId: string;
  droneId: string;
  droneName: string;
  fieldId: string;
  pilotId: string;
  pilotName: string;
  status: FlightStatus;
  startTime: Date;
  endTime?: Date;
  actualDurationMinutes: number;
  actualDistanceKm: number;
  imagesCaptured: number;
  videoRecordedMinutes: number;
  averageSpeed: number;
  maxAltitude: number;
  batteryUsage: number;
  weatherConditions: WeatherCondition;
  incidents: FlightIncident[];
  gpsTrack: GPSPoint[];
  imageMetadata: CapturedImageMetadata[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeatherCondition {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  visibility: number;
  cloudCover: number;
  precipitation: number;
}

export interface FlightIncident {
  id: string;
  type: 'low_battery' | 'high_wind' | 'obstacle_detected' | 'signal_loss' | 'geofence_breach' | 'emergency_landing' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  resolution: string;
  resolvedBy?: string;
}

export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: Date;
  speed: number;
  heading: number;
  batteryLevel: number;
}

export interface CapturedImageMetadata {
  id: string;
  fileName: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  gimbalPitch: number;
  focalLength: number;
  exposureTime: number;
  iso: number;
  gpsAccuracy: number;
  cloudCover?: number;
  fileSize: number;
  resolution: string;
}

export interface CropScan {
  id: string;
  scanNumber: string;
  fieldId: string;
  flightRecordId: string;
  date: Date;
  scanType: ScanType;
  imageCount: number;
  totalAreaCovered: number;
  resolution: number;
  ndviMap?: string;
  healthAnalysis?: CropHealthAnalysis;
  anomalies: CropAnomaly[];
  recommendations: string[];
  generatedAt: Date;
}

export interface CropHealthAnalysis {
  overallScore: number;
  healthyPercentage: number;
  stressedPercentage: number;
  diseasedPercentage: number;
  deadPercentage: number;
  zones: { id: string; name: string; health: number; status: string; area: number }[];
  issuesFound: number;
  treatmentRecommendations: string[];
}

export interface CropAnomaly {
  id: string;
  type: 'nutrient_deficiency' | 'pest_damage' | 'disease' | 'water_stress' | 'weed_infestation' | 'mechanical_damage' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lng: number };
  area: number;
  confidence: number;
  description: string;
  treatmentSuggestion: string;
  detectedAt: Date;
}

export interface DroneFleetStats {
  totalDrones: number;
  available: number;
  inFlight: number;
  charging: number;
  inMaintenance: number;
  totalFlightHours: number;
  totalFlights: number;
  totalImagesCaptured: number;
  averageFlightDuration: number;
  fleetUtilization: number;
  upcomingFlights: FlightPlan[];
  recentFlights: FlightRecord[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class DroneService {
  private drones: Map<string, Drone> = new Map();
  private flightPlans: Map<string, FlightPlan> = new Map();
  private flightRecords: Map<string, FlightRecord> = new Map();
  private cropScans: Map<string, CropScan> = new Map();

  // ── Drone Management ─────────────────────────────────────────────────────

  async registerDrone(data: Omit<Drone, 'id' | 'createdAt' | 'updatedAt' | 'totalFlightHours' | 'totalFlights'>): Promise<Drone> {
    const now = new Date();
    const drone: Drone = {
      ...data,
      id: randomUUID(),
      totalFlightHours: 0,
      totalFlights: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.drones.set(drone.id, drone);
    return drone;
  }

  async updateDrone(id: string, updates: Partial<Drone>): Promise<Drone> {
    const existing = this.drones.get(id);
    if (!existing) throw new Error(`Drone ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.drones.set(id, updated);
    return updated;
  }

  async getDrone(id: string): Promise<Drone | undefined> {
    return this.drones.get(id);
  }

  async listDrones(status?: DroneStatus): Promise<Drone[]> {
    let results = Array.from(this.drones.values());
    if (status) results = results.filter((d) => d.status === status);
    return results;
  }

  async updateDroneStatus(id: string, status: DroneStatus, location?: { lat: number; lng: number; altitude: number }): Promise<Drone> {
    const drone = this.drones.get(id);
    if (!drone) throw new Error(`Drone ${id} not found`);
    drone.status = status;
    if (location) drone.location = location;
    drone.updatedAt = new Date();
    this.drones.set(id, drone);
    return drone;
  }

  async updateBattery(id: string, level: number): Promise<Drone> {
    const drone = this.drones.get(id);
    if (!drone) throw new Error(`Drone ${id} not found`);
    drone.batteryLevel = Math.max(0, Math.min(100, level));
    drone.updatedAt = new Date();
    this.drones.set(id, drone);
    return drone;
  }

  // ── Flight Planning ──────────────────────────────────────────────────────

  async createFlightPlan(data: Omit<FlightPlan, 'id' | 'planNumber' | 'status' | 'createdAt' | 'updatedAt'>): Promise<FlightPlan> {
    const now = new Date();
    const planNumber = `FP-${now.getFullYear()}-${String(this.flightPlans.size + 1).padStart(6, '0')}`;
    const plan: FlightPlan = { ...data, id: randomUUID(), planNumber, status: 'planned', createdAt: now, updatedAt: now };
    this.flightPlans.set(plan.id, plan);
    return plan;
  }

  async updateFlightPlan(id: string, updates: Partial<FlightPlan>): Promise<FlightPlan> {
    const existing = this.flightPlans.get(id);
    if (!existing) throw new Error(`Flight plan ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.flightPlans.set(id, updated);
    return updated;
  }

  async generateGridWaypoints(bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } }, altitude: number, overlapPercent: number): Promise<Waypoint[]> {
    const waypoints: Waypoint[] = [];
    const latRange = bounds.northEast.lat - bounds.southWest.lat;
    const lngRange = bounds.northEast.lng - bounds.southWest.lng;
    const stepLat = latRange * (1 - overlapPercent / 100) * 0.8;
    const stepLng = lngRange * (1 - overlapPercent / 100) * 0.8;

    let seq = 0;
    let lat = bounds.southWest.lat;
    let direction = 1;

    while (lat <= bounds.northEast.lat) {
      const lngs = direction > 0
        ? [bounds.southWest.lng, bounds.northEast.lng]
        : [bounds.northEast.lng, bounds.southWest.lng];

      for (const lng of lngs) {
        waypoints.push({
          id: randomUUID(),
          sequence: seq++,
          latitude: lat,
          longitude: lng,
          altitude,
          speed: 8,
          heading: direction > 0 ? 90 : 270,
          gimbalPitch: -90,
          action: { type: 'take_photo', parameters: {} },
          waitTime: 0,
        });
      }
      lat += stepLat;
      direction *= -1;
    }

    return waypoints;
  }

  async generateCircularWaypoints(center: { lat: number; lng: number }, radiusKm: number, altitude: number, points: number = 12): Promise<Waypoint[]> {
    const waypoints: Waypoint[] = [];
    const kmToDeg = 1 / 111.32;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const lat = center.lat + (radiusKm * kmToDeg) * Math.sin(angle);
      const lng = center.lng + (radiusKm * kmToDeg * Math.cos(center.lat * Math.PI / 180)) * Math.cos(angle);
      waypoints.push({
        id: randomUUID(),
        sequence: i,
        latitude: lat,
        longitude: lng,
        altitude,
        speed: 8,
        heading: (angle * 180 / Math.PI + 90) % 360,
        gimbalPitch: -90,
        action: { type: 'take_photo', parameters: {} },
        waitTime: 0,
      });
    }
    return waypoints;
  }

  async estimateFlightMetrics(waypoints: Waypoint[], speed: number): Promise<{
    durationMinutes: number;
    distanceKm: number;
    estimatedImages: number;
    batteryRequired: number;
  }> {
    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const dlat = waypoints[i].latitude - waypoints[i - 1].latitude;
      const dlng = waypoints[i].longitude - waypoints[i - 1].longitude;
      totalDistance += Math.sqrt(dlat * dlat + dlng * dlng) * 111.32;
    }

    const durationMinutes = (totalDistance / speed) * 60;
    const estimatedImages = Math.ceil(totalDistance / 0.05);
    const batteryRequired = Math.min(100, (durationMinutes / 30) * 100);

    return {
      durationMinutes: Math.round(durationMinutes),
      distanceKm: Math.round(totalDistance * 100) / 100,
      estimatedImages,
      batteryRequired: Math.round(batteryRequired),
    };
  }

  async getFlightPlans(fieldId?: string): Promise<FlightPlan[]> {
    let plans = Array.from(this.flightPlans.values());
    if (fieldId) plans = plans.filter((p) => p.fieldId === fieldId);
    return plans.sort((a, b) => b.scheduledStart.getTime() - a.scheduledStart.getTime());
  }

  // ── Flight Execution ─────────────────────────────────────────────────────

  async startFlight(planId: string, pilotId: string, pilotName: string): Promise<FlightRecord> {
    const plan = this.flightPlans.get(planId);
    if (!plan) throw new Error(`Flight plan ${planId} not found`);
    if (plan.status !== 'planned') throw new Error('Flight plan is not in planned status');

    const drone = this.drones.get(plan.droneId);
    if (!drone) throw new Error(`Drone ${plan.droneId} not found`);
    if (drone.status !== 'available') throw new Error('Drone is not available');
    if (drone.batteryLevel < 30) throw new Error('Insufficient battery level');

    const now = new Date();
    plan.status = 'active';
    plan.updatedAt = now;
    this.flightPlans.set(planId, plan);

    drone.status = 'in_flight';
    drone.lastFlightDate = now;
    drone.totalFlights++;
    this.drones.set(plan.droneId, drone);

    const flightRecord: FlightRecord = {
      id: randomUUID(),
      flightNumber: `FL-${now.getFullYear()}-${String(this.flightRecords.size + 1).padStart(6, '0')}`,
      planId,
      droneId: plan.droneId,
      droneName: plan.droneName,
      fieldId: plan.fieldId,
      pilotId,
      pilotName,
      status: 'active',
      startTime: now,
      actualDurationMinutes: 0,
      actualDistanceKm: 0,
      imagesCaptured: 0,
      videoRecordedMinutes: 0,
      averageSpeed: 0,
      maxAltitude: plan.altitude,
      batteryUsage: 0,
      weatherConditions: { temperature: 22, windSpeed: 12, windDirection: 180, humidity: 55, visibility: 10, cloudCover: 20, precipitation: 0 },
      incidents: [],
      gpsTrack: [],
      imageMetadata: [],
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    this.flightRecords.set(flightRecord.id, flightRecord);
    return flightRecord;
  }

  async completeFlight(flightId: string, notes: string = ''): Promise<FlightRecord> {
    const record = this.flightRecords.get(flightId);
    if (!record) throw new Error(`Flight record ${flightId} not found`);

    const now = new Date();
    record.endTime = now;
    record.actualDurationMinutes = Math.round((now.getTime() - record.startTime.getTime()) / 60000);
    record.status = 'completed';
    record.notes = notes;
    record.updatedAt = now;
    this.flightRecords.set(flightId, record);

    const plan = this.flightPlans.get(record.planId);
    if (plan) {
      plan.status = 'completed';
      plan.updatedAt = now;
      this.flightPlans.set(plan.id, plan);
    }

    const drone = this.drones.get(record.droneId);
    if (drone) {
      drone.status = 'available';
      drone.batteryLevel = Math.max(10, drone.batteryLevel - record.batteryUsage);
      drone.totalFlightHours += record.actualDurationMinutes / 60;
      drone.updatedAt = now;
      this.drones.set(record.droneId, drone);
    }

    return record;
  }

  async abortFlight(flightId: string, reason: string): Promise<FlightRecord> {
    const record = this.flightRecords.get(flightId);
    if (!record) throw new Error(`Flight record ${flightId} not found`);

    const now = new Date();
    record.endTime = now;
    record.actualDurationMinutes = Math.round((now.getTime() - record.startTime.getTime()) / 60000);
    record.status = 'aborted';
    record.incidents.push({
      id: randomUUID(),
      type: 'emergency_landing',
      severity: 'high',
      description: reason,
      timestamp: now,
      resolution: 'Flight aborted',
    });
    record.updatedAt = now;
    this.flightRecords.set(flightId, record);

    const drone = this.drones.get(record.droneId);
    if (drone) {
      drone.status = 'available';
      drone.updatedAt = now;
      this.drones.set(record.droneId, drone);
    }

    return record;
  }

  async addGPSPoint(flightId: string, point: Omit<GPSPoint, 'timestamp'>): Promise<void> {
    const record = this.flightRecords.get(flightId);
    if (!record) throw new Error(`Flight record ${flightId} not found`);
    record.gpsTrack.push({ ...point, timestamp: new Date() });
    record.updatedAt = new Date();
    this.flightRecords.set(flightId, record);
  }

  async addCapturedImage(flightId: string, metadata: Omit<CapturedImageMetadata, 'id' | 'timestamp'>): Promise<CapturedImageMetadata> {
    const record = this.flightRecords.get(flightId);
    if (!record) throw new Error(`Flight record ${flightId} not found`);
    const image: CapturedImageMetadata = { ...metadata, id: randomUUID(), timestamp: new Date() };
    record.imageMetadata.push(image);
    record.imagesCaptured++;
    record.updatedAt = new Date();
    this.flightRecords.set(flightId, record);
    return image;
  }

  async addFlightIncident(flightId: string, incident: Omit<FlightIncident, 'id' | 'timestamp'>): Promise<FlightIncident> {
    const record = this.flightRecords.get(flightId);
    if (!record) throw new Error(`Flight record ${flightId} not found`);
    const inc: FlightIncident = { ...incident, id: randomUUID(), timestamp: new Date() };
    record.incidents.push(inc);
    record.updatedAt = new Date();
    this.flightRecords.set(flightId, record);
    return inc;
  }

  // ── Crop Scanning ────────────────────────────────────────────────────────

  async createCropScan(data: Omit<CropScan, 'id' | 'scanNumber' | 'generatedAt'>): Promise<CropScan> {
    const now = new Date();
    const scan: CropScan = {
      ...data,
      id: randomUUID(),
      scanNumber: `SCAN-${now.getFullYear()}-${String(this.cropScans.size + 1).padStart(6, '0')}`,
      generatedAt: now,
    };
    this.cropScans.set(scan.id, scan);
    return scan;
  }

  async analyzeCropScan(scanId: string): Promise<CropScan> {
    const scan = this.cropScans.get(scanId);
    if (!scan) throw new Error(`Crop scan ${scanId} not found`);

    const anomalies: CropAnomaly[] = [];
    const numAnomalies = Math.floor(Math.random() * 5);
    const anomalyTypes: CropAnomaly['type'][] = ['nutrient_deficiency', 'pest_damage', 'disease', 'water_stress', 'weed_infestation'];

    for (let i = 0; i < numAnomalies; i++) {
      anomalies.push({
        id: randomUUID(),
        type: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
        severity: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
        location: { lat: 38.5 + Math.random() * 0.1, lng: -98 + Math.random() * 0.1 },
        area: Math.round(Math.random() * 500 * 100) / 100,
        confidence: 0.7 + Math.random() * 0.3,
        description: `Anomaly detected at scan location`,
        treatmentSuggestion: 'Inspect area and apply targeted treatment',
        detectedAt: new Date(),
      });
    }

    scan.anomalies = anomalies;
    scan.healthAnalysis = {
      overallScore: 60 + Math.floor(Math.random() * 35),
      healthyPercentage: 50 + Math.floor(Math.random() * 40),
      stressedPercentage: 10 + Math.floor(Math.random() * 20),
      diseasedPercentage: Math.floor(Math.random() * 10),
      deadPercentage: Math.floor(Math.random() * 5),
      zones: [
        { id: randomUUID(), name: 'North Zone', health: 80, status: 'healthy', area: 5000 },
        { id: randomUUID(), name: 'South Zone', health: 65, status: 'stressed', area: 3000 },
        { id: randomUUID(), name: 'East Zone', health: 45, status: 'needs_attention', area: 2000 },
      ],
      issuesFound: anomalies.length,
      treatmentRecommendations: [
        'Apply nitrogen fertilizer to stressed zones',
        'Investigate pest damage in eastern section',
        'Improve irrigation coverage in low-moisture areas',
      ],
    };
    scan.recommendations = scan.healthAnalysis.treatmentRecommendations;

    this.cropScans.set(scanId, scan);
    return scan;
  }

  async getFieldScans(fieldId: string): Promise<CropScan[]> {
    return Array.from(this.cropScans.values())
      .filter((s) => s.fieldId === fieldId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // ── Flight Records ───────────────────────────────────────────────────────

  async getFlightRecord(id: string): Promise<FlightRecord | undefined> {
    return this.flightRecords.get(id);
  }

  async getDroneFlights(droneId: string, limit: number = 50): Promise<FlightRecord[]> {
    return Array.from(this.flightRecords.values())
      .filter((r) => r.droneId === droneId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // ── Fleet Stats ──────────────────────────────────────────────────────────

  async getFleetStats(): Promise<DroneFleetStats> {
    const drones = Array.from(this.drones.values());
    const records = Array.from(this.flightRecords.values());
    const upcoming = Array.from(this.flightPlans.values()).filter((p) => p.status === 'planned');
    const recent = records.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 10);

    return {
      totalDrones: drones.length,
      available: drones.filter((d) => d.status === 'available').length,
      inFlight: drones.filter((d) => d.status === 'in_flight').length,
      charging: drones.filter((d) => d.status === 'charging').length,
      inMaintenance: drones.filter((d) => d.status === 'maintenance').length,
      totalFlightHours: drones.reduce((s, d) => s + d.totalFlightHours, 0),
      totalFlights: records.length,
      totalImagesCaptured: records.reduce((s, r) => s + r.imagesCaptured, 0),
      averageFlightDuration: records.length ? records.reduce((s, r) => s + r.actualDurationMinutes, 0) / records.length : 0,
      fleetUtilization: drones.length > 0 ? Math.round((drones.filter((d) => d.status === 'in_flight').length / drones.length) * 100) : 0,
      upcomingFlights: upcoming,
      recentFlights: recent,
    };
  }
}
