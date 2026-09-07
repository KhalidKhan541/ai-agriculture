import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 text-gray-800",
        primary:
          "bg-green-100 text-green-800",
        secondary:
          "bg-blue-100 text-blue-800",
        destructive:
          "bg-red-100 text-red-800",
        warning:
          "bg-yellow-100 text-yellow-800",
        success:
          "bg-emerald-100 text-emerald-800",
        outline:
          "border border-gray-300 text-gray-700",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({
  className,
  variant,
  size,
  dot = false,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };
