import * as React from "react";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status chip. Status colors are ONLY used here (and for needs-attention
 * cards). Always icon + text + tint so color is never the only signal.
 */
const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        success:
          "bg-[var(--success-bg)] text-[var(--success-fg)] border-[var(--success-bd)]",
        warning:
          "bg-[var(--warning-bg)] text-[var(--warning-fg)] border-[var(--warning-bd)]",
        error:
          "bg-[var(--error-bg)] text-[var(--error-fg)] border-[var(--error-bd)]",
        neutral:
          "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--border)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export type ChipTone = NonNullable<VariantProps<typeof chipVariants>["tone"]>;

const TONE_ICON: Record<ChipTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: Clock,
  error: XCircle,
  neutral: Circle,
};

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof chipVariants> {
  /** Override the default per-tone icon (e.g. AlertTriangle for failed). */
  icon?: React.ComponentType<{ className?: string }>;
}

function Chip({ className, tone, icon, children, ...props }: ChipProps) {
  const resolved: ChipTone = tone ?? "neutral";
  const Icon = icon ?? TONE_ICON[resolved];
  return (
    <span className={cn(chipVariants({ tone: resolved }), className)} {...props}>
      <Icon aria-hidden="true" />
      {children}
    </span>
  );
}

export { Chip, chipVariants };
