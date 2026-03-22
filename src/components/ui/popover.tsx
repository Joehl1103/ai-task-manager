import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(function PopoverTrigger({ className, ...props }, ref) {
  return (
    <PopoverPrimitive.Trigger
      className={cn(className)}
      data-slot="popover-trigger"
      ref={ref}
      {...props}
    />
  );
});

const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>(function PopoverAnchor({ className, ...props }, ref) {
  return (
    <PopoverPrimitive.Anchor
      className={cn(className)}
      data-slot="popover-anchor"
      ref={ref}
      {...props}
    />
  );
});

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent(
  { align = "center", className, forceMount, sideOffset = 8, ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal forceMount={forceMount}>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          "z-50 w-72 rounded-md border border-[color:var(--border)] bg-[color:var(--popover)] p-4 text-[color:var(--popover-foreground)] shadow-md outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          className,
        )}
        data-slot="popover-content"
        ref={ref}
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
