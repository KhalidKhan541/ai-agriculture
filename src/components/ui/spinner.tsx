import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "bars" | "circle";
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

function Spinner({ size = "md", variant = "default", className, ...props }: SpinnerProps) {
  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)} {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-green-600",
              size === "xs" ? "h-1 w-1" : size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
              "animate-bounce"
            )}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "bars") {
    return (
      <div className={cn("flex items-center gap-1", className)} {...props}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-green-600",
              size === "xs" ? "h-2 w-0.5" : size === "sm" ? "h-3 w-0.5" : "h-4 w-1",
              "animate-pulse"
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-200 border-t-green-600",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <Loader2
      className={cn("animate-spin text-green-600", sizeClasses[size], className)}
      {...props}
    />
  );
}

export { Spinner, type SpinnerProps };
