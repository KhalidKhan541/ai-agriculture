"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WaterUsageData {
  date: string;
  volume: number;
  efficiency?: number;
  cost?: number;
}

interface WaterChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: WaterUsageData[];
  title?: string;
  totalVolume?: number;
  averageEfficiency?: number;
  costPerLiter?: number;
  period?: "daily" | "weekly" | "monthly";
  onPeriodChange?: (period: "daily" | "weekly" | "monthly") => void;
}

const periodLabels = {
  daily: "Last 7 Days",
  weekly: "Last 4 Weeks",
  monthly: "Last 12 Months",
};

function BarChart({ data, maxValue }: { data: WaterUsageData[]; maxValue: number }) {
  const maxVol = maxValue || Math.max(...data.map((d) => d.volume), 1);

  return (
    <div className="flex items-end gap-1.5 h-40 px-2">
      {data.map((item, i) => {
        const height = (item.volume / maxVol) * 100;
        const isHigh = item.volume > maxVol * 0.8;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex justify-center">
              <div
                className={cn(
                  "absolute bottom-0 w-full max-w-[40px] rounded-t-md transition-all duration-500 group-hover:opacity-80",
                  isHigh ? "bg-agriculture-water" : "bg-agriculture-waterLight"
                )}
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  {item.volume.toLocaleString()}L
                </div>
              </div>
            </div>
            <span className="text-[9px] text-gray-400 font-medium">
              {new Date(item.date).toLocaleDateString("en-US", { day: "numeric" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EfficiencyLine({ data }: { data: WaterUsageData[] }) {
  const hasEfficiency = data.some((d) => d.efficiency !== undefined);
  if (!hasEfficiency) return null;

  const avgEfficiency = data.reduce((sum, d) => sum + (d.efficiency || 0), 0) / data.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-[10px] text-gray-500">Efficiency</span>
      </div>
      <span className="text-xs font-bold text-green-600">
        {Math.round(avgEfficiency)}%
      </span>
    </div>
  );
}

function WaterChart({
  data,
  title = "Water Usage",
  totalVolume,
  averageEfficiency,
  costPerLiter,
  period = "daily",
  onPeriodChange,
  className,
  ...props
}: WaterChartProps) {
  const maxValue = Math.max(...data.map((d) => d.volume), 1);
  const total = totalVolume || data.reduce((sum, d) => sum + d.volume, 0);
  const avgEfficiency = averageEfficiency || (data.reduce((sum, d) => sum + (d.efficiency || 0), 0) / data.length) || 0;
  const totalCost = costPerLiter ? total * costPerLiter : data.reduce((sum, d) => sum + (d.cost || 0), 0);

  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>💧</span>
            {title}
          </CardTitle>
          {onPeriodChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={cn(
                    "px-2 py-1 text-[10px] font-medium rounded-md transition-all",
                    period === p
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">{periodLabels[period]}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-agriculture-water/5 rounded-lg p-2.5 border border-agriculture-water/10">
            <p className="text-[10px] font-medium text-agriculture-water uppercase">Total Usage</p>
            <p className="text-lg font-bold text-agriculture-waterDark">
              {total.toLocaleString()} <span className="text-[10px] font-normal">L</span>
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
            <p className="text-[10px] font-medium text-green-600 uppercase">Efficiency</p>
            <p className="text-lg font-bold text-green-700">{Math.round(avgEfficiency)}%</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
            <p className="text-[10px] font-medium text-blue-600 uppercase">
              {costPerLiter ? "Cost" : "Sessions"}
            </p>
            <p className="text-lg font-bold text-blue-700">
              {costPerLiter
                ? `$${totalCost.toFixed(2)}`
                : data.length}
            </p>
          </div>
        </div>

        <div className="relative">
          <BarChart data={data} maxValue={maxValue} />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
            {[0, 25, 50, 75, 100].map((tick) => (
              <div
                key={tick}
                className="absolute left-0 right-0 border-t border-gray-100 border-dashed"
                style={{ top: `${100 - tick}%` }}
              >
                <span className="absolute -left-1 -top-2 text-[8px] text-gray-300">
                  {Math.round((tick / 100) * maxValue).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <EfficiencyLine data={data} />
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="h-2 w-2 rounded bg-agriculture-waterLight" />
            Normal
            <span className="h-2 w-2 rounded bg-agriculture-water ml-2" />
            High
          </div>
        </div>

        {data.some((d) => d.cost) && (
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] font-medium text-gray-400 uppercase mb-2">Daily Breakdown</p>
            <div className="space-y-1">
              {data.slice(-5).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {new Date(item.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium">{item.volume.toLocaleString()}L</span>
                    {item.cost != null && (
                      <span className="text-green-600 font-bold">${item.cost.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { WaterChart };
export type { WaterChartProps, WaterUsageData };
