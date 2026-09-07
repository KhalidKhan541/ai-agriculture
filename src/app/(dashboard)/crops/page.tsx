"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Sprout,
  Wheat,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Droplets,
} from "lucide-react";

const cropsData = [
  {
    id: "1",
    name: "Winter Wheat",
    variety: "Hard Red Winter",
    farm: "Green Valley Farm",
    field: "North Field",
    plantedDate: "Mar 15, 2026",
    expectedHarvest: "Sep 10, 2026",
    status: "growing",
    health: 92,
    growthStage: "Grain Fill",
    moisture: 65,
    acres: 45,
  },
  {
    id: "2",
    name: "Sweet Corn",
    variety: "Golden Cross Bantam",
    farm: "Green Valley Farm",
    field: "South Field",
    plantedDate: "Apr 2, 2026",
    expectedHarvest: "Oct 5, 2026",
    status: "growing",
    health: 87,
    growthStage: "Tasseling",
    moisture: 58,
    acres: 35,
  },
  {
    id: "3",
    name: "Soybeans",
    variety: "AgriMAX 542",
    farm: "Green Valley Farm",
    field: "East Field",
    plantedDate: "May 10, 2026",
    expectedHarvest: "Nov 1, 2026",
    status: "attention",
    health: 78,
    growthStage: "Vegetative",
    moisture: 42,
    acres: 25,
  },
  {
    id: "4",
    name: "Barley",
    variety: "Pinnacle",
    farm: "Green Valley Farm",
    field: "West Field",
    plantedDate: "Mar 20, 2026",
    expectedHarvest: "Aug 25, 2026",
    status: "harvest-ready",
    health: 95,
    growthStage: "Maturity",
    moisture: 71,
    acres: 15,
  },
  {
    id: "5",
    name: "Rice",
    variety: "Calrose",
    farm: "Oakwood Fields",
    field: "Paddy Section A",
    plantedDate: "Jun 5, 2026",
    expectedHarvest: "Nov 15, 2026",
    status: "growing",
    health: 88,
    growthStage: "Tillering",
    moisture: 82,
    acres: 40,
  },
  {
    id: "6",
    name: "Romaine Lettuce",
    variety: "Parris Island",
    farm: "Riverside Gardens",
    field: "Greenhouse 1",
    plantedDate: "Aug 20, 2026",
    expectedHarvest: "Sep 20, 2026",
    status: "harvest-ready",
    health: 96,
    growthStage: "Harvest Ready",
    moisture: 55,
    acres: 5,
  },
];

const statusStyles: Record<string, { label: string; className: string }> = {
  growing: { label: "Growing", className: "badge-green" },
  attention: { label: "Needs Attention", className: "badge-yellow" },
  "harvest-ready": { label: "Harvest Ready", className: "badge-blue" },
  harvested: { label: "Harvested", className: "badge-red" },
};

type SortKey = "name" | "health" | "acres";

export default function CropsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filteredCrops = cropsData
    .filter((crop) => {
      const matchesSearch =
        crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.farm.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || crop.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return a[sortKey] - b[sortKey];
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crops</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track crop health, growth stages, and harvest schedules.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Crop
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card text-center">
          <Sprout className="mx-auto h-5 w-5 text-green-600" />
          <div className="mt-1 text-xl font-bold text-gray-900">
            {cropsData.length}
          </div>
          <div className="text-xs text-gray-500">Total Crops</div>
        </div>
        <div className="card text-center">
          <div className="mx-auto h-5 w-5 rounded-full bg-green-500" />
          <div className="mt-1 text-xl font-bold text-green-600">
            {cropsData.filter((c) => c.status === "growing").length}
          </div>
          <div className="text-xs text-gray-500">Growing</div>
        </div>
        <div className="card text-center">
          <div className="mx-auto h-5 w-5 rounded-full bg-blue-500" />
          <div className="mt-1 text-xl font-bold text-blue-600">
            {cropsData.filter((c) => c.status === "harvest-ready").length}
          </div>
          <div className="text-xs text-gray-500">Ready to Harvest</div>
        </div>
        <div className="card text-center">
          <div className="mx-auto h-5 w-5 rounded-full bg-yellow-500" />
          <div className="mt-1 text-xl font-bold text-yellow-600">
            {cropsData.filter((c) => c.status === "attention").length}
          </div>
          <div className="text-xs text-gray-500">Needs Attention</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search crops, varieties, farms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-9 pr-8"
            >
              <option value="all">All Status</option>
              <option value="growing">Growing</option>
              <option value="harvest-ready">Harvest Ready</option>
              <option value="attention">Needs Attention</option>
              <option value="harvested">Harvested</option>
            </select>
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="input-field pr-8"
          >
            <option value="name">Sort by Name</option>
            <option value="health">Sort by Health</option>
            <option value="acres">Sort by Size</option>
          </select>
          <div className="hidden sm:flex rounded-lg border border-gray-200">
            <button
              onClick={() => setView("grid")}
              className={`p-2 text-sm ${
                view === "grid"
                  ? "bg-green-50 text-green-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 text-sm ${
                view === "list"
                  ? "bg-green-50 text-green-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Crops Grid / List */}
      {filteredCrops.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <Sprout className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No crops found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? "Try adjusting your search or filters."
              : "Get started by logging your first crop."}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCrops.map((crop) => {
            const statusInfo = statusStyles[crop.status];
            return (
              <div
                key={crop.id}
                className="card group hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                      <Sprout className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {crop.name}
                      </h3>
                      <p className="text-xs text-gray-500">{crop.variety}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === crop.id ? null : crop.id)
                      }
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenu === crop.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="p-1">
                          <Link
                            href={`/dashboard/crops/${crop.id}`}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Link>
                          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status + Stage */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={statusInfo.className}>{statusInfo.label}</span>
                  <span className="text-xs text-gray-500">
                    Stage: {crop.growthStage}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {crop.field}
                  </div>
                  <div className="flex items-center gap-1">
                    <Wheat className="h-3 w-3" />
                    {crop.acres} acres
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Planted {crop.plantedDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    Moisture {crop.moisture}%
                  </div>
                </div>

                {/* Health Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      Health
                    </span>
                    <div className="flex items-center gap-1">
                      {crop.health >= 85 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={`text-xs font-bold ${
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
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-1.5 rounded-full ${
                        crop.health >= 85
                          ? "bg-green-500"
                          : crop.health >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${crop.health}%` }}
                    />
                  </div>
                </div>

                {/* Harvest Date */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>Expected harvest: {crop.expectedHarvest}</span>
                  <span className="text-gray-400">{crop.farm}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500">Crop</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Farm</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Field</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Stage</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Health</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Harvest
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCrops.map((crop) => {
                  const statusInfo = statusStyles[crop.status];
                  return (
                    <tr key={crop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {crop.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {crop.variety}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{crop.farm}</td>
                      <td className="px-6 py-4 text-gray-600">{crop.field}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {crop.growthStage}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            crop.health >= 85
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {crop.health}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={statusInfo.className}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {crop.expectedHarvest}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/crops/${crop.id}`}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
