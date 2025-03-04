/**
 * Safely converts any value to a number, returning 0 for null/undefined/NaN
 */
function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number as currency with a $ symbol
 * Handles large numbers with appropriate formatting
 * @param value The number to format
 * @returns Formatted string with $ symbol
 */
export function formatCurrency(value: number): string {
  const num = safeNumber(value);
  
  // For values over 1 million, use M suffix
  if (Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  
  // For values over 1000, use k suffix
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}k`;
  }
  
  // For regular values, use standard formatting
  return `$${num.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formats a number as a percentage with 1 decimal place
 * @param value The decimal value to format (e.g., 0.156 for 15.6%)
 * @returns Formatted string with % symbol
 */
export function formatPercentage(value: number): string {
  const num = safeNumber(value);
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * Formats a number with appropriate suffixes for readability
 * Only uses k/M suffixes for values above 100,000
 * @param value The number to format
 * @returns Formatted string
 */
function formatNumber(value: number): string {
  const num = safeNumber(value);
  
  // For values over 1 million, use M suffix
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  
  // For values over 100,000, use k suffix
  if (Math.abs(num) >= 100000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  
  // For regular values, use standard formatting
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Formats a metric value based on the display type
 * @param value The value to format
 * @param displayType The type of display format to use
 * @returns Formatted string
 */
export function formatMetricValue(value: number | null | undefined, displayType: 'number' | 'dollar' | 'percent'): string {
  const num = safeNumber(value);
  
  switch (displayType) {
    case 'dollar':
      return formatCurrency(num);
    case 'percent':
      return formatPercentage(num);
    case 'number':
    default:
      return formatNumber(num);
  }
}
