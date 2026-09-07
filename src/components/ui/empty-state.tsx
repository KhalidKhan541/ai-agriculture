import * as React from "react";
import { cn } from "@/lib/utils";
import { Inbox, Search, Leaf, Cloud, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateVariant = "default" | "search" | "farming" | "weather" | "analytics";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: <Inbox className="h-12 w-12 text-gray-300" />,
  search: <Search className="h-12 w-12 text-gray-300" />,
  farming: <Leaf className="h-12 w-12 text-green-300" />,
  weather: <Cloud className="h-12 w-12 text-blue-300" />,
  analytics: <BarChart3 className="h-12 w-12 text-purple-300" />,
};

function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        {icon || defaultIcons[variant]}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      <div className="flex items-center gap-3">
        {action && (
          <Button
            variant={action.variant || "default"}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
}: Omit<EmptyStateProps, "variant" | "secondaryAction">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-gray-300 bg-white p-8",
        className
      )}
    >
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
}

export { EmptyState, EmptyStateCard, type EmptyStateProps };
