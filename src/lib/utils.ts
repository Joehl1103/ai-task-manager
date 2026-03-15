import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind and conditional class names the same way shadcn/ui does.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
