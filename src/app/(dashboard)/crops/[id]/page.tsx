"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sprout,
  Wheat,
  MapPin,
  Calendar,
  Droplets,
  TrendingUp,
  TrendingDown,
  Pencil,
  BarChart3,
  Thermometer,
  Wind,
  Sun,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  Activity,
} from "lucide-react";

const cropDetails = {
  id: "1",
  name: "Winter Wheat",
  variety: "Hard Red Winter",
  farm: "Green Valley Farm",
  field: "North Field",
  fieldAcres: 45,
  plantedDate: "Mar 15, 2026",
  expectedHarvest: "Sep 10, 2026",
  status: "growing",
  growthStage: "Grain Fill",
  health: 92,
  moisture: 65,
  temperature: "26°C",
  soilPH: 6.8,
  nitrogenLevel: "Optimal",
  daysSincePlanting: 175,
  daysToHarvest: 4,
};

const healthHistory = [
  { date: "Aug 20", health: 88 },
  { date: "Aug 25", health: 89 },
  { date: "Aug 30", health: 90 },
  { date: "Sep 1", health: 91 },
  { date: "Sep 3", health: 92 },
  { date: "Sep 5", health: 92 },
  { date: "Sep 7", health: 92 },
];

const tasks = [
  {
    id: 1,
    task: "Apply foliar fungicide",
    status: "completed",
    date: "Aug 28, 2026",
    notes: "Applied Tilt at 4 oz/acre",
  },
  {
    id: 2,
    task: "Soil moisture check",
    status: "completed",
    date: "Sep 2, 2026",
    notes: "All readings normal",
  },
  {
    id: 3,
    task: "Scout for pests",
    status: "in-progress",
    date: "Sep 7, 2026",
    notes: "Checking for aphids and wheat rust",
  },
  {
    id: 4,
    task: "Pre-harvest assessment",
    status: "upcoming",
    date: "Sep 8, 2026",
    notes: "",
  },
  {
    id: 5,
    task: "Begin harvest",
    status: "upcoming",
    date: "Sep 10, 2026",
    notes: "",
  },
];

const aiInsights = [
  {
    id: 1,
    type: "positive",
    title: "Optimal Grain Fill Phase",
    description:
      "Current moisture and temperature levels are ideal for grain fill. Expect above-average yield if conditions remain stable.",
  },
  {
    id: 2,
    type: "warning",
    title: "Rain in 48 Hours",
    description:
      "Forecasted 15mm rainfall. Consider advancing fungicide application to avoid wash-off.",
  },
  {
    id: 3,
    type: "info",
    title: "Harvest Window Analysis",
    description:
      "AI models predict optimal harvest window Sep 10-12. Moisture content should reach 13.5% by then.",
  },
];

const taskStatusStyles: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  completed: {
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
    label: "Completed",
  },
  "in-progress": {
    icon: Clock,
    color: "text-blue-600 bg-blue-100",
    label: "In Progress",
  },
  upcoming: {
    icon: Calendar,
    color: "text-gray-500 bg-gray-100",
    label: "Upcoming",
  },
};

const insightStyles: Record<string, string> = {
  positive: "border-l-green-500 bg-green-50",
  warning: "border-l-amber-500 bg-amber-50",
  info: "border-l-blue-500 bg-blue-50",
};

const tabs = ["Overview", "Growth", "Tasks", "AI Insights"];

