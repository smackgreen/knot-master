import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Quotation } from '@/types';
import { formatCurrency, formatDate, formatDateI18n } from './formatters';
import i18next from 'i18next';

interface BusinessInfo {
  name: string;
  logo?: string | null;
  address: string;
  city: string;
  email: string;
  phone: string;
  website?: string;
}

interface ClientInfo {
  name: string;
  partnerName?: string;
  email: string;
  phone?: string;
}

interface DocumentCustomization {
  customTitle?: string;
  legalText?: string;
}

// Generate PDF for Invoice
export const generateInvoicePDF = async (
  invoice: Invoice,
  businessInfo: BusinessInfo,
  clientInfo: ClientInfo,
  customization: DocumentCustomization = {}
) => {
  const doc = new jsPDF();
  const t = i18next.t;

  // Set document properties
  doc.setProperties({
    title: `Invoice ${invoice.invoiceNumber}`,
    subject: 'Invoice',
    author: businessInfo.name,
    creator: 'Wedding Planner CRM'
  });

  // Check if we have a logo
  const hasLogo = businessInfo.logo && businessInfo.logo !== "/placeholder.svg" && !businessInfo.logo.includes("placeholder");

  // Add logo and title on the same line
  const headerYPosition = 20;

  // Add company logo if available
  if (hasLogo) {
    try {
      // Add the logo in the top-left corner
      const logoWidth = 30; // Width in mm
      const logoHeight = 15; // Height in mm
      const logoX = 14; // X position
      const logoY = 15; // Y position

      // Add the logo as a data URL
      doc.addImage(businessInfo.logo, 'AUTO', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // Title is removed as requested

  // Add custom title in the top-right corner if provided
  if (customization.customTitle) {
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80); // Dark gray color
    doc.text(customization.customTitle, doc.internal.pageSize.getWidth() - 14, headerYPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
  }

  // Move invoice info below the logo/title
  const infoStartY = 35;
  doc.setFontSize(10);
  doc.text(`${t('invoices.number')}: ${invoice.invoiceNumber}`, 14, infoStartY);
  doc.text(`${t('invoices.issueDate')}: ${formatDateI18n(invoice.issueDate, 'MM/dd/yyyy')}`, 14, infoStartY + 5);
  doc.text(`${t('invoices.dueDate')}: ${formatDateI18n(invoice.dueDate, 'MM/dd/yyyy')}`, 14, infoStartY + 10);


  // Add business info
  doc.setFontSize(12);
  doc.text(`${t('invoices.from')}:`, 14, 55);
  doc.setFontSize(10);
  doc.text(businessInfo.name, 14, 60);
  doc.text(businessInfo.address, 14, 65);
  doc.text(businessInfo.city, 14, 70);
  doc.text(businessInfo.email, 14, 75);

  // Logo is already added at the top of the document


  // Add client info
  doc.setFontSize(12);
  doc.text(`${t('invoices.to')}:`, 120, 55);
  doc.setFontSize(10);
  doc.text(`${clientInfo.name}${clientInfo.partnerName ? ` & ${clientInfo.partnerName}` : ''}`, 120, 60);
  doc.text(clientInfo.email, 120, 65);
  if (clientInfo.phone) {
    doc.text(clientInfo.phone, 120, 70);
  }

  // Add items table
  const tableColumn = [
    t('invoices.description'),
    t('invoices.quantity'),
    t('invoices.unitPrice'),
    t('invoices.amountBeforeTax'),
    t('invoices.total')
  ];
  const tableRows = invoice.items.map(item => {
    const amountBeforeTax = item.amountBeforeTax || (item.quantity * item.unitPrice);

    return [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(amountBeforeTax),
      formatCurrency(item.total)
    ];
  });

  // Adjust table position if we have a logo
  const tableStartY = hasLogo ? 105 : 95;

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' }
    }
  });

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Increase the x-position for the values to prevent overlap
  doc.text(`${t('invoices.subtotal')}:`, 130, finalY);
  doc.text(formatCurrency(invoice.subtotal), 180, finalY, { align: 'right' });

  // Remove the redundant "Montant HT" line

  doc.text(`${t('invoices.vat')}:`, 130, finalY + 8);
  doc.text(formatCurrency(invoice.tax), 180, finalY + 8, { align: 'right' });

  doc.setFontSize(12);
  doc.text(`${t('invoices.total')}:`, 130, finalY + 20);
  doc.text(formatCurrency(invoice.total), 180, finalY + 20, { align: 'right' });

  // Add notes if any
  if (invoice.notes) {
    doc.setFontSize(12);
    doc.text(`${t('invoices.notes')}:`, 14, finalY + 30);
    doc.setFontSize(10);
    doc.text(invoice.notes, 14, finalY + 35);
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);

    // Page number
    doc.text(
      `${t('common.pageCount', { current: i, total: pageCount })}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Legal information if provided
    if (customization.legalText) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Light gray color

      // Split the legal text into multiple lines if it's too long
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - 28; // 14pt margin on each side
      const textLines = doc.splitTextToSize(customization.legalText, maxWidth);

      // Position the legal text at the bottom of the page
      const bottomMargin = 20; // Space from the bottom of the page
      const startY = doc.internal.pageSize.getHeight() - bottomMargin;

      doc.text(textLines, 14, startY);
      doc.setTextColor(0, 0, 0); // Reset to black
    }
  }

  // Save the PDF
  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};

// Generate PDF for Quotation
export const generateQuotationPDF = async (
  quotation: Quotation,
  businessInfo: BusinessInfo,
  clientInfo: ClientInfo,
  customization: DocumentCustomization = {}
) => {
  const doc = new jsPDF();
  const t = i18next.t;

  // Set document properties
  doc.setProperties({
    title: `Quotation ${quotation.quotationNumber}`,
    subject: 'Quotation',
    author: businessInfo.name,
    creator: 'Wedding Planner CRM'
  });

  // Check if we have a logo
  const hasLogo = businessInfo.logo && businessInfo.logo !== "/placeholder.svg" && !businessInfo.logo.includes("placeholder");

  // Add logo and title on the same line
  const headerYPosition = 20;

  // Add company logo if available
  if (hasLogo) {
    try {
      // Add the logo in the top-left corner
      const logoWidth = 30; // Width in mm
      const logoHeight = 15; // Height in mm
      const logoX = 14; // X position
      const logoY = 15; // Y position

      // Add the logo as a data URL
      doc.addImage(businessInfo.logo, 'AUTO', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // Title is removed as requested

  // Add custom title in the top-right corner if provided
  if (customization.customTitle) {
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80); // Dark gray color
    doc.text(customization.customTitle, doc.internal.pageSize.getWidth() - 14, headerYPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
  }

  // Move quotation info below the logo/title
  const infoStartY = 35;
  doc.setFontSize(10);
  doc.text(`${t('quotations.number')}: ${quotation.quotationNumber}`, 14, infoStartY);
  doc.text(`${t('quotations.issueDate')}: ${formatDateI18n(quotation.issueDate, 'MM/dd/yyyy')}`, 14, infoStartY + 5);
  doc.text(`${t('quotations.validUntil')}: ${formatDateI18n(quotation.validUntil, 'MM/dd/yyyy')}`, 14, infoStartY + 10);

  // Add status


  // Add business info
  doc.setFontSize(12);
  doc.text(`${t('quotations.from')}:`, 14, 55);
  doc.setFontSize(10);
  doc.text(businessInfo.name, 14, 60);
  doc.text(businessInfo.address, 14, 65);
  doc.text(businessInfo.city, 14, 70);
  doc.text(businessInfo.email, 14, 75);

  // Logo is already added at the top of the document


  // Add client info
  doc.setFontSize(12);
  doc.text(`${t('quotations.to')}:`, 120, 55);
  doc.setFontSize(10);
  doc.text(`${clientInfo.name}${clientInfo.partnerName ? ` & ${clientInfo.partnerName}` : ''}`, 120, 60);
  doc.text(clientInfo.email, 120, 65);
  if (clientInfo.phone) {
    doc.text(clientInfo.phone, 120, 70);
  }

  // Add items table
  const tableColumn = [
    t('quotations.description'),
    t('quotations.quantity'),
    t('quotations.unitPrice'),
    t('quotations.amountBeforeTax'),
    t('quotations.total')
  ];
  const tableRows = quotation.items.map(item => {
    const amountBeforeTax = item.amountBeforeTax || (item.quantity * item.unitPrice);

    return [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(amountBeforeTax),
      formatCurrency(item.total)
    ];
  });

  // Adjust table position if we have a logo
  const tableStartY = hasLogo ? 105 : 95;

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' }
    }
  });

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Increase the x-position for the values to prevent overlap
  doc.text(`${t('quotations.subtotal')}:`, 130, finalY);
  doc.text(formatCurrency(quotation.subtotal), 180, finalY, { align: 'right' });

  // Remove the redundant "Montant HT" line

  doc.text(`${t('quotations.vat')}:`, 130, finalY + 8);
  doc.text(formatCurrency(quotation.tax), 180, finalY + 8, { align: 'right' });

  doc.setFontSize(12);
  doc.text(`${t('quotations.total')}:`, 130, finalY + 20);
  doc.text(formatCurrency(quotation.total), 180, finalY + 20, { align: 'right' });

  // Add notes if any
  if (quotation.notes) {
    doc.setFontSize(12);
    doc.text(`${t('quotations.notes')}:`, 14, finalY + 30);
    doc.setFontSize(10);
    doc.text(quotation.notes, 14, finalY + 35);
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);

    // Page number
    doc.text(
      `${t('common.pageCount', { current: i, total: pageCount })}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Legal information if provided
    if (customization.legalText) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Light gray color

      // Split the legal text into multiple lines if it's too long
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - 28; // 14pt margin on each side
      const textLines = doc.splitTextToSize(customization.legalText, maxWidth);

      // Position the legal text at the bottom of the page
      const bottomMargin = 20; // Space from the bottom of the page
      const startY = doc.internal.pageSize.getHeight() - bottomMargin;

      doc.text(textLines, 14, startY);
      doc.setTextColor(0, 0, 0); // Reset to black
    }
  }

  // Save the PDF
  doc.save(`Quotation_${quotation.quotationNumber}.pdf`);
};
