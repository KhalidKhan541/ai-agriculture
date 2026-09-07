"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Package,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Bell,
  FileText,
  Target,
} from "lucide-react";

interface CommodityPrice {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  unit: string;
  high52w: number;
  low52w: number;
  volume: string;
  trend: "up" | "down" | "stable";
}

interface MarketListing {
  id: string;
  commodity: string;
  type: "buy" | "sell";
  quantity: number;
  pricePerUnit: number;
  location: string;
  postedDate: string;
  expiryDate: string;
  buyer: string;
  status: "active" | "matched" | "expired";
  quality: string;
}

interface PriceAlert {
  id: string;
  commodity: string;
  targetPrice: number;
  currentPrice: number;
  direction: "above" | "below";
  status: "active" | "triggered";
}

const commodities: CommodityPrice[] = [
  { id: "c1", name: "Corn", symbol: "CORN", currentPrice: 4.82, change: +0.12, changePercent: +2.55, unit: "bu", high52w: 5.45, low52w: 3.92, volume: "245K", trend: "up" },
  { id: "c2", name: "Soybeans", symbol: "SOYB", currentPrice: 11.45, change: -0.23, changePercent: -1.97, unit: "bu", high52w: 13.20, low52w: 9.80, volume: "189K", trend: "down" },
  { id: "c3", name: "Wheat", symbol: "WHEAT", currentPrice: 6.12, change: +0.08, changePercent: +1.32, unit: "bu", high52w: 7.15, low52w: 5.20, volume: "156K", trend: "up" },
  { id: "c4", name: "Alfalfa Hay", symbol: "ALF", currentPrice: 285.00, change: +5.00, changePercent: +1.79, unit: "ton", high52w: 320, low52w: 240, volume: "12K", trend: "up" },
  { id: "c5", name: "Cotton", symbol: "COTT", currentPrice: 0.82, change: -0.01, changePercent: -1.20, unit: "lb", high52w: 0.95, low52w: 0.68, volume: "98K", trend: "stable" },
  { id: "c6", name: "Rice", symbol: "RICE", currentPrice: 17.20, change: +0.35, changePercent: +2.08, unit: "cwt", high52w: 19.50, low52w: 14.80, volume: "67K", trend: "up" },
];

const listings: MarketListing[] = [
  { id: "m1", commodity: "Corn", type: "sell", quantity: 5000, pricePerUnit: 4.85, location: "Green Valley, CA", postedDate: "Sep 6", expiryDate: "Sep 20", buyer: "Valley Grain Co-op", status: "active", quality: "#2 Yellow" },
  { id: "m2", commodity: "Soybeans", type: "sell", quantity: 3000, pricePerUnit: 11.50, location: "Green Valley, CA", postedDate: "Sep 5", expiryDate: "Sep 18", buyer: "Pacific Oil Mills", status: "active", quality: "#1 Yellow" },
  { id: "m3", commodity: "Wheat", type: "sell", quantity: 2000, pricePerUnit: 6.15, location: "Green Valley, CA", postedDate: "Sep 4", expiryDate: "Sep 15", buyer: "Central Milling", status: "matched", quality: "HRW #1" },
  { id: "m4", commodity: "Alfalfa Hay", type: "buy", quantity: 50, pricePerUnit: 280.00, location: "Nearby", postedDate: "Sep 6", expiryDate: "Sep 22", buyer: "Self", status: "active", quality: "Premium" },
  { id: "m5", commodity: "Corn", type: "buy", quantity: 2000, pricePerUnit: 4.75, location: "Within 50mi", postedDate: "Sep 3", expiryDate: "Sep 16", buyer: "Livestock Farm LLC", status: "active", quality: "#2 Yellow" },
];

const priceAlerts: PriceAlert[] = [
  { id: "a1", commodity: "Corn", targetPrice: 5.00, currentPrice: 4.82, direction: "above", status: "active" },
  { id: "a2", commodity: "Soybeans", targetPrice: 12.00, currentPrice: 11.45, direction: "above", status: "active" },
  { id: "a3", commodity: "Wheat", targetPrice: 6.00, currentPrice: 6.12, direction: "above", status: "triggered" },
];

