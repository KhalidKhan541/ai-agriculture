"use client";

import { useState } from "react";
import {
  Wrench,
  Gauge,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck,
  Calendar,
  DollarSign,
  Tool,
  BarChart3,
  Battery,
  Fuel,
  Search,
  Filter,
  Plus,
  FileText,
  ArrowRight,
  Cog,
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string;
  make: string;
  model: string;
  year: number;
  status: "operational" | "maintenance" | "idle" | "repair";
  hours: number;
  fuelLevel: number;
  location: string;
  lastService: string;
  nextService: string;
  value: number;
  utilization: number;
}

interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: "scheduled" | "repair" | "inspection";
  description: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  estimatedCost: number;
  status: "pending" | "in-progress" | "completed";
  technician: string;
}

interface MaintenanceLog {
  id: string;
  date: string;
  equipment: string;
  type: string;
  description: string;
  cost: number;
  technician: string;
}

const equipmentList: Equipment[] = [
  { id: "e1", name: "Tractor #1", type: "Tractor", make: "John Deere", model: "8R 410", year: 2023, status: "operational", hours: 1245, fuelLevel: 82, location: "North Field", lastService: "Aug 15, 2026", nextService: "Oct 15, 2026", value: 385000, utilization: 78 },
  { id: "e2", name: "Combine #1", type: "Combine", make: "John Deere", model: "S780", year: 2022, status: "operational", hours: 892, fuelLevel: 65, location: "South Field", lastService: "Jul 20, 2026", nextService: "Sep 20, 2026", value: 520000, utilization: 92 },
  { id: "e3", name: "Sprayer #1", type: "Sprayer", make: "Case IH", model: "Magnum 340", year: 2021, status: "maintenance", hours: 678, fuelLevel: 45, location: "Workshop", lastService: "Sep 1, 2026", nextService: "Sep 10, 2026", value: 280000, utilization: 0 },
  { id: "e4", name: "Tractor #2", type: "Tractor", make: "John Deere", model: "6R 230", year: 2024, status: "operational", hours: 456, fuelLevel: 91, location: "East Field", lastService: "Aug 25, 2026", nextService: "Oct 25, 2026", value: 245000, utilization: 65 },
  { id: "e5", name: "Truck #1", type: "Truck", make: "Ford", model: "F-350", year: 2023, status: "idle", hours: 3200, fuelLevel: 38, location: "Farm Yard", lastService: "Jul 10, 2026", nextService: "Sep 10, 2026", value: 65000, utilization: 12 },
  { id: "e6", name: "Irrigation Pump", type: "Pump", make: "Valley", model: "8120", year: 2020, status: "operational", hours: 4520, fuelLevel: 100, location: "South Field", lastService: "Jun 15, 2026", nextService: "Dec 15, 2026", value: 45000, utilization: 55 },
  { id: "e7", name: "Grain Cart", type: "Cart", make: "Brent", model: "1596", year: 2022, status: "operational", hours: 340, fuelLevel: 100, location: "North Field", lastService: "Aug 1, 2026", nextService: "Nov 1, 2026", value: 85000, utilization: 88 },
];

const maintenanceTasks: MaintenanceTask[] = [
  { id: "mt1", equipmentId: "e3", equipmentName: "Sprayer #1", type: "repair", description: "Nozzle replacement and boom inspection", dueDate: "Sep 10, 2026", priority: "high", estimatedCost: 1200, status: "in-progress", technician: "Mike Johnson" },
  { id: "mt2", equipmentId: "e5", equipmentName: "Truck #1", type: "scheduled", description: "5000-mile service: oil change, filters, tire rotation", dueDate: "Sep 15, 2026", priority: "medium", estimatedCost: 850, status: "pending", technician: "Mike Johnson" },
  { id: "mt3", equipmentId: "e1", equipmentName: "Tractor #1", type: "inspection", description: "Pre-harvest safety inspection", dueDate: "Sep 12, 2026", priority: "medium", estimatedCost: 200, status: "pending", technician: "Sarah Chen" },
  { id: "mt4", equipmentId: "e2", equipmentName: "Combine #1", type: "scheduled", description: "Threshing component calibration", dueDate: "Sep 20, 2026", priority: "high", estimatedCost: 3500, status: "pending", technician: "Mike Johnson" },
];

