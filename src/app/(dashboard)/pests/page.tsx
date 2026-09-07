"use client";

import { useState } from "react";
import {
  Bug,
  Shield,
  AlertTriangle,
  Camera,
  Search,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Spray,
  Leaf,
  TrendingUp,
  Eye,
  ArrowRight,
  FileText,
  Bell,
} from "lucide-react";

interface PestDetection {
  id: string;
  name: string;
  scientificName: string;
  severity: "low" | "medium" | "high" | "critical";
  cropAffected: string;
  location: string;
  detectedDate: string;
  confidence: number;
  treatment: string;
  status: "active" | "treated" | "monitoring";
  imageDescription: string;
}

interface TreatmentPlan {
  id: string;
  pestName: string;
  method: string;
  product: string;
  dosage: string;
  scheduledDate: string;
  status: "pending" | "in-progress" | "completed";
  notes: string;
}

interface PestTrend {
  month: string;
  detections: number;
  treatments: number;
}

const detections: PestDetection[] = [
  {
    id: "p1", name: "Corn Earworm", scientificName: "Helicoverpa zea", severity: "high", cropAffected: "Corn - North Field",
    location: "North Field, Rows 12-28", detectedDate: "Sep 5, 2026", confidence: 94, treatment: "Bt spray application",
    status: "active", imageDescription: "Larvae feeding on corn silks"
  },
  {
    id: "p2", name: "Soybean Aphid", scientificName: "Aphis glycines", severity: "medium", cropAffected: "Soybeans - South Field",
    location: "South Field, Block C", detectedDate: "Sep 4, 2026", confidence: 87, treatment: "Insecticidal soap + ladybug release",
    status: "monitoring", imageDescription: "Colonies on leaf undersides"
  },
  {
    id: "p3", name: "Japanese Beetle", scientificName: "Popillia japonica", severity: "low", cropAffected: "Grapes - West Vineyard",
    location: "West Vineyard, Rows 1-5", detectedDate: "Sep 3, 2026", confidence: 92, treatment: "Manual removal + neem oil",
    status: "treated", imageDescription: "Adult beetles on grape leaves"
  },
  {
    id: "p4", name: "Tomato Hornworm", scientificName: "Manduca quinquemaculata", severity: "medium", cropAffected: "Tomatoes - Greenhouse A",
    location: "Greenhouse A, Section 2", detectedDate: "Sep 6, 2026", confidence: 96, treatment: "Hand picking + parasitic wasp release",
    status: "active", imageDescription: "Large caterpillar on tomato stems"
  },
  {
    id: "p5", name: "Powdery Mildew", scientificName: "Erysiphe necator", severity: "medium", cropAffected: "Grapes - West Vineyard",
    location: "West Vineyard, Rows 3-7", detectedDate: "Sep 2, 2026", confidence: 89, treatment: "Sulfur application + canopy management",
    status: "treated", imageDescription: "White powdery coating on leaves"
  },
];

const treatmentPlans: TreatmentPlan[] = [
  { id: "t1", pestName: "Corn Earworm", method: "Biological Control", product: "Bt (Bacillus thuringiensis)", dosage: "2 lbs/acre", scheduledDate: "Sep 8, 2026", status: "pending", notes: "Apply in evening for best results" },
  { id: "t2", pestName: "Soybean Aphid", method: "Integrated Pest Management", product: "Insecticidal Soap + Hippodamia convergens", dosage: "5 gal soap + 1500 ladybugs/acre", scheduledDate: "Sep 9, 2026", status: "pending", notes: "Release ladybugs at dusk" },
  { id: "t3", pestName: "Tomato Hornworm", method: "Biological Control", product: "Trichogramma wasps", dosage: "50,000 eggs/acre", scheduledDate: "Sep 10, 2026", status: "pending", notes: "Distribute cards evenly throughout greenhouse" },
];

const pestTrends: PestTrend[] = [
  { month: "Apr", detections: 3, treatments: 2 },
  { month: "May", detections: 8, treatments: 6 },
  { month: "Jun", detections: 15, treatments: 12 },
  { month: "Jul", detections: 22, treatments: 18 },
  { month: "Aug", detections: 18, treatments: 15 },
  { month: "Sep", detections: 5, treatments: 2 },
];

const maxTrend = Math.max(...pestTrends.map((t) => t.detections));

