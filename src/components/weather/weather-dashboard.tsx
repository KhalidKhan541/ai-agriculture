"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Weather, WeatherForecast } from "@/types";

interface WeatherDashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  currentWeather: Weather | null;
  forecast: WeatherForecast[];
  alerts?: { type: string; severity: string; message: string; validUntil: string }[];
  historical?: {
    averageTemp: number;
    totalRainfall: number;
    sunnyDays: number;
    rainyDays: number;
  };
  onRefresh?: () => void;
}

const conditionIcons: Record<string, string> = {
  SUNNY: "☀️",
  PARTLY_CLOUDY: "⛅",
  CLOUDY: "☁️",
  RAINY: "🌧️",
  HEAVY_RAIN: "⛈️",
  STORMY: "🌩️",
  SNOWY: "❄️",
  FOGGY: "🌫️",
  WINDY: "💨",
  HAIL: "🌨️",
};

const conditionColors: Record<string, { bg: string; text: string; border: string }> = {
  SUNNY: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  PARTLY_CLOUDY: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  CLOUDY: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  RAINY: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  HEAVY_RAIN: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  STORMY: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  SNOWY: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  FOGGY: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  WINDY: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  HAIL: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
};

const severityConfig: Record<string, { variant: "destructive" | "warning" | "secondary"; icon: string }> = {
  SEVERE: { variant: "destructive", icon: "🔴" },
  HIGH: { variant: "warning", icon: "🟠" },
  MODERATE: { variant: "warning", icon: "🟡" },
  LOW: { variant: "secondary", icon: "🔵" },
};

function CurrentWeatherCard({ weather }: { weather: Weather | null }) {
  if (!weather) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <svg className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <p className="text-sm text-gray-500">No weather data available</p>
        </CardContent>
      </Card>
    );
  }

  const cond = conditionColors[weather.condition] || conditionColors.SUNNY;

  return (
    <Card className={cn("overflow-hidden", cond.bg, "border", cond.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{conditionIcons[weather.condition] || "☀️"}</span>
              <div>
                <p className={cn("text-4xl font-bold", cond.text)}>
                  {weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}
                </p>
                <p className={cn("text-sm font-medium mt-0.5", cond.text)}>
                  {weather.condition?.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            {weather.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {weather.location}
              </p>
            )}
          </div>

          <Badge variant="primary" size="sm">
            {weather.recordedAt
              ? formatRelativeTime(weather.recordedAt)
              : "Live"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-black/5">
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Feels Like</p>
            <p className="text-sm font-bold text-gray-900">
              {weather.feelsLike != null ? `${Math.round(weather.feelsLike)}°` : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Humidity</p>
            <p className="text-sm font-bold text-gray-900">
              {weather.humidity != null ? `${Math.round(weather.humidity)}%` : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Wind</p>
            <p className="text-sm font-bold text-gray-900">
              {weather.windSpeed != null ? `${Math.round(weather.windSpeed)} km/h` : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Precipitation</p>
            <p className="text-sm font-bold text-gray-900">
              {weather.precipitation != null ? `${weather.precipitation} mm` : "0 mm"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">UV Index</p>
            <p className="text-sm font-bold text-gray-900">{weather.uvIndex ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Pressure</p>
            <p className="text-sm font-bold text-gray-900">
              {weather.pressure != null ? `${weather.pressure} hPa` : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Visibility</p>
            <p className="text-sm font-bold text-gray-900">
              {weather.visibility != null ? `${weather.visibility} km` : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Dew Point</p>
            <p className="text-sm font-bold text-gray-900">
              {weather.dewPoint != null ? `${Math.round(weather.dewPoint)}°` : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastList({ forecast }: { forecast: WeatherForecast[] }) {
  if (forecast.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-gray-500">No forecast available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {forecast.slice(0, 7).map((day, i) => {
        const cond = conditionColors[day.condition] || conditionColors.SUNNY;
        return (
          <div
            key={day.id || i}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              "hover:bg-gray-50",
              cond.bg, cond.border
            )}
          >
            <span className="text-2xl w-8 text-center">{conditionIcons[day.condition] || "☀️"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {day.date ? new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : `Day ${i + 1}`}
              </p>
              <p className="text-xs text-gray-500 truncate">{day.condition?.replace(/_/g, " ")}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">
                {day.tempMax != null ? `${Math.round(day.tempMax)}°` : "—"}
                <span className="text-gray-400 font-normal"> / </span>
                {day.tempMin != null ? `${Math.round(day.tempMin)}°` : "—"}
              </p>
              {day.precipitationChance != null && (
                <p className="text-[10px] text-blue-500 font-medium">
                  💧 {Math.round(day.precipitationChance)}%
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeatherAlerts({ alerts }: { alerts: { type: string; severity: string; message: string; validUntil: string }[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const config = severityConfig[alert.severity] || severityConfig.LOW;
        return (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2 p-3 rounded-lg border",
              config.variant === "destructive" && "bg-red-50 border-red-200",
              config.variant === "warning" && "bg-amber-50 border-amber-200",
              config.variant === "secondary" && "bg-blue-50 border-blue-200"
            )}
          >
            <span className="text-sm mt-0.5">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{alert.type}</span>
                <Badge variant={config.variant} size="sm">{alert.severity}</Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
              {alert.validUntil && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Valid until {formatDate(alert.validUntil)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistoricalStats({ historical }: { historical: { averageTemp: number; totalRainfall: number; sunnyDays: number; rainyDays: number } }) {
  const stats = [
    { label: "Avg Temperature", value: `${Math.round(historical.averageTemp)}°C`, icon: "🌡️", color: "text-orange-600" },
    { label: "Total Rainfall", value: `${historical.totalRainfall} mm`, icon: "🌧️", color: "text-blue-600" },
    { label: "Sunny Days", value: `${historical.sunnyDays}`, icon: "☀️", color: "text-yellow-600" },
    { label: "Rainy Days", value: `${historical.rainyDays}`, icon: "🌧️", color: "text-blue-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{stat.icon}</span>
            <span className="text-[10px] font-medium text-gray-500 uppercase">{stat.label}</span>
          </div>
          <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return formatDate(date);
}

function WeatherDashboard({
  currentWeather,
  forecast,
  alerts = [],
  historical,
  onRefresh,
  className,
  ...props
}: WeatherDashboardProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Weather Overview</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg text-gray-400 hover:text-agriculture-leaf hover:bg-agriculture-field/10 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      <CurrentWeatherCard weather={currentWeather} />

      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="text-amber-500">⚠️</span>
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeatherAlerts alerts={alerts} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">7-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastList forecast={forecast} />
          </CardContent>
        </Card>

        {historical && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">This Month Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoricalStats historical={historical} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export { WeatherDashboard, CurrentWeatherCard, ForecastList, WeatherAlerts, HistoricalStats };
export type { WeatherDashboardProps };
