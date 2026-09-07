"use client";

import Link from "next/link";
import {
  Wheat,
  Sprout,
  CloudSun,
  TrendingUp,
  Droplets,
  Bug,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin,
  ChevronRight,
} from "lucide-react";

const stats = [
  {
    label: "Total Farms",
    value: "4",
    change: "+1",
    trend: "up",
    icon: Wheat,
    color: "bg-green-50 text-green-600",
  },
  {
    label: "Active Crops",
    value: "12",
    change: "+3",
    trend: "up",
    icon: Sprout,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Avg. Health Score",
    value: "87%",
    change: "+2.5%",
    trend: "up",
    icon: TrendingUp,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Weather Risk",
    value: "Low",
    change: "-12%",
    trend: "down",
    icon: CloudSun,
    color: "bg-amber-50 text-amber-600",
  },
];

const recentAlerts = [
  {
    id: 1,
    type: "irrigation",
    severity: "warning",
    title: "Irrigation needed in Field B3",
    description: "Soil moisture dropped below 30% threshold",
    time: "5 minutes ago",
    field: "B3 — North Section",
  },
  {
    id: 2,
    type: "pest",
    severity: "danger",
    title: "Potential pest activity detected",
    description: "Image analysis shows signs of aphids in wheat crop",
    time: "1 hour ago",
    field: "North Field — Block 2",
  },
  {
    id: 3,
    type: "harvest",
    severity: "success",
    title: "Wheat crop ready for harvest",
    description: "Optimal harvest window opens in 3 days",
    time: "2 hours ago",
    field: "Block 2 — East Side",
  },
  {
    id: 4,
    type: "weather",
    severity: "info",
    title: "Rain expected in 48 hours",
    description: "15mm rainfall forecast, consider delaying irrigation",
    time: "3 hours ago",
    field: "All Fields",
  },
];

const cropHealthData = [
  { name: "Wheat", field: "North Field", health: 92, trend: "up", color: "bg-green-500" },
  { name: "Corn", field: "South Field", health: 85, trend: "up", color: "bg-emerald-500" },
  { name: "Soybeans", field: "East Field", health: 78, trend: "down", color: "bg-yellow-500" },
  { name: "Rice", field: "West Paddy", health: 88, trend: "up", color: "bg-blue-500" },
];

const upcomingTasks = [
  {
    id: 1,
    task: "Apply fertilizer — Field A1",
    due: "Tomorrow",
    priority: "high",
  },
  {
    id: 2,
    task: "Soil sampling — Block 3 & 4",
    due: "Sep 10",
    priority: "medium",
  },
  {
    id: 3,
    task: "Harvest wheat — Block 2",
    due: "Sep 12",
    priority: "high",
  },
  {
    id: 4,
    task: "Equipment maintenance",
    due: "Sep 15",
    priority: "low",
  },
];

const severityStyles: Record<string, string> = {
  warning: "bg-amber-100 text-amber-700 border-l-amber-500",
  danger: "bg-red-100 text-red-700 border-l-red-500",
  success: "bg-green-100 text-green-700 border-l-green-500",
  info: "bg-blue-100 text-blue-700 border-l-blue-500",
};

const priorityStyles: Record<string, string> = {
  high: "badge-red",
  medium: "badge-yellow",
  low: "badge-blue",
};

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, John 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening with your farms today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span
                    className={
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-gray-400">from last week</span>
                </div>
              </div>
              <div className={`rounded-xl p-2.5 ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <div className="lg:col-span-2 card p-0">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent Alerts
            </h2>
            <Link
              href="/dashboard/alerts"
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 px-6 py-4 ${severityStyles[alert.severity]}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{alert.title}</h3>
                    <p className="mt-0.5 text-xs opacity-75">
                      {alert.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs opacity-60">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.field}
                      </span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crop Health */}
        <div className="card p-0">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Crop Health
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {cropHealthData.map((crop) => (
              <div key={crop.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {crop.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {crop.field}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      crop.health >= 85
                        ? "text-green-600"
                        : crop.health >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {crop.health}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${crop.color}`}
                    style={{ width: `${crop.health}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/farms"
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="rounded-lg bg-green-100 p-2">
                <Wheat className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Farm</span>
            </Link>
            <Link
              href="/dashboard/crops"
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="rounded-lg bg-emerald-100 p-2">
                <Sprout className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Log Crop
              </span>
            </Link>
            <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="rounded-lg bg-blue-100 p-2">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Irrigation Log
              </span>
            </button>
            <button className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="rounded-lg bg-red-100 p-2">
                <Bug className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Report Issue
              </span>
            </button>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card p-0">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Upcoming Tasks
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {task.task}
                  </p>
                  <p className="text-xs text-gray-500">Due: {task.due}</p>
                </div>
                <span className={priorityStyles[task.priority]}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
