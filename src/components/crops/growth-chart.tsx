"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GrowthStage } from "@/types";

interface GrowthStageData {
  stage: GrowthStage;
  startDate?: string;
  endDate?: string;
  progress?: number;
  notes?: string;
  healthScore?: number;
}

interface GrowthChartProps extends React.HTMLAttributes<HTMLDivElement> {
  cropName: string;
  currentStage: GrowthStage;
  stages: GrowthStageData[];
  plantingDate?: string;
  expectedHarvest?: string;
  showDetails?: boolean;
}

const stageConfig: Record<string, { label: string; color: string; bg: string; borderColor: string; icon: string; description: string; optimalDays: number }> = {
  GERMINATION: {
    label: "Germination",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    borderColor: "border-yellow-300",
    icon: "🌱",
    description: "Seed sprouting and root establishment",
    optimalDays: 14,
  },
  VEGETATIVE: {
    label: "Vegetative",
    color: "text-green-600",
    bg: "bg-green-50",
    borderColor: "border-green-300",
    icon: "🌿",
    description: "Leaf and stem growth phase",
    optimalDays: 45,
  },
  FLOWERING: {
    label: "Flowering",
    color: "text-pink-600",
    bg: "bg-pink-50",
    borderColor: "border-pink-300",
    icon: "🌸",
    description: "Bloom and pollination period",
    optimalDays: 21,
  },
  FRUITING: {
    label: "Fruiting",
    color: "text-orange-600",
    bg: "bg-orange-50",
    borderColor: "border-orange-300",
    icon: "🍅",
    description: "Fruit development and sizing",
    optimalDays: 30,
  },
  MATURATION: {
    label: "Maturation",
    color: "text-amber-700",
    bg: "bg-amber-50",
    borderColor: "border-amber-300",
    icon: "🌾",
    description: "Ripening and final development",
    optimalDays: 21,
  },
  HARVEST_READY: {
    label: "Harvest Ready",
    color: "text-green-800",
    bg: "bg-green-100",
    borderColor: "border-green-400",
    icon: "🚜",
    description: "Optimal time for harvesting",
    optimalDays: 7,
  },
};

const allStages: GrowthStage[] = ["GERMINATION", "VEGETATIVE", "FLOWERING", "FRUITING", "MATURATION", "HARVEST_READY"];

function GrowthTimeline({
  stages,
  currentStage,
  showDetails = false,
}: {
  stages: GrowthStageData[];
  currentStage: GrowthStage;
  showDetails?: boolean;
}) {
  const currentIndex = allStages.indexOf(currentStage);

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-1">
        {allStages.map((stage, index) => {
          const config = stageConfig[stage];
          const stageData = stages.find((s) => s.stage === stage);
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const progress = stageData?.progress || (isCompleted ? 100 : isCurrent ? 50 : 0);

          return (
            <div key={stage} className="relative flex items-start gap-3 py-2">
              <div
                className={cn(
                  "relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                  isCompleted && "bg-agriculture-leaf text-white shadow-sm",
                  isCurrent && "bg-agriculture-leaf text-white shadow-md ring-4 ring-agriculture-field/20",
                  isFuture && "bg-gray-100 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm">{config.icon}</span>
                )}
              </div>

              <div className={cn("flex-1 min-w-0", isFuture && "opacity-50")}>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", config.color)}>
                    {config.label}
                  </span>
                  {isCurrent && (
                    <Badge variant="primary" size="sm">Current</Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="default" size="sm">Done</Badge>
                  )}
                </div>

                {showDetails && (
                  <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                )}

                {stageData && (isCompleted || isCurrent) && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isCompleted ? "bg-agriculture-leaf" : "bg-agriculture-field"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500">{progress}%</span>
                    </div>
                    {stageData.startDate && (
                      <p className="text-[10px] text-gray-400">
                        {new Date(stageData.startDate).toLocaleDateString()}
                        {stageData.endDate && ` — ${new Date(stageData.endDate).toLocaleDateString()}`}
                      </p>
                    )}
                    {stageData.healthScore !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">Health:</span>
                        <span
                          className={cn(
                            "text-[10px] font-bold",
                            stageData.healthScore >= 80
                              ? "text-green-600"
                              : stageData.healthScore >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          )}
                        >
                          {stageData.healthScore}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isFuture && showDetails && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Est. {config.optimalDays} days
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GrowthBar({
  currentStage,
  plantingDate,
  expectedHarvest,
}: {
  currentStage: GrowthStage;
  plantingDate?: string;
  expectedHarvest?: string;
}) {
  const currentIndex = allStages.indexOf(currentStage);
  const progress = ((currentIndex + 0.5) / allStages.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-medium text-gray-500">
        <span>{plantingDate ? new Date(plantingDate).toLocaleDateString() : "Start"}</span>
        <span>{expectedHarvest ? new Date(expectedHarvest).toLocaleDateString() : "End"}</span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-agriculture-leaf/80 to-agriculture-leaf rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
        {allStages.map((stage, i) => {
          const pos = ((i + 1) / allStages.length) * 100;
          return (
            <div
              key={stage}
              className="absolute top-0 bottom-0 w-px bg-white/50"
              style={{ left: `${pos}%` }}
            />
          );
        })}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white border-2 border-agriculture-leaf rounded-full shadow-sm transition-all duration-500"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between">
        {allStages.map((stage, i) => {
          const config = stageConfig[stage];
          return (
            <div
              key={stage}
              className={cn(
                "text-center",
                i <= currentIndex ? "text-agriculture-leaf" : "text-gray-300"
              )}
            >
              <span className="text-sm">{config.icon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GrowthChart({
  cropName,
  currentStage,
  stages,
  plantingDate,
  expectedHarvest,
  showDetails = true,
  className,
  ...props
}: GrowthChartProps) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Growth Stages — {cropName}
          </CardTitle>
          <Badge variant="primary" size="sm">
            {stageConfig[currentStage]?.label || currentStage}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <GrowthBar
          currentStage={currentStage}
          plantingDate={plantingDate}
          expectedHarvest={expectedHarvest}
        />

        <div className="pt-2 border-t border-gray-100">
          <GrowthTimeline
            stages={stages}
            currentStage={currentStage}
            showDetails={showDetails}
          />
        </div>

        {showDetails && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-4 w-4 text-agriculture-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">Stage Details</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {stageConfig[currentStage]?.description}. The crop is currently in the {stageConfig[currentStage]?.label.toLowerCase()} phase.
              {plantingDate && ` Planted on ${new Date(plantingDate).toLocaleDateString()}.`}
              {expectedHarvest && ` Expected harvest: ${new Date(expectedHarvest).toLocaleDateString()}.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { GrowthChart, GrowthTimeline, GrowthBar, stageConfig };
export type { GrowthChartProps, GrowthStageData };
