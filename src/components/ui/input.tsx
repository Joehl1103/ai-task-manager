import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Provides a compact text input with the same styling language as the rest of the shell.
 */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)] focus:bg-[color:var(--surface)] focus:ring-2 focus:ring-[color:var(--focus-ring)]",
        "placeholder:text-[color:var(--muted)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
