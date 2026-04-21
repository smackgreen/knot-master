/**
 * Vercel Serverless Function: /api/finalize-document
 *
 * Dual-Layer PDF Document Signing Endpoint
 *
 * This endpoint orchestrates the complete signing pipeline:
 * 1. Downloads the original PDF from Supabase Storage
 * 2. Embeds visual signatures (Layer 2) using pdf-lib
 * 3. Applies cryptographic digital signature (Layer 1) using node-signpdf
 * 4. Uploads the finalized PDF back to Supabase Storage
 * 5. Updates the database record with the final_pdf_url
 *
 * Security:
 * - Requires Supabase JWT authentication (Authorization: Bearer <token>)
 * - Validates all input parameters
 * - Uses HTTPS for all data transfers
 *
 * Request Body:
 * {
 *   "documentId": string,
 *   "pdfUrl": string (signed URL to download the original PDF),
 *   "signatures": Array<{
 *     "signatureImage": string (base64 PNG),
 *     "signerRole": "organizer" | "client" | "planner" | "vendor",
 *     "signerName": string,
 *     "signerEmail": string,
 *     "signedAt": string (ISO date)
 *   }>,
 *   "storagePath": string (path in Supabase Storage to upload the signed PDF),
 *   "customPlacements"?: Record<string, SignaturePlacement>
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { finalizeDocument, loadCertificates, validateSignatureImage, SignatureEmbedding } from './_lib/pdf-processor';

// Allowed CORS origins
const ALLOWED_ORIGINS = [
  'https://your-app.vercel.app',  // Replace with actual production domain
  'http://localhost:5173',         // Local development
  'http://localhost:3000',         // Alternative dev port
];

/**
 * Set CORS headers on the response based on the request origin.
 */
function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Validate the Supabase JWT authentication token
 */
async function validateAuthToken(req: VercelRequest): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.substring(7);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { valid: false, error: 'Server configuration error' };
  }

  // Create a Supabase client with the service role key to verify the JWT
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { valid: false, error: 'Invalid or expired authentication token' };
  }

  return { valid: true, userId: user.id };
}

/**
 * Validate the API request (field validation only — auth is handled separately)
 */
function validateRequest(req: VercelRequest): { valid: boolean; error?: string } {
  // Only allow POST
  if (req.method !== 'POST') {
    return { valid: false, error: 'Method not allowed' };
  }

  // Validate required fields
  const { documentId, pdfUrl, signatures, storagePath } = req.body;

  if (!documentId) {
    return { valid: false, error: 'Missing documentId' };
  }

  if (!pdfUrl) {
    return { valid: false, error: 'Missing pdfUrl' };
  }

  if (!signatures || !Array.isArray(signatures) || signatures.length === 0) {
    return { valid: false, error: 'Missing or invalid signatures array' };
  }

  if (!storagePath) {
    return { valid: false, error: 'Missing storagePath' };
  }

  // Validate each signature
  for (let i = 0; i < signatures.length; i++) {
    const sig = signatures[i];
    if (!sig.signatureImage) {
      return { valid: false, error: `Signature at index ${i} missing signatureImage` };
    }
    if (!sig.signerRole) {
      return { valid: false, error: `Signature at index ${i} missing signerRole` };
    }
    if (!sig.signerName) {
      return { valid: false, error: `Signature at index ${i} missing signerName` };
    }
    if (!sig.signerEmail) {
      return { valid: false, error: `Signature at index ${i} missing signerEmail` };
    }
  }

  return { valid: true };
}

/**
 * Download PDF from a signed URL with SSRF protection.
 */
