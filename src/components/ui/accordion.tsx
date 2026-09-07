"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
}

interface AccordionContextType {
  openItems: string[];
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType>({
  openItems: [],
  toggle: () => {},
});

function Accordion({
  children,
  defaultValue = [],
  className,
}: {
  children: React.ReactNode;
  defaultValue?: string[];
  className?: string;
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(defaultValue);

  const toggle = React.useCallback((value: string) => {
    setOpenItems((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ value, children }: AccordionItemProps) {
  const { openItems, toggle } = React.useContext(AccordionContext);
  const isOpen = openItems.includes(value);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div onClick={() => toggle(value)}>{children}</div>
      </AccordionItemContext.Provider>
    </div>
  );
}

const AccordionItemContext = React.createContext<{
  value: string;
  isOpen: boolean;
}>({ value: "", isOpen: false });

function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isOpen } = React.useContext(AccordionItemContext);

  return (
    <button
      className={cn(
        "flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isOpen } = React.useContext(AccordionItemContext);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "border-t border-gray-100 px-4 py-3.5 text-sm text-gray-600",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