const recentPriceHistory = [
  { day: "Mon", corn: 4.70, soy: 11.68, wheat: 6.04 },
  { day: "Tue", corn: 4.72, soy: 11.55, wheat: 6.00 },
  { day: "Wed", corn: 4.68, soy: 11.60, wheat: 5.98 },
  { day: "Thu", corn: 4.75, soy: 11.40, wheat: 6.05 },
  { day: "Fri", corn: 4.82, soy: 11.45, wheat: 6.12 },
];

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState("all");

  const filteredListings = listings.filter((l) => {
    if (selectedCommodity !== "all" && l.commodity !== selectedCommodity) return false;
    if (searchQuery && !l.commodity.toLowerCase().includes(searchQuery.toLowerCase()) && !l.buyer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-sm text-gray-500">Real-time commodity prices, listings, and market analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Bell className="mr-2 h-4 w-4" />
            Price Alerts
          </button>
          <button className="btn-primary">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Listing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {commodities.map((commodity) => (
          <div key={commodity.id} className="card cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedCommodity(commodity.name)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">{commodity.symbol}</p>
                <p className="text-lg font-bold text-gray-900">{commodity.name}</p>
              </div>
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${commodity.changePercent > 0 ? "bg-green-50 text-green-700" : commodity.changePercent < 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"}`}>
                {commodity.changePercent > 0 ? <ArrowUpRight className="h-3 w-3" /> : commodity.changePercent < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                <span className="text-xs font-medium">{Math.abs(commodity.changePercent).toFixed(2)}%</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-gray-900">${commodity.currentPrice.toFixed(2)}</p>
              <p className={`text-sm ${commodity.change > 0 ? "text-green-600" : "text-red-600"}`}>{commodity.change > 0 ? "+" : ""}{commodity.change.toFixed(2)} / {commodity.unit}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-400">52w High</p>
                <p className="text-xs font-medium text-green-600">${commodity.high52w.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">52w Low</p>
                <p className="text-xs font-medium text-red-600">${commodity.low52w.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Volume</p>
                <p className="text-xs font-medium text-gray-900">{commodity.volume}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500" style={{ width: `${((commodity.currentPrice - commodity.low52w) / (commodity.high52w - commodity.low52w)) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Active Listings</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search listings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-9" />
            </div>
            <select value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)} className="input-field w-auto">
              <option value="all">All Commodities</option>
              {[...new Set(listings.map((l) => l.commodity))].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase text-gray-500">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Commodity</th>
                <th className="pb-3 pr-4">Quantity</th>
                <th className="hidden pb-3 pr-4 sm:table-cell">Price/Unit</th>
                <th className="hidden pb-3 pr-4 md:table-cell">Buyer/Seller</th>
                <th className="hidden pb-3 pr-4 lg:table-cell">Location</th>
                <th className="hidden pb-3 pr-4 lg:table-cell">Expires</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <span className={listing.type === "sell" ? "badge-green" : "badge-blue"}>
                      {listing.type === "sell" ? "Sell" : "Buy"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-gray-900">{listing.commodity}</p>
                      <p className="text-xs text-gray-500">{listing.quality}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{listing.quantity.toLocaleString()} {listing.commodity === "Alfalfa Hay" ? "tons" : "bu"}</td>
                  <td className="hidden py-3 pr-4 sm:table-cell font-semibold text-gray-900">${listing.pricePerUnit.toFixed(2)}</td>
                  <td className="hidden py-3 pr-4 md:table-cell text-gray-600">{listing.buyer}</td>
                  <td className="hidden py-3 pr-4 lg:table-cell text-gray-600">{listing.location}</td>
                  <td className="hidden py-3 pr-4 lg:table-cell text-gray-500">{listing.expiryDate}</td>
                  <td className="py-3">
                    <span className={listing.status === "active" ? "badge-green" : listing.status === "matched" ? "badge-blue" : "badge-yellow"}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">5-Day Price Comparison</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Corn</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Soy</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Wheat</span>
            </div>
          </div>
          <div className="space-y-2">
            {recentPriceHistory.map((day, i) => (
              <div key={i} className="grid grid-cols-4 items-center gap-2 text-sm">
                <span className="text-gray-500">{day.day}</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${((day.corn - 4.5) / 1) * 60}px` }} />
                  <span className="text-xs">${day.corn.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: `${((day.soy - 11) / 1) * 60}px` }} />
                  <span className="text-xs">${day.soy.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${((day.wheat - 5.5) / 1) * 60}px` }} />
                  <span className="text-xs">${day.wheat.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Price Alerts</h3>
            <button className="text-sm font-medium text-green-600 hover:text-green-700">+ New Alert</button>
          </div>
          <div className="space-y-3">
            {priceAlerts.map((alert) => (
              <div key={alert.id} className={`flex items-center gap-3 rounded-lg border p-3 ${alert.status === "triggered" ? "border-green-200 bg-green-50" : "border-gray-100"}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${alert.status === "triggered" ? "bg-green-100" : "bg-gray-100"}`}>
                  {alert.status === "triggered" ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Target className="h-5 w-5 text-gray-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.commodity}</p>
                  <p className="text-xs text-gray-500">Alert {alert.direction} ${alert.targetPrice.toFixed(2)} (Current: ${alert.currentPrice.toFixed(2)})</p>
                </div>
                <span className={alert.status === "triggered" ? "badge-green" : "badge-yellow"}>
                  {alert.status === "triggered" ? "Triggered" : "Watching"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