async function downloadPdf(url: string): Promise<Buffer> {
  const parsed = new URL(url);

  // Only allow Supabase storage URLs
  if (!parsed.hostname.endsWith('.supabase.co')) {
    throw new Error('Only Supabase storage URLs are allowed');
  }

  // Block internal/private IPs
  const blocked = ['127.0.0.1', 'localhost', '169.254.169.254', '0.0.0.0'];
  if (blocked.includes(parsed.hostname)) {
    throw new Error('Invalid URL');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload signed PDF to Supabase Storage
 */
async function uploadSignedPdf(
  pdfBytes: Buffer,
  storagePath: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  const uploadUrl = `${supabaseUrl}/storage/v1/object/documents/${storagePath}`;
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: pdfBytes,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload signed PDF: ${response.status} - ${errorText}`);
  }

  // Return the storage path
  return storagePath;
}

/**
 * Update the document record in the database with the final PDF URL
 */
async function updateDocumentRecord(
  documentId: string,
  finalPdfPath: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/rest/v1/documents?id=eq.${documentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      final_pdf_url: finalPdfPath,
      status: 'signed',
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to update document record: ${response.status} - ${errorText}`);
    // Don't throw - the PDF was signed successfully, just the DB update failed
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers on all responses
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    // Authenticate via Supabase JWT
    const authResult = await validateAuthToken(req);
    if (!authResult.valid) {
      return res.status(401).json({ error: authResult.error });
    }

    // Validate request fields
    const validation = validateRequest(req);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { documentId, pdfUrl, signatures, storagePath, customPlacements } = req.body;

    console.log(`[finalize-document] Processing document ${documentId} with ${signatures.length} signatures`);

    // Step 1: Download the original PDF
    console.log('[finalize-document] Downloading original PDF...');
    let pdfBytes: Buffer;
    try {
      pdfBytes = await downloadPdf(pdfUrl);
    } catch (downloadError: any) {
      console.error('[finalize-document] PDF download failed:', downloadError);
      return res.status(400).json({ 
        error: `Failed to download PDF: ${downloadError.message}` 
      });
    }

    // Step 2: Load PKCS#12 certificate
    let p12Buffer: Buffer;
    try {
      p12Buffer = loadCertificates();
    } catch (certError: any) {
      console.error('[finalize-document] Certificate loading failed:', certError);
      return res.status(500).json({
        error: `Certificate configuration error: ${certError.message}`
      });
    }

    // Step 3: Run the dual-layer signing pipeline
    console.log('[finalize-document] Running dual-layer signing pipeline...');
    const result = await finalizeDocument(
      pdfBytes,
      signatures as SignatureEmbedding[],
      p12Buffer,
      customPlacements
    );

    if (!result.success || !result.pdfBytes) {
      console.error('[finalize-document] Signing pipeline failed:', result.error);
      return res.status(500).json({ 
        error: `Signing pipeline failed: ${result.error}` 
      });
    }

    // Step 4: Upload the signed PDF to Supabase Storage
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[finalize-document] Missing Supabase configuration');
      // Return the signed PDF as base64 so the client can handle upload
      const base64Pdf = result.pdfBytes.toString('base64');
      return res.status(200).json({
        success: true,
        signedPdfBase64: base64Pdf,
        warning: 'Supabase not configured - client must handle upload',
        cryptoWarning: result.error,
      });
    }

    // Generate a unique path for the signed PDF
    const signedPdfPath = storagePath.replace(/\.pdf$/i, '-signed.pdf');
    
    console.log('[finalize-document] Uploading signed PDF to:', signedPdfPath);
    const finalPath = await uploadSignedPdf(
      result.pdfBytes,
      signedPdfPath,
      supabaseUrl,
      supabaseKey
    );

    // Step 5: Update the database record
    console.log('[finalize-document] Updating document record...');
    await updateDocumentRecord(documentId, finalPath, supabaseUrl, supabaseKey);

    console.log('[finalize-document] Document signing complete!');

    return res.status(200).json({
      success: true,
      finalPdfPath: finalPath,
      documentId: documentId,
      signatureCount: signatures.length,
      cryptoWarning: result.error, // Present if crypto signing degraded gracefully
    });

  } catch (error: any) {
    console.error('[finalize-document] Unhandled error:', error);
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
}
