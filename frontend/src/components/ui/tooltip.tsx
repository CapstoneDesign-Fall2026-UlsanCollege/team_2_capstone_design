"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = React.useId();

  return (
    <span
      className={cn("relative inline-flex items-center group", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children ? (
        children
      ) : (
        <button
          type="button"
          aria-describedby={visible ? id : undefined}
          aria-label={content}
          className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-help p-0.5 rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ink)]"
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      )}

      {visible && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--ink)] shadow-none text-left font-normal animate-in fade-in zoom-in-95 duration-150 leading-relaxed"
        >
          {content}
        </span>
      )}
    </span>
  );
}
