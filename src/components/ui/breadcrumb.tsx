import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  className?: string;
  renderItem?: (item: BreadcrumbItem, index: number) => React.ReactNode;
}

function Breadcrumb({
  items,
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />,
  maxItems = 4,
  className,
  renderItem,
}: BreadcrumbProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const visibleItems = React.useMemo(() => {
    if (isExpanded || items.length <= maxItems) return items;
    return [
      items[0],
      { label: "...", isCurrent: false },
      ...items.slice(items.length - (maxItems - 1)),
    ];
  }, [items, maxItems, isExpanded]);

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5">
        {visibleItems.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="flex-shrink-0" aria-hidden="true">
                {separator}
              </span>
            )}
            {renderItem ? (
              renderItem(item, index)
            ) : item.label === "..." ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Show more</span>
              </button>
            ) : item.href && !item.isCurrent ? (
              <a
                href={item.href}
                className="text-sm font-medium text-gray-500 transition-colors hover:text-green-600"
              >
                {item.label}
              </a>
            ) : (
              <span
                className="text-sm font-medium text-gray-900"
                aria-current={item.isCurrent ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps };
