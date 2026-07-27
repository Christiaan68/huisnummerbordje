import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combineert Tailwind-classNames veilig, met conflictresolutie.
 * Wordt gebruikt door alle shadcn/ui-componenten.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
