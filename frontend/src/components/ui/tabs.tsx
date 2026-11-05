"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly TabOption<T>[];
  /** "segmented" = pill group (date range). "underline" = page sections. */
  variant?: "segmented" | "underline";
  "aria-label": string;
  className?: string;
}

/**
 * Accessible tablist: roving tabindex + Arrow/Home/End keys.
 * Controlled; panels are rendered by the caller.
 */
export function Tabs<T extends string>({
  value,
  onValueChange,
  options,
  variant = "segmented",
  className,
  ...rest
}: TabsProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % options.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else return;
    e.preventDefault();
    onValueChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn(
        variant === "segmented"
          ? "inline-flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-0.5"
          : "flex items-center gap-5 border-b border-[var(--border)]",
        className
      )}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "cursor-pointer whitespace-nowrap text-[13px] transition-colors",
              variant === "segmented"
                ? cn(
                    "min-h-11 md:min-h-8 rounded-md px-3 font-medium",
                    selected
                      ? "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)]"
                      : "border border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                  )
                : cn(
                    "min-h-11 md:min-h-9 -mb-px border-b-2",
                    selected
                      ? "border-[var(--ink)] text-[var(--ink)] font-semibold"
                      : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                  )
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
