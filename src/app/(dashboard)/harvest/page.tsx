"use client";

import { useState } from "react";
import {
  Wheat,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Truck,
  Package,
  BarChart3,
  Target,
  DollarSign,
  ArrowRight,
  FileText,
  Filter,
} from "lucide-react";

interface HarvestTask {
  id: string;
  crop: string;
  field: string;
  acres: number;
  estimatedYield: number;
  actualYield: number | null;
  status: "pending" | "in-progress" | "completed" | "delayed";
  scheduledDate: string;
  completedDate: string | null;
  equipment: string;
  moistureContent: number;
  quality: "A" | "B" | "C" | null;
}

interface HarvestLog {
  id: string;
  date: string;
  crop: string;
  field: string;
  quantity: number;
  unit: string;
  truckId: string;
  destination: string;
  moisture: number;
  notes: string;
}

interface CropSummary {
  crop: string;
  totalAcres: number;
  harvestedAcres: number;
  estimatedYield: number;
  actualYield: number;
  status: "not-started" | "in-progress" | "completed";
}

const harvestTasks: HarvestTask[] = [
  { id: "h1", crop: "Corn", field: "North Field", acres: 45, estimatedYield: 8100, actualYield: 7850, status: "completed", scheduledDate: "Sep 1-3", completedDate: "Sep 2", equipment: "John Deere S780", moistureContent: 18.2, quality: "A" },
  { id: "h2", crop: "Soybeans", field: "South Field", acres: 38, estimatedYield: 4560, actualYield: null, status: "in-progress", scheduledDate: "Sep 5-8", completedDate: null, equipment: "Case IH 8250", moistureContent: 13.5, quality: null },
  { id: "h3", crop: "Wheat", field: "East Field", acres: 22, estimatedYield: 3300, actualYield: 3180, status: "completed", scheduledDate: "Aug 20-22", completedDate: "Aug 21", equipment: "John Deere S780", moistureContent: 11.8, quality: "A" },
  { id: "h4", crop: "Alfalfa", field: "West Pasture", acres: 15, estimatedYield: 1800, actualYield: null, status: "pending", scheduledDate: "Sep 12-14", completedDate: null, equipment: "JD 9700 SP Forage Harvester", moistureContent: 0, quality: null },
  { id: "h5", crop: "Corn", field: "South-East Block", acres: 28, estimatedYield: 5040, actualYield: null, status: "delayed", scheduledDate: "Sep 8-10", completedDate: null, equipment: "John Deere S780", moistureContent: 22.1, quality: null },
];

const harvestLogs: HarvestLog[] = [
  { id: "l1", date: "Sep 5, 2:30 PM", crop: "Soybeans", field: "South Field - Block A", quantity: 1200, unit: "bu", truckId: "T-003", destination: "Valley Grain Co-op", moisture: 13.2, notes: "Clean load, no foreign material" },
  { id: "l2", date: "Sep 5, 11:00 AM", crop: "Soybeans", field: "South Field - Block B", quantity: 1150, unit: "bu", truckId: "T-001", destination: "Valley Grain Co-op", moisture: 13.8, notes: "Minor dock for green material" },
  { id: "l3", date: "Sep 2, 4:00 PM", crop: "Corn", field: "North Field - Block C", quantity: 2400, unit: "bu", truckId: "T-002", destination: "Elevate ethanol plant", moisture: 17.9, notes: "Premium grade corn" },
  { id: "l4", date: "Sep 2, 1:00 PM", crop: "Corn", field: "North Field - Block A", quantity: 2250, unit: "bu", truckId: "T-004", destination: "Elevate ethanol plant", moisture: 18.5, notes: "Standard load" },
];

const cropSummaries: CropSummary[] = [
  { crop: "Corn", totalAcres: 73, harvestedAcres: 45, estimatedYield: 13140, actualYield: 7850, status: "in-progress" },
  { crop: "Soybeans", totalAcres: 38, harvestedAcres: 18, estimatedYield: 4560, actualYield: 2350, status: "in-progress" },
  { crop: "Wheat", totalAcres: 22, harvestedAcres: 22, estimatedYield: 3300, actualYield: 3180, status: "completed" },
  { crop: "Alfalfa", totalAcres: 15, harvestedAcres: 0, estimatedYield: 1800, actualYield: 0, status: "not-started" },
];

