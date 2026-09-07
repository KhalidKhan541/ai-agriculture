import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      indeterminate = false,
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || React.useId();

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className="peer sr-only"
            aria-invalid={!!error}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={cn(
              "flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-green-500 peer-focus-visible:ring-offset-2",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              "border-gray-300 bg-white",
              "peer-checked:border-green-600 peer-checked:bg-green-600",
              "peer-data-[state=indeterminate]:border-green-600 peer-data-[state=indeterminate]:bg-green-600",
              error && "border-red-500"
            )}
          >
            <span className="text-white" aria-hidden="true">
              {indeterminate ? (
                <Minus className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
              )}
            </span>
          </label>
        </div>
        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <label
                htmlFor={checkboxId}
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
Checkbox.displayName = "Checkbox";

export { Checkbox };
