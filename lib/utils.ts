import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });
}
