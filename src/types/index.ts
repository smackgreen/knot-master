
export interface Client {
  id: string;
  name: string;
  partnerName: string;
  email: string;
  phone: string;
  weddingDate: Date | string;
  venue: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date | string;
  budget?: Budget;
  vendors?: Vendor[];
  tasks?: Task[];
  guests?: Guest[];
  mealPlans?: MealPlan[];
}

export interface Vendor {
  id: string;
  clientId: string;
  name: string;
  category: VendorCategory;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  cost?: number;
  isPaid?: boolean;
}

export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'florist'
  | 'music'
  | 'cake'
  | 'attire'
  | 'hair_makeup'
  | 'transportation'
  | 'rentals'
  | 'stationery'
  | 'gifts'
  | 'other';

export interface Budget {
  id: string;
  clientId: string;
  totalBudget: number;
  spentSoFar: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  category: VendorCategory;
  allocated: number;
  spent: number;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  dueDate: Date | string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date | string;
  category?: VendorCategory;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export type GuestStatus = 'invited' | 'confirmed' | 'declined' | 'pending';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amountBeforeTax: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string; // Changed from 'number' to 'invoiceNumber' to be consistent
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  legalText?: string;
  customTitle?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  clientId: string;
  quotationNumber: string; // Changed from 'number' to 'quotationNumber' to be consistent
  issueDate: string;
  validUntil: string;
  status: QuotationStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  legalText?: string;
  customTitle?: string;
  createdAt: string;
}

export interface Child {
  name: string;
  age?: number;
  mealPreference?: string;
}

export type TableShape = 'round' | 'rectangular' | 'square' | 'custom';

export interface Table {
  id: string;
  clientId: string;
  name: string;
  shape: TableShape;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  capacity: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeatingChart {
  id: string;
  clientId: string;
  name: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status: GuestStatus;
  rsvpStatus?: string;
  mealPreference?: string;
  isCouple: boolean;
  partnerFirstName?: string;
  partnerLastName?: string;
  partnerEmail?: string;
  partnerMealPreference?: string;
  hasChildren: boolean;
  children?: Child[];
  tableAssignment?: string; // Kept for backward compatibility
  tableId?: string; // Reference to a table
  seatPosition?: number; // Position at the table
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ColorSchemeType = 'primary' | 'accent' | 'neutral';

export interface ColorScheme {
  id: string;
  suggestionId: string;
  name: string;
  type: ColorSchemeType;
  hexValue: string;
  createdAt: string;
}

export interface DecorIdea {
  id: string;
  suggestionId: string;
  category: string; // 'centerpiece', 'backdrop', 'lighting', etc.
  description: string;
  imageUrl?: string;
  createdAt: string;
}

export interface VisualizationProject {
  id: string;
  suggestionId: string;
  name: string;
  venueImageUrl?: string;
  modifiedImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignSuggestion {
  id: string;
  clientId: string;
  name: string;
  theme?: string;
  season?: string;
  preferences?: string;
  colorSchemes?: ColorScheme[];
  decorIdeas?: DecorIdea[];
  visualizations?: VisualizationProject[];
  createdAt: string;
  updatedAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'cocktail';

export type CourseType = 'starter' | 'main' | 'dessert' | 'beverage' | 'snack';

export interface DietaryRestriction {
  id: string;
  guestId: string;
  restrictionType: string; // 'vegetarian', 'vegan', 'gluten_free', etc.
  notes?: string;
  createdAt: string;
}

export interface MealItemFlags {
  meetsVegetarian?: boolean;
  meetsVegan?: boolean;
  meetsGlutenFree?: boolean;
  meetsDairyFree?: boolean;
  meetsNutFree?: boolean;
  meetsHalalKosher?: boolean;
  meetsSeasonality?: boolean;
  meetsRegion?: boolean;
}

export interface MealItem {
  id: string;
  mealPlanId: string;
  name: string;
  description?: string;
  course: CourseType;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  containsAlcohol: boolean;
  estimatedCostPerPerson?: number;
  imageUrl?: string;
  seasonality?: string[];
  region?: string;
  notes?: string;
  createdAt: string;
  // Optional flags for UI indicators
  flags?: MealItemFlags;
  meetsAllRequirements?: boolean;
}

export interface MealPlan {
  id: string;
  clientId: string;
  name: string;
  eventDate?: Date | string;
  mealType: MealType;
  guestCount?: number;
  budgetPerPerson?: number;
  location?: string;
  season?: string;
  culturalRequirements?: string;
  preferences?: string;
  notes?: string;
  mealItems?: MealItem[];
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled';
export type ContractCategory = 'client' | 'vendor' | 'planning' | 'other';

export interface Signature {
  name: string;
  signature: string; // Base64 encoded signature image
  email: string;
  timestamp: string;
  ip?: string;
}

export type DocumentStatus = 'pending' | 'signed' | 'expired' | 'cancelled';
export type SignerRole = 'client' | 'vendor' | 'planner';
export type SignatureRequestStatus = 'pending' | 'completed' | 'expired' | 'cancelled';
export type SignatureEventType = 'created' | 'viewed' | 'signed' | 'expired' | 'cancelled';

export interface Document {
  id: string;
  contractId?: string;
  quotationId?: string;
  invoiceId?: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  signatures?: ElectronicSignature[];
  signatureRequests?: SignatureRequest[];
}

export interface ElectronicSignature {
  id: string;
  documentId: string;
  signerName: string;
  signerEmail: string;
  signerRole: SignerRole;
  signatureImage: string; // Base64 encoded signature image
  ipAddress?: string;
  consentTimestamp: string;
  createdAt: string;
}

export interface SignatureRequest {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  recipientRole: SignerRole;
  status: SignatureRequestStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  metadata?: {
    invoiceId?: string;
    quotationId?: string;
    [key: string]: any;
  };
}

export interface SignatureEvent {
  id: string;
  documentId: string;
  eventType: SignatureEventType;
  actor?: string; // email of the person who performed the action
  actorRole?: string; // client, vendor, planner, system
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: ContractCategory;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  templateId?: string;
  clientId?: string;
  vendorId?: string;
  name: string;
  content: string;
  status: ContractStatus;
  clientSignature?: Signature;
  vendorSignature?: Signature;
  plannerSignature?: Signature;
  sentAt?: string;
  expiresAt?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}