export default function HarvestPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "logs">("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTasks = harvestTasks.filter((t) => statusFilter === "all" || t.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "badge-green";
      case "in-progress": return "badge-blue";
      case "pending": return "badge-yellow";
      case "delayed": return "badge-red";
      default: return "badge-blue";
    }
  };

  const totalHarvested = harvestLogs.reduce((sum, log) => sum + log.quantity, 0);
  const totalAcres = cropSummaries.reduce((s, c) => s + c.totalAcres, 0);
  const harvestedAcres = cropSummaries.reduce((s, c) => s + c.harvestedAcres, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Harvest Management</h1>
          <p className="text-sm text-gray-500">Track harvest progress, log deliveries, and monitor yield data</p>
        </div>
        <button className="btn-primary">
          <FileText className="mr-2 h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{harvestedAcres}/{totalAcres}</p>
            <p className="text-xs text-gray-500">Acres Harvested</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalHarvested.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Bushels Delivered</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
            <Truck className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{harvestLogs.length}</p>
            <p className="text-xs text-gray-500">Truck Loads</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">$127.4k</p>
            <p className="text-xs text-gray-500">Est. Revenue</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-4 border-b border-gray-100 pb-3">
          {(["overview", "tasks", "logs"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-1 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-green-600 text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Crop Progress</h4>
            {cropSummaries.map((crop) => (
              <div key={crop.crop} className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Wheat className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{crop.crop}</p>
                    <span className={getStatusColor(crop.status === "completed" ? "completed" : crop.status === "in-progress" ? "in-progress" : "pending")}>
                      {crop.status === "not-started" ? "Not Started" : crop.status === "in-progress" ? "In Progress" : "Completed"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                    <span>{crop.harvestedAcres}/{crop.totalAcres} acres</span>
                    <span>Est: {crop.estimatedYield.toLocaleString()} bu</span>
                    {crop.actualYield > 0 && <span>Actual: {crop.actualYield.toLocaleString()} bu</span>}
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div className={`h-2 rounded-full ${crop.status === "completed" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${(crop.harvestedAcres / crop.totalAcres) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{Math.round((crop.harvestedAcres / crop.totalAcres) * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto text-xs">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{task.crop} - {task.field}</h4>
                      <span className={getStatusColor(task.status)}>{task.status.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{task.acres} acres</span>
                      <span>Est: {task.estimatedYield.toLocaleString()} bu</span>
                      <span>Equipment: {task.equipment}</span>
                      <span>Scheduled: {task.scheduledDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {task.quality && <span className="badge-green">Grade {task.quality}</span>}
                    {task.actualYield && <span className="text-sm font-semibold text-green-700">{task.actualYield.toLocaleString()} bu</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4">Date/Time</th>
                  <th className="pb-3 pr-4">Crop</th>
                  <th className="pb-3 pr-4">Field</th>
                  <th className="hidden pb-3 pr-4 sm:table-cell">Quantity</th>
                  <th className="hidden pb-3 pr-4 md:table-cell">Truck</th>
                  <th className="hidden pb-3 pr-4 lg:table-cell">Destination</th>
                  <th className="pb-3">Moisture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {harvestLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 text-sm text-gray-600">{log.date}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">{log.crop}</td>
                    <td className="py-3 pr-4 text-gray-600">{log.field}</td>
                    <td className="hidden py-3 pr-4 sm:table-cell">
                      <span className="font-semibold text-gray-900">{log.quantity.toLocaleString()}</span> {log.unit}
                    </td>
                    <td className="hidden py-3 pr-4 md:table-cell text-gray-600">{log.truckId}</td>
                    <td className="hidden py-3 pr-4 lg:table-cell text-gray-600">{log.destination}</td>
                    <td className="py-3">
                      <span className={log.moisture > 20 ? "text-red-600 font-medium" : log.moisture > 15 ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}>
                        {log.moisture}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-900">Harvest Alerts</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Rain Forecast Delay - South-East Block</p>
              <p className="text-xs text-yellow-600">Rain expected Sep 10-11. Corn moisture content at 22.1% is above optimal. Consider delaying harvest.</p>
            </div>
            <button className="btn-secondary text-xs">Adjust Schedule</button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <Target className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Yield Variance Alert - Soybeans</p>
              <p className="text-xs text-blue-600">Block B showing 8% below estimated yield. AI suggests soil nutrient depletion. Recommended: post-harvest soil test.</p>
            </div>
            <button className="btn-secondary text-xs">View Analysis</button>
          </div>
        </div>
      </div>
    </div>
  );
}
