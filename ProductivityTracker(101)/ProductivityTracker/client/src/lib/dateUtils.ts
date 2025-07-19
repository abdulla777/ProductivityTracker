// Safe date utility functions to prevent "Invalid time value" errors

/**
 * Safely parses a date string and returns a valid Date object or null
 */
export function safeDateParse(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === '' || dateStr === 'null' || dateStr === 'undefined') {
    return null;
  }
  
  try {
    const date = new Date(dateStr);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: "${dateStr}"`);
      return null;
    }
    return date;
  } catch (error) {
    console.warn(`Error parsing date: "${dateStr}"`, error);
    return null;
  }
}

/**
 * Safely formats a date for display
 */
export function safeFormatDate(dateStr: string | null | undefined, fallback: string = 'غير محدد'): string {
  const date = safeDateParse(dateStr);
  if (!date) return fallback;
  
  try {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn(`Error formatting date: "${dateStr}"`, error);
    return fallback;
  }
}

/**
 * Safely converts date to ISO string for API calls
 */
export function safeToISOString(dateStr: string | null | undefined): string | null {
  const date = safeDateParse(dateStr);
  if (!date) return null;
  
  try {
    return date.toISOString();
  } catch (error) {
    console.warn(`Error converting to ISO: "${dateStr}"`, error);
    return null;
  }
}

/**
 * Safely gets today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  try {
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error getting today string:', error);
    return '2025-07-18'; // Fallback to a known valid date
  }
}

/**
 * Validates if a date string is in valid format
 */
export function isValidDateString(dateStr: string | null | undefined): boolean {
  if (!dateStr || dateStr === '' || dateStr === 'null' || dateStr === 'undefined') {
    return false;
  }
  
  const date = safeDateParse(dateStr);
  return date !== null;
}