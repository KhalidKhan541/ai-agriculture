import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <div
      ref={ref}
      role="radiogroup"
      className={cn(
        "gap-3",
        orientation === "horizontal" ? "flex flex-wrap" : "flex flex-col",
        className
      )}
      {...props}
    />
  )
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  (
    {
      className,
      label,
      description,
      error,
      id,
      ...props
    },
    ref
  ) => {
    const radioId = id || React.useId();

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            className="peer sr-only"
            aria-invalid={!!error}
            {...props}
          />
          <label
            htmlFor={radioId}
            className={cn(
              "flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-green-500 peer-focus-visible:ring-offset-2",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              "border-gray-300 bg-white",
              "peer-checked:border-green-600",
              error && "border-red-500"
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white opacity-0 transition-all peer-checked:opacity-100 peer-checked:bg-green-600" />
          </label>
        </div>
        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <label
                htmlFor={radioId}
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
