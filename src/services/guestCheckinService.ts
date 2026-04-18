import { supabase } from '@/integrations/supabase/client';
import {
  GuestWithCheckin,
  GuestGroup,
  CheckInEvent,
  CheckInRecord,
  CheckInStation,
  QRCodeData,
  CheckInStatistics,
  CheckInResult,
  GuestSearchFilters
} from '@/types/guestCheckin';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';

// Guest Groups
export const fetchGuestGroups = async (clientId: string): Promise<GuestGroup[]> => {
  const { data, error } = await supabase
    .from('guest_groups')
    .select(`
      id,
      client_id,
      name,
      type,
      qr_code,
      notes,
      created_at,
      updated_at,
      guests:guests(*)
    `)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error fetching guest groups:', error);
    throw error;
  }

  return data.map(group => ({
    id: group.id,
    clientId: group.client_id,
    name: group.name,
    type: group.type,
    qrCode: group.qr_code,
    notes: group.notes,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
    guests: group.guests ? group.guests.map(formatGuest) : []
  }));
};

export const createGuestGroup = async (
  clientId: string,
  name: string,
  type: string = 'family',
  notes?: string
): Promise<GuestGroup> => {
  // Get the user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Generate a unique QR code for the group
  const qrCode = generateQRCode({
    type: 'group',
    id: uuidv4(), // Temporary ID until we get the real one
    clientId,
    name
  });

  const { data, error } = await supabase
    .from('guest_groups')
    .insert({
      user_id: user.id,
      client_id: clientId,
      name,
      type,
      qr_code: qrCode,
      notes
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating guest group:', error);
    throw error;
  }

  // Update the QR code with the real ID
  const updatedQRCode = generateQRCode({
    type: 'group',
    id: data.id,
    clientId,
    name
  });

  const { error: updateError } = await supabase
    .from('guest_groups')
    .update({ qr_code: updatedQRCode })
    .eq('id', data.id);

  if (updateError) {
    console.error('Error updating guest group QR code:', updateError);
  }

  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    type: data.type,
    qrCode: updatedQRCode,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    guests: []
  };
};

// Check-in Events
export const fetchCheckInEvents = async (clientId: string): Promise<CheckInEvent[]> => {
  const { data, error } = await supabase
    .from('check_in_events')
    .select('*')
    .eq('client_id', clientId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching check-in events:', error);
    throw error;
  }

  return data.map(event => ({
    id: event.id,
    clientId: event.client_id,
    name: event.name,
    eventDate: event.event_date,
    location: event.location,
    description: event.description,
    isActive: event.is_active,
    createdAt: event.created_at,
    updatedAt: event.updated_at
  }));
};

export const createCheckInEvent = async (
  clientId: string,
  name: string,
  eventDate: string,
  location?: string,
  description?: string
): Promise<CheckInEvent> => {
  // Get the user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('check_in_events')
    .insert({
      user_id: user.id,
      client_id: clientId,
      name,
      event_date: eventDate,
      location,
      description,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating check-in event:', error);
    throw error;
  }

  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    eventDate: data.event_date,
    location: data.location,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Check-in Records
export const fetchCheckInRecords = async (eventId: string): Promise<CheckInRecord[]> => {
  const { data, error } = await supabase
    .from('check_in_records')
    .select(`
      id,
      event_id,
      guest_id,
      check_in_time,
      checked_in_by,
      method,
      notes,
      created_at,
      updated_at,
      guest:guests(*)
    `)
    .eq('event_id', eventId)
    .order('check_in_time', { ascending: false });

  if (error) {
    console.error('Error fetching check-in records:', error);
    throw error;
  }

  return data.map(record => ({
    id: record.id,
    eventId: record.event_id,
    guestId: record.guest_id,
    checkInTime: record.check_in_time,
    checkedInBy: record.checked_in_by,
    method: record.method,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    guest: record.guest ? formatGuest(record.guest) : undefined
  }));
};

export const checkInGuest = async (
  eventId: string,
  guestId: string,
  checkedInBy?: string,
  method: string = 'qr',
  notes?: string
): Promise<CheckInResult> => {
  try {
    // First, check if the guest exists
    const { data: guestData, error: guestError } = await supabase
      .from('guests')
      .select(`
        *,
        group:guest_groups(*)
      `)
      .eq('id', guestId)
      .single();

    if (guestError) {
      return {
        success: false,
        message: 'Guest not found'
      };
    }

    // Check if the guest is already checked in for this event
    const { data: existingRecord, error: recordError } = await supabase
      .from('check_in_records')
      .select('*')
      .eq('event_id', eventId)
      .eq('guest_id', guestId)
      .maybeSingle();

    if (existingRecord) {
      return {
        success: false,
        message: 'Guest already checked in',
        guest: formatGuest(guestData),
        group: guestData.group ? {
          id: guestData.group.id,
          clientId: guestData.group.client_id,
          name: guestData.group.name,
          type: guestData.group.type,
          qrCode: guestData.group.qr_code,
          notes: guestData.group.notes,
          createdAt: guestData.group.created_at,
          updatedAt: guestData.group.updated_at
        } : undefined,
        tableAssignment: guestData.table_assignment,
        mealPreference: guestData.meal_preference,
        specialAccommodations: guestData.special_accommodations
      };
    }

    // Create the check-in record
    const { data: checkInData, error: checkInError } = await supabase
      .from('check_in_records')
      .insert({
        event_id: eventId,
        guest_id: guestId,
        check_in_time: new Date().toISOString(),
        checked_in_by: checkedInBy,
        method,
        notes
      })
      .select()
      .single();

    if (checkInError) {
      return {
        success: false,
        message: 'Error creating check-in record'
      };
    }

    // Update the guest's checked_in status
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        checked_in: true,
        check_in_time: new Date().toISOString(),
        check_in_notes: notes
      })
      .eq('id', guestId);

    if (updateError) {
      return {
        success: false,
        message: 'Error updating guest check-in status'
      };
    }

    return {
      success: true,
      message: 'Guest checked in successfully',
      guest: formatGuest(guestData),
      group: guestData.group ? {
        id: guestData.group.id,
        clientId: guestData.group.client_id,
        name: guestData.group.name,
        type: guestData.group.type,
        qrCode: guestData.group.qr_code,
        notes: guestData.group.notes,
        createdAt: guestData.group.created_at,
        updatedAt: guestData.group.updated_at
      } : undefined,
      tableAssignment: guestData.table_assignment,
      mealPreference: guestData.meal_preference,
      specialAccommodations: guestData.special_accommodations
    };
  } catch (error) {
    console.error('Error checking in guest:', error);
    return {
      success: false,
      message: 'An unexpected error occurred'
    };
  }
};

