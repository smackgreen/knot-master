/**
 * PDF Signing Service
 * 
 * Client-side service that orchestrates the dual-layer PDF signing process
 * by communicating with the Vercel serverless API endpoint.
 * 
 * Flow:
 * 1. Collects all signature data from the frontend
 * 2. Downloads the original PDF via signed URL
 * 3. Sends everything to /api/finalize-document
 * 4. The API embeds visual signatures + applies cryptographic signature
 * 5. Returns the final signed PDF URL/path
 */

import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from './storageService';
import { getDocumentById } from './documentService';
import { ElectronicSignature } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface SignatureDataForPdf {
  /** Base64-encoded PNG signature image */
  signatureImage: string;
  /** Role of the signer */
  signerRole: 'organizer' | 'client' | 'planner' | 'vendor';
  /** Full name of the signer */
  signerName: string;
  /** Email of the signer */
  signerEmail: string;
  /** ISO timestamp of when the signature was captured */
  signedAt: string;
}

export interface PdfSigningResult {
  success: boolean;
  finalPdfPath?: string;
  signedPdfBase64?: string;
  error?: string;
  cryptoWarning?: string;
}

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ============================================================================
// Main Signing Function
// ============================================================================

/**
 * Finalize a document by applying dual-layer signatures to the PDF.
 * 
 * This function:
 * 1. Retrieves all electronic signatures for the document
 * 2. Gets a signed URL for the original PDF
 * 3. Calls the backend API to embed visual + cryptographic signatures
 * 4. Returns the path to the finalized PDF
 * 
 * @param documentId - The ID of the document to finalize
 * @returns Result containing the final PDF path or error
 */
export async function finalizePdfDocument(
  documentId: string
): Promise<PdfSigningResult> {
  try {
    console.log(`[pdfSigningService] Starting PDF finalization for document ${documentId}`);

    // Step 1: Get the document with all signatures
    const document = await getDocumentById(documentId);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    if (!document.signatures || document.signatures.length === 0) {
      return { success: false, error: 'No signatures found for this document' };
    }

    // Check that both organizer and client have signed
    const hasOrganizer = document.signatures.some(
      (sig) => sig.signerRole === 'planner' || (sig.signerRole as string) === 'organizer'
    );
    const hasClient = document.signatures.some(
      (sig) => sig.signerRole === 'client' || sig.signerRole === 'vendor'
    );

    if (!hasOrganizer || !hasClient) {
      console.warn('[pdfSigningService] Not all required signers have signed yet', {
        hasOrganizer,
        hasClient,
        signatures: document.signatures.map(s => s.signerRole),
      });
      // Still proceed - we'll embed whatever signatures we have
    }

    // Step 2: Get a signed URL for the original PDF
    const pdfUrl = await getSignedUrl(document.filePath);
    if (!pdfUrl) {
      return { success: false, error: 'Failed to get PDF download URL' };
    }

    // Step 3: Prepare signature data
    const signatures: SignatureDataForPdf[] = document.signatures.map(
      (sig: ElectronicSignature) => ({
        signatureImage: sig.signatureImage,
        signerRole: sig.signerRole as any,
        signerName: sig.signerName,
        signerEmail: sig.signerEmail,
        signedAt: sig.consentTimestamp,
      })
    );

    // Step 4: Call the API to finalize the document
    const result = await callFinalizeApi({
      documentId,
      pdfUrl,
      signatures,
      storagePath: document.filePath,
    });

    return result;
  } catch (error: any) {
    console.error('[pdfSigningService] Error finalizing PDF:', error);
    return {
      success: false,
      error: error.message || 'Unknown error finalizing PDF',
    };
  }
}

/**
 * Finalize a document with a single new signature (for incremental signing).
 * 
 * This is used when a signer signs and we want to immediately embed
 * their signature into the PDF, even if not all parties have signed yet.
 */
