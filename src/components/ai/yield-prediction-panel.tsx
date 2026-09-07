"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface YieldDataPoint {
  date: string;
  actual?: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
}

interface YieldPredictionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  cropName: string;
  predictedYield: number;
  confidence: number;
  historicalAverage: number;
  unit?: string;
  dataPoints: YieldDataPoint[];
  factors?: { name: string; impact: "positive" | "negative" | "neutral"; magnitude: number }[];
  lastUpdated?: string;
  onRefresh?: () => void;
}

function YieldComparisonChart({ dataPoints }: { dataPoints: YieldDataPoint[] }) {
  const allValues = dataPoints.flatMap((d) => [d.actual, d.predicted, d.lowerBound, d.upperBound].filter((v): v is number => v != null));
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  return (
    <div className="relative">
      <div className="flex items-end gap-1 h-32 px-1">
        {dataPoints.map((point, i) => {
          const actualHeight = point.actual != null ? ((point.actual - minVal) / range) * 100 : 0;
          const predictedHeight = point.predicted != null ? ((point.predicted - minVal) / range) * 100 : 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              {point.upperBound != null && point.lowerBound != null && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[12px] bg-agriculture-leaf/10 rounded"
                  style={{
                    height: `${((point.upperBound - point.lowerBound) / range) * 100}%`,
                    bottom: `${((point.lowerBound - minVal) / range) * 100}%`,
                  }}
                />
              )}
              <div className="relative w-full flex justify-center items-end gap-px" style={{ height: "100%" }}>
                {point.actual != null && (
                  <div
                    className="w-2 bg-agriculture-leaf rounded-t transition-all group-hover:opacity-80"
                    style={{ height: `${actualHeight}%` }}
                  />
                )}
                {point.predicted != null && (
                  <div
                    className="w-2 bg-blue-400 rounded-t transition-all group-hover:opacity-80 border border-dashed border-blue-600"
                    style={{ height: `${predictedHeight}%` }}
                  />
                )}
              </div>
              <div className="absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {point.actual != null && `Actual: ${point.actual}`}
                {point.predicted != null && `${point.actual != null ? " | " : ""}Pred: ${point.predicted}`}
              </div>
              <span className="text-[8px] text-gray-400 mt-1">
                {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImpactFactorBar({ factor }: { factor: { name: string; impact: "positive" | "negative" | "neutral"; magnitude: number } }) {
  const colorMap = {
    positive: { bg: "bg-green-500", text: "text-green-600", icon: "↑" },
    negative: { bg: "bg-red-500", text: "text-red-600", icon: "↓" },
    neutral: { bg: "bg-gray-400", text: "text-gray-500", icon: "→" },
  };

  const config = colorMap[factor.impact];

  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-xs font-bold w-4 text-center", config.text)}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 truncate">{factor.name}</span>
          <span className={cn("text-[10px] font-bold", config.text)}>
            {factor.impact === "positive" ? "+" : factor.impact === "negative" ? "-" : ""}{Math.round(factor.magnitude * 100)}%
          </span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-0.5">
          <div
            className={cn("h-full rounded-full transition-all", config.bg)}
            style={{ width: `${Math.min(factor.magnitude * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function YieldPredictionPanel({
  cropName,
  predictedYield,
  confidence,
  historicalAverage,
  unit = "tons/ha",
  dataPoints,
  factors = [],
  lastUpdated,
  onRefresh,
  className,
  ...props
}: YieldPredictionPanelProps) {
  const changePercent = historicalAverage > 0
    ? ((predictedYield - historicalAverage) / historicalAverage) * 100
    : 0;
  const isPositive = changePercent >= 0;

  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Yield Prediction</CardTitle>
              <p className="text-xs text-gray-500">{cropName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm">
              AI Powered
            </Badge>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-[10px] font-medium text-blue-500 uppercase">Predicted Yield</p>
            <p className="text-xl font-bold text-blue-700">
              {predictedYield.toFixed(1)} <span className="text-xs font-normal">{unit}</span>
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Historical Avg</p>
            <p className="text-xl font-bold text-gray-700">
              {historicalAverage.toFixed(1)} <span className="text-xs font-normal">{unit}</span>
            </p>
          </div>
          <div className={cn("rounded-lg p-3 border", isPositive ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100")}>
            <p className={cn("text-[10px] font-medium uppercase", isPositive ? "text-green-500" : "text-red-500")}>vs Average</p>
            <p className={cn("text-xl font-bold", isPositive ? "text-green-700" : "text-red-700")}>
              {isPositive ? "+" : ""}{changePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Model Confidence</span>
            <span className="text-xs font-bold text-gray-700">{Math.round(confidence * 100)}%</span>
          </div>
          <Progress
            value={confidence * 100}
            color={confidence > 0.8 ? "green" : confidence > 0.6 ? "blue" : "yellow"}
          />
        </div>

        {dataPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Yield Trend</h4>
            <div className="pt-4 pb-6">
              <YieldComparisonChart dataPoints={dataPoints} />
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-agriculture-leaf" />
                Actual
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-blue-400 border border-dashed border-blue-600" />
                Predicted
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-agriculture-leaf/20" />
                Confidence Range
              </div>
            </div>
          </div>
        )}

        {factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Impact Factors</h4>
            <div className="space-y-2">
              {factors.map((factor, i) => (
                <ImpactFactorBar key={i} factor={factor} />
              ))}
            </div>
          </div>
        )}

        {lastUpdated && (
          <p className="text-[10px] text-gray-400 text-center">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { YieldPredictionPanel, YieldComparisonChart, ImpactFactorBar };
export type { YieldPredictionPanelProps, YieldDataPoint };
