"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Wheat,
  DollarSign,
  Droplets,
  Leaf,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Layers,
} from "lucide-react";

interface KPICard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface CropYield {
  crop: string;
  estimated: number;
  actual: number;
  variance: number;
  acres: number;
}

interface RevenueStream {
  category: string;
  amount: number;
  percentage: number;
  trend: "up" | "down";
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const kpis: KPICard[] = [
  { title: "Total Revenue", value: "$342,500", change: 12.4, changeLabel: "vs last season", icon: <DollarSign className="h-6 w-6" />, color: "bg-green-100 text-green-600" },
  { title: "Avg. Yield/Acre", value: "186 bu", change: 8.2, changeLabel: "vs last season", icon: <Wheat className="h-6 w-6" />, color: "bg-yellow-100 text-yellow-600" },
  { title: "Water Efficiency", value: "94.2%", change: 3.1, changeLabel: "improvement", icon: <Droplets className="h-6 w-6" />, color: "bg-blue-100 text-blue-600" },
  { title: "Soil Health Score", value: "87/100", change: 5.0, changeLabel: "points gained", icon: <Leaf className="h-6 w-6" />, color: "bg-emerald-100 text-emerald-600" },
];

const cropYields: CropYield[] = [
  { crop: "Corn", estimated: 8100, actual: 7850, variance: -3.1, acres: 73 },
  { crop: "Soybeans", estimated: 4560, actual: 4720, variance: 3.5, acres: 38 },
  { crop: "Wheat", estimated: 3300, actual: 3450, variance: 4.5, acres: 22 },
  { crop: "Alfalfa", estimated: 1800, actual: 1750, variance: -2.8, acres: 15 },
];

const revenueStreams: RevenueStream[] = [
  { category: "Corn Sales", amount: 168000, percentage: 49, trend: "up" },
  { category: "Soybean Sales", amount: 96000, percentage: 28, trend: "up" },
  { category: "Wheat Sales", amount: 42000, percentage: 12, trend: "down" },
  { category: "Hay Sales", amount: 24000, percentage: 7, trend: "up" },
  { category: "Other", amount: 12500, percentage: 4, trend: "stable" },
];

const monthlyData: MonthlyData[] = [
  { month: "Jan", revenue: 0, expenses: 45000, profit: -45000 },
  { month: "Feb", revenue: 0, expenses: 38000, profit: -38000 },
  { month: "Mar", revenue: 15000, expenses: 52000, profit: -37000 },
  { month: "Apr", revenue: 28000, expenses: 48000, profit: -20000 },
  { month: "May", revenue: 45000, expenses: 42000, profit: 3000 },
  { month: "Jun", revenue: 62000, expenses: 35000, profit: 27000 },
  { month: "Jul", revenue: 78000, expenses: 30000, profit: 48000 },
  { month: "Aug", revenue: 85000, expenses: 28000, profit: 57000 },
  { month: "Sep", revenue: 29500, expenses: 25000, profit: 4500 },
];

const maxRevenue = Math.max(...monthlyData.map((d) => Math.max(d.revenue, d.expenses)));

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"season" | "year" | "3years">("season");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farm Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive performance metrics and insights for your operation</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as typeof timeRange)} className="input-field w-auto">
            <option value="season">This Season</option>
            <option value="year">Full Year</option>
            <option value="3years">3-Year Trend</option>
          </select>
          <button className="btn-secondary">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="card">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.color}`}>{kpi.icon}</div>
              <div className={`flex items-center gap-1 text-sm font-medium ${kpi.change > 0 ? "text-green-600" : "text-red-600"}`}>
                {kpi.change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(kpi.change)}%
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500">{kpi.title}</p>
            <p className="text-xs text-gray-400">{kpi.changeLabel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card col-span-1 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Revenue vs Expenses</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Expenses</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Profit</span>
            </div>
          </div>
          <div className="flex items-end gap-2" style={{ height: 220 }}>
            {monthlyData.map((data, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end gap-0.5" style={{ height: 180 }}>
                  <div className="flex-1 rounded-t bg-green-500" style={{ height: `${(data.revenue / maxRevenue) * 100}%` }} />
                  <div className="flex-1 rounded-t bg-red-400" style={{ height: `${(data.expenses / maxRevenue) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Revenue Breakdown</h3>
            <PieChart className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {revenueStreams.map((stream) => (
              <div key={stream.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{stream.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">${(stream.amount / 1000).toFixed(0)}k</span>
                    {stream.trend === "up" ? <TrendingUp className="h-3 w-3 text-green-500" /> : stream.trend === "down" ? <TrendingDown className="h-3 w-3 text-red-500" /> : null}
                  </div>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: `${stream.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Revenue</span>
              <span className="text-lg font-bold text-gray-900">$342,500</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Crop Yield Performance</h3>
            <Target className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            {cropYields.map((crop) => (
              <div key={crop.crop} className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{crop.crop}</p>
                    <p className="text-xs text-gray-500">{crop.acres} acres</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{crop.actual.toLocaleString()} bu</p>
                    <p className={`text-xs font-medium ${crop.variance > 0 ? "text-green-600" : "text-red-600"}`}>{crop.variance > 0 ? "+" : ""}{crop.variance}% vs estimate</p>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className={`h-2 rounded-full ${crop.variance >= 0 ? "bg-green-500" : "bg-yellow-500"}`} style={{ width: `${Math.min((crop.actual / crop.estimated) * 100, 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>Estimated: {crop.estimated.toLocaleString()} bu</span>
                  <span>Yield: {Math.round(crop.actual / crop.acres)} bu/acre</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Operational Insights</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="text-sm font-medium text-green-800">Water Usage Optimized</h4>
              </div>
              <p className="mt-1 text-xs text-green-700">Smart irrigation saved 18,500 gallons this season (12% reduction vs manual scheduling)</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Soil Health Improving</h4>
              </div>
              <p className="mt-1 text-xs text-blue-700">Cover crop integration increased organic matter by 0.3% in tested fields</p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-600" />
                <h4 className="text-sm font-medium text-yellow-800">Pest Pressure Below Average</h4>
              </div>
              <p className="mt-1 text-xs text-yellow-700">IPM strategy reduced treatment costs by $4,200 compared to conventional approach</p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-800">Equipment Efficiency Up</h4>
              </div>
              <p className="mt-1 text-xs text-purple-700">GPS-guided operations reduced overlap by 8%, saving fuel and input costs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
