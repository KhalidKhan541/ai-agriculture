"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { PestAlert } from "@/types";

interface PestAlertCardProps extends React.HTMLAttributes<HTMLDivElement> {
  alert: PestAlert;
  onResolve?: (alertId: string) => void;
  onView?: (alertId: string) => void;
  compact?: boolean;
}

const severityConfig: Record<string, { label: string; variant: "destructive" | "warning" | "secondary" | "default" | "primary"; icon: string; bgClass: string; borderClass: string }> = {
  CRITICAL: {
    label: "Critical",
    variant: "destructive",
    icon: "🔴",
    bgClass: "bg-red-50",
    borderClass: "border-red-200 hover:border-red-300",
  },
  SEVERE: {
    label: "Severe",
    variant: "destructive",
    icon: "🟠",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200 hover:border-orange-300",
  },
  HIGH: {
    label: "High",
    variant: "warning",
    icon: "🟡",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200 hover:border-amber-300",
  },
  MODERATE: {
    label: "Moderate",
    variant: "secondary",
    icon: "🔵",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200 hover:border-blue-300",
  },
  LOW: {
    label: "Low",
    variant: "default",
    icon: "⚪",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200 hover:border-gray-300",
  },
};

const detectionMethodIcons: Record<string, { icon: string; label: string }> = {
  manual: { icon: "👁️", label: "Manual" },
  sensor: { icon: "📡", label: "Sensor" },
  satellite: { icon: "🛰️", label: "Satellite" },
  drone: { icon: "🚁", label: "Drone" },
};

function PestAlertCard({
  alert,
  onResolve,
  onView,
  compact = false,
  className,
  ...props
}: PestAlertCardProps) {
  const severity = severityConfig[alert.severity] || severityConfig.MODERATE;
  const detection = alert.detectedBy ? detectionMethodIcons[alert.detectedBy] : null;
  const isResolved = alert.resolved;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "hover:shadow-md",
        isResolved ? "opacity-60 bg-gray-50" : severity.bgClass,
        isResolved ? "border-gray-200" : severity.borderClass,
        className
      )}
      {...props}
    >
      {isResolved && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
          RESOLVED
        </div>
      )}

      {!isResolved && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-current to-transparent opacity-50"
          style={{ color: severity.variant === "destructive" ? "#ef4444" : severity.variant === "warning" ? "#f59e0b" : "#6b7280" }}
        />
      )}

      <CardHeader className={cn("pb-2", compact && "pt-3 pb-1")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-lg shrink-0 mt-0.5">{severity.icon}</span>
            <div className="space-y-0.5 min-w-0">
              <CardTitle className={cn("font-semibold text-gray-900 truncate", compact ? "text-sm" : "text-base")}>
                {alert.pest?.name || "Pest Alert"}
              </CardTitle>
              {alert.pest?.scientificName && (
                <p className="text-xs text-gray-500 italic">{alert.pest.scientificName}</p>
              )}
            </div>
          </div>
          <Badge variant={severity.variant} size="sm">
            {severity.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-3", compact && "space-y-2")}>
        {alert.description && (
          <p className={cn("text-gray-600 leading-relaxed", compact ? "text-xs" : "text-sm")}>
            {alert.description}
          </p>
        )}

        <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3")}>
          {alert.field && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Field</p>
              <p className="text-xs font-bold text-gray-700 truncate">{alert.field.name}</p>
            </div>
          )}
          {alert.crop && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Crop</p>
              <p className="text-xs font-bold text-gray-700 truncate">{alert.crop.name}</p>
            </div>
          )}
          {alert.areaHa && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Affected Area</p>
              <p className="text-xs font-bold text-amber-600">{alert.areaHa} ha</p>
            </div>
          )}
          {detection && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Detected By</p>
              <div className="flex items-center gap-1">
                <span className="text-xs">{detection.icon}</span>
                <p className="text-xs font-bold text-gray-700">{detection.label}</p>
              </div>
            </div>
          )}
        </div>

        {alert.latitude != null && alert.longitude != null && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
          </div>
        )}

        {alert.imageUrl && (
          <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={alert.imageUrl}
              alt="Pest detection"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
              <p className="text-[10px] text-white font-medium">Detection Image</p>
            </div>
          </div>
        )}

        {!compact && alert.metadata && typeof alert.metadata === "object" && Object.keys(alert.metadata as Record<string, unknown>).length > 0 && (
          <div className="bg-white/50 rounded-lg p-2 border border-gray-100">
            <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Additional Info</p>
            <div className="space-y-0.5">
              {Object.entries(alert.metadata as Record<string, unknown>).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="font-medium text-gray-700">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className={cn("pt-2 flex items-center justify-between", compact && "pt-1 pb-2")}>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {alert.detectedAt ? formatRelativeTime(alert.detectedAt) : "Recently"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isResolved && onResolve && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(alert.id);
              }}
              className="px-2.5 py-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
            >
              Mark Resolved
            </button>
          )}
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(alert.id);
              }}
              className="px-2.5 py-1 text-[10px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            >
              Details
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export { PestAlertCard };
export type { PestAlertCardProps };
