"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface HealthIndicator {
  name: string;
  score: number;
  status: "good" | "warning" | "critical";
  details?: string;
}

interface RiskFactor {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  confidence?: number;
}

interface RecommendedAction {
  action: string;
  priority: "low" | "medium" | "high";
  reason: string;
  estimatedImpact?: string;
}

interface CropHealthPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  cropName: string;
  overallScore: number;
  indicators: HealthIndicator[];
  riskFactors: RiskFactor[];
  actions: RecommendedAction[];
  lastAnalyzed?: string;
  confidence?: number;
  onRefresh?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const severityConfig: Record<string, { variant: "destructive" | "warning" | "secondary"; icon: string }> = {
  high: { variant: "destructive", icon: "🔴" },
  medium: { variant: "warning", icon: "🟡" },
  low: { variant: "secondary", icon: "🔵" },
};

const priorityConfig: Record<string, { variant: "destructive" | "warning" | "secondary" | "primary"; label: string }> = {
  high: { variant: "destructive", label: "Urgent" },
  medium: { variant: "warning", label: "Important" },
  low: { variant: "secondary", label: "Optional" },
};

function HealthGauge({ score, size = "lg" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", text: "text-green-600", label: "Healthy" };
    if (s >= 60) return { stroke: "#eab308", text: "text-yellow-600", label: "Fair" };
    if (s >= 40) return { stroke: "#f97316", text: "text-orange-600", label: "Poor" };
    return { stroke: "#ef4444", text: "text-red-600", label: "Critical" };
  };

  const config = getColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "h-20 w-20",
    md: "h-28 w-28",
    lg: "h-36 w-36",
  };

  const textSize = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={config.stroke}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold text-gray-900", textSize[size])}>{score}</span>
          <span className="text-[10px] text-gray-500 -mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={cn("text-xs font-semibold", config.text)}>{config.label}</span>
    </div>
  );
}

function HealthIndicatorBar({ indicator }: { indicator: HealthIndicator }) {
  const colors = statusColors[indicator.status] || statusColors.good;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", indicator.status === "good" ? "bg-green-500" : indicator.status === "warning" ? "bg-amber-500" : "bg-red-500")} />
          <span className="text-xs font-medium text-gray-700">{indicator.name}</span>
        </div>
        <span className={cn("text-xs font-bold", colors.text)}>{indicator.score}%</span>
      </div>
      <Progress
        value={indicator.score}
        color={indicator.status === "good" ? "green" : indicator.status === "warning" ? "yellow" : "red"}
      />
      {indicator.details && (
        <p className="text-[10px] text-gray-500 pl-4">{indicator.details}</p>
      )}
    </div>
  );
}

function RiskFactorCard({ risk }: { risk: RiskFactor }) {
  const config = severityConfig[risk.severity] || severityConfig.low;

  return (
    <div className={cn(
      "flex items-start gap-2 p-2.5 rounded-lg border",
      risk.severity === "high" && "bg-red-50 border-red-200",
      risk.severity === "medium" && "bg-amber-50 border-amber-200",
      risk.severity === "low" && "bg-blue-50 border-blue-200"
    )}>
      <span className="text-sm shrink-0 mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-900">{risk.type}</span>
          <Badge variant={config.variant} size="sm">{risk.severity}</Badge>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">{risk.description}</p>
        {risk.confidence != null && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-gray-400">Confidence:</span>
            <span className="text-[10px] font-bold text-gray-600">{Math.round(risk.confidence * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: RecommendedAction }) {
  const config = priorityConfig[action.priority] || priorityConfig.low;

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-200 bg-white">
      <div className="h-5 w-5 rounded-full bg-agriculture-leaf/10 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="h-3 w-3 text-agriculture-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-900">{action.action}</span>
          <Badge variant={config.variant} size="sm">{config.label}</Badge>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">{action.reason}</p>
        {action.estimatedImpact && (
          <p className="text-[10px] text-agriculture-leaf font-medium mt-1">
            Expected: {action.estimatedImpact}
          </p>
        )}
      </div>
    </div>
  );
}

function CropHealthPanel({
  cropName,
  overallScore,
  indicators,
  riskFactors,
  actions,
  lastAnalyzed,
  confidence,
  onRefresh,
  className,
  ...props
}: CropHealthPanelProps) {
  const criticalRisks = riskFactors.filter((r) => r.severity === "high").length;
  const urgentActions = actions.filter((a) => a.priority === "high").length;

  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-agriculture-leaf/10 flex items-center justify-center">
              <svg className="h-5 w-5 text-agriculture-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base font-semibold">AI Crop Health</CardTitle>
              <p className="text-xs text-gray-500">{cropName}</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-md text-gray-400 hover:text-agriculture-leaf hover:bg-agriculture-field/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-6">
          <HealthGauge score={overallScore} />
          <div className="flex-1 space-y-2">
            {indicators.slice(0, 4).map((indicator) => (
              <HealthIndicatorBar key={indicator.name} indicator={indicator} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {lastAnalyzed && (
            <span>Analyzed {new Date(lastAnalyzed).toLocaleString()}</span>
          )}
          {confidence != null && (
            <span>Confidence: {Math.round(confidence * 100)}%</span>
          )}
          {criticalRisks > 0 && (
            <span className="text-red-500 font-medium">{criticalRisks} critical risk{criticalRisks > 1 ? "s" : ""}</span>
          )}
          {urgentActions > 0 && (
            <span className="text-amber-500 font-medium">{urgentActions} urgent action{urgentActions > 1 ? "s" : ""}</span>
          )}
        </div>

        {riskFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Risk Factors</h4>
            <div className="space-y-2">
              {riskFactors.map((risk, i) => (
                <RiskFactorCard key={i} risk={risk} />
              ))}
            </div>
          </div>
        )}

        {actions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recommended Actions</h4>
            <div className="space-y-2">
              {actions.map((action, i) => (
                <ActionCard key={i} action={action} />
              ))}
            </div>
          </div>
        )}

        {indicators.length > 4 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">All Indicators</h4>
            <div className="space-y-2">
              {indicators.slice(4).map((indicator) => (
                <HealthIndicatorBar key={indicator.name} indicator={indicator} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { CropHealthPanel, HealthGauge, HealthIndicatorBar, RiskFactorCard, ActionCard };
export type { CropHealthPanelProps, HealthIndicator, RiskFactor, RecommendedAction };
