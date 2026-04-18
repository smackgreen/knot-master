
import { Invoice, Quotation, InvoiceItem } from '../types';

// Helper function to generate invoice items
const generateInvoiceItems = (count: number): InvoiceItem[] => {
  const items: InvoiceItem[] = [];
  const descriptions = [
    'Venue Coordination',
    'Event Planning Services',
    'Photography Package',
    'Catering Services',
    'Floral Arrangements',
    'DJ Services',
    'Wedding Cake',
    'Transportation',
    'Ceremony Setup',
    'Reception Setup'
  ];
  
  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = Math.floor(Math.random() * 900) + 100;
    items.push({
      id: Math.random().toString(36).substring(2, 9),
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      quantity,
      unitPrice,
      total: quantity * unitPrice
    });
  }
  
  return items;
};

// Generate a mock invoice
const generateMockInvoice = (id: string, clientId: string, number: string, status: Invoice['status']): Invoice => {
  const items = generateInvoiceItems(Math.floor(Math.random() * 4) + 2);
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const tax = Math.round(subtotal * 0.08);
  
  return {
    id,
    clientId,
    number,
    issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    status,
    items,
    subtotal,
    tax,
    total: subtotal + tax,
    notes: Math.random() > 0.5 ? 'Please pay by the due date.' : undefined,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
  };
};

// Generate a mock quotation
const generateMockQuotation = (id: string, clientId: string, number: string, status: Quotation['status']): Quotation => {
  const items = generateInvoiceItems(Math.floor(Math.random() * 4) + 2);
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const tax = Math.round(subtotal * 0.08);
  
  return {
    id,
    clientId,
    number,
    issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    status,
    items,
    subtotal,
    tax,
    total: subtotal + tax,
    notes: Math.random() > 0.5 ? 'This quote is valid for 30 days.' : undefined,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
  };
};

// Create mock invoices
export const mockInvoices: Invoice[] = [
  generateMockInvoice('inv-1', 'client-1', 'INV-2025-001', 'paid'),
  generateMockInvoice('inv-2', 'client-2', 'INV-2025-002', 'sent'),
  generateMockInvoice('inv-3', 'client-3', 'INV-2025-003', 'draft'),
  generateMockInvoice('inv-4', 'client-1', 'INV-2025-004', 'overdue'),
  generateMockInvoice('inv-5', 'client-2', 'INV-2025-005', 'draft')
];

// Create mock quotations
export const mockQuotations: Quotation[] = [
  generateMockQuotation('quote-1', 'client-1', 'Q-2025-001', 'accepted'),
  generateMockQuotation('quote-2', 'client-2', 'Q-2025-002', 'sent'),
  generateMockQuotation('quote-3', 'client-3', 'Q-2025-003', 'rejected'),
  generateMockQuotation('quote-4', 'client-1', 'Q-2025-004', 'draft'),
  generateMockQuotation('quote-5', 'client-2', 'Q-2025-005', 'draft')
];
