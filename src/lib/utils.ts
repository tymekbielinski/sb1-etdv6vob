import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to format a number (0-1) as a percentage string (e.g., 0.25 => "25%")
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'; // Or handle as needed, e.g., return '-' or ''
  }
  // Ensure value is treated as a number before calling toLocaleString
  const numericValue = Number(value);
  return numericValue.toLocaleString(undefined, { 
    style: 'percent', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 1 // Show one decimal place if needed
  });
}
