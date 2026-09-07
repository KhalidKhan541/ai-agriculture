"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeatherForecast } from "@/types";

interface ForecastCardProps extends React.HTMLAttributes<HTMLDivElement> {
  forecast: WeatherForecast;
  showDetails?: boolean;
  compact?: boolean;
}

const conditionConfig: Record<string, { icon: string; bg: string; text: string; border: string; gradient: string }> = {
  SUNNY: { icon: "☀️", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", gradient: "from-amber-100 to-yellow-50" },
  PARTLY_CLOUDY: { icon: "⛅", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", gradient: "from-blue-100 to-sky-50" },
  CLOUDY: { icon: "☁️", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", gradient: "from-gray-100 to-slate-50" },
  RAINY: { icon: "🌧️", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", gradient: "from-blue-100 to-indigo-50" },
  HEAVY_RAIN: { icon: "⛈️", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", gradient: "from-indigo-100 to-purple-50" },
  STORMY: { icon: "🌩️", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", gradient: "from-purple-100 to-pink-50" },
  SNOWY: { icon: "❄️", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", gradient: "from-sky-100 to-cyan-50" },
  FOGGY: { icon: "🌫️", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", gradient: "from-slate-100 to-gray-50" },
  WINDY: { icon: "💨", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", gradient: "from-teal-100 to-emerald-50" },
  HAIL: { icon: "🌨️", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", gradient: "from-cyan-100 to-blue-50" },
};

const windDirection = (degrees: number): string => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
};

const uvLevel = (index: number): { label: string; color: string } => {
  if (index <= 2) return { label: "Low", color: "text-green-600" };
  if (index <= 5) return { label: "Moderate", color: "text-yellow-600" };
  if (index <= 7) return { label: "High", color: "text-orange-600" };
  if (index <= 10) return { label: "Very High", color: "text-red-600" };
  return { label: "Extreme", color: "text-purple-600" };
};

function ForecastCard({
  forecast,
  showDetails = false,
  compact = false,
  className,
  ...props
}: ForecastCardProps) {
  const config = conditionConfig[forecast.condition] || conditionConfig.SUNNY;
  const precipitationChance = forecast.precipitationChance ?? 0;
  const isRainy = ["RAINY", "HEAVY_RAIN", "STORMY", "HAIL"].includes(forecast.condition || "");

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all hover:shadow-md",
          config.bg, config.border,
          className
        )}
        {...props}
      >
        <span className="text-2xl">{config.icon}</span>
        <p className="text-xs font-medium text-gray-500">
          {forecast.date
            ? new Date(forecast.date).toLocaleDateString("en-US", { weekday: "short" })
            : "—"}
        </p>
        <p className={cn("text-lg font-bold", config.text)}>
          {forecast.tempMax != null ? `${Math.round(forecast.tempMax)}°` : "—"}
        </p>
        <p className="text-[10px] text-gray-400">
          {forecast.tempMin != null ? `${Math.round(forecast.tempMin)}°` : "—"}
        </p>
        {precipitationChance > 0 && (
          <div className="flex items-center gap-0.5">
            <span className="text-[10px]">💧</span>
            <span className="text-[10px] font-medium text-blue-500">
              {Math.round(precipitationChance)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5",
        "border", config.border,
        className
      )}
      {...props}
    >
      <div className={cn("h-1.5 bg-gradient-to-r", config.gradient)} />

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-gray-900">
              {forecast.date
                ? new Date(forecast.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : "Forecast"}
            </CardTitle>
            <p className={cn("text-sm font-medium", config.text)}>
              {forecast.condition?.replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-4xl">{config.icon}</span>
            {isRainy && (
              <Badge variant="secondary" size="sm">
                🌧️ Rain Expected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {forecast.tempMax != null ? `${Math.round(forecast.tempMax)}°` : "—"}
          </span>
          <span className="text-lg text-gray-400">/</span>
          <span className="text-lg font-medium text-gray-500">
            {forecast.tempMin != null ? `${Math.round(forecast.tempMin)}°` : "—"}
          </span>
          <span className="text-xs text-gray-400 ml-1">C</span>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Feels Like</p>
              <p className="text-sm font-bold text-gray-700">
                {forecast.feelsLike != null ? `${Math.round(forecast.feelsLike)}°` : "—"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Humidity</p>
              <p className="text-sm font-bold text-gray-700">
                {forecast.humidity != null ? `${Math.round(forecast.humidity)}%` : "—"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Wind</p>
              <p className="text-sm font-bold text-gray-700">
                {forecast.windSpeed != null
                  ? `${Math.round(forecast.windSpeed)} km/h ${
                      forecast.windDirection != null ? windDirection(forecast.windDirection) : ""
                    }`
                  : "—"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">UV Index</p>
              <p className={cn("text-sm font-bold", forecast.uvIndex != null ? uvLevel(forecast.uvIndex).color : "text-gray-700")}>
                {forecast.uvIndex ?? "—"}
                {forecast.uvIndex != null && (
                  <span className="text-[10px] font-normal ml-1">
                    {uvLevel(forecast.uvIndex).label}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-gray-400 uppercase">Precipitation Chance</span>
            <span className={cn(
              "text-xs font-bold",
              precipitationChance > 60 ? "text-blue-600" : precipitationChance > 30 ? "text-blue-400" : "text-gray-500"
            )}>
              {Math.round(precipitationChance)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                precipitationChance > 60
                  ? "bg-blue-500"
                  : precipitationChance > 30
                  ? "bg-blue-300"
                  : "bg-gray-300"
              )}
              style={{ width: `${precipitationChance}%` }}
            />
          </div>
        </div>

        {showDetails && forecast.sunrise && forecast.sunset && (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌅</span>
              <div>
                <p className="text-[10px] text-gray-400">Sunrise</p>
                <p className="text-xs font-bold text-gray-700">
                  {new Date(forecast.sunrise).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌇</span>
              <div>
                <p className="text-[10px] text-gray-400">Sunset</p>
                <p className="text-xs font-bold text-gray-700">
                  {new Date(forecast.sunset).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        )}

        {showDetails && forecast.precipitation != null && forecast.precipitation > 0 && (
          <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💧</span>
              <div>
                <p className="text-[10px] text-blue-500 font-medium">Expected Rainfall</p>
                <p className="text-sm font-bold text-blue-700">{forecast.precipitation} mm</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { ForecastCard };
export type { ForecastCardProps };
