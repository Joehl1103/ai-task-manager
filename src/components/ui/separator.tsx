import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(function Separator(
  { className, decorative = true, orientation = "horizontal", ...props },
  ref,
) {
  return (
    <SeparatorPrimitive.Root
      className={cn(
        "shrink-0 bg-[color:var(--row-divider)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      ref={ref}
      {...props}
    />
  );
});

export { Separator };
