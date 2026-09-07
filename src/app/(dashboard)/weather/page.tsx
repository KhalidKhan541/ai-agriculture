"use client";

import { useState } from "react";
import {
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Navigation,
  RefreshCw,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface DailyForecast {
  day: string;
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: React.ReactNode;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

interface WeatherAlert {
  id: string;
  type: "warning" | "watch" | "advisory";
  title: string;
  description: string;
  expires: string;
}

const forecastData: DailyForecast[] = [
  { day: "Mon", date: "Sep 7", high: 84, low: 62, condition: "Sunny", icon: <Sun className="h-6 w-6 text-yellow-500" />, precipitation: 0, humidity: 35, windSpeed: 8 },
  { day: "Tue", date: "Sep 8", high: 81, low: 60, condition: "Partly Cloudy", icon: <CloudSun className="h-6 w-6 text-gray-500" />, precipitation: 10, humidity: 42, windSpeed: 12 },
  { day: "Wed", date: "Sep 9", high: 76, low: 58, condition: "Cloudy", icon: <Cloud className="h-6 w-6 text-gray-400" />, precipitation: 30, humidity: 55, windSpeed: 15 },
  { day: "Thu", date: "Sep 10", high: 72, low: 55, condition: "Rain", icon: <CloudRain className="h-6 w-6 text-blue-500" />, precipitation: 80, humidity: 78, windSpeed: 20 },
  { day: "Fri", date: "Sep 11", high: 70, low: 54, condition: "Rain", icon: <CloudRain className="h-6 w-6 text-blue-500" />, precipitation: 90, humidity: 82, windSpeed: 18 },
  { day: "Sat", date: "Sep 12", high: 78, low: 58, condition: "Partly Cloudy", icon: <CloudSun className="h-6 w-6 text-gray-500" />, precipitation: 20, humidity: 48, windSpeed: 10 },
  { day: "Sun", date: "Sep 13", high: 82, low: 61, condition: "Sunny", icon: <Sun className="h-6 w-6 text-yellow-500" />, precipitation: 5, humidity: 38, windSpeed: 7 },
];

const alerts: WeatherAlert[] = [
  { id: "1", type: "warning", title: "Heavy Rain Expected", description: "1-2 inches of rainfall expected Thursday through Friday. Consider postponing any planned spraying operations.", expires: "Sep 10, 2026 6:00 AM" },
  { id: "2", type: "advisory", title: "Frost Advisory Next Week", description: "Temperatures may drop to 32\u00b0F overnight on Sep 15. Protect sensitive crops.", expires: "Sep 14, 2026 8:00 PM" },
];

const hourlyData = [
  { time: "6 AM", temp: 64, humidity: 72, wind: 5 },
  { time: "9 AM", temp: 72, humidity: 58, wind: 8 },
  { time: "12 PM", temp: 82, humidity: 40, wind: 12 },
  { time: "3 PM", temp: 84, humidity: 35, wind: 15 },
  { time: "6 PM", temp: 79, humidity: 42, wind: 10 },
  { time: "9 PM", temp: 70, humidity: 55, wind: 7 },
];

const soilConditions = [
  { depth: "2 inches", temp: 72, moisture: 45 },
  { depth: "4 inches", temp: 68, moisture: 52 },
  { depth: "8 inches", temp: 64, moisture: 58 },
  { depth: "12 inches", temp: 61, moisture: 62 },
];

export default function WeatherPage() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [unit, setUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");

  const toCelsius = (f: number) => Math.round(((f - 32) * 5) / 9);
  const displayTemp = (f: number) => (unit === "celsius" ? `${toCelsius(f)}\u00b0C` : `${f}\u00b0F`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weather Center</h1>
          <p className="text-sm text-gray-500">Real-time weather data and forecasts for your farm</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setUnit(unit === "fahrenheit" ? "celsius" : "fahrenheit")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">
            {unit === "fahrenheit" ? "\u00b0F" : "\u00b0C"}
          </button>
          <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`rounded-xl border-l-4 p-4 ${alert.type === "warning" ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${alert.type === "warning" ? "text-red-600" : "text-yellow-600"}`} />
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold ${alert.type === "warning" ? "text-red-800" : "text-yellow-800"}`}>{alert.title}</h4>
                  <p className={`mt-1 text-sm ${alert.type === "warning" ? "text-red-700" : "text-yellow-700"}`}>{alert.description}</p>
                  <p className="mt-1 text-xs text-gray-500">Expires: {alert.expires}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card col-span-1 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100">
              <Sun className="h-10 w-10 text-yellow-500" />
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">{displayTemp(84)}</p>
              <p className="text-sm text-gray-500">Feels like {displayTemp(86)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-semibold text-gray-900">Sunny</p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>Green Valley Farm, CA</span>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <Droplets className="mx-auto h-5 w-5 text-blue-500" />
              <p className="mt-1 text-lg font-semibold text-gray-900">35%</p>
              <p className="text-xs text-gray-500">Humidity</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <Wind className="mx-auto h-5 w-5 text-teal-500" />
              <p className="mt-1 text-lg font-semibold text-gray-900">8 mph</p>
              <p className="text-xs text-gray-500">Wind</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <Eye className="mx-auto h-5 w-5 text-purple-500" />
              <p className="mt-1 text-lg font-semibold text-gray-900">10 mi</p>
              <p className="text-xs text-gray-500">Visibility</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <Gauge className="mx-auto h-5 w-5 text-orange-500" />
              <p className="mt-1 text-lg font-semibold text-gray-900">30.12</p>
              <p className="text-xs text-gray-500">Pressure (inHg)</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Sun & Moon</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-600">Sunrise</span>
              </div>
              <span className="text-sm font-medium">6:32 AM</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-gray-600">Sunset</span>
              </div>
              <span className="text-sm font-medium">7:18 PM</span>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">UV Index</p>
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500">
                <div className="h-2 w-1/5 rounded-full bg-white shadow" style={{ marginLeft: "18%" }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Low</span>
                <span>High</span>
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-orange-600">6 - High</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">7-Day Forecast</h3>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {forecastData.map((day, i) => (
            <button key={i} onClick={() => setSelectedDay(i)} className={`rounded-xl p-3 text-center transition-all ${selectedDay === i ? "bg-green-50 ring-2 ring-green-500" : "hover:bg-gray-50"}`}>
              <p className="text-xs font-medium text-gray-500">{day.day}</p>
              <div className="my-2 flex justify-center">{day.icon}</div>
              <p className="text-sm font-bold text-gray-900">{displayTemp(day.high)}</p>
              <p className="text-xs text-gray-400">{displayTemp(day.low)}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Droplets className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-gray-500">{day.precipitation}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Hourly Temperature</h3>
          <div className="space-y-3">
            {hourlyData.map((hour, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-12 text-xs text-gray-500">{hour.time}</span>
                <div className="flex-1">
                  <div className="h-3 w-full rounded-full bg-gray-100">
                    <div className="h-3 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400" style={{ width: `${((hour.temp - 60) / 30) * 100}%` }} />
                  </div>
                </div>
                <span className="w-12 text-right text-sm font-medium">{displayTemp(hour.temp)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Soil Conditions</h3>
          <div className="space-y-3">
            {soilConditions.map((soil, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg bg-gray-50 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{soil.depth}</p>
                  <p className="text-xs text-gray-500">Temperature: {displayTemp(soil.temp)}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900">{soil.moisture}%</span>
                  </div>
                  <p className="text-xs text-gray-500">Moisture</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Growing Degree Days</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-xs font-medium text-green-700">Corn (GDD)</p>
            <p className="mt-1 text-2xl font-bold text-green-900">2,847</p>
            <p className="text-xs text-green-600">Target: 3,000</p>
            <div className="mt-2 h-2 w-full rounded-full bg-green-200">
              <div className="h-2 rounded-full bg-green-600" style={{ width: "95%" }} />
            </div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-xs font-medium text-yellow-700">Soybeans (GDD)</p>
            <p className="mt-1 text-2xl font-bold text-yellow-900">1,923</p>
            <p className="text-xs text-yellow-600">Target: 2,500</p>
            <div className="mt-2 h-2 w-full rounded-full bg-yellow-200">
              <div className="h-2 rounded-full bg-yellow-600" style={{ width: "77%" }} />
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-700">Wheat (GDD)</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">1,456</p>
            <p className="text-xs text-blue-600">Target: 1,800</p>
            <div className="mt-2 h-2 w-full rounded-full bg-blue-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: "81%" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Historical Comparison</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">Avg. Temperature</p>
            <p className="mt-1 text-xl font-bold text-gray-900">78.2\u00b0F</p>
            <p className="text-xs text-green-600">+2.1\u00b0 above avg</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">Total Rainfall</p>
            <p className="mt-1 text-xl font-bold text-gray-900">3.2 in</p>
            <p className="text-xs text-red-600">-1.4 in below avg</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">Growing Days</p>
            <p className="mt-1 text-xl font-bold text-gray-900">148</p>
            <p className="text-xs text-green-600">On track</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">Drought Risk</p>
            <p className="mt-1 text-xl font-bold text-yellow-600">Moderate</p>
            <p className="text-xs text-gray-500">Monitor irrigation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
