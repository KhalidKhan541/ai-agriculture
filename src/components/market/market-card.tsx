"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatNumber } from "@/lib/utils";
import type { ProduceListingWithDetails, MarketWithPrices } from "@/types";

interface MarketCardProps extends React.HTMLAttributes<HTMLDivElement> {
  listing?: ProduceListingWithDetails;
  market?: MarketWithPrices;
  onNavigate?: (id: string) => void;
  onContact?: (sellerId: string) => void;
  compact?: boolean;
  viewMode?: "listing" | "market";
}

const listingStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "primary" | "secondary" }> = {
  ACTIVE: { label: "Available", variant: "success" },
  SOLD: { label: "Sold", variant: "default" },
  RESERVED: { label: "Reserved", variant: "warning" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
};

const freshnessConfig: Record<string, { label: string; color: string }> = {
  FRESH: { label: "Fresh", color: "text-green-600" },
  GOOD: { label: "Good", color: "text-blue-600" },
  FAIR: { label: "Fair", color: "text-yellow-600" },
  OLD: { label: "Old", color: "text-red-600" },
};

function PriceTrend({ prices }: { prices: { price: number; recordedAt: string }[] }) {
  if (prices.length < 2) return null;

  const latest = prices[prices.length - 1].price;
  const previous = prices[prices.length - 2].price;
  const change = ((latest - previous) / previous) * 100;
  const isUp = change > 0;
  const isStable = Math.abs(change) < 1;

  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium", isStable ? "text-gray-500" : isUp ? "text-green-600" : "text-red-600")}>
      <svg
        className={cn("h-3 w-3", isStable && "hidden", !isUp && "rotate-180")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      <span>{isStable ? "—" : `${Math.abs(change).toFixed(1)}%`}</span>
    </div>
  );
}

function ListingCard({ listing, onNavigate, onContact, compact }: {
  listing: ProduceListingWithDetails;
  onNavigate?: (id: string) => void;
  onContact?: (sellerId: string) => void;
  compact?: boolean;
}) {
  const status = listingStatusConfig[listing.status] || listingStatusConfig.ACTIVE;
  const freshness = listing.freshness ? freshnessConfig[listing.freshness] : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        "border-agriculture-field/20 hover:border-agriculture-field/40"
      )}
      onClick={() => onNavigate?.(listing.id)}
      role={onNavigate ? "button" : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-gray-900 truncate group-hover:text-agriculture-leaf transition-colors">
              {listing.produce?.name || "Produce"}
            </CardTitle>
            {listing.produce?.harvestRecord?.crop && (
              <p className="text-xs text-gray-500">
                {listing.produce.harvestRecord.crop.name}
              </p>
            )}
          </div>
          <Badge variant={status.variant} dot size="sm">
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-agriculture-leaf">
            ${listing.price?.toFixed(2) || "—"}
          </span>
          <span className="text-xs text-gray-500">/ {listing.unit || "kg"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Quantity</p>
            <p className="text-sm font-bold text-gray-900">
              {listing.quantity?.toLocaleString() || "—"} {listing.unit || "kg"}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Market</p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {listing.market?.name || "—"}
            </p>
          </div>
          {freshness && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Freshness</p>
              <p className={cn("text-sm font-bold", freshness.color)}>{freshness.label}</p>
            </div>
          )}
          {listing.minOrder && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Min Order</p>
              <p className="text-sm font-bold text-gray-700">{listing.minOrder} {listing.unit || "kg"}</p>
            </div>
          )}
        </div>

        {listing.description && !compact && (
          <p className="text-xs text-gray-500 line-clamp-2">{listing.description}</p>
        )}

        {listing.seller && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <div className="h-6 w-6 rounded-full bg-agriculture-field/10 flex items-center justify-center">
              <span className="text-[10px] font-medium text-agriculture-leafDark">
                {listing.seller.name?.[0] || listing.seller.email[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {listing.seller.name || listing.seller.email}
              </p>
            </div>
            {onContact && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContact(listing.seller.id);
                }}
                className="px-2 py-1 text-[10px] font-medium text-agriculture-leaf bg-agriculture-field/10 rounded-md hover:bg-agriculture-field/20 transition-colors"
              >
                Contact
              </button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between text-[10px] text-gray-400">
        <span>Listed {listing.createdAt ? formatDate(listing.createdAt) : "recently"}</span>
        {listing.expiresAt && (
          <span className={cn(
            "font-medium",
            new Date(listing.expiresAt) < new Date() ? "text-red-500" : "text-gray-500"
          )}>
            Expires {formatDate(listing.expiresAt)}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}

function MarketInfoCard({ market, onNavigate }: {
  market: MarketWithPrices;
  onNavigate?: (id: string) => void;
}) {
  const latestPrices = market.prices?.slice(-5) || [];
  const avgPrice = latestPrices.length > 0
    ? latestPrices.reduce((sum, p) => sum + p.price, 0) / latestPrices.length
    : 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        "border-blue-200 hover:border-blue-300"
      )}
      onClick={() => onNavigate?.(market.id)}
      role={onNavigate ? "button" : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {market.name}
            </CardTitle>
            {market.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {market.location}
              </p>
            )}
          </div>
          <Badge variant="secondary" size="sm">{market.currency || "USD"}</Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Avg Price</p>
            <p className="text-lg font-bold text-blue-700">
              ${avgPrice.toFixed(2)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Listings</p>
            <p className="text-lg font-bold text-gray-900">{market._count?.listings || 0}</p>
          </div>
        </div>

        {latestPrices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-400 uppercase">Price Trend</span>
              <PriceTrend prices={latestPrices} />
            </div>
            <div className="flex items-end gap-0.5 h-12">
              {latestPrices.map((p, i) => {
                const maxP = Math.max(...latestPrices.map((lp) => lp.price));
                const minP = Math.min(...latestPrices.map((lp) => lp.price));
                const range = maxP - minP || 1;
                const height = ((p.price - minP) / range) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-200 rounded-t transition-all hover:bg-blue-400"
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${p.price.toFixed(2)} on ${new Date(p.recordedAt).toLocaleDateString()}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {market.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{market.description}</p>
        )}
      </CardContent>

      <CardFooter className="relative pt-2 flex items-center justify-between text-[10px] text-gray-400">
        <span>{market.region || market.country || "Global"}</span>
        <span>{market._count?.prices || 0} price records</span>
      </CardFooter>
    </Card>
  );
}

function MarketCard({
  listing,
  market,
  onNavigate,
  onContact,
  compact = false,
  viewMode = "listing",
  className,
  ...props
}: MarketCardProps) {
  if (viewMode === "market" && market) {
    return <MarketInfoCard market={market} onNavigate={onNavigate} />;
  }

  if (listing) {
    return <ListingCard listing={listing} onNavigate={onNavigate} onContact={onContact} compact={compact} />;
  }

  return null;
}

export { MarketCard, ListingCard, MarketInfoCard, PriceTrend };
export type { MarketCardProps };
