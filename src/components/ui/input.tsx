import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Provides a shadcn-style text input with Relay's restrained border and focus treatment.
 */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none transition-colors",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[color:var(--muted)]",
        "focus-visible:border-[color:var(--border-strong)] focus-visible:bg-[color:var(--surface)] focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