// Check-in Statistics
export const getCheckInStatistics = async (eventId: string): Promise<CheckInStatistics> => {
  try {
    // Get the event details to get the client ID
    const { data: eventData, error: eventError } = await supabase
      .from('check_in_events')
      .select('client_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      throw new Error('Event not found');
    }

    // Get all guests for this client
    const { data: guestsData, error: guestsError } = await supabase
      .from('guests')
      .select('id, group_id')
      .eq('client_id', eventData.client_id);

    if (guestsError) {
      throw new Error('Error fetching guests');
    }

    // Get all check-in records for this event
    const { data: checkInsData, error: checkInsError } = await supabase
      .from('check_in_records')
      .select('guest_id, check_in_time')
      .eq('event_id', eventId);

    if (checkInsError) {
      throw new Error('Error fetching check-in records');
    }

    const totalGuests = guestsData.length;
    const checkedInGuests = checkInsData.length;
    const checkedInPercentage = totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0;

    // Process check-ins by hour
    const checkInsByHour = processCheckInsByHour(checkInsData);

    // Process check-ins by group
    const checkInsByGroup = await processCheckInsByGroup(eventData.client_id, guestsData, checkInsData);

    return {
      totalGuests,
      checkedInGuests,
      checkedInPercentage,
      checkInsByHour,
      checkInsByGroup
    };
  } catch (error) {
    console.error('Error getting check-in statistics:', error);
    throw error;
  }
};

// Helper functions
function formatGuest(guest: any): GuestWithCheckin {
  return {
    id: guest.id,
    clientId: guest.client_id,
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    rsvpStatus: guest.rsvp_status,
    mealPreference: guest.meal_preference,
    tableAssignment: guest.table_assignment,
    plusOne: guest.plus_one,
    notes: guest.notes,
    createdAt: guest.created_at,
    qrCode: guest.qr_code,
    checkedIn: guest.checked_in || false,
    checkInTime: guest.check_in_time,
    checkInNotes: guest.check_in_notes,
    specialAccommodations: guest.special_accommodations,
    groupId: guest.group_id
  };
}

function generateQRCode(data: QRCodeData): string {
  // In a real implementation, this would generate a QR code image or data URL
  // For now, we'll just return a JSON string that would be encoded in the QR
  return JSON.stringify(data);
}

function processCheckInsByHour(checkIns: any[]): { hour: string; count: number }[] {
  const hourCounts: Record<string, number> = {};

  checkIns.forEach(checkIn => {
    const hour = format(parseISO(checkIn.check_in_time), 'HH:00');
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  return Object.entries(hourCounts).map(([hour, count]) => ({
    hour,
    count
  })).sort((a, b) => a.hour.localeCompare(b.hour));
}

async function processCheckInsByGroup(
  clientId: string,
  guests: any[],
  checkIns: any[]
): Promise<{ groupType: string; total: number; checkedIn: number; percentage: number }[]> {
  // Get all guest groups
  const { data: groupsData, error: groupsError } = await supabase
    .from('guest_groups')
    .select('id, type')
    .eq('client_id', clientId);

  if (groupsError) {
    throw new Error('Error fetching guest groups');
  }

  // Create a map of group IDs to group types
  const groupTypes: Record<string, string> = {};
  groupsData.forEach(group => {
    groupTypes[group.id] = group.type;
  });

  // Count guests by group type
  const groupCounts: Record<string, { total: number; checkedIn: number }> = {};

  guests.forEach(guest => {
    const groupType = guest.group_id ? groupTypes[guest.group_id] || 'Unknown' : 'Individual';
    
    if (!groupCounts[groupType]) {
      groupCounts[groupType] = { total: 0, checkedIn: 0 };
    }
    
    groupCounts[groupType].total += 1;
  });

  // Count checked-in guests by group type
  const checkedInGuestIds = new Set(checkIns.map((checkIn: any) => checkIn.guest_id));
  
  guests.forEach(guest => {
    if (checkedInGuestIds.has(guest.id)) {
      const groupType = guest.group_id ? groupTypes[guest.group_id] || 'Unknown' : 'Individual';
      groupCounts[groupType].checkedIn += 1;
    }
  });

  // Calculate percentages and format the result
  return Object.entries(groupCounts).map(([groupType, counts]) => ({
    groupType,
    total: counts.total,
    checkedIn: counts.checkedIn,
    percentage: counts.total > 0 ? (counts.checkedIn / counts.total) * 100 : 0
  }));
}