export default function CropDetailPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Simple sparkline data
  const maxHealth = Math.max(...healthHistory.map((h) => h.health));
  const minHealth = Math.min(...healthHistory.map((h) => h.health));
  const range = maxHealth - minHealth || 1;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/crops"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Crops
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
              <Sprout className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {cropDetails.name}
                </h1>
                <span className="badge-green">{cropDetails.status}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {cropDetails.variety} • {cropDetails.farm} • {cropDetails.field}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </button>
            <button className="btn-primary">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Crop
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-xl font-bold text-green-600">
                {cropDetails.health}%
              </div>
              <div className="text-xs text-gray-500">Health Score</div>
            </div>
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {cropDetails.moisture}%
              </div>
              <div className="text-xs text-gray-500">Soil Moisture</div>
            </div>
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Leaf className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {cropDetails.soilPH}
              </div>
              <div className="text-xs text-gray-500">Soil pH</div>
            </div>
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Wheat className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {cropDetails.fieldAcres}
              </div>
              <div className="text-xs text-gray-500">Acres</div>
            </div>
          </div>

          {/* Health Trend */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Health Trend
              </h3>
              <span className="text-xs text-gray-500">Last 7 readings</span>
            </div>
            <div className="relative h-32">
              <svg className="h-full w-full" viewBox="0 0 400 100">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="400"
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                  />
                ))}
                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={healthHistory
                    .map((point, i) => {
                      const x = (i / (healthHistory.length - 1)) * 380 + 10;
                      const y =
                        100 -
                        ((point.health - minHealth) / range) * 80 -
                        10;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
                {/* Dots */}
                {healthHistory.map((point, i) => {
                  const x = (i / (healthHistory.length - 1)) * 380 + 10;
                  const y =
                    100 - ((point.health - minHealth) / range) * 80 - 10;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#22c55e"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2">
              {healthHistory.map((h) => (
                <span key={h.date}>{h.date}</span>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="card p-0">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Field Tasks
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {tasks.map((task) => {
                const style = taskStatusStyles[task.status];
                const Icon = style.icon;
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 px-6 py-4"
                  >
                    <div
                      className={`mt-0.5 rounded-lg p-1.5 ${style.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {task.task}
                        </h4>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.color}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {task.date}
                      </p>
                      {task.notes && (
                        <p className="mt-1 text-xs text-gray-400 italic">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Growth Info */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Growth Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Growth Stage</span>
                <span className="text-sm font-medium text-gray-900">
                  {cropDetails.growthStage}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Planted</span>
                <span className="text-sm font-medium text-gray-900">
                  {cropDetails.plantedDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Expected Harvest</span>
                <span className="text-sm font-medium text-gray-900">
                  {cropDetails.expectedHarvest}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Days Growing</span>
                <span className="text-sm font-bold text-green-600">
                  {cropDetails.daysSincePlanting}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Days to Harvest</span>
                <span className="text-sm font-bold text-amber-600">
                  {cropDetails.daysToHarvest}
                </span>
              </div>
            </div>
          </div>

          {/* Environment */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Current Conditions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <Thermometer className="mx-auto h-4 w-4 text-amber-600" />
                <div className="mt-1 text-sm font-bold text-gray-900">
                  {cropDetails.temperature}
                </div>
                <div className="text-[10px] text-gray-500">Temperature</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <Droplets className="mx-auto h-4 w-4 text-blue-600" />
                <div className="mt-1 text-sm font-bold text-gray-900">
                  {cropDetails.moisture}%
                </div>
                <div className="text-[10px] text-gray-500">Moisture</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <Sun className="mx-auto h-4 w-4 text-yellow-500" />
                <div className="mt-1 text-sm font-bold text-gray-900">
                  8 hrs
                </div>
                <div className="text-[10px] text-gray-500">Sunlight</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <Wind className="mx-auto h-4 w-4 text-gray-500" />
                <div className="mt-1 text-sm font-bold text-gray-900">
                  8 km/h
                </div>
                <div className="text-[10px] text-gray-500">Wind</div>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Nitrogen Level</span>
                <span className="text-xs font-medium text-green-600">
                  {cropDetails.nitrogenLevel}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200">
                <div className="h-1.5 w-3/4 rounded-full bg-green-500" />
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              AI Insights
            </h3>
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className={`rounded-xl border-l-4 p-4 ${insightStyles[insight.type]}`}
              >
                <div className="flex items-start gap-2">
                  {insight.type === "warning" ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                  ) : insight.type === "positive" ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                  ) : (
                    <Activity className="mt-0.5 h-4 w-4 text-blue-600" />
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {insight.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
                      {insight.description}
                    </p>
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
