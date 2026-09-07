"use client";

import { useState } from "react";
import {
  Plane,
  Battery,
  Clock,
  MapPin,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Camera,
  Route,
  Gauge,
  Wind,
  Thermometer,
  Signal,
  Eye,
  Download,
  Calendar,
  Settings,
  BarChart3,
} from "lucide-react";

interface Drone {
  id: string;
  name: string;
  model: string;
  status: "ready" | "flying" | "charging" | "maintenance";
  batteryLevel: number;
  lastFlight: string;
  totalFlights: number;
  totalHours: number;
  location: string;
  signalStrength: number;
}

interface FlightMission {
  id: string;
  droneId: string;
  droneName: string;
  type: "mapping" | "spraying" | "inspection" | "scouting";
  field: string;
  scheduledTime: string;
  duration: string;
  status: "completed" | "in-progress" | "scheduled" | "aborted";
  coverage: number;
  area: string;
  imagesCaptured: number;
}

interface FlightLog {
  id: string;
  date: string;
  drone: string;
  mission: string;
  field: string;
  duration: string;
  distance: string;
  images: number;
  area: string;
}

const drones: Drone[] = [
  { id: "d1", name: "Eagle Eye 1", model: "DJI Agras T40", status: "flying", batteryLevel: 68, lastFlight: "Now", totalFlights: 245, totalHours: 312, location: "North Field - In Flight", signalStrength: 92 },
  { id: "d2", name: "Scout Pro", model: "DJI Mavic 3M", status: "ready", batteryLevel: 100, lastFlight: "2 hours ago", totalFlights: 189, totalHours: 156, location: "Farm Yard", signalStrength: 100 },
  { id: "d3", name: "Sky Mapper", model: " senseFly eBee X", status: "charging", batteryLevel: 35, lastFlight: "3 hours ago", totalFlights: 87, totalHours: 98, location: "Charging Station", signalStrength: 0 },
  { id: "d4", name: "Heavy Lifter", model: "DJI Agras T20", status: "maintenance", batteryLevel: 0, lastFlight: "Yesterday", totalFlights: 312, totalHours: 445, location: "Workshop", signalStrength: 0 },
];

const missions: FlightMission[] = [
  { id: "m1", droneId: "d1", droneName: "Eagle Eye 1", type: "scouting", field: "North Field - Corn", scheduledTime: "Now", duration: "45 min", status: "in-progress", coverage: 65, area: "45 acres", imagesCaptured: 234 },
  { id: "m2", droneId: "d2", droneName: "Scout Pro", type: "mapping", field: "South Field - Soybeans", scheduledTime: "2:00 PM", duration: "30 min", status: "scheduled", coverage: 0, area: "38 acres", imagesCaptured: 0 },
  { id: "m3", droneId: "d3", droneName: "Sky Mapper", type: "mapping", field: "East Orchard", scheduledTime: "10:00 AM", duration: "20 min", status: "completed", coverage: 100, area: "12 acres", imagesCaptured: 456 },
  { id: "m4", droneId: "d1", droneName: "Eagle Eye 1", type: "spraying", field: "North Field - Corn", scheduledTime: "6:00 AM", duration: "55 min", status: "completed", coverage: 100, area: "45 acres", imagesCaptured: 0 },
  { id: "m5", droneId: "d4", droneName: "Heavy Lifter", type: "spraying", field: "West Vineyard", scheduledTime: "8:00 AM", duration: "25 min", status: "aborted", coverage: 40, area: "8 acres", imagesCaptured: 0 },
];

const flightLogs: FlightLog[] = [
  { id: "fl1", date: "Sep 7, 6:00 AM", drone: "Eagle Eye 1", mission: "Spraying", field: "North Field", duration: "55 min", distance: "12.4 mi", images: 0, area: "45 acres" },
  { id: "fl2", date: "Sep 7, 10:00 AM", drone: "Sky Mapper", mission: "Mapping", field: "East Orchard", duration: "20 min", distance: "3.2 mi", images: 456, area: "12 acres" },
  { id: "fl3", date: "Sep 6, 7:00 AM", drone: "Eagle Eye 1", mission: "Scouting", field: "South Field", duration: "40 min", distance: "8.8 mi", images: 312, area: "38 acres" },
  { id: "fl4", date: "Sep 6, 2:00 PM", drone: "Scout Pro", mission: "Inspection", field: "Greenhouse", duration: "15 min", distance: "1.5 mi", images: 128, area: "1 acre" },
  { id: "fl5", date: "Sep 5, 8:00 AM", drone: "Heavy Lifter", mission: "Spraying", field: "West Vineyard", duration: "25 min", distance: "4.2 mi", images: 0, area: "8 acres" },
];

