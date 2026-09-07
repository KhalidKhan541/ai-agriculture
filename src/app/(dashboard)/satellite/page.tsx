"use client";

import { useState } from "react";
import {
  Satellite,
  Layers,
  MapPin,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Info,
  CheckCircle,
  AlertTriangle,
  Leaf,
  Droplets,
  Thermometer,
  Target,
} from "lucide-react";

interface SatelliteImage {
  id: string;
  name: string;
  date: string;
  type: "NDVI" | "Moisture" | "Thermal" | "RGB";
  field: string;
  resolution: string;
  cloudCover: number;
  status: "processed" | "processing" | "queued";
}

interface FieldAnalysis {
  id: string;
  fieldName: string;
  acres: number;
  ndvi: number;
  ndviStatus: "excellent" | "good" | "fair" | "poor";
  moisture: number;
  temperature: number;
  cropHealth: number;
  stressAreas: number;
  lastUpdated: string;
}

interface NDVILegend {
  range: string;
  label: string;
  color: string;
}

const satelliteImages: SatelliteImage[] = [
  { id: "s1", name: "North Field NDVI Map", date: "Sep 6, 2026", type: "NDVI", field: "North Field", resolution: "3m", cloudCover: 2, status: "processed" },
  { id: "s2", name: "South Field Moisture", date: "Sep 6, 2026", type: "Moisture", field: "South Field", resolution: "10m", cloudCover: 5, status: "processed" },
  { id: "s3", name: "Full Farm Thermal", date: "Sep 5, 2026", type: "Thermal", field: "All Fields", resolution: "30m", cloudCover: 0, status: "processed" },
  { id: "s4", name: "East Orchard RGB", date: "Sep 5, 2026", type: "RGB", field: "East Orchard", resolution: "0.5m", cloudCover: 8, status: "processed" },
  { id: "s5", name: "West Vineyard NDVI", date: "Sep 7, 2026", type: "NDVI", field: "West Vineyard", resolution: "3m", cloudCover: 15, status: "processing" },
];

const fieldAnalyses: FieldAnalysis[] = [
  { id: "f1", fieldName: "North Field - Corn", acres: 45, ndvi: 0.82, ndviStatus: "excellent", moisture: 62, temperature: 84, cropHealth: 92, stressAreas: 2, lastUpdated: "2 hours ago" },
  { id: "f2", fieldName: "South Field - Soybeans", acres: 38, ndvi: 0.71, ndviStatus: "good", moisture: 48, temperature: 82, cropHealth: 78, stressAreas: 5, lastUpdated: "3 hours ago" },
  { id: "f3", fieldName: "East Orchard - Apples", acres: 12, ndvi: 0.78, ndviStatus: "good", moisture: 55, temperature: 80, cropHealth: 85, stressAreas: 1, lastUpdated: "4 hours ago" },
  { id: "f4", fieldName: "West Vineyard - Grapes", acres: 8, ndvi: 0.65, ndviStatus: "fair", moisture: 71, temperature: 79, cropHealth: 72, stressAreas: 8, lastUpdated: "5 hours ago" },
  { id: "f5", fieldName: "Greenhouse Complex", acres: 1, ndvi: 0.88, ndviStatus: "excellent", moisture: 58, temperature: 76, cropHealth: 95, stressAreas: 0, lastUpdated: "1 hour ago" },
];

const ndviLegend: NDVILegend[] = [
  { range: "0.8 - 1.0", label: "Dense, Healthy Vegetation", color: "bg-green-600" },
  { range: "0.6 - 0.8", label: "Moderate Vegetation", color: "bg-green-400" },
  { range: "0.4 - 0.6", label: "Sparse Vegetation", color: "bg-yellow-400" },
  { range: "0.2 - 0.4", label: "Stressed Vegetation", color: "bg-orange-400" },
  { range: "0.0 - 0.2", label: "Bare Soil / No Vegetation", color: "bg-red-400" },
];

