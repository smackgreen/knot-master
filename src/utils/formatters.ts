
import { format, isPast, isToday, getDay, getMonth } from 'date-fns';
import { VendorCategory } from '../types';
import i18next from 'i18next';

// Format a date in various formats
export const formatDate = (date: Date | string, formatStr: string = 'MMM d, yyyy') => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid date';
  }
};

// Format a date with i18n support
export const formatDateI18n = (date: Date | string, formatStr: string = 'MMM d, yyyy') => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const t = i18next.t;

    // Basic formatting first
    let formattedDate = format(dateObj, formatStr);

    // Replace month names
    const monthNames = [
      t('common.months.january'), t('common.months.february'),
      t('common.months.march'), t('common.months.april'),
      t('common.months.may'), t('common.months.june'),
      t('common.months.july'), t('common.months.august'),
      t('common.months.september'), t('common.months.october'),
      t('common.months.november'), t('common.months.december')
    ];

    const shortMonthNames = [
      t('common.months.jan'), t('common.months.feb'),
      t('common.months.mar'), t('common.months.apr'),
      t('common.months.may_short'), t('common.months.jun'),
      t('common.months.jul'), t('common.months.aug'),
      t('common.months.sep'), t('common.months.oct'),
      t('common.months.nov'), t('common.months.dec')
    ];

    // Replace day names
    const dayNames = [
      t('common.days.sunday'), t('common.days.monday'),
      t('common.days.tuesday'), t('common.days.wednesday'),
      t('common.days.thursday'), t('common.days.friday'),
      t('common.days.saturday')
    ];

    const shortDayNames = [
      t('common.days.sun'), t('common.days.mon'),
      t('common.days.tue'), t('common.days.wed'),
      t('common.days.thu'), t('common.days.fri'),
      t('common.days.sat')
    ];

    // Replace English month names with translated ones
    const englishMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const englishShortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Replace English day names with translated ones
    const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const englishShortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Replace full month names
    englishMonths.forEach((month, index) => {
      formattedDate = formattedDate.replace(month, monthNames[index]);
    });

    // Replace short month names
    englishShortMonths.forEach((month, index) => {
      formattedDate = formattedDate.replace(month, shortMonthNames[index]);
    });

    // Replace full day names
    englishDays.forEach((day, index) => {
      formattedDate = formattedDate.replace(day, dayNames[index]);
    });

    // Replace short day names
    englishShortDays.forEach((day, index) => {
      formattedDate = formattedDate.replace(day, shortDayNames[index]);
    });

    return formattedDate;
  } catch (error) {
    return 'Invalid date';
  }
};

// Format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format vendor category
export const formatVendorCategory = (category: VendorCategory): string => {
  if (!category) return '';

  // Replace underscores with spaces and capitalize each word
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get task status with color
export const getTaskStatusInfo = (status: string, dueDate: Date | string) => {
  const date = new Date(dueDate);

  switch (status) {
    case 'completed':
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    case 'in_progress':
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
    case 'not_started':
      if (isPast(date) && !isToday(date)) {
        return { label: 'Overdue', color: 'bg-red-100 text-red-800' };
      }
      if (isToday(date)) {
        return { label: 'Due Today', color: 'bg-amber-100 text-amber-800' };
      }
      return { label: 'Not Started', color: 'bg-gray-100 text-gray-800' };
    case 'overdue':
      return { label: 'Overdue', color: 'bg-red-100 text-red-800' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800' };
  }
};

// Get priority badge
export const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return { label: 'High', color: 'bg-red-100 text-red-800' };
    case 'medium':
      return { label: 'Medium', color: 'bg-amber-100 text-amber-800' };
    case 'low':
      return { label: 'Low', color: 'bg-green-100 text-green-800' };
    default:
      return { label: priority, color: 'bg-gray-100 text-gray-800' };
  }
};

// Get wedding status
export const getWeddingStatusInfo = (status: string, date: Date | string) => {
  const weddingDate = new Date(date);
  const t = i18next.t;

  switch (status) {
    case 'completed':
      return { label: t('clients.completed'), color: 'bg-gray-100 text-gray-700' };
    case 'cancelled':
      return { label: t('clients.cancelled'), color: 'bg-red-100 text-red-800' };
    case 'active':
      if (isPast(weddingDate) && !isToday(weddingDate)) {
        return { label: t('clients.pastDue'), color: 'bg-amber-100 text-amber-800' };
      }
      if (isToday(weddingDate)) {
        return { label: t('dashboard.today'), color: 'bg-green-100 text-green-800' };
      }
      return { label: t('clients.active'), color: 'bg-blue-100 text-blue-800' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800' };
  }
};

// Calculate days remaining
export const getDaysRemaining = (date: Date | string): number => {
  const targetDate = new Date(date);
  const currentDate = new Date();

  // Reset times to midnight for accurate day calculation
  targetDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);

  const differenceInTime = targetDate.getTime() - currentDate.getTime();
  return Math.ceil(differenceInTime / (1000 * 3600 * 24));
};

// Calculate due amount
export const calculateDueAmount = (actual: number, paid: number): number => {
  return Math.max(0, actual - paid);
};
