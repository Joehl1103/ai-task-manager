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
        "rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--card-foreground)] shadow-sm",
        className,
      )}
      data-slot="card"
      ref={ref}
      {...props}
    />
  );
});

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(function CardHeader(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6", className)}
      data-slot="card-header"
      ref={ref}
      {...props}
    />
  );
});

const CardTitle = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(function CardTitle(
  { className, ...props },
  ref,
) {
  return (
      <p
      className={cn("font-semibold leading-none tracking-tight text-[color:var(--foreground)]", className)}
      data-slot="card-title"
      ref={ref}
      {...props}
    />
  );
});

const CardDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        className={cn("text-sm text-[color:var(--muted)]", className)}
        data-slot="card-description"
        ref={ref}
        {...props}
      />
    );
  },
);

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(function CardContent(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn("p-6 pt-0", className)}
      data-slot="card-content"
      ref={ref}
      {...props}
    />
  );
});

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(function CardFooter(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      data-slot="card-footer"
      ref={ref}
      {...props}
    />
  );
});

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
