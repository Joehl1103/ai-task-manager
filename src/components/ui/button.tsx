import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:opacity-90",
        outline:
          "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-muted)]",
        ghost:
          "text-[color:var(--muted-strong)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]",
        subtle:
          "border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Provides a shadcn-style button primitive while preserving Relay's quieter no-chrome variants.
 */
export function Button({
  asChild = false,
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      type={type}
      {...props}
    />
  );
}
