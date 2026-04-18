// Types for the advanced guest management with QR code check-in

import { Guest } from "./index";

export interface GuestWithCheckin extends Guest {
  qrCode?: string;
  checkedIn: boolean;
  checkInTime?: Date | string;
  checkInNotes?: string;
  specialAccommodations?: string;
  groupId?: string;
  group?: GuestGroup;
}

export interface GuestGroup {
  id: string;
  clientId: string;
  name: string;
  type: 'family' | 'couple' | 'individual' | string;
  qrCode?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  guests?: GuestWithCheckin[];
}

export interface CheckInEvent {
  id: string;
  clientId: string;
  name: string;
  eventDate: Date | string;
  location?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  checkInRecords?: CheckInRecord[];
  checkInStations?: CheckInStation[];
}

export interface CheckInRecord {
  id: string;
  eventId: string;
  guestId: string;
  checkInTime: Date | string;
  checkedInBy?: string;
  method: 'qr' | 'manual' | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  guest?: GuestWithCheckin;
}

export interface CheckInStation {
  id: string;
  eventId: string;
  name: string;
  deviceId?: string;
  isActive: boolean;
  lastActive?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// QR code generation types
export interface QRCodeData {
  type: 'guest' | 'group';
  id: string;
  clientId: string;
  name: string;
}

export interface QRCodeOptions {
  size?: number;
  color?: string;
  backgroundColor?: string;
  includeMargin?: boolean;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// Check-in statistics types
export interface CheckInStatistics {
  totalGuests: number;
  checkedInGuests: number;
  checkedInPercentage: number;
  checkInsByHour: CheckInByHour[];
  checkInsByGroup: CheckInByGroup[];
}

export interface CheckInByHour {
  hour: string;
  count: number;
}

export interface CheckInByGroup {
  groupType: string;
  total: number;
  checkedIn: number;
  percentage: number;
}

// Mobile check-in app types
export interface CheckInAppState {
  eventId: string;
  stationId: string;
  stationName: string;
  isOnline: boolean;
  lastSyncTime?: Date | string;
  pendingCheckIns: PendingCheckIn[];
}

export interface PendingCheckIn {
  guestId: string;
  checkInTime: Date | string;
  checkedInBy: string;
  method: 'qr' | 'manual' | string;
  notes?: string;
  synced: boolean;
}

// Guest search and filter types
export interface GuestSearchFilters {
  searchTerm?: string;
  checkedInOnly?: boolean;
  notCheckedInOnly?: boolean;
  groupType?: string;
  tableNumber?: string;
  mealPreference?: string;
}

// Guest check-in result types
export interface CheckInResult {
  success: boolean;
  message: string;
  guest?: GuestWithCheckin;
  group?: GuestGroup;
  tableAssignment?: string;
  mealPreference?: string;
  specialAccommodations?: string;
}

// Guest badge printing types
export interface GuestBadge {
  guestId: string;
  guestName: string;
  tableNumber?: string;
  mealPreference?: string;
  specialAccommodations?: string;
  badgeTemplate: string;
  badgeColor?: string;
}

export interface BadgePrintJob {
  eventId: string;
  badges: GuestBadge[];
  printerId?: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  errorMessage?: string;
}
