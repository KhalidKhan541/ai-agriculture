import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      maxLength,
      showCount = false,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const [charCount, setCharCount] = React.useState(
      typeof value === "string" ? value.length : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors",
            "placeholder:text-gray-400",
            "focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            "resize-y",
            error &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            {hint && !error && (
              <p className="text-xs text-gray-500">{hint}</p>
            )}
          </div>
          {showCount && maxLength && (
            <p
              className={cn(
                "text-xs",
                charCount >= maxLength ? "text-red-600" : "text-gray-400"
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
