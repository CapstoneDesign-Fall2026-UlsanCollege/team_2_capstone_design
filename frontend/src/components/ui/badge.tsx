import * as React from "react";
import { cn } from "@/lib/utils";

/** Neutral count/label badge (e.g. sidebar order count). Not a status; use Chip for statuses. */
function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-1.5 text-xs font-medium text-[var(--ink)] tabular-nums",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
