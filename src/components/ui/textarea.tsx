import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Gives multiline composers the same shadcn-style structure as Input without adding extra chrome.
 */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none transition-colors",
        "placeholder:text-[color:var(--muted)] focus-visible:border-[color:var(--border-strong)] focus-visible:bg-[color:var(--surface)] focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      data-slot="textarea"
      ref={ref}
      {...props}
    />
  );
});
