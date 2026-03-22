import * as React from "react";

import { cn } from "@/lib/utils";

interface CollapsibleContextValue {
  open: boolean;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

interface CollapsibleProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

/**
 * Provides a lightweight controlled/uncontrolled collapsible wrapper for the workspace shell.
 */
export function Collapsible({
  children,
  className,
  defaultOpen = false,
  open = defaultOpen,
  ...props
}: CollapsibleProps) {
  return (
    <CollapsibleContext.Provider value={{ open }}>
      <div
        className={cn(className)}
        data-slot="collapsible"
        data-state={open ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleContentProps extends React.ComponentProps<"div"> {
  forceMount?: boolean;
}

/**
 * Only renders open content unless `forceMount` is requested for layout reasons.
 */
export function CollapsibleContent({
  children,
  className,
  forceMount = false,
  ...props
}: CollapsibleContentProps) {
  const context = React.useContext(CollapsibleContext);
  const open = context?.open ?? true;

  if (!open && !forceMount) {
    return null;
  }

  return (
    <div
      className={cn(className)}
      data-slot="collapsible-content"
      data-state={open ? "open" : "closed"}
      hidden={!open}
      {...props}
    >
      {children}
    </div>
  );
}
