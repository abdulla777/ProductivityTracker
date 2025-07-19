import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";
import { ar } from "date-fns/locale";

// Utility function to merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe date parsing function
function safeParseDate(date: Date | string | number | null | undefined): Date | null {
  if (!date) return null;
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Format date in Arabic locale
export function formatDate(date: Date | string | number): string {
  if (!date) return '--';
  const parsed = safeParseDate(date);
  if (!parsed) return '--';
  try {
    return format(parsed, 'dd MMMM yyyy', { locale: ar });
  } catch {
    return '--';
  }
}

// Format time in Arabic locale (12-hour format)
export function formatTime(date: Date | string | number): string {
  if (!date) return '--';
  const parsed = safeParseDate(date);
  if (!parsed) return '--';
  try {
    return format(parsed, 'h:mm a', { locale: ar });
  } catch {
    return '--';
  }
}

// Safe time string formatting (for HH:MM format)
export function formatTimeString(timeStr: string | null | undefined): string {
  if (!timeStr) return '--';
  if (typeof timeStr === 'string' && timeStr.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
    return timeStr.slice(0, 5); // Return just HH:MM
  }
  // Try parsing as a date
  const parsed = safeParseDate(timeStr);
  if (parsed) {
    try {
      return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--';
    }
  }
  return '--';
}

// Format relative time (e.g., "3 days ago") in Arabic
export function formatRelativeTime(date: Date | string | number): string {
  if (!date) return '--';
  const parsed = safeParseDate(date);
  if (!parsed) return '--';
  try {
    return formatDistance(parsed, new Date(), { 
      addSuffix: true,
      locale: ar 
    });
  } catch {
    return '--';
  }
}

// Format percentage for display
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
}

// Get status color based on project status
export function getStatusColor(status: string): {
  bg: string;
  text: string;
} {
  switch (status) {
    case 'new':
      return { bg: 'bg-primary-100', text: 'text-primary-700' };
    case 'in_progress':
      return { bg: 'bg-warning-100', text: 'text-warning-700' };
    case 'delayed':
      return { bg: 'bg-error-100', text: 'text-error-700' };
    case 'completed':
      return { bg: 'bg-success-100', text: 'text-success-700' };
    case 'cancelled':
      return { bg: 'bg-secondary-100', text: 'text-secondary-700' };
    default:
      return { bg: 'bg-secondary-100', text: 'text-secondary-700' };
  }
}

// Get color based on completion percentage
export function getCompletionColor(percentage: number): string {
  if (percentage >= 80) return 'bg-success-500';
  if (percentage >= 50) return 'bg-primary-500';
  if (percentage >= 25) return 'bg-warning-500';
  return 'bg-error-500';
}

// Get i18n key for status - use with t() function for proper translation
export function getStatusTranslationKey(status: string): string {
  return `project.status.${status}`;
}

// Legacy function - use getRoleTranslationKey instead with t() function
export function getRoleLabel(role: string): string {
  // This is kept for backward compatibility
  // New code should use getRoleTranslationKey with t() function
  return `role.${role}`;
}

// Get i18n key for role - use with t() function for proper translation
export function getRoleTranslationKey(role: string): string {
  return `role.${role}`;
}

// Get i18n key for project phase - use with t() function for proper translation
export function getPhaseTranslationKey(phase: string): string {
  const keyMap: Record<string, string> = {
    'architectural_design': 'project.phases.architecturalDesign',
    'structural_design': 'project.phases.structuralDesign',
    'mep_design': 'project.phases.mepDesign',
    'official_approval': 'project.phases.officialApproval',
    'execution_supervision': 'project.phases.siteSupervision',
  };
  
  return keyMap[phase] || phase;
}

// Get rating stars (1-5) as JSX array
export function getRatingStars(rating: number): { filled: number, empty: number } {
  const filledStars = Math.min(Math.max(Math.round(rating), 0), 5);
  const emptyStars = 5 - filledStars;
  
  return {
    filled: filledStars,
    empty: emptyStars
  };
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Get initials from name (for avatars)
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Generate a random pastel color (for consistent user colors)
export function getAvatarColor(id: number | string): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-teal-100 text-teal-800',
  ];
  
  const idNum = typeof id === 'string' ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : id;
  return colors[idNum % colors.length];
}

// Validate Arabic text
export function isArabicText(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

// Convert English numbers to Arabic
export function toArabicNumbers(num: number | string): string {
  if (num === undefined || num === null) return '';
  
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (d) => arabicNumbers[parseInt(d)]);
}
