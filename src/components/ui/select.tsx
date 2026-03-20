import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Provides a styled native select that matches the Input primitive's visual language.
 */
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-10 w-full cursor-pointer appearance-none rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 pr-8 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)] focus:bg-[color:var(--surface)] focus:ring-2 focus:ring-[color:var(--focus-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
