"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Wheat,
  Sprout,
  Calendar,
  Settings,
  BarChart3,
  Droplets,
  Thermometer,
  Wind,
  Pencil,
  Plus,
  ChevronRight,
  TrendingUp,
  Activity,
} from "lucide-react";

const farmDetails = {
  id: "1",
  name: "Green Valley Farm",
  location: "Sacramento, CA 95814",
  acres: 120,
  established: "2019",
  status: "active",
  description:
    "Primary wheat and corn production facility with precision irrigation systems and satellite monitoring.",
  owner: "John Doe",
  coordinates: { lat: 38.5816, lng: -121.4944 },
};

const fields = [
  {
    id: "f1",
    name: "North Field",
    acres: 45,
    crop: "Wheat",
    health: 92,
    status: "healthy",
    plantedDate: "Mar 15, 2026",
    harvestDate: "Sep 10, 2026",
    moisture: 65,
  },
  {
    id: "f2",
    name: "South Field",
    acres: 35,
    crop: "Corn",
    health: 87,
    status: "healthy",
    plantedDate: "Apr 2, 2026",
    harvestDate: "Oct 5, 2026",
    moisture: 58,
  },
  {
    id: "f3",
    name: "East Field",
    acres: 25,
    crop: "Soybeans",
    health: 78,
    status: "attention",
    plantedDate: "May 10, 2026",
    harvestDate: "Nov 1, 2026",
    moisture: 42,
  },
  {
    id: "f4",
    name: "West Field",
    acres: 15,
    crop: "Barley",
    health: 95,
    status: "healthy",
    plantedDate: "Mar 20, 2026",
    harvestDate: "Aug 25, 2026",
    moisture: 71,
  },
];

const weatherData = {
  temp: "28°C",
  humidity: "62%",
  wind: "12 km/h",
  forecast: "Partly cloudy, rain expected in 48h",
};

const recentActivities = [
  {
    id: 1,
    type: "irrigation",
    title: "Irrigation completed — North Field",
    time: "2 hours ago",
    icon: Droplets,
    color: "text-blue-600 bg-blue-100",
  },
  {
    id: 2,
    type: "fertilizer",
    title: "Fertilizer applied — South Field",
    time: "1 day ago",
    icon: Wheat,
    color: "text-green-600 bg-green-100",
  },
  {
    id: 3,
    type: "inspection",
    title: "Drone inspection — East Field",
    time: "2 days ago",
    icon: Activity,
    color: "text-purple-600 bg-purple-100",
  },
  {
    id: 4,
    type: "harvest",
    title: "Harvest completed — West Field",
    time: "5 days ago",
    icon: Sprout,
    color: "text-amber-600 bg-amber-100",
  },
];

const tabs = ["Overview", "Fields", "Analytics", "Activities"];

const statusColor: Record<string, string> = {
  healthy: "badge-green",
  attention: "badge-yellow",
  critical: "badge-red",
};

export default function FarmDetailPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/farms"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {farmDetails.name}
              </h1>
              <span className="badge-green">{farmDetails.status}</span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {farmDetails.location}
              </span>
              <span className="flex items-center gap-1">
                <Wheat className="h-3.5 w-3.5" />
                {farmDetails.acres} acres
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Since {farmDetails.established}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </button>
            <button className="btn-primary">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Farm
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
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <Wheat className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {farmDetails.acres}
              </div>
              <div className="text-xs text-gray-500">Total Acres</div>
            </div>
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Sprout className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">4</div>
              <div className="text-xs text-gray-500">Active Fields</div>
            </div>
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-green-600">88%</div>
              <div className="text-xs text-gray-500">Avg Health</div>
            </div>
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Droplets className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-gray-900">59%</div>
              <div className="text-xs text-gray-500">Avg Moisture</div>
            </div>
          </div>

          {/* Fields Table */}
          <div className="card p-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Fields ({fields.length})
              </h2>
              <button className="btn-primary text-xs">
                <Plus className="mr-1 h-3 w-3" />
                Add Field
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 font-medium text-gray-500">
                      Field
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500">
                      Crop
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500">
                      Acres
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500">
                      Health
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500">
                      Moisture
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {fields.map((field) => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {field.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{field.crop}</td>
                      <td className="px-6 py-4 text-gray-600">{field.acres}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-gray-100">
                            <div
                              className={`h-1.5 rounded-full ${
                                field.health >= 85
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }`}
                              style={{ width: `${field.health}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{field.health}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {field.moisture}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={statusColor[field.status]}>
                          {field.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/crops/1`}
                          className="text-green-600 hover:text-green-700"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weather */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Current Weather
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <Thermometer className="mx-auto h-5 w-5 text-amber-600" />
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {weatherData.temp}
                </div>
                <div className="text-[10px] text-gray-500">Temperature</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <Droplets className="mx-auto h-5 w-5 text-blue-600" />
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {weatherData.humidity}
                </div>
                <div className="text-[10px] text-gray-500">Humidity</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <Wind className="mx-auto h-5 w-5 text-gray-600" />
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {weatherData.wind}
                </div>
                <div className="text-[10px] text-gray-500">Wind</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <Calendar className="mx-auto h-5 w-5 text-gray-600" />
                <div className="mt-1 text-sm font-bold text-gray-900">
                  48h
                </div>
                <div className="text-[10px] text-gray-500">Rain Forecast</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {weatherData.forecast}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="card p-0">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 px-5 py-3">
                    <div className={`rounded-lg p-1.5 ${activity.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              About this Farm
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {farmDetails.description}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                Last updated 2 hours ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
