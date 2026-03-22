import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Provides a stock shadcn-style card surface with quieter defaults so workspace views can reuse
 * the same structure without reaching for custom one-off wrappers.
 */
const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--card-foreground)] shadow-none",
        className,
      )}
      data-slot="card"
      ref={ref}
      {...props}
    />
  );
});

/**
 * Keeps card headers aligned with the shadcn registry structure so sections read consistently.
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(function CardHeader(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-4 py-4", className)}
      data-slot="card-header"
      ref={ref}
      {...props}
    />
  );
});

/**
 * Renders the primary title for a card section.
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(function CardTitle(
  { className, ...props },
  ref,
) {
  return (
    <p
      className={cn("text-sm font-semibold text-[color:var(--foreground)]", className)}
      data-slot="card-title"
      ref={ref}
      {...props}
    />
  );
});

/**
 * Renders supporting helper copy beneath a card title.
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        className={cn("text-sm leading-6 text-[color:var(--muted)]", className)}
        data-slot="card-description"
        ref={ref}
        {...props}
      />
    );
  },
);

/**
 * Holds the main body content for a card.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(function CardContent(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn("px-4 pb-4", className)}
      data-slot="card-content"
      ref={ref}
      {...props}
    />
  );
});

/**
 * Keeps footer actions aligned at the bottom of a card.
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(function CardFooter(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn("flex items-center px-4 pb-4", className)}
      data-slot="card-footer"
      ref={ref}
      {...props}
    />
  );
});

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
