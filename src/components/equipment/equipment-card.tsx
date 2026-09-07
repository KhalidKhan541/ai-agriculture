"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatNumber } from "@/lib/utils";
import type { EquipmentWithMaintenance } from "@/types";

interface EquipmentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  equipment: EquipmentWithMaintenance;
  onNavigate?: (equipmentId: string) => void;
  onEdit?: (equipmentId: string) => void;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "primary" | "secondary"; icon: string }> = {
  ACTIVE: { label: "Operational", variant: "success", icon: "✅" },
  IDLE: { label: "Idle", variant: "default", icon: "⏸️" },
  IN_USE: { label: "In Use", variant: "primary", icon: "🚜" },
  MAINTENANCE: { label: "Maintenance", variant: "warning", icon: "🔧" },
  OUT_OF_SERVICE: { label: "Out of Service", variant: "destructive", icon: "⛔" },
  RETIRED: { label: "Retired", variant: "secondary", icon: "📦" },
};

const equipmentTypeIcons: Record<string, string> = {
  TRACTOR: "🚜",
  HARVESTER: "🌾",
  PLANTER: "🌱",
  IRRIGATION: "💧",
  SPRAYER: "🌫️",
  TRUCK: "🚛",
  EXCAVATOR: "🏗️",
  GENERATOR: "⚡",
  PUMP: "🔄",
  DRONE: "🚁",
  SENSOR: "📡",
  OTHER: "⚙️",
};

function MaintenanceTimeline({ maintenance }: { maintenance: EquipmentWithMaintenance["maintenance"] }) {
  if (!maintenance || maintenance.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-gray-400 uppercase">Recent Maintenance</p>
      {maintenance.slice(0, 3).map((m) => (
        <div key={m.id} className="flex items-start gap-2 text-xs">
          <div className="h-4 w-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[8px]">🔧</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-700 truncate">{m.type || "Scheduled Maintenance"}</p>
            <p className="text-[10px] text-gray-400">
              {m.completedAt ? formatDate(m.completedAt) : m.scheduledDate ? `Scheduled: ${formatDate(m.scheduledDate)}` : "Pending"}
            </p>
          </div>
          {m.cost && (
            <span className="text-[10px] font-bold text-gray-600 shrink-0">${m.cost.toLocaleString()}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EquipmentCard({
  equipment,
  onNavigate,
  onEdit,
  compact = false,
  className,
  ...props
}: EquipmentCardProps) {
  const status = statusConfig[equipment.status] || statusConfig.ACTIVE;
  const typeIcon = equipmentTypeIcons[equipment.type?.toUpperCase()] || equipmentTypeIcons.OTHER;
  const hoursUsed = equipment.metadata && typeof equipment.metadata === "object"
    ? (equipment.metadata as Record<string, unknown>).hoursUsed
    : null;
  const lastService = equipment.maintenance?.[0];

  const depreciation = equipment.purchasePrice && equipment.currentValue
    ? Math.round(((equipment.purchasePrice - equipment.currentValue) / equipment.purchasePrice) * 100)
    : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        equipment.status === "MAINTENANCE" && "border-amber-300",
        equipment.status === "OUT_OF_SERVICE" && "border-red-300",
        equipment.status !== "MAINTENANCE" && equipment.status !== "OUT_OF_SERVICE" && "border-gray-200 hover:border-agriculture-field/40",
        className
      )}
      onClick={() => onNavigate?.(equipment.id)}
      role={onNavigate ? "button" : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-2xl shrink-0">{typeIcon}</span>
            <div className="space-y-0.5 min-w-0">
              <CardTitle className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {equipment.name}
              </CardTitle>
              <p className="text-xs text-gray-500">
                {equipment.brand} {equipment.model}
              </p>
            </div>
          </div>
          <Badge variant={status.variant} dot size="sm">
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Type</p>
            <p className="text-sm font-bold text-gray-900">{equipment.type?.replace(/_/g, " ") || "—"}</p>
          </div>
          {equipment.year && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Year</p>
              <p className="text-sm font-bold text-gray-900">{equipment.year}</p>
            </div>
          )}
          {equipment.serialNumber && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Serial</p>
              <p className="text-sm font-bold text-gray-700 font-mono truncate">{equipment.serialNumber}</p>
            </div>
          )}
          {equipment.fuelType && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Fuel</p>
              <p className="text-sm font-bold text-gray-700">{equipment.fuelType}</p>
            </div>
          )}
        </div>

        {hoursUsed != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-400 uppercase">Hours Used</span>
              <span className="text-xs font-bold text-gray-700">{Number(hoursUsed).toLocaleString()}h</span>
            </div>
          </div>
        )}

        {(equipment.purchasePrice || equipment.currentValue) && (
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-400 uppercase">Value</span>
              {depreciation !== null && (
                <span className={cn(
                  "text-[10px] font-bold",
                  depreciation > 50 ? "text-red-500" : depreciation > 25 ? "text-amber-500" : "text-green-500"
                )}>
                  -{depreciation}% dep.
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              {equipment.currentValue && (
                <span className="text-lg font-bold text-gray-900">
                  ${formatNumber(equipment.currentValue)}
                </span>
              )}
              {equipment.purchasePrice && equipment.currentValue && equipment.purchasePrice !== equipment.currentValue && (
                <span className="text-xs text-gray-400 line-through">
                  ${formatNumber(equipment.purchasePrice)}
                </span>
              )}
            </div>
          </div>
        )}

        {!compact && lastService && (
          <div className="pt-2 border-t border-gray-100">
            <MaintenanceTimeline maintenance={[lastService]} />
          </div>
        )}

        {!compact && equipment.assignments && equipment.assignments.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Assignments</p>
            <div className="flex items-center gap-1">
              {equipment.assignments.slice(0, 3).map((a, i) => (
                <div
                  key={a.id || i}
                  className="h-6 px-2 rounded-full bg-blue-50 border border-blue-200 flex items-center"
                >
                  <span className="text-[10px] font-medium text-blue-700">
                    {a.fieldId ? `Field` : `Assignment ${i + 1}`}
                  </span>
                </div>
              ))}
              {equipment.assignments.length > 3 && (
                <span className="text-[10px] text-gray-400">+{equipment.assignments.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative pt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {equipment.purchaseDate ? `Purchased ${formatDate(equipment.purchaseDate)}` : ""}
        </span>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(equipment.id);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export { EquipmentCard, MaintenanceTimeline };
export type { EquipmentCardProps };