export default function DronesPage() {
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);

  const activeDrones = drones.filter((d) => d.status === "flying").length;
  const totalFlights = drones.reduce((sum, d) => sum + d.totalFlights, 0);
  const totalHours = drones.reduce((sum, d) => sum + d.totalHours, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "badge-green";
      case "flying": return "badge-blue";
      case "charging": return "badge-yellow";
      case "maintenance": return "badge-red";
      default: return "badge-blue";
    }
  };

  const getMissionStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "badge-green";
      case "in-progress": return "badge-blue";
      case "scheduled": return "badge-yellow";
      case "aborted": return "badge-red";
      default: return "badge-blue";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drone Fleet Management</h1>
          <p className="text-sm text-gray-500">Monitor drone operations, flight missions, and aerial data collection</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Route className="mr-2 h-4 w-4" />
            Plan Mission
          </button>
          <button className="btn-primary">
            <Plane className="mr-2 h-4 w-4" />
            Launch Drone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <Plane className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeDrones}/{drones.length}</p>
            <p className="text-xs text-gray-500">Drones Active</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalFlights}</p>
            <p className="text-xs text-gray-500">Total Flights</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
            <p className="text-xs text-gray-500">Flight Hours</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">1,130</p>
            <p className="text-xs text-gray-500">Images Today</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Fleet Status</h3>
          <div className="space-y-4">
            {drones.map((drone) => (
              <div key={drone.id} className={`rounded-xl border p-4 transition-all ${selectedDrone === drone.id ? "border-green-300 bg-green-50" : "border-gray-100 hover:border-gray-200"}`} onClick={() => setSelectedDrone(drone.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${drone.status === "flying" ? "bg-blue-100" : drone.status === "ready" ? "bg-green-100" : drone.status === "charging" ? "bg-yellow-100" : "bg-gray-100"}`}>
                      <Plane className={`h-6 w-6 ${drone.status === "flying" ? "text-blue-600" : drone.status === "ready" ? "text-green-600" : drone.status === "charging" ? "text-yellow-600" : "text-gray-600"}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{drone.name}</p>
                      <p className="text-xs text-gray-500">{drone.model}</p>
                    </div>
                  </div>
                  <span className={getStatusColor(drone.status)}>{drone.status.charAt(0).toUpperCase() + drone.status.slice(1)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Battery className={`h-4 w-4 ${drone.batteryLevel > 50 ? "text-green-500" : drone.batteryLevel > 20 ? "text-yellow-500" : "text-red-500"}`} />
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${drone.batteryLevel > 50 ? "bg-green-500" : drone.batteryLevel > 20 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${drone.batteryLevel}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">{drone.batteryLevel}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Signal className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{drone.signalStrength > 0 ? `${drone.signalStrength}%` : "N/A"}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>{drone.totalFlights} flights</span>
                  <span>{drone.totalHours}h total</span>
                  <span>{drone.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Mission Status</h3>
          <div className="space-y-3">
            {missions.map((mission) => (
              <div key={mission.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{mission.droneName}</p>
                      <span className={getMissionStatusColor(mission.status)}>
                        {mission.status.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{mission.field}</p>
                  </div>
                  <span className="badge-blue">{mission.type.charAt(0).toUpperCase() + mission.type.slice(1)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 sm:grid-cols-4">
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{mission.duration}</div>
                  <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{mission.area}</div>
                  <div className="flex items-center gap-1"><Camera className="h-3 w-3" />{mission.imagesCaptured} images</div>
                  <div className="flex items-center gap-1"><Gauge className="h-3 w-3" />{mission.coverage}% coverage</div>
                </div>
                {mission.status === "in-progress" && (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${mission.coverage}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{mission.coverage}% complete</p>
                  </div>
                )}
                {mission.status === "aborted" && (
                  <div className="mt-2 rounded-lg bg-red-50 p-2">
                    <p className="text-xs text-red-600">Mission aborted - Low battery. Rescheduled for tomorrow.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recent Flight Logs</h3>
          <button className="text-sm font-medium text-green-600 hover:text-green-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase text-gray-500">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Drone</th>
                <th className="pb-3 pr-4">Mission</th>
                <th className="hidden pb-3 pr-4 sm:table-cell">Field</th>
                <th className="hidden pb-3 pr-4 md:table-cell">Duration</th>
                <th className="hidden pb-3 pr-4 md:table-cell">Distance</th>
                <th className="hidden pb-3 pr-4 lg:table-cell">Images</th>
                <th className="pb-3">Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {flightLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 text-gray-600">{log.date}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{log.drone}</td>
                  <td className="py-3 pr-4 text-gray-600">{log.mission}</td>
                  <td className="hidden py-3 pr-4 sm:table-cell text-gray-600">{log.field}</td>
                  <td className="hidden py-3 pr-4 md:table-cell text-gray-600">{log.duration}</td>
                  <td className="hidden py-3 pr-4 md:table-cell text-gray-600">{log.distance}</td>
                  <td className="hidden py-3 pr-4 lg:table-cell text-gray-600">{log.images || "---"}</td>
                  <td className="py-3 text-gray-600">{log.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
