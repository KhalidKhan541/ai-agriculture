"use client";

import * as React from "react";
import { Search, Command as CommandIcon, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  group?: string;
  onSelect?: () => void;
}

interface CommandProps {
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  onSelect?: (item: CommandItem) => void;
  className?: string;
}

function Command({
  items,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
  onSelect,
  className,
}: CommandProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filteredItems = React.useMemo(() => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower)
    );
  }, [items, query]);

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      const group = item.group || "Suggestions";
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filteredItems]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      filteredItems[selectedIndex].onSelect?.();
      onSelect?.(filteredItems[selectedIndex]);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white",
        className
      )}
    >
      <div className="flex items-center border-b border-gray-200 px-4">
        <CommandIcon className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
        <input
          className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-[300px] overflow-y-auto p-2">
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-2 py-1.5 text-xs font-medium text-gray-500">
                {group}
              </p>
              {items.map((item, i) => {
                const globalIndex = filteredItems.indexOf(item);
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                      globalIndex === selectedIndex
                        ? "bg-green-50 text-green-900"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => {
                      item.onSelect?.();
                      onSelect?.(item);
                    }}
                  >
                    {item.icon && (
                      <span className="text-gray-400">{item.icon}</span>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.shortcut && (
                      <div className="flex items-center gap-1">
                        {item.shortcut.map((key) => (
                          <kbd
                            key={key}
                            className="rounded border bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    )}
                    <CornerDownLeft className="h-3 w-3 text-gray-400" />
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { Command, type CommandItem, type CommandProps };
