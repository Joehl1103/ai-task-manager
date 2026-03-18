import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Gives the delegation brief composer a consistent multiline field.
 */
export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--border-strong)] focus:bg-[color:var(--surface)] focus:ring-2 focus:ring-[color:var(--focus-ring)]",
        "placeholder:text-[color:var(--muted)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
