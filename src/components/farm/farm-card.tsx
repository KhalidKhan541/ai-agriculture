"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { FarmWithRelations } from "@/types";

interface FarmCardProps extends React.HTMLAttributes<HTMLDivElement> {
  farm: FarmWithRelations;
  onNavigate?: (farmId: string) => void;
  onEdit?: (farmId: string) => void;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "primary" | "secondary" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "default" },
  PENDING_VERIFICATION: { label: "Pending", variant: "warning" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

const seasonEmoji: Record<string, string> = {
  SPRING: "🌱",
  SUMMER: "☀️",
  AUTUMN: "🍂",
  WINTER: "❄️",
};

function FarmCard({
  farm,
  onNavigate,
  onEdit,
  compact = false,
  className,
  ...props
}: FarmCardProps) {
  const status = statusConfig[farm.status] || statusConfig.ACTIVE;
  const activeCrops = farm.crops?.filter((c) => c.status === "ACTIVE").length || 0;
  const totalEquipment = farm.equipment?.length || 0;
  const completionRate = farm.areaHa > 0 ? Math.round((activeCrops / Math.max(farm.areaHa / 10, 1)) * 100) : 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        "border-agriculture-field/20 hover:border-agriculture-field/40",
        className
      )}
      onClick={() => onNavigate?.(farm.id)}
      role={onNavigate ? "button" : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-agriculture-field/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate group-hover:text-agriculture-leafDark transition-colors">
              {farm.name}
            </CardTitle>
            {farm.description && (
              <p className="text-sm text-gray-500 truncate">{farm.description}</p>
            )}
          </div>
          <Badge variant={status.variant} dot size="sm">
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Area</p>
            <p className="text-lg font-bold text-gray-900">
              {farm.areaHa.toLocaleString()} <span className="text-xs font-normal text-gray-500">ha</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Crops</p>
            <p className="text-lg font-bold text-agriculture-leaf">{activeCrops}</p>
          </div>
          {farm.members && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Team</p>
              <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                  {farm.members.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="h-6 w-6 rounded-full bg-agriculture-field/20 border-2 border-white flex items-center justify-center"
                      title={member.user.name || member.user.email}
                    >
                      <span className="text-[10px] font-medium text-agriculture-leafDark">
                        {member.user.name?.[0] || member.user.email[0]}
                      </span>
                    </div>
                  ))}
                </div>
                {farm.members.length > 3 && (
                  <span className="text-xs text-gray-500">+{farm.members.length - 3}</span>
                )}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</p>
            <p className="text-lg font-bold text-gray-700">{totalEquipment}</p>
          </div>
        </div>

        {!compact && farm.address && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">
              {[farm.city, farm.state, farm.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {!compact && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Field Coverage</span>
              <span className="text-xs text-gray-700 font-semibold">{Math.min(completionRate, 100)}%</span>
            </div>
            <Progress
              value={Math.min(completionRate, 100)}
              color={completionRate > 80 ? "green" : completionRate > 50 ? "blue" : "yellow"}
            />
          </div>
        )}

        {!compact && farm._count && (
          <div className="flex items-center gap-3 pt-1">
            {farm._count.crops > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-agriculture-leaf" />
                {farm._count.crops} crops
              </div>
            )}
            {farm._count.soilSamples > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-agriculture-soil" />
                {farm._count.soilSamples} soil samples
              </div>
            )}
            {farm._count.financials > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-agriculture-corn" />
                {farm._count.financials} records
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="relative pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Created {new Date(farm.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(farm.id);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-agriculture-leaf hover:bg-agriculture-field/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.(farm.id);
            }}
            className="p-1.5 rounded-md text-gray-400 hover:text-agriculture-leaf hover:bg-agriculture-field/10 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}

export { FarmCard };
export type { FarmCardProps };
