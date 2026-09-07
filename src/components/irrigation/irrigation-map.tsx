"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { IrrigationZone, Irrigation } from "@/types";

interface IrrigationZoneData extends IrrigationZone {
  irrigations?: Irrigation[];
  sensorReadings?: { soilMoisture?: number; temperature?: number }[];
}

interface IrrigationMapProps extends React.HTMLAttributes<HTMLDivElement> {
  zones: IrrigationZoneData[];
  onZoneClick?: (zoneId: string) => void;
  selectedZoneId?: string;
  showSensorData?: boolean;
  layout?: "grid" | "list";
}

const zoneStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "primary" | "secondary"; color: string }> = {
  ACTIVE: { label: "Active", variant: "success", color: "bg-status-active" },
  INACTIVE: { label: "Inactive", variant: "default", color: "bg-status-inactive" },
  MAINTENANCE: { label: "Maintenance", variant: "warning", color: "bg-status-warning" },
  DEFECTIVE: { label: "Defective", variant: "destructive", color: "bg-status-error" },
};

const irrigationTypeIcons: Record<string, string> = {
  DRIP: "💧",
  SPRINKLER: "💦",
  FLOOD: "🌊",
  CENTER_PIVOT: "🔄",
  SUBSURFACE: "⬇️",
  MANUAL: "🚿",
  SMART_AUTOMATED: "🤖",
};

function MoistureGauge({
  value,
  label = "Soil Moisture",
  size = "md",
}: {
  value?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const moisture = value ?? 0;
  const getColor = (m: number) => {
    if (m < 20) return "text-red-500";
    if (m < 40) return "text-orange-500";
    if (m < 60) return "text-green-500";
    if (m < 80) return "text-blue-500";
    return "text-blue-600";
  };

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${moisture}, 100`}
            strokeLinecap="round"
            className={cn(getColor(moisture), "transition-all duration-700")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-gray-900", textSize[size])}>
            {Math.round(moisture)}%
          </span>
        </div>
      </div>
      {label && <span className="text-[10px] font-medium text-gray-500 uppercase">{label}</span>}
    </div>
  );
}

function ZoneCard({
  zone,
  isSelected = false,
  onClick,
  showSensorData = false,
}: {
  zone: IrrigationZoneData;
  isSelected?: boolean;
  onClick?: (zoneId: string) => void;
  showSensorData?: boolean;
}) {
  const status = zoneStatusConfig[zone.status] || zoneStatusConfig.ACTIVE;
  const irrigationCount = zone.irrigations?.length || 0;
  const lastIrrigation = zone.irrigations?.[0];
  const sensorReading = zone.sensorReadings?.[0];

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5",
        isSelected
          ? "border-agriculture-leaf ring-2 ring-agriculture-field/20 shadow-md"
          : "border-gray-200 hover:border-agriculture-field/40",
        zone.status === "MAINTENANCE" && "border-amber-300",
        zone.status === "DEFECTIVE" && "border-red-300",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(zone.id)}
    >
      {zone.status === "MAINTENANCE" && (
        <div className="absolute top-2 right-2">
          <span className="text-xs">🔧</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-gray-900">{zone.name}</h4>
          {zone.description && (
            <p className="text-xs text-gray-500 truncate max-w-[180px]">{zone.description}</p>
          )}
        </div>
        <Badge variant={status.variant} size="sm" dot>
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-gray-400 uppercase">Area</p>
          <p className="text-sm font-bold text-gray-900">
            {zone.areaHa?.toLocaleString() || "—"} <span className="text-[10px] font-normal text-gray-500">ha</span>
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-gray-400 uppercase">Type</p>
          <div className="flex items-center gap-1">
            <span className="text-xs">{irrigationTypeIcons[zone.irrigationType || "DRIP"] || "💧"}</span>
            <p className="text-xs font-medium text-gray-700">{zone.irrigationType?.replace(/_/g, " ") || "Drip"}</p>
          </div>
        </div>
        {zone.flowRate && (
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Flow Rate</p>
            <p className="text-sm font-bold text-agriculture-water">{zone.flowRate} L/h</p>
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-gray-400 uppercase">Sessions</p>
          <p className="text-sm font-bold text-gray-700">{irrigationCount}</p>
        </div>
      </div>

      {showSensorData && sensorReading && (
        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 mb-3">
          <p className="text-[10px] font-medium text-gray-400 uppercase mb-2">Sensor Reading</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoistureGauge value={sensorReading.soilMoisture} size="sm" />
              <div className="space-y-0.5">
                {sensorReading.temperature != null && (
                  <p className="text-xs text-gray-600">
                    🌡️ {Math.round(sensorReading.temperature)}°C
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {lastIrrigation && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>Last: {lastIrrigation.type?.replace(/_/g, " ")}</span>
          <span>{lastIrrigation.volumeLiters ? `${lastIrrigation.volumeLiters}L` : "—"}</span>
        </div>
      )}
    </div>
  );
}

function IrrigationSummary({ zones }: { zones: IrrigationZoneData[] }) {
  const totalArea = zones.reduce((sum, z) => sum + (z.areaHa || 0), 0);
  const activeZones = zones.filter((z) => z.status === "ACTIVE").length;
  const maintenanceZones = zones.filter((z) => z.status === "MAINTENANCE").length;
  const totalSessions = zones.reduce((sum, z) => sum + (z.irrigations?.length || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-agriculture-water/5 rounded-lg p-3 border border-agriculture-water/10">
        <p className="text-[10px] font-medium text-agriculture-water uppercase">Total Zones</p>
        <p className="text-xl font-bold text-agriculture-waterDark">{zones.length}</p>
      </div>
      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
        <p className="text-[10px] font-medium text-green-600 uppercase">Active</p>
        <p className="text-xl font-bold text-green-700">{activeZones}</p>
      </div>
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
        <p className="text-[10px] font-medium text-amber-600 uppercase">Maintenance</p>
        <p className="text-xl font-bold text-amber-700">{maintenanceZones}</p>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-[10px] font-medium text-blue-600 uppercase">Total Sessions</p>
        <p className="text-xl font-bold text-blue-700">{totalSessions}</p>
      </div>
    </div>
  );
}

function IrrigationMap({
  zones,
  onZoneClick,
  selectedZoneId,
  showSensorData = false,
  layout = "grid",
  className,
  ...props
}: IrrigationMapProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Irrigation Zones</h3>
        <Badge variant="secondary" size="sm">{zones.length} zones</Badge>
      </div>

      <IrrigationSummary zones={zones} />

      {zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <span className="text-3xl mb-2">💧</span>
          <p className="text-sm text-gray-500">No irrigation zones configured</p>
          <p className="text-xs text-gray-400 mt-1">Add zones to manage irrigation across your farm</p>
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              isSelected={zone.id === selectedZoneId}
              onClick={onZoneClick}
              showSensorData={showSensorData}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              isSelected={zone.id === selectedZoneId}
              onClick={onZoneClick}
              showSensorData={showSensorData}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { IrrigationMap, ZoneCard, IrrigationSummary, MoistureGauge };
export type { IrrigationMapProps, IrrigationZoneData };
