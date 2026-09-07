"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import type { CropWithRelations } from "@/types";

interface CropCardProps extends React.HTMLAttributes<HTMLDivElement> {
  crop: CropWithRelations;
  onNavigate?: (cropId: string) => void;
  onEdit?: (cropId: string) => void;
  compact?: boolean;
  showAI?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "primary" | "secondary" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  DORMANT: { label: "Dormant", variant: "default" },
  HARVESTED: { label: "Harvested", variant: "primary" },
  FAILED: { label: "Failed", variant: "destructive" },
  DISEASED: { label: "Diseased", variant: "destructive" },
  PEST_AFFECTED: { label: "Pest Affected", variant: "warning" },
};

const growthStageConfig: Record<string, { label: string; color: string; icon: string }> = {
  GERMINATION: { label: "Germination", color: "text-yellow-600", icon: "🌱" },
  VEGETATIVE: { label: "Vegetative", color: "text-green-500", icon: "🌿" },
  FLOWERING: { label: "Flowering", color: "text-pink-500", icon: "🌸" },
  FRUITING: { label: "Fruiting", color: "text-orange-500", icon: "🍎" },
  MATURATION: { label: "Maturation", color: "text-amber-600", icon: "🌾" },
  HARVEST_READY: { label: "Ready to Harvest", color: "text-green-700", icon: "🚜" },
};

const seasonColors: Record<string, string> = {
  SPRING: "bg-green-50 text-green-700 border-green-200",
  SUMMER: "bg-yellow-50 text-yellow-700 border-yellow-200",
  AUTUMN: "bg-orange-50 text-orange-700 border-orange-200",
  WINTER: "bg-blue-50 text-blue-700 border-blue-200",
};

function CropCard({
  crop,
  onNavigate,
  onEdit,
  compact = false,
  showAI = false,
  className,
  ...props
}: CropCardProps) {
  const status = statusConfig[crop.status] || statusConfig.ACTIVE;
  const growth = growthStageConfig[crop.growthStage || "VEGETATIVE"] || growthStageConfig.VEGETATIVE;
  const hasAlerts = (crop.pestAlerts?.length || 0) > 0;
  const alertCount = crop.pestAlerts?.length || 0;

  const growthProgress = React.useMemo(() => {
    if (!crop.plantingDate) return 0;
    const planted = new Date(crop.plantingDate).getTime();
    const harvest = crop.expectedHarvest ? new Date(crop.expectedHarvest).getTime() : planted + 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const total = harvest - planted;
    const elapsed = now - planted;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  }, [crop.plantingDate, crop.expectedHarvest]);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        hasAlerts && "border-amber-300 hover:border-amber-400",
        !hasAlerts && "border-agriculture-field/20 hover:border-agriculture-field/40",
        className
      )}
      onClick={() => onNavigate?.(crop.id)}
      role={onNavigate ? "button" : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      {...props}
    >
      {hasAlerts && (
        <div className="absolute top-0 right-0">
          <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
            {alertCount} ALERT{alertCount > 1 ? "S" : ""}
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-agriculture-field/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{growth.icon}</span>
              <CardTitle className="text-base font-semibold truncate group-hover:text-agriculture-leafDark transition-colors">
                {crop.name}
              </CardTitle>
            </div>
            {crop.variety && (
              <p className="text-xs text-gray-500 ml-7">{crop.variety.name}</p>
            )}
          </div>
          <Badge variant={status.variant} dot size="sm">
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("font-medium", growth.color)}>{growth.label}</span>
          <span className="text-gray-300">•</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", seasonColors[crop.season] || seasonColors.SPRING)}>
            {crop.season}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {crop.areaPlantedHa && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Area</p>
              <p className="text-sm font-bold text-gray-900">{crop.areaPlantedHa} ha</p>
            </div>
          )}
          {crop.seedRate && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Seed Rate</p>
              <p className="text-sm font-bold text-gray-900">{crop.seedRate} kg/ha</p>
            </div>
          )}
          {crop.field && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Field</p>
              <p className="text-sm font-bold text-gray-900 truncate">{crop.field.name}</p>
            </div>
          )}
          {crop.plantingDate && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Planted</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(crop.plantingDate)}</p>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-gray-400 uppercase">Growth Progress</span>
            <span className="text-[10px] font-bold text-gray-700">{growthProgress}%</span>
          </div>
          <Progress
            value={growthProgress}
            color={growthProgress > 80 ? "green" : growthProgress > 50 ? "blue" : "yellow"}
          />
        </div>

        {showAI && crop.yieldForecasts && crop.yieldForecasts.length > 0 && (
          <div className="bg-agriculture-leaf/5 rounded-lg p-2 border border-agriculture-field/10">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="h-3 w-3 text-agriculture-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[10px] font-semibold text-agriculture-leafDark uppercase">AI Forecast</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-gray-900">
                {crop.yieldForecasts[0].predictedYield?.toLocaleString() || "—"}
              </span>
              <span className="text-[10px] text-gray-500">tons predicted</span>
            </div>
            {crop.yieldForecasts[0].confidence && (
              <div className="mt-1 flex items-center gap-1">
                <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-agriculture-leaf rounded-full"
                    style={{ width: `${crop.yieldForecasts[0].confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">
                  {Math.round(crop.yieldForecasts[0].confidence * 100)}% conf.
                </span>
              </div>
            )}
          </div>
        )}

        {crop._count && (
          <div className="flex items-center gap-3">
            {crop._count.harvestRecords > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="h-1 w-1 rounded-full bg-agriculture-harvest" />
                {crop._count.harvestRecords} harvests
              </div>
            )}
            {crop._count.pestAlerts > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-amber-500">
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                {crop._count.pestAlerts} alerts
              </div>
            )}
          </div>
        )}
      </CardContent>

      {!compact && (
        <CardFooter className="relative pt-2 pb-3 flex items-center justify-between text-xs text-gray-400">
          <span>
            {crop.expectedHarvest
              ? `Harvest by ${formatDate(crop.expectedHarvest)}`
              : "No harvest date set"}
          </span>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(crop.id);
              }}
              className="p-1 rounded text-gray-400 hover:text-agriculture-leaf hover:bg-agriculture-field/10 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export { CropCard };
export type { CropCardProps };
