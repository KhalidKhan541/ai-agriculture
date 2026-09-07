"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Wheat,
  MapPin,
  Sprout,
  Calendar,
  ArrowUpRight,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

const farmsData = [
  {
    id: "1",
    name: "Green Valley Farm",
    location: "Sacramento, CA",
    acres: 120,
    crops: 3,
    status: "active",
    lastActivity: "2 hours ago",
    healthScore: 92,
    image: null,
    description: "Primary wheat and corn production facility",
  },
  {
    id: "2",
    name: "Sunrise Ranch",
    location: "Modesto, CA",
    acres: 85,
    crops: 2,
    status: "active",
    lastActivity: "5 hours ago",
    healthScore: 87,
    image: null,
    description: "Organic vegetable and fruit farm",
  },
  {
    id: "3",
    name: "Oakwood Fields",
    location: "Fresno, CA",
    acres: 200,
    crops: 4,
    status: "maintenance",
    lastActivity: "1 day ago",
    healthScore: 78,
    image: null,
    description: "Large-scale soybean and rice cultivation",
  },
  {
    id: "4",
    name: "Riverside Gardens",
    location: "Bakersfield, CA",
    acres: 60,
    crops: 2,
    status: "active",
    lastActivity: "3 hours ago",
    healthScore: 95,
    image: null,
    description: "Specialty herb and salad green production",
  },
];

const statusStyles: Record<string, string> = {
  active: "badge-green",
  maintenance: "badge-yellow",
  inactive: "badge-red",
};

type SortKey = "name" | "acres" | "crops" | "healthScore";

export default function FarmsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filteredFarms = farmsData
    .filter((farm) => {
      const matchesSearch =
        farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farm.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || farm.status === statusFilter;
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
          <h1 className="text-2xl font-bold text-gray-900">Farms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your farms, fields, and locations.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Farm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search farms by name or location..."
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
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="input-field pr-8"
          >
            <option value="name">Sort by Name</option>
            <option value="acres">Sort by Size</option>
            <option value="crops">Sort by Crops</option>
            <option value="healthScore">Sort by Health</option>
          </select>
        </div>
      </div>

      {/* Farms Grid */}
      {filteredFarms.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <Wheat className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No farms found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? "Try adjusting your search or filters."
              : "Get started by adding your first farm."}
          </p>
          {!searchQuery && (
            <button className="btn-primary mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Farm
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFarms.map((farm) => (
            <div
              key={farm.id}
              className="card group relative hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="mb-4 flex h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                <Wheat className="h-10 w-10 text-green-400" />
              </div>

              {/* Content */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {farm.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {farm.location}
                  </div>
                </div>
                <span className={statusStyles[farm.status]}>{farm.status}</span>
              </div>

              <p className="mt-2 text-sm text-gray-500 line-clamp-1">
                {farm.description}
              </p>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-gray-50 p-2.5 text-center">
                  <div className="text-sm font-bold text-gray-900">
                    {farm.acres}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    Acres
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5 text-center">
                  <div className="text-sm font-bold text-gray-900">
                    {farm.crops}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    Crops
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5 text-center">
                  <div
                    className={`text-sm font-bold ${
                      farm.healthScore >= 85
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {farm.healthScore}%
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    Health
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  Active {farm.lastActivity}
                </div>
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === farm.id ? null : farm.id)
                    }
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === farm.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-xl border border-gray-200 bg-white shadow-lg">
                      <div className="p-1">
                        <Link
                          href={`/dashboard/farms/${farm.id}`}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
