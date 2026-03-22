import { Search } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function Command({ className, ...props }, ref) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl bg-[color:var(--surface)] text-[color:var(--foreground)]",
        className,
      )}
      data-slot="command"
      ref={ref}
      {...props}
    />
  );
});

interface CommandInputProps extends React.ComponentPropsWithoutRef<"input"> {
  wrapperClassName?: string;
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  function CommandInput({ className, wrapperClassName, ...props }, ref) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 border-b border-[color:var(--border)] px-3",
          wrapperClassName,
        )}
        data-slot="command-input-wrapper"
      >
        <Search
          aria-hidden="true"
          className="size-4 shrink-0 text-[color:var(--muted)]"
        />
        <input
          className={cn(
            "flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--muted)]",
            className,
          )}
          data-slot="command-input"
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function CommandList({ className, ...props }, ref) {
  return (
    <div
      className={cn("max-h-[24rem] overflow-y-auto p-2", className)}
      data-slot="command-list"
      ref={ref}
      role="listbox"
      {...props}
    />
  );
});

const CommandEmpty = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(function CommandEmpty({ className, ...props }, ref) {
  return (
    <p
      className={cn("rounded-md px-3 py-6 text-sm text-[color:var(--muted)]", className)}
      data-slot="command-empty"
      ref={ref}
      {...props}
    />
  );
});

interface CommandGroupProps extends React.ComponentPropsWithoutRef<"div"> {
  heading?: string;
}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  function CommandGroup({ children, className, heading, ...props }, ref) {
    return (
      <div className={cn("space-y-1", className)} data-slot="command-group" ref={ref} {...props}>
        {heading ? (
          <p className="px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {heading}
          </p>
        ) : null}
        {children}
      </div>
    );
  },
);

interface CommandItemProps extends React.ComponentPropsWithoutRef<"button"> {
  selected?: boolean;
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  function CommandItem(
    { className, selected = false, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        aria-selected={selected}
        className={cn(
          "w-full rounded-lg border px-3 py-3 text-left transition outline-none",
          "focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
          selected
            ? "border-[color:var(--foreground)] bg-[color:var(--surface-strong)]"
            : "border-transparent hover:border-[color:var(--border)] hover:bg-[color:var(--surface-strong)]",
          className,
        )}
        data-selected={selected ? "true" : "false"}
        data-slot="command-item"
        ref={ref}
        role="option"
        type={type}
        {...props}
      />
    );
  },
);

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function CommandSeparator({ className, ...props }, ref) {
  return (
    <div
      className={cn("h-px bg-[color:var(--border)]", className)}
      data-slot="command-separator"
      ref={ref}
      {...props}
    />
  );
});

const CommandShortcut = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(function CommandShortcut({ className, ...props }, ref) {
  return (
    <span
      className={cn("text-xs tracking-[0.14em] text-[color:var(--muted)]", className)}
      data-slot="command-shortcut"
      ref={ref}
      {...props}
    />
  );
});

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
