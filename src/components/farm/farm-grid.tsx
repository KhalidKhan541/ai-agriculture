"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FarmCard } from "./farm-card";
import { Badge } from "@/components/ui/badge";
import type { FarmWithRelations } from "@/types";

interface FarmGridProps extends React.HTMLAttributes<HTMLDivElement> {
  farms: FarmWithRelations[];
  onFarmClick?: (farmId: string) => void;
  onEditFarm?: (farmId: string) => void;
  viewMode?: "grid" | "list";
  filter?: string;
  onFilterChange?: (filter: string) => void;
  emptyMessage?: string;
  loading?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

const filterOptions = [
  { value: "all", label: "All Farms" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING_VERIFICATION", label: "Pending" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

function FarmGridSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}
    >
      {Array.from({ length: columns * 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-1">
                <div className="h-2 bg-gray-100 rounded w-12" />
                <div className="h-5 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function FarmEmptyState({ message = "No farms found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-20 w-20 rounded-full bg-agriculture-field/10 flex items-center justify-center mb-4">
        <svg className="h-10 w-10 text-agriculture-leaf/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{message}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        Create your first farm to get started with AI-powered agriculture management.
      </p>
    </div>
  );
}

function FarmGrid({
  farms,
  onFarmClick,
  onEditFarm,
  viewMode = "grid",
  filter = "all",
  onFilterChange,
  emptyMessage,
  loading = false,
  columns = 3,
  className,
  ...props
}: FarmGridProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredFarms = React.useMemo(() => {
    let result = farms;
    if (filter !== "all") {
      result = result.filter((f) => f.status === filter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.city?.toLowerCase().includes(q) ||
          f.country?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [farms, filter, searchQuery]);

  const stats = React.useMemo(() => {
    const active = farms.filter((f) => f.status === "ACTIVE").length;
    const totalArea = farms.reduce((sum, f) => sum + (f.areaHa || 0), 0);
    const totalCrops = farms.reduce((sum, f) => sum + (f.crops?.length || 0), 0);
    return { active, totalArea, totalCrops };
  }, [farms]);

  if (loading) {
    return <FarmGridSkeleton columns={columns} />;
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange?.(opt.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                filter === opt.value
                  ? "bg-agriculture-leaf text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {opt.label}
              {opt.value === "all" && (
                <span className="ml-1 opacity-70">({farms.length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search farms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-agriculture-leaf/20 focus:border-agriculture-leaf/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-status-active" />
          {stats.active} active
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-agriculture-soil" />
          {stats.totalArea.toLocaleString()} ha total
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-agriculture-leaf" />
          {stats.totalCrops} crops
        </div>
      </div>

      {filteredFarms.length === 0 ? (
        <FarmEmptyState message={emptyMessage} />
      ) : viewMode === "grid" ? (
        <div
          className={cn(
            "grid gap-4",
            columns === 1 && "grid-cols-1",
            columns === 2 && "grid-cols-1 md:grid-cols-2",
            columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}
        >
          {filteredFarms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onNavigate={onFarmClick}
              onEdit={onEditFarm}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFarms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onNavigate={onFarmClick}
              onEdit={onEditFarm}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { FarmGrid, FarmGridSkeleton, FarmEmptyState };
export type { FarmGridProps };