export default function SatellitePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"ndvi" | "moisture" | "thermal">("ndvi");
  const [filter, setFilter] = useState<"all" | "NDVI" | "Moisture" | "Thermal" | "RGB">("all");

  const filteredImages = satelliteImages.filter((img) => filter === "all" || img.type === filter);

  const getNDVIStatus = (ndvi: number) => {
    if (ndvi >= 0.8) return { label: "Excellent", color: "text-green-600" };
    if (ndvi >= 0.6) return { label: "Good", color: "text-green-500" };
    if (ndvi >= 0.4) return { label: "Fair", color: "text-yellow-600" };
    return { label: "Poor", color: "text-red-600" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satellite Imagery</h1>
          <p className="text-sm text-gray-500">NDVI maps, field analysis, and crop health monitoring from space</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </button>
          <button className="btn-primary">
            <Download className="mr-2 h-4 w-4" />
            Export Maps
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <Leaf className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">0.78</p>
            <p className="text-xs text-gray-500">Avg. NDVI</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <Droplets className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">58%</p>
            <p className="text-xs text-gray-500">Avg. Moisture</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
            <Thermometer className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">81&deg;F</p>
            <p className="text-xs text-gray-500">Canopy Temp</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">16</p>
            <p className="text-xs text-gray-500">Stress Areas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card col-span-1 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Field Map Viewer</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                {(["ndvi", "moisture", "thermal"] as const).map((layer) => (
                  <button key={layer} onClick={() => setActiveLayer(layer)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeLayer === layer ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {layer.charAt(0).toUpperCase() + layer.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"><ZoomIn className="h-4 w-4" /></button>
                <button className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"><ZoomOut className="h-4 w-4" /></button>
                <button className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"><Maximize className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          <div className="relative flex h-80 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 via-green-50 to-yellow-50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-2">
                {fieldAnalyses.map((field) => (
                  <div key={field.id} className={`relative cursor-pointer rounded-lg p-3 transition-all hover:scale-105 ${field.ndviStatus === "excellent" ? "bg-green-500/20" : field.ndviStatus === "good" ? "bg-green-400/20" : field.ndviStatus === "fair" ? "bg-yellow-400/20" : "bg-red-400/20"}`} onClick={() => setSelectedImage(field.id)}>
                    <MapPin className="mx-auto h-4 w-4 text-green-700" />
                    <p className="mt-1 text-center text-xs font-medium text-gray-700">{field.fieldName.split(" - ")[0]}</p>
                    <p className="text-center text-xs text-gray-500">NDVI: {field.ndvi}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 p-2 shadow-sm">
              <p className="text-xs font-medium text-gray-700">{activeLayer.toUpperCase()} Layer</p>
              <p className="text-xs text-gray-500">Last updated: Sep 7, 2026</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            {ndviLegend.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded-sm ${item.color}`} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Field Analysis</h3>
          <div className="space-y-3">
            {fieldAnalyses.map((field) => (
              <div key={field.id} className={`rounded-lg border p-3 transition-all ${selectedImage === field.id ? "border-green-300 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{field.fieldName}</p>
                  <span className={`text-xs font-semibold ${getNDVIStatus(field.ndvi).color}`}>{getNDVIStatus(field.ndvi).label}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>NDVI: <span className="font-medium text-gray-700">{field.ndvi}</span></div>
                  <div>Moisture: <span className="font-medium text-gray-700">{field.moisture}%</span></div>
                  <div>Health: <span className="font-medium text-gray-700">{field.cropHealth}%</span></div>
                  <div>Stress: <span className="font-medium text-gray-700">{field.stressAreas} areas</span></div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                  <div className={`h-1.5 rounded-full ${field.cropHealth >= 90 ? "bg-green-500" : field.cropHealth >= 75 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${field.cropHealth}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Available Imagery</h3>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["all", "NDVI", "Moisture", "Thermal", "RGB"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((img) => (
            <div key={img.id} className="rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${img.type === "NDVI" ? "bg-green-100" : img.type === "Moisture" ? "bg-blue-100" : img.type === "Thermal" ? "bg-orange-100" : "bg-gray-100"}`}>
                    <Satellite className={`h-5 w-5 ${img.type === "NDVI" ? "text-green-600" : img.type === "Moisture" ? "text-blue-600" : img.type === "Thermal" ? "text-orange-600" : "text-gray-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{img.name}</p>
                    <p className="text-xs text-gray-500">{img.field}</p>
                  </div>
                </div>
                <span className={img.status === "processed" ? "badge-green" : img.status === "processing" ? "badge-yellow" : "badge-blue"}>
                  {img.status.charAt(0).toUpperCase() + img.status.slice(1)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-gray-50 p-1.5">
                  <p className="text-xs text-gray-400">Resolution</p>
                  <p className="text-xs font-medium text-gray-700">{img.resolution}</p>
                </div>
                <div className="rounded bg-gray-50 p-1.5">
                  <p className="text-xs text-gray-400">Cloud</p>
                  <p className="text-xs font-medium text-gray-700">{img.cloudCover}%</p>
                </div>
                <div className="rounded bg-gray-50 p-1.5">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-xs font-medium text-gray-700">{img.date.split(",")[0]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
