"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Harvest, HarvestRecord } from "@/types";

interface HarvestRecordData extends HarvestRecord {
  crop?: { id: string; name: string } | null;
  field?: { id: string; name: string } | null;
  produce?: { id: string; name: string; quantity: number; unit: string }[];
}

interface HarvestData extends Harvest {
  records?: HarvestRecordData[];
}

interface HarvestCardProps extends React.HTMLAttributes<HTMLDivElement> {
  harvest: HarvestData;
  onView?: (harvestId: string) => void;
  onEdit?: (harvestId: string) => void;
  compact?: boolean;
}

const seasonConfig: Record<string, { icon: string; color: string; bg: string }> = {
  SPRING: { icon: "🌱", color: "text-green-600", bg: "bg-green-50" },
  SUMMER: { icon: "☀️", color: "text-yellow-600", bg: "bg-yellow-50" },
  AUTUMN: { icon: "🍂", color: "text-orange-600", bg: "bg-orange-50" },
  WINTER: { icon: "❄️", color: "text-blue-600", bg: "bg-blue-50" },
};

function HarvestCard({
  harvest,
  onView,
  onEdit,
  compact = false,
  className,
  ...props
}: HarvestCardProps) {
  const season = seasonConfig[harvest.season] || seasonConfig.AUTUMN;
  const records = harvest.records || [];
  const totalQuantity = records.reduce(
    (sum, r) => sum + (r.produce?.reduce((pSum, p) => pSum + (p.quantity || 0), 0) || 0),
    0
  );
  const uniqueCrops = [...new Set(records.filter((r) => r.crop).map((r) => r.crop!.name))];
  const uniqueFields = [...new Set(records.filter((r) => r.field).map((r) => r.field!.name))];
  const duration = harvest.startDate && harvest.endDate
    ? Math.ceil((new Date(harvest.endDate).getTime() - new Date(harvest.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        "border-agriculture-harvest/20 hover:border-agriculture-harvest/40",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-agriculture-harvest/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{season.icon}</span>
              <CardTitle className="text-base font-semibold text-gray-900 truncate">
                {harvest.season} {harvest.year} Harvest
              </CardTitle>
            </div>
            {harvest.notes && (
              <p className="text-xs text-gray-500 truncate ml-7">{harvest.notes}</p>
            )}
          </div>
          <Badge variant="primary" size="sm" className={season.bg}>
            {harvest.year}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Total Yield</p>
            <p className="text-lg font-bold text-agriculture-harvest">
              {totalQuantity > 0 ? `${formatNumber(totalQuantity)} kg` : "—"}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Records</p>
            <p className="text-lg font-bold text-gray-900">{records.length}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Crops</p>
            <p className="text-sm font-bold text-gray-700">
              {uniqueCrops.length > 0 ? uniqueCrops.join(", ") : "—"}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Fields</p>
            <p className="text-sm font-bold text-gray-700">
              {uniqueFields.length > 0 ? uniqueFields.join(", ") : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(harvest.startDate)}
            {harvest.endDate && ` — ${formatDate(harvest.endDate)}`}
          </div>
          {duration !== null && (
            <span className="text-gray-400">({duration} days)</span>
          )}
        </div>

        {!compact && records.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Recent Records</p>
            {records.slice(0, 3).map((record) => {
              const recordQuantity = record.produce?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-6 w-6 rounded-full bg-agriculture-field/10 flex items-center justify-center text-[10px]">
                      🌾
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {record.crop?.name || "Unknown Crop"}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {record.field?.name || "Unknown Field"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-agriculture-harvest">
                      {recordQuantity > 0 ? `${formatNumber(recordQuantity)} kg` : "—"}
                    </p>
                    {record.date && (
                      <p className="text-[10px] text-gray-400">{formatDate(record.date)}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {records.length > 3 && (
              <p className="text-center text-[10px] text-gray-400">
                +{records.length - 3} more records
              </p>
            )}
          </div>
        )}

        {!compact && harvest.metadata && typeof harvest.metadata === "object" && (
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Details</p>
            <div className="space-y-0.5">
              {Object.entries(harvest.metadata as Record<string, unknown>).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="font-medium text-gray-700">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative pt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          Created {formatDate(harvest.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(harvest.id);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-agriculture-harvest hover:bg-orange-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(harvest.id);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-agriculture-harvest hover:bg-orange-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export { HarvestCard };
export type { HarvestCardProps, HarvestData, HarvestRecordData };
