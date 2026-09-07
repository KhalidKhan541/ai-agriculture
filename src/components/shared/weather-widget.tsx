"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Weather } from "@/types";

interface WeatherWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  weather: Weather | null;
  compact?: boolean;
  showLocation?: boolean;
  onClick?: () => void;
}

const conditionConfig: Record<string, { icon: string; bg: string; text: string; gradient: string }> = {
  SUNNY: { icon: "☀️", bg: "bg-amber-50", text: "text-amber-700", gradient: "from-amber-400 to-yellow-300" },
  PARTLY_CLOUDY: { icon: "⛅", bg: "bg-blue-50", text: "text-blue-700", gradient: "from-blue-400 to-sky-300" },
  CLOUDY: { icon: "☁️", bg: "bg-gray-50", text: "text-gray-700", gradient: "from-gray-400 to-slate-300" },
  RAINY: { icon: "🌧️", bg: "bg-blue-50", text: "text-blue-700", gradient: "from-blue-500 to-indigo-400" },
  HEAVY_RAIN: { icon: "⛈️", bg: "bg-indigo-50", text: "text-indigo-700", gradient: "from-indigo-500 to-purple-400" },
  STORMY: { icon: "🌩️", bg: "bg-purple-50", text: "text-purple-700", gradient: "from-purple-500 to-pink-400" },
  SNOWY: { icon: "❄️", bg: "bg-sky-50", text: "text-sky-700", gradient: "from-sky-400 to-cyan-300" },
  FOGGY: { icon: "🌫️", bg: "bg-slate-50", text: "text-slate-700", gradient: "from-slate-400 to-gray-300" },
  WINDY: { icon: "💨", bg: "bg-teal-50", text: "text-teal-700", gradient: "from-teal-400 to-emerald-300" },
  HAIL: { icon: "🌨️", bg: "bg-cyan-50", text: "text-cyan-700", gradient: "from-cyan-400 to-blue-300" },
};

function WeatherWidget({
  weather,
  compact = false,
  showLocation = true,
  onClick,
  className,
  ...props
}: WeatherWidgetProps) {
  const config = weather ? conditionConfig[weather.condition] || conditionConfig.SUNNY : conditionConfig.SUNNY;

  if (!weather) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200",
          onClick && "cursor-pointer hover:bg-gray-100 transition-colors",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <span className="text-lg">🌤️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Weather unavailable</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
          config.bg,
          onClick && "cursor-pointer hover:shadow-md",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-lg font-bold", config.text)}>
            {weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}
          </p>
        </div>
        {showLocation && weather.location && (
          <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{weather.location}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all",
        config.bg,
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", config.gradient)} />

      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <p className={cn("text-2xl font-bold", config.text)}>
                  {weather.temperature != null ? `${Math.round(weather.temperature)}°C` : "—"}
                </p>
                <p className={cn("text-xs font-medium", config.text)}>
                  {weather.condition?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            {showLocation && weather.location && (
              <p className="text-[10px] text-gray-500 flex items-center gap-1 ml-1">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {weather.location}
              </p>
            )}
          </div>

          <div className="text-right space-y-0.5">
            {weather.humidity != null && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span>💧</span>
                <span className="font-medium">{Math.round(weather.humidity)}%</span>
              </div>
            )}
            {weather.windSpeed != null && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span>💨</span>
                <span className="font-medium">{Math.round(weather.windSpeed)} km/h</span>
              </div>
            )}
          </div>
        </div>

        {weather.feelsLike != null && (
          <div className="mt-3 pt-2 border-t border-black/5 flex items-center gap-4 text-[10px] text-gray-500">
            <span>Feels like {Math.round(weather.feelsLike)}°</span>
            {weather.uvIndex != null && <span>UV {weather.uvIndex}</span>}
            {weather.precipitation != null && weather.precipitation > 0 && (
              <span>🌧️ {weather.precipitation}mm</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WeatherWidgetInline({ weather, className }: { weather: Weather | null; className?: string }) {
  if (!weather) return null;

  const config = conditionConfig[weather.condition] || conditionConfig.SUNNY;

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span className="text-sm">{config.icon}</span>
      <span className={cn("font-bold", config.text)}>
        {weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}
      </span>
      {weather.humidity != null && (
        <span className="text-gray-400">💧{Math.round(weather.humidity)}%</span>
      )}
    </div>
  );
}

export { WeatherWidget, WeatherWidgetInline };
export type { WeatherWidgetProps };
