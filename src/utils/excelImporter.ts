import { Guest, GuestStatus } from '@/types';
import * as XLSX from 'xlsx';

interface ExcelGuestRow {
  [key: string]: any;
}

export const parseExcelFile = async (file: File): Promise<ExcelGuestRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Assume first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(worksheet);
        resolve(rows as ExcelGuestRow[]);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

interface ExcelGuestData extends Partial<Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>> {
  // Add legacy fields for backward compatibility
  plusOne?: boolean;
  plusOneName?: string;
}

export const mapExcelRowsToGuests = (
  rows: ExcelGuestRow[],
  clientId: string,
  columnMapping: Record<string, string>
): Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>[] => {
  return rows.map(row => {
    const guest: ExcelGuestData = {
      clientId,
      status: 'pending' as GuestStatus,
      isCouple: false,
      hasChildren: false,
      children: [],
      country: 'USA', // Default country
      // Legacy fields
      plusOne: false
    };

    // Map each column based on the provided mapping
    Object.entries(columnMapping).forEach(([guestKey, excelColumn]) => {
      if (row[excelColumn] !== undefined) {
        // Handle special cases
        if (guestKey === 'plusOne' || guestKey === 'isCouple' || guestKey === 'hasChildren') {
          // Convert 'Yes'/'No' to boolean
          const value = typeof row[excelColumn] === 'string'
            ? row[excelColumn] === 'Yes' || row[excelColumn] === 'yes' || row[excelColumn] === 'true' || row[excelColumn] === 'TRUE'
            : !!row[excelColumn];

          // @ts-ignore - Dynamic property assignment
          guest[guestKey] = value;

          // Keep plusOne and isCouple in sync
          if (guestKey === 'plusOne') guest.isCouple = value;
          if (guestKey === 'isCouple') guest.plusOne = value;
        } else if (guestKey === 'status') {
          // Validate status
          const status = String(row[excelColumn]).toLowerCase();
          if (['pending', 'invited', 'confirmed', 'declined'].includes(status)) {
            guest[guestKey] = status as GuestStatus;
          }
        } else if (guestKey === 'childrenNames') {
          // Process children names
          const childrenNames = String(row[excelColumn]).split(',').map(name => name.trim()).filter(Boolean);
          if (childrenNames.length > 0) {
            guest.hasChildren = true;
            guest.children = childrenNames.map(name => ({ name }));
          }
        } else if (guestKey === 'childrenAges') {
          // Process children ages
          const childrenAges = String(row[excelColumn]).split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age));
          if (childrenAges.length > 0 && guest.children) {
            // Assign ages to existing children
            childrenAges.forEach((age, index) => {
              if (guest.children && index < guest.children.length) {
                guest.children[index].age = age;
              }
            });
          }
        } else if (guestKey === 'childrenMealPreferences') {
          // Process children meal preferences
          const childrenMeals = String(row[excelColumn]).split(',').map(meal => meal.trim()).filter(Boolean);
          if (childrenMeals.length > 0 && guest.children) {
            // Assign meal preferences to existing children
            childrenMeals.forEach((meal, index) => {
              if (guest.children && index < guest.children.length) {
                guest.children[index].mealPreference = meal;
              }
            });
          }
        } else {
          // @ts-ignore - Dynamic property assignment
          guest[guestKey] = row[excelColumn];
        }
      }
    });

    // Ensure required fields
    if (!guest.firstName || !guest.lastName) {
      throw new Error(`First name and last name are required for all guests. Row: ${JSON.stringify(row)}`);
    }

    // If plusOneName is provided but partner names aren't, try to parse the plusOneName
    if (!guest.partnerFirstName && !guest.partnerLastName && guest.plusOneName) {
      const nameParts = guest.plusOneName.split(' ');
      if (nameParts.length >= 2) {
        guest.partnerFirstName = nameParts[0];
        guest.partnerLastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        guest.partnerFirstName = nameParts[0];
      }
    }

    return guest as Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>;
  });
};

// Define standard column mapping
export const standardColumnMapping = {
  // Primary guest
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  city: 'City',
  state: 'State',
  postalCode: 'Postal Code',
  country: 'Country',
  status: 'Status',
  mealPreference: 'Meal Preference',

  // Partner information
  isCouple: 'Is Couple',
  partnerFirstName: 'Partner First Name',
  partnerLastName: 'Partner Last Name',
  partnerEmail: 'Partner Email',
  partnerMealPreference: 'Partner Meal Preference',

  // Children information
  hasChildren: 'Has Children',
  childrenNames: 'Children Names',
  childrenAges: 'Children Ages',
  childrenMealPreferences: 'Children Meal Preferences',

  // Other information
  tableAssignment: 'Table Assignment',
  notes: 'Notes',

  // Legacy fields (for backward compatibility)
  plusOne: 'Plus One',
  plusOneName: 'Plus One Name'
};
