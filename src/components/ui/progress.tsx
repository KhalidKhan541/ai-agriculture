import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  showLabel?: boolean;
  label?: string;
  color?: "green" | "blue" | "yellow" | "red" | "gray";
}

const colorMap = {
  green: "bg-green-600",
  blue: "bg-blue-600",
  yellow: "bg-yellow-500",
  red: "bg-red-600",
  gray: "bg-gray-400",
};

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value,
      indicatorClassName,
      showLabel = false,
      label,
      color = "green",
      ...props
    },
    ref
  ) => {
    const percentage = value || 0;

    return (
      <div className="w-full space-y-1.5">
        {(showLabel || label) && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {label || `${Math.round(percentage)}%`}
            </span>
            {showLabel && label && (
              <span className="text-sm text-gray-500">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100",
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-in-out",
              colorMap[color],
              indicatorClassName
            )}
            style={{ width: `${percentage}%` }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
