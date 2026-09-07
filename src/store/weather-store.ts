import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface WeatherData {
  id: string;
  location: { lat: number; lng: number };
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  condition: "sunny" | "cloudy" | "rainy" | "stormy" | "snowy" | "foggy";
  uvIndex: number;
  visibility: number;
  pressure: number;
  forecast: WeatherForecast[];
  lastUpdated: string;
}

export interface WeatherForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: WeatherData["condition"];
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

export interface WeatherAlert {
  id: string;
  type: "frost" | "heat" | "storm" | "flood" | "drought";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface WeatherState {
  currentWeather: WeatherData | null;
  alerts: WeatherAlert[];
  selectedLocation: { lat: number; lng: number } | null;
  unit: "celsius" | "fahrenheit";
  isLoading: boolean;
  lastFetchTime: string | null;

  setCurrentWeather: (weather: WeatherData) => void;
  addAlert: (alert: WeatherAlert) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;
  toggleUnit: () => void;
  setUnit: (unit: "celsius" | "fahrenheit") => void;
  setLoading: (loading: boolean) => void;
  setLastFetchTime: (time: string) => void;

  getActiveAlerts: () => WeatherAlert[];
  getAlertsBySeverity: (severity: WeatherAlert["severity"]) => WeatherAlert[];
  convertTemperature: (temp: number) => number;
}

export const useWeatherStore = create<WeatherState>()(
  immer((set, get) => ({
    currentWeather: null,
    alerts: [],
    selectedLocation: null,
    unit: "celsius",
    isLoading: false,
    lastFetchTime: null,

    setCurrentWeather: (weather) =>
      set((state) => {
        state.currentWeather = weather;
      }),

    addAlert: (alert) =>
      set((state) => {
        state.alerts.unshift(alert);
      }),

    removeAlert: (id) =>
      set((state) => {
        state.alerts = state.alerts.filter((a) => a.id !== id);
      }),

    clearAlerts: () =>
      set((state) => {
        state.alerts = [];
      }),

    setSelectedLocation: (location) =>
      set((state) => {
        state.selectedLocation = location;
      }),

    toggleUnit: () =>
      set((state) => {
        state.unit = state.unit === "celsius" ? "fahrenheit" : "celsius";
      }),

    setUnit: (unit) =>
      set((state) => {
        state.unit = unit;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setLastFetchTime: (time) =>
      set((state) => {
        state.lastFetchTime = time;
      }),

    getActiveAlerts: () => get().alerts.filter((a) => a.isActive),

    getAlertsBySeverity: (severity) =>
      get().alerts.filter((a) => a.severity === severity && a.isActive),

    convertTemperature: (temp) => {
      const state = get();
      if (state.unit === "fahrenheit") {
        return Math.round((temp * 9) / 5 + 32);
      }
      return temp;
    },
  }))
);
