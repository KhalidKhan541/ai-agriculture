"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface StatCard {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
  bgColor: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface CropYieldData {
  cropName: string;
  yield: number;
  area: number;
  yieldPerHa: number;
}

interface FarmAnalyticsProps extends React.HTMLAttributes<HTMLDivElement> {
  farmName: string;
  stats: StatCard[];
  revenue?: RevenueData[];
  cropYields?: CropYieldData[];
  topCrops?: { name: string; count: number; health: number }[];
  recentActivity?: { type: string; description: string; time: string }[];
  period?: string;
}

function MiniBarChart({ data, height = 60 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
              {item.label}: {item.value.toLocaleString()}
            </div>
            <div
              className={cn("w-full rounded-t transition-all group-hover:opacity-80", item.color || "bg-agriculture-leaf")}
              style={{ height: `${barHeight}%` }}
            />
            <span className="text-[8px] text-gray-400">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function RevenueChart({ data }: { data: RevenueData[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.expenses, d.profit]), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-40">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative h-full justify-end">
            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap z-10">
              <div>Revenue: ${item.revenue.toLocaleString()}</div>
              <div>Expenses: ${item.expenses.toLocaleString()}</div>
              <div>Profit: ${item.profit.toLocaleString()}</div>
            </div>
            <div className="flex items-end gap-px w-full justify-center" style={{ height: "100%" }}>
              <div
                className="w-2 bg-green-500 rounded-t group-hover:opacity-80 transition-all"
                style={{ height: `${(item.revenue / maxVal) * 100}%` }}
              />
              <div
                className="w-2 bg-red-400 rounded-t group-hover:opacity-80 transition-all"
                style={{ height: `${(item.expenses / maxVal) * 100}%` }}
              />
              <div
                className="w-2 bg-blue-500 rounded-t group-hover:opacity-80 transition-all"
                style={{ height: `${(item.profit / maxVal) * 100}%` }}
              />
            </div>
            <span className="text-[8px] text-gray-400 mt-1">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500" />Revenue</div>
        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-400" />Expenses</div>
        <div className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-blue-500" />Profit</div>
      </div>
    </div>
  );
}

function CropYieldChart({ data }: { data: CropYieldData[] }) {
  const maxVal = Math.max(...data.map((d) => d.yieldPerHa), 1);
  const colors = ["bg-green-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">{item.cropName}</span>
            <span className="text-xs text-gray-500">{item.yieldPerHa.toFixed(1)} t/ha</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", colors[i % colors.length])}
              style={{ width: `${(item.yieldPerHa / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FarmAnalytics({
  farmName,
  stats,
  revenue,
  cropYields,
  topCrops,
  recentActivity,
  period = "This Month",
  className,
  ...props
}: FarmAnalyticsProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Farm Analytics</h2>
          <p className="text-xs text-gray-500">{farmName} &middot; {period}</p>
        </div>
        <Badge variant="secondary" size="sm">Live Data</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className={cn("border", stat.bgColor)}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-[10px] font-medium text-gray-500 uppercase">{stat.label}</span>
              </div>
              <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
              {stat.change != null && (
                <div className={cn("flex items-center gap-0.5 text-[10px] font-bold mt-1",
                  stat.change >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  <svg
                    className={cn("h-2.5 w-2.5", stat.change < 0 && "rotate-180")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {Math.abs(stat.change)}% vs last period
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {revenue && revenue.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenue} />
            </CardContent>
          </Card>
        )}

        {cropYields && cropYields.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Crop Yield Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <CropYieldChart data={cropYields} />
            </CardContent>
          </Card>
        )}

        {topCrops && topCrops.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Crops</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCrops.map((crop, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-agriculture-field/10 flex items-center justify-center shrink-0">
                    <span className="text-sm">🌾</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900 truncate">{crop.name}</span>
                      <span className="text-xs text-gray-500">{crop.count} plots</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={crop.health}
                        color={crop.health > 80 ? "green" : crop.health > 50 ? "yellow" : "red"}
                        className="h-1.5"
                      />
                      <span className="text-[10px] font-bold text-gray-600 w-8 text-right">{crop.health}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {recentActivity && recentActivity.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActivity.slice(0, 5).map((activity, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px]">
                      {activity.type === "planting" && "🌱"}
                      {activity.type === "harvest" && "🌾"}
                      {activity.type === "irrigation" && "💧"}
                      {activity.type === "alert" && "⚠️"}
                      {activity.type === "equipment" && "🚜"}
                      {!["planting", "harvest", "irrigation", "alert", "equipment"].includes(activity.type) && "📋"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 truncate">{activity.description}</p>
                    <p className="text-[10px] text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export { FarmAnalytics, MiniBarChart, RevenueChart, CropYieldChart };
export type { FarmAnalyticsProps, StatCard, RevenueData, CropYieldData };