export async function embedSingleSignature(
  documentId: string,
  signature: SignatureDataForPdf
): Promise<PdfSigningResult> {
  try {
    console.log(`[pdfSigningService] Embedding single signature for ${signature.signerRole}`);

    const document = await getDocumentById(documentId);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    const pdfUrl = await getSignedUrl(document.filePath);
    if (!pdfUrl) {
      return { success: false, error: 'Failed to get PDF download URL' };
    }

    return await callFinalizeApi({
      documentId,
      pdfUrl,
      signatures: [signature],
      storagePath: document.filePath,
    });
  } catch (error: any) {
    console.error('[pdfSigningService] Error embedding single signature:', error);
    return {
      success: false,
      error: error.message || 'Unknown error embedding signature',
    };
  }
}

// ============================================================================
// API Communication
// ============================================================================

interface FinalizeApiParams {
  documentId: string;
  pdfUrl: string;
  signatures: SignatureDataForPdf[];
  storagePath: string;
}

async function callFinalizeApi(params: FinalizeApiParams): Promise<PdfSigningResult> {
  const apiUrl = `${API_BASE_URL}/api/finalize-document`;

  // Get the current user's session token for authentication
  // Fall back to the anon key for public signers (unauthenticated users
  // accessing the signing page via email link)
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!authToken) {
    console.error('[callFinalizeApi] No auth token available (no session and no anon key)');
    return { success: false, error: 'Authentication required' };
  }

  console.log(`[pdfSigningService] Calling API: ${apiUrl}`, {
    authMode: session ? 'jwt' : 'anon-key',
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    return {
      success: false,
      error: `API error (${response.status}): ${errorData.error || response.statusText}`,
    };
  }

  const data = await response.json();

  // If the API returned a base64 PDF (no Supabase configured),
  // handle the upload client-side
  if (data.signedPdfBase64 && !data.finalPdfPath) {
    return await handleClientSideUpload(
      params.documentId,
      data.signedPdfBase64,
      params.storagePath
    );
  }

  return {
    success: data.success,
    finalPdfPath: data.finalPdfPath,
    cryptoWarning: data.cryptoWarning,
  };
}

/**
 * Handle uploading the signed PDF from the client side
 * (fallback when the API doesn't have Supabase credentials)
 */
async function handleClientSideUpload(
  documentId: string,
  base64Pdf: string,
  originalPath: string
): Promise<PdfSigningResult> {
  try {
    // Convert base64 to Blob
    const binaryString = atob(base64Pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // Generate the signed PDF path
    const signedPath = originalPath.replace(/\.pdf$/i, '-signed.pdf');

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(signedPath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[pdfSigningService] Upload failed:', uploadError);
      return {
        success: false,
        error: `Failed to upload signed PDF: ${uploadError.message}`,
      };
    }

    // Update the document record
    const { error: updateError } = await supabase
      .from('documents' as any)
      .update({
        final_pdf_url: signedPath,
        status: 'signed',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', documentId);

    if (updateError) {
      console.error('[pdfSigningService] DB update failed:', updateError);
      // Don't fail - the PDF was uploaded successfully
    }

    return {
      success: true,
      finalPdfPath: signedPath,
    };
  } catch (error: any) {
    console.error('[pdfSigningService] Client-side upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload signed PDF',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a document is ready for finalization
 * (both organizer/planner and client/vendor have signed)
 */
export async function isDocumentReadyForFinalization(
  documentId: string
): Promise<{ ready: boolean; missingRoles: string[] }> {
  const document = await getDocumentById(documentId);
  if (!document || !document.signatures) {
    return { ready: false, missingRoles: ['planner', 'client'] };
  }

  const roles = document.signatures.map((sig) => sig.signerRole);
  const missingRoles: string[] = [];

  if (!roles.includes('planner') && !roles.some(r => (r as string) === 'organizer')) {
    missingRoles.push('planner');
  }
  if (!roles.includes('client') && !roles.includes('vendor')) {
    missingRoles.push('client');
  }

  return { ready: missingRoles.length === 0, missingRoles };
}

/**
 * Get the download URL for the finalized (signed) PDF
 */
export async function getFinalSignedPdfUrl(
  documentId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('documents' as any)
      .select('final_pdf_url, file_path')
      .eq('id', documentId)
      .single();

    if (error || !data) return null;

    const row = data as any;
    const path = row.final_pdf_url || row.file_path;
    return await getSignedUrl(path);
  } catch {
    return null;
  }
}
