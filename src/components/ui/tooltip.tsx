import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;

function TooltipPortal({
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Portal>) {
  if (typeof document === "undefined") {
    return <>{children}</>;
  }

  return <TooltipPrimitive.Portal {...props}>{children}</TooltipPrimitive.Portal>;
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(function TooltipTrigger({ className, ...props }, ref) {
  return (
    <TooltipPrimitive.Trigger
      className={className}
      data-slot="tooltip-trigger"
      ref={ref}
      {...props}
    />
  );
});

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 8, ...props }, ref) {
  return (
    <TooltipPortal>
      <TooltipPrimitive.Content
        className={cn(
          "z-50 overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--popover)] px-2.5 py-1.5 text-xs text-[color:var(--popover-foreground)] shadow-sm",
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=delayed-open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1",
          "data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          className,
        )}
        data-slot="tooltip-content"
        ref={ref}
        sideOffset={sideOffset}
        {...props}
      />
    </TooltipPortal>
  );
});

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
