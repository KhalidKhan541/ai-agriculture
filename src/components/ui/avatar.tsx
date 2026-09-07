import * as React from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
  status?: "online" | "offline" | "away" | "busy";
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500",
  busy: "bg-red-500",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt,
      fallback,
      size = "md",
      shape = "circle",
      status,
      ...props
    },
    ref
  ) => {
    const [imgError, setImgError] = React.useState(false);
    const initials = getInitials(alt || fallback || "U");

    return (
      <div ref={ref} className={cn("relative inline-flex shrink-0", className)} {...props}>
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden bg-green-100 text-green-700 font-semibold",
            sizeClasses[size],
            shape === "circle" ? "rounded-full" : "rounded-lg"
          )}
        >
          {src && !imgError ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
              statusColors[status],
              size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    max?: number;
    size?: AvatarProps["size"];
  }
>(({ className, children, max = 5, size = "md", ...props }, ref) => {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remaining = childArray.length - max;

  return (
    <div ref={ref} className={cn("flex -space-x-2", className)} {...props}>
      {visibleChildren.map((child, i) => (
        <div key={i} className="relative ring-2 ring-white">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold ring-2 ring-white",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
});
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarGroup };
