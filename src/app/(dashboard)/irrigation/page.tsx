"use client";

import { useState } from "react";
import {
  Droplets,
  Clock,
  MapPin,
  Play,
  Pause,
  Settings,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Timer,
  Zap,
  Gauge,
  BarChart3,
  Calendar,
  Power,
  PowerOff,
} from "lucide-react";

interface IrrigationZone {
  id: string;
  name: string;
  area: string;
  status: "active" | "inactive" | "scheduled" | "maintenance";
  moisture: number;
  targetMoisture: number;
  flowRate: number;
  lastRun: string;
  nextScheduled: string;
  waterUsed: number;
  cropType: string;
}

interface WaterUsage {
  date: string;
  amount: number;
}

const zones: IrrigationZone[] = [
  { id: "z1", name: "North Field - Corn", area: "45 acres", status: "active", moisture: 62, targetMoisture: 65, flowRate: 12.5, lastRun: "2 hours ago", nextScheduled: "Today 4:00 PM", waterUsed: 1250, cropType: "Corn" },
  { id: "z2", name: "South Field - Soybeans", area: "38 acres", status: "scheduled", moisture: 48, targetMoisture: 60, flowRate: 10.2, lastRun: "Yesterday 6:00 AM", nextScheduled: "Today 6:00 AM", waterUsed: 980, cropType: "Soybeans" },
  { id: "z3", name: "East Orchard - Apples", area: "12 acres", status: "active", moisture: 55, targetMoisture: 58, flowRate: 8.8, lastRun: "30 min ago", nextScheduled: "Today 2:00 PM", waterUsed: 420, cropType: "Apples" },
  { id: "z4", name: "West Vineyard", area: "8 acres", status: "inactive", moisture: 71, targetMoisture: 65, flowRate: 0, lastRun: "3 days ago", nextScheduled: "When needed", waterUsed: 310, cropType: "Grapes" },
  { id: "z5", name: "Greenhouse Section A", area: "0.5 acres", status: "active", moisture: 58, targetMoisture: 60, flowRate: 2.1, lastRun: "1 hour ago", nextScheduled: "Today 5:00 PM", waterUsed: 85, cropType: "Tomatoes" },
  { id: "z6", name: "Greenhouse Section B", area: "0.5 acres", status: "maintenance", moisture: 42, targetMoisture: 60, flowRate: 0, lastRun: "2 days ago", nextScheduled: "Pending repair", waterUsed: 72, cropType: "Peppers" },
];

const weeklyUsage: WaterUsage[] = [
  { date: "Mon", amount: 3800 },
  { date: "Tue", amount: 4200 },
  { date: "Wed", amount: 3500 },
  { date: "Thu", amount: 4800 },
  { date: "Fri", amount: 4100 },
  { date: "Sat", amount: 3200 },
  { date: "Sun", amount: 2900 },
];

const scheduleSlots = [
  { time: "5:00 AM", zone: "South Field - Soybeans", duration: "45 min", status: "completed" },
  { time: "6:00 AM", zone: "East Orchard - Apples", duration: "30 min", status: "completed" },
  { time: "2:00 PM", zone: "North Field - Corn", duration: "60 min", status: "scheduled" },
  { time: "4:00 PM", zone: "Greenhouse Section A", duration: "20 min", status: "scheduled" },
  { time: "6:00 PM", zone: "North Field - Corn", duration: "30 min", status: "scheduled" },
];

const maxUsage = Math.max(...weeklyUsage.map((d) => d.amount));