export default function PestsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "treated" | "monitoring">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDetections = detections.filter((d) => {
    if (filter !== "all" && d.status !== filter) return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase()) && !d.cropAffected.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "badge-red";
      case "monitoring": return "badge-yellow";
      case "treated": return "badge-green";
      default: return "badge-blue";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pest Management</h1>
          <p className="text-sm text-gray-500">AI-powered pest detection, tracking, and treatment planning</p>
        </div>
        <button className="btn-primary">
          <Camera className="mr-2 h-4 w-4" />
          Report Sighting
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
            <Bug className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{detections.filter((d) => d.status === "active").length}</p>
            <p className="text-xs text-gray-500">Active Threats</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{detections.filter((d) => d.status === "treated").length}</p>
            <p className="text-xs text-gray-500">Treated</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
            <Eye className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{detections.filter((d) => d.status === "monitoring").length}</p>
            <p className="text-xs text-gray-500">Monitoring</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">71</p>
            <p className="text-xs text-gray-500">Total This Season</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Pest Detections</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search pests or crops..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-9" />
            </div>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {(["all", "active", "monitoring", "treated"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {filteredDetections.map((pest) => (
            <div key={pest.id} className="rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-green-100">
                  <Bug className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <h4 className="text-base font-semibold text-gray-900">{pest.name}</h4>
                    <span className="text-sm italic text-gray-400">{pest.scientificName}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSeverityColor(pest.severity)}`}>{pest.severity.toUpperCase()}</span>
                    <span className={getStatusBadge(pest.status)}>{pest.status.charAt(0).toUpperCase() + pest.status.slice(1)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 text-gray-400" />{pest.cropAffected}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />{pest.location}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" />{pest.detectedDate}</div>
                    <div className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-gray-400" />{pest.confidence}% confidence</div>
                  </div>
                  <div className="mt-2 rounded-lg bg-gray-50 p-2">
                    <p className="text-xs text-gray-500">AI Image Analysis: {pest.imageDescription}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Recommended:</span> {pest.treatment}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="btn-primary text-xs">
                    <Spray className="mr-1 h-3.5 w-3.5" />
                    Treat
                  </button>
                  <button className="btn-secondary text-xs">
                    <FileText className="mr-1 h-3.5 w-3.5" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredDetections.length === 0 && (
            <div className="py-8 text-center">
              <Bug className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No detections match your filters</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Upcoming Treatments</h3>
          <div className="space-y-3">
            {treatmentPlans.map((plan) => (
              <div key={plan.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{plan.pestName}</p>
                    <p className="text-xs text-gray-500">{plan.method}</p>
                  </div>
                  <span className={plan.status === "completed" ? "badge-green" : plan.status === "in-progress" ? "badge-blue" : "badge-yellow"}>
                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="text-gray-400">Product:</span> {plan.product}</div>
                  <div><span className="text-gray-400">Dosage:</span> {plan.dosage}</div>
                  <div><span className="text-gray-400">Scheduled:</span> {plan.scheduledDate}</div>
                </div>
                {plan.notes && <p className="mt-2 text-xs italic text-gray-500">Note: {plan.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Season Trend</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Detections</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Treatments</span>
            </div>
          </div>
          <div className="flex items-end gap-3" style={{ height: 180 }}>
            {pestTrends.map((trend, i) => (
              <div key={i} className="flex flex-1 items-end gap-1">
                <div className="flex w-full flex-col items-center gap-1">
                  <div className="flex w-full items-end gap-0.5">
                    <div className="flex-1 rounded-t bg-red-400" style={{ height: `${(trend.detections / maxTrend) * 140}px` }} />
                    <div className="flex-1 rounded-t bg-green-400" style={{ height: `${(trend.treatments / maxTrend) * 140}px` }} />
                  </div>
                  <span className="text-xs text-gray-500">{trend.month}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-900">Pest Risk Assessment</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <h4 className="text-sm font-medium text-green-800">Low Risk</h4>
            </div>
            <p className="mt-2 text-xs text-green-700">West Vineyard, Greenhouse A</p>
            <p className="mt-1 text-xs text-green-600">Current conditions unfavorable for pest outbreaks</p>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <h4 className="text-sm font-medium text-yellow-800">Moderate Risk</h4>
            </div>
            <p className="mt-2 text-xs text-yellow-700">South Field - Soybeans</p>
            <p className="mt-1 text-xs text-yellow-600">Warm temps and humidity may increase aphid activity</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <h4 className="text-sm font-medium text-red-800">High Risk</h4>
            </div>
            <p className="mt-2 text-xs text-red-700">North Field - Corn</p>
            <p className="mt-1 text-xs text-red-600">Active earworm infestation, elevated temperature forecast</p>
          </div>
        </div>
      </div>
    </div>
  );
}