const maintenanceLogs: MaintenanceLog[] = [
  { id: "ml1", date: "Sep 1, 2026", equipment: "Sprayer #1", type: "Repair", description: "Replaced broken hydraulic line on boom", cost: 450, technician: "Mike Johnson" },
  { id: "ml2", date: "Aug 25, 2026", equipment: "Tractor #2", type: "Scheduled", description: "300-hour service: oil, filters, grease points", cost: 620, technician: "Sarah Chen" },
  { id: "ml3", date: "Aug 15, 2026", equipment: "Tractor #1", type: "Scheduled", description: "500-hour service complete", cost: 780, technician: "Mike Johnson" },
  { id: "ml4", date: "Aug 10, 2026", equipment: "Combine #1", type: "Inspection", description: "Pre-season header inspection", cost: 150, technician: "Sarah Chen" },
];

export default function EquipmentPage() {
  const [filter, setFilter] = useState<"all" | "operational" | "maintenance" | "idle" | "repair">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEquipment = equipmentList.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase()) && !e.make.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "badge-green";
      case "maintenance": return "badge-yellow";
      case "idle": return "badge-blue";
      case "repair": return "badge-red";
      default: return "badge-blue";
    }
  };

  const totalValue = equipmentList.reduce((sum, e) => sum + e.value, 0);
  const operationalCount = equipmentList.filter((e) => e.status === "operational").length;
  const avgUtilization = Math.round(equipmentList.filter((e) => e.status === "operational").reduce((sum, e) => sum + e.utilization, 0) / operationalCount);
  const pendingTasks = maintenanceTasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-sm text-gray-500">Track, maintain, and optimize your farm equipment fleet</p>
        </div>
        <button className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{operationalCount}/{equipmentList.length}</p>
            <p className="text-xs text-gray-500">Operational</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{avgUtilization}%</p>
            <p className="text-xs text-gray-500">Avg. Utilization</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
            <Wrench className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
            <p className="text-xs text-gray-500">Pending Services</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">${(totalValue / 1000).toFixed(0)}k</p>
            <p className="text-xs text-gray-500">Fleet Value</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Fleet Overview</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search equipment..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-9" />
            </div>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {(["all", "operational", "maintenance", "idle"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEquipment.map((eq) => (
            <div key={eq.id} className="rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                    <Truck className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{eq.name}</p>
                    <p className="text-xs text-gray-500">{eq.year} {eq.make} {eq.model}</p>
                  </div>
                </div>
                <span className={getStatusColor(eq.status)}>{eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{eq.hours.toLocaleString()} hrs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="h-3.5 w-3.5 text-gray-400" />
                  <div className="flex-1">
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div className={`h-1.5 rounded-full ${eq.fuelLevel > 50 ? "bg-green-500" : eq.fuelLevel > 25 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${eq.fuelLevel}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{eq.fuelLevel}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{eq.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{eq.utilization}% used</span>
                </div>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last: {eq.lastService}</span>
                  <span>Next: {eq.nextService}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming Maintenance</h3>
            <button className="text-sm font-medium text-green-600 hover:text-green-700">+ Schedule</button>
          </div>
          <div className="space-y-3">
            {maintenanceTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${task.priority === "high" ? "bg-red-100" : task.priority === "medium" ? "bg-yellow-100" : "bg-gray-100"}`}>
                  <Wrench className={`h-5 w-5 ${task.priority === "high" ? "text-red-600" : task.priority === "medium" ? "text-yellow-600" : "text-gray-600"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.equipmentName}</p>
                  <p className="text-xs text-gray-500">{task.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{task.dueDate}</span>
                    <span>Est: ${task.estimatedCost.toLocaleString()}</span>
                    <span>{task.technician}</span>
                  </div>
                </div>
                <span className={task.status === "completed" ? "badge-green" : task.status === "in-progress" ? "badge-blue" : "badge-yellow"}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Recent Maintenance History</h3>
            <button className="text-sm font-medium text-green-600 hover:text-green-700">View All</button>
          </div>
          <div className="space-y-3">
            {maintenanceLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{log.equipment} - {log.type}</p>
                  <p className="text-xs text-gray-500">{log.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{log.date}</span>
                    <span>${log.cost.toLocaleString()}</span>
                    <span>{log.technician}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
