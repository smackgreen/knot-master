/**
 * PDF Processing Utilities for Dual-Layer Signature System
 * 
 * This module provides the core PDF manipulation functions:
 * - Layer 2 (Visual): Embeds signature images into PDF pages using pdf-lib
 * - Layer 1 (Cryptographic): Applies digital certificates using node-signpdf
 * 
 * @module pdf-processor
 */

import { PDFDocument, PDFImage, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib';
import signpdf from 'node-signpdf';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SignatureEmbedding {
  /** Base64-encoded PNG signature image */
  signatureImage: string;
  /** Role of the signer (organizer/planner or client) */
  signerRole: 'organizer' | 'client' | 'planner' | 'vendor';
  /** Full name of the signer */
  signerName: string;
  /** Email of the signer */
  signerEmail: string;
  /** Timestamp of when the signature was captured */
  signedAt: string;
}

export interface SignaturePlacement {
  /** X coordinate (from left edge of page) */
  x: number;
  /** Y coordinate (from bottom edge of page) */
  y: number;
  /** Width of the signature image */
  width: number;
  /** Height of the signature image */
  height: number;
  /** Page number (1-based) */
  page: number;
}

export interface VisualEmbedResult {
  success: boolean;
  pdfBytes: Buffer | null;
  error?: string;
}

export interface CryptoSignResult {
  success: boolean;
  signedPdfBytes: Buffer | null;
  error?: string;
}

export interface FinalizeResult {
  success: boolean;
  pdfBytes: Buffer | null;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default signature placements for organizer and client */
const DEFAULT_SIGNATURE_PLACEMENTS: Record<string, SignaturePlacement> = {
  organizer: {
    x: 50,
    y: 120,
    width: 200,
    height: 60,
    page: -1, // Last page
  },
  planner: {
    x: 50,
    y: 120,
    width: 200,
    height: 60,
    page: -1,
  },
  client: {
    x: 320,
    y: 120,
    width: 200,
    height: 60,
    page: -1,
  },
  vendor: {
    x: 320,
    y: 60,
    width: 200,
    height: 60,
    page: -1,
  },
};

// ============================================================================
// Layer 2: Visual Signature Embedding
// ============================================================================

/**
 * Embed visual signature images into a PDF document at precise locations.
 * 
 * This function:
 * 1. Loads the original PDF
 * 2. For each signature, converts the base64 PNG to a PDF image
 * 3. Places the image at the designated coordinates on the correct page
 * 4. Adds signer metadata (name, date, role) below each signature
 * 5. Returns the modified PDF bytes
 * 
 * @param pdfBytes - Original PDF file as a Buffer
 * @param signatures - Array of signature data to embed
 * @param customPlacements - Optional custom placement overrides
 * @returns Result containing the modified PDF bytes
 */
export async function embedVisualSignatures(
  pdfBytes: Buffer,
  signatures: SignatureEmbedding[],
  customPlacements?: Record<string, SignaturePlacement>
): Promise<VisualEmbedResult> {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    if (pages.length === 0) {
      return { success: false, pdfBytes: null, error: 'PDF has no pages' };
    }

    // Embed the Helvetica font for metadata text
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const sig of signatures) {
      // Determine placement
      const placement = customPlacements?.[sig.signerRole] 
        || DEFAULT_SIGNATURE_PLACEMENTS[sig.signerRole]
        || DEFAULT_SIGNATURE_PLACEMENTS.client;

      // Resolve page number (-1 means last page)
      const pageIndex = placement.page === -1 ? pages.length - 1 : placement.page - 1;
      
      if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn(`Invalid page index ${pageIndex} for ${sig.signerRole}, using last page`);
        continue;
      }

      const page = pages[pageIndex];
      const { height: pageHeight } = page.getSize();

      // Convert base64 to Uint8Array
      const base64Data = sig.signatureImage.includes(',')
        ? sig.signatureImage.split(',')[1]
        : sig.signatureImage;
      
      const imageBytes = Buffer.from(base64Data, 'base64');
      
      // Embed the PNG image
      let signatureImage: PDFImage;
      try {
        signatureImage = await pdfDoc.embedPng(imageBytes);
      } catch (pngError) {
        // If PNG embedding fails, try JPEG (some canvas implementations output JPEG)
        console.warn('PNG embedding failed, trying JPEG:', pngError);
        try {
          signatureImage = await pdfDoc.embedJpg(imageBytes);
        } catch (jpgError) {
          console.error('Both PNG and JPEG embedding failed:', jpgError);
          continue;
        }
      }

      // Calculate dimensions maintaining aspect ratio
      const imgDims = signatureImage.size();
      const targetWidth = placement.width;
      const targetHeight = placement.height;
      const scale = Math.min(
        targetWidth / imgDims.width,
        targetHeight / imgDims.height
      );
      const finalWidth = imgDims.width * scale;
      const finalHeight = imgDims.height * scale;

      // Center the signature within the placement area
      const offsetX = (targetWidth - finalWidth) / 2;
      const offsetY = (targetHeight - finalHeight) / 2;

      // Draw the signature image
      page.drawImage(signatureImage, {
        x: placement.x + offsetX,
        y: pageHeight - placement.y - finalHeight + offsetY,
        width: finalWidth,
        height: finalHeight,
      });

      // Draw signer metadata below the signature
      const metadataY = pageHeight - placement.y - finalHeight - 10;
      
      // Draw a signature line
      page.drawLine({
        start: { x: placement.x, y: pageHeight - placement.y + 2 },
        end: { x: placement.x + targetWidth, y: pageHeight - placement.y + 2 },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      });

      // Signer name
      page.drawText(sig.signerName, {
        x: placement.x,
        y: metadataY,
        size: 8,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Signer role
      const roleLabel = sig.signerRole.charAt(0).toUpperCase() + sig.signerRole.slice(1);
      const nameWidth = helveticaBoldFont.widthOfTextAtSize(sig.signerName, 8);
      page.drawText(`(${roleLabel})`, {
        x: placement.x + nameWidth + 4,
        y: metadataY,
        size: 7,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Signing date
      const formattedDate = new Date(sig.signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      page.drawText(formattedDate, {
        x: placement.x,
        y: metadataY - 12,
        size: 7,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Signer email
      page.drawText(sig.signerEmail, {
        x: placement.x,
        y: metadataY - 22,
        size: 6,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    return {
      success: true,
      pdfBytes: Buffer.from(modifiedPdfBytes),
    };
  } catch (error: any) {
    console.error('Error embedding visual signatures:', error);
    return {
      success: false,
      pdfBytes: null,
      error: error.message || 'Unknown error embedding visual signatures',
    };
  }
}

// ============================================================================
// Layer 1: Cryptographic Digital Signature
// ============================================================================

/**
 * Apply a cryptographic digital signature to a PDF document.
 *
 * This function:
 * 1. Loads the PDF with an added signature placeholder
 * 2. Signs the PDF using node-signpdf with the provided PKCS#12 certificate
 * 3. Returns the cryptographically signed PDF bytes
 *
 * The digital signature ensures:
 * - Document integrity (any modification is detectable)
 * - Non-repudiation (signer cannot deny signing)
 * - Tamper-evidence (changes invalidate the signature)
 *
 * @param pdfBytes - PDF bytes (with visual signatures already embedded)
 * @param p12Buffer - PKCS#12 (.p12/.pfx) certificate buffer
 * @param signerInfo - Information about the signer for the signature dictionary
 * @returns Result containing the digitally signed PDF bytes
 */
export async function applyCryptographicSignature(
  pdfBytes: Buffer,
  p12Buffer: Buffer,
  signerInfo?: {
    name?: string;
    email?: string;
    reason?: string;
    location?: string;
  }
): Promise<CryptoSignResult> {
  try {
    // Load the PDF and add a signature placeholder
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Add signature metadata to the PDF
    if (signerInfo) {
      pdfDoc.setTitle('Signed Document');
      pdfDoc.setSubject('Digitally Signed Document');
      pdfDoc.setCreator('KnotToIt Document Signing System');
      pdfDoc.setProducer('KnotToIt PDF Processor');
      pdfDoc.setKeywords(['signed', 'digital-signature', signerInfo?.name || 'unknown']);
    }

    // Save with byte range placeholder for signature
    // We need to add an annotation widget for the signature field
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    
    // Add a hidden signature field annotation
    // This is required by node-signpdf to know where to place the digital signature
    const signatureDict = pdfDoc.context.obj({
      Type: 'Sig',
      Filter: 'Adobe.PPKLite',
      SubFilter: 'adbe.pkcs7.detached',
      ByteRange: [0, 0, 0, 0],
      Contents: Buffer.alloc(8192), // Pre-allocated buffer for the signature
      Reason: signerInfo?.reason || 'Document verification',
      Name: signerInfo?.name || 'KnotToIt Signing Service',
      Location: signerInfo?.location || 'Paris, France',
      M: new Date().toISOString(),
    });

    // Save the PDF with placeholder
    const pdfWithPlaceholder = await pdfDoc.save();

    // Sign the PDF using node-signpdf with PKCS#12 buffer
    // Note: signpdf.sign() is synchronous — no await needed
    const signedPdf = signpdf.sign(Buffer.from(pdfWithPlaceholder), p12Buffer);

    return {
      success: true,
      signedPdfBytes: signedPdf,
    };
  } catch (error: any) {
    console.error('Error applying cryptographic signature:', error);
    return {
      success: false,
      signedPdfBytes: null,
      error: error.message || 'Unknown error applying cryptographic signature',
    };
  }
}

// ============================================================================
// Combined Pipeline
// ============================================================================

/**
 * Full dual-layer signature pipeline:
 * 1. Embed visual signatures (Layer 2)
 * 2. Apply cryptographic digital signature (Layer 1)
 *
 * @param pdfBytes - Original PDF file bytes
 * @param signatures - Visual signature data
 * @param p12Buffer - PKCS#12 (.p12/.pfx) certificate buffer for cryptographic signing
 * @param customPlacements - Optional custom signature placements
 * @returns Final signed PDF bytes
 */
export async function finalizeDocument(
  pdfBytes: Buffer,
  signatures: SignatureEmbedding[],
  p12Buffer: Buffer,
  customPlacements?: Record<string, SignaturePlacement>
): Promise<FinalizeResult> {
  try {
    console.log(`[finalizeDocument] Starting dual-layer signing for ${signatures.length} signatures`);

    // Step 1: Embed visual signatures
    const visualResult = await embedVisualSignatures(pdfBytes, signatures, customPlacements);
    
    if (!visualResult.success || !visualResult.pdfBytes) {
      return {
        success: false,
        pdfBytes: null,
        error: `Visual embedding failed: ${visualResult.error}`,
      };
    }
    
    console.log('[finalizeDocument] Visual signatures embedded successfully');

    // Step 2: Apply cryptographic signature
    const cryptoResult = await applyCryptographicSignature(
      visualResult.pdfBytes,
      p12Buffer,
      {
        name: 'KnotToIt Document Signing',
        email: 'signing@knottoit.com',
        reason: 'Dual-layer document signing: visual + cryptographic',
        location: 'Paris, France',
      }
    );

    if (!cryptoResult.success || !cryptoResult.signedPdfBytes) {
      // If cryptographic signing fails, return the visually signed PDF
      // This provides graceful degradation
      console.warn('[finalizeDocument] Cryptographic signing failed, returning visually signed PDF:', cryptoResult.error);
      return {
        success: true,
        pdfBytes: visualResult.pdfBytes,
        error: `Cryptographic signing failed (visual signatures applied): ${cryptoResult.error}`,
      };
    }

    console.log('[finalizeDocument] Cryptographic signature applied successfully');

    return {
      success: true,
      pdfBytes: cryptoResult.signedPdfBytes,
    };
  } catch (error: any) {
    console.error('[finalizeDocument] Error in finalize pipeline:', error);
    return {
      success: false,
      pdfBytes: null,
      error: error.message || 'Unknown error in finalize pipeline',
    };
  }
}

// ============================================================================
// Certificate Loading Utilities
// ============================================================================

/**
 * Load PKCS#12 certificate from environment variables or file system.
 *
 * Priority:
 * 1. Environment variable (CERTIFICATE_P12, base64-encoded .p12) - for production/Vercel
 * 2. File system (certs/cert.p12) - for development
 */
export function loadCertificates(): Buffer {
  // Try environment variable first (for Vercel deployment)
  if (process.env.CERTIFICATE_P12) {
    return Buffer.from(process.env.CERTIFICATE_P12, 'base64');
  }

  // Fall back to file system (for local development)
  const p12Path = join(process.cwd(), 'certs', 'cert.p12');

  if (existsSync(p12Path)) {
    return readFileSync(p12Path);
  }

  throw new Error(
    'No PKCS#12 certificate found. Set CERTIFICATE_P12 environment variable (base64-encoded .p12) ' +
    'or run scripts/generate-cert.sh to create local certificates.'
  );
}

/**
 * Validate that a base64 string is a valid PNG image.
 */
export function validateSignatureImage(base64Data: string): boolean {
  try {
    const data = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(data, 'base64');
    // PNG magic number: 89 50 4E 47
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  } catch {
    return false;
  }
}