export default function IrrigationPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({ z1: true, z3: true, z5: true });

  const totalWaterUsed = zones.reduce((sum, z) => sum + z.waterUsed, 0);
  const activeZones = zones.filter((z) => z.status === "active").length;
  const avgMoisture = Math.round(zones.filter((z) => z.status !== "maintenance").reduce((sum, z) => sum + z.moisture, 0) / zones.filter((z) => z.status !== "maintenance").length);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "badge-green";
      case "scheduled": return "badge-blue";
      case "inactive": return "badge-yellow";
      case "maintenance": return "badge-red";
      default: return "badge-blue";
    }
  };

  const getMoistureColor = (current: number, target: number) => {
    if (current >= target) return "text-green-600";
    if (current >= target - 10) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Irrigation Management</h1>
          <p className="text-sm text-gray-500">Monitor and control your smart irrigation system</p>
        </div>
        <button className="btn-primary">
          <Settings className="mr-2 h-4 w-4" />
          System Settings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <Droplets className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{(totalWaterUsed / 1000).toFixed(1)}k</p>
            <p className="text-xs text-gray-500">Gallons Today</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <Power className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeZones}/{zones.length}</p>
            <p className="text-xs text-gray-500">Active Zones</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
            <Gauge className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{avgMoisture}%</p>
            <p className="text-xs text-gray-500">Avg. Soil Moisture</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
            <Timer className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">4.2h</p>
            <p className="text-xs text-gray-500">Total Runtime Today</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Irrigation Zones</h3>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-600"><span className="h-2 w-2 rounded-full bg-green-500" /> Active</span>
            <span className="flex items-center gap-1 text-xs text-blue-600"><span className="h-2 w-2 rounded-full bg-blue-500" /> Scheduled</span>
            <span className="flex items-center gap-1 text-xs text-yellow-600"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Inactive</span>
            <span className="flex items-center gap-1 text-xs text-red-600"><span className="h-2 w-2 rounded-full bg-red-500" /> Maintenance</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase text-gray-500">
                <th className="pb-3 pr-4">Zone</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Moisture</th>
                <th className="hidden pb-3 pr-4 md:table-cell">Flow Rate</th>
                <th className="hidden pb-3 pr-4 lg:table-cell">Water Used</th>
                <th className="hidden pb-3 pr-4 lg:table-cell">Last Run</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50" onClick={() => setSelectedZone(zone.id)}>
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-gray-900">{zone.name}</p>
                      <p className="text-xs text-gray-500">{zone.area} &middot; {zone.cropType}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={getStatusColor(zone.status)}>
                      {zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${zone.moisture >= zone.targetMoisture ? "bg-green-500" : zone.moisture >= zone.targetMoisture - 10 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(zone.moisture, 100)}%` }} />
                      </div>
                      <span className={`text-sm font-medium ${getMoistureColor(zone.moisture, zone.targetMoisture)}`}>{zone.moisture}%</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">Target: {zone.targetMoisture}%</p>
                  </td>
                  <td className="hidden py-3 pr-4 md:table-cell">
                    <span className="text-sm font-medium text-gray-900">{zone.flowRate > 0 ? `${zone.flowRate} GPM` : "---"}</span>
                  </td>
                  <td className="hidden py-3 pr-4 lg:table-cell">
                    <span className="text-sm font-medium text-gray-900">{zone.waterUsed} gal</span>
                  </td>
                  <td className="hidden py-3 pr-4 lg:table-cell">
                    <span className="text-sm text-gray-500">{zone.lastRun}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {zone.status === "maintenance" ? (
                        <button disabled className="rounded-lg p-1.5 text-gray-300">
                          <Power className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsRunning((prev) => ({ ...prev, [zone.id]: !prev[zone.id] })); }}
                          className={`rounded-lg p-1.5 transition-colors ${isRunning[zone.id] ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                        >
                          {isRunning[zone.id] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Schedule</h3>
            <button className="text-sm font-medium text-green-600 hover:text-green-700">+ Add Task</button>
          </div>
          <div className="space-y-3">
            {scheduleSlots.map((slot, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${slot.status === "completed" ? "bg-green-100" : "bg-blue-100"}`}>
                  {slot.status === "completed" ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{slot.zone}</p>
                  <p className="text-xs text-gray-500">{slot.time} &middot; {slot.duration}</p>
                </div>
                <span className={slot.status === "completed" ? "badge-green" : "badge-blue"}>
                  {slot.status === "completed" ? "Done" : "Upcoming"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Weekly Water Usage</h3>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingDown className="h-4 w-4" />
              <span>-8% vs last week</span>
            </div>
          </div>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {weeklyUsage.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{day.amount.toLocaleString()}</span>
                <div className="w-full rounded-t-md bg-blue-500 transition-all" style={{ height: `${(day.amount / maxUsage) * 100}%` }} />
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-xs text-gray-500">This Week</p>
              <p className="text-sm font-semibold">{(weeklyUsage.reduce((s, d) => s + d.amount, 0) / 1000).toFixed(1)}k gal</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-xs text-gray-500">Daily Avg</p>
              <p className="text-sm font-semibold">{Math.round(weeklyUsage.reduce((s, d) => s + d.amount, 0) / 7).toLocaleString()} gal</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-xs text-gray-500">Peak Day</p>
              <p className="text-sm font-semibold">{Math.max(...weeklyUsage.map((d) => d.amount)).toLocaleString()} gal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-900">System Alerts</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <PowerOff className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Greenhouse B - Valve Fault</p>
              <p className="text-xs text-red-600">Zone Z6 valve not responding. Maintenance scheduled for tomorrow.</p>
            </div>
            <span className="badge-red">Urgent</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <Zap className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Low Water Pressure Detected</p>
              <p className="text-xs text-yellow-600">East Orchard pressure dropped below threshold. Checking supply line.</p>
            </div>
            <span className="badge-yellow">Warning</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Water Budget Alert</p>
              <p className="text-xs text-blue-600">You&apos;ve used 78% of your monthly water allocation. Consider adjusting schedules.</p>
            </div>
            <span className="badge-blue">Info</span>
          </div>
        </div>
      </div>
    </div>
  );
}
