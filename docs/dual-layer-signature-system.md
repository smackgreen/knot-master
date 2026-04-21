# Dual-Layer PDF Signature System

## Architecture Overview

This document describes the dual-layer signature system implemented for the KnotToIt document signing platform. The system combines **visual signatures** (hand-drawn or typed) with **cryptographic digital signatures** to provide both human-readable authentication and tamper-evident document integrity.

## Layer Design

### Layer 1: Cryptographic Security

The first layer applies a cryptographic digital certificate to the PDF to permanently lock the document. This ensures:

- **Document Integrity**: Any post-signing modification is strictly detectable
- **Non-repudiation**: Signers cannot deny having signed the document
- **Tamper-evidence**: Changes to the PDF invalidate the digital signature

**Implementation**: `node-signpdf` with a self-signed OpenSSL certificate (RSA-2048, SHA-256)

### Layer 2: Visual Signatures

The second layer renders graphical signature representations directly onto the PDF pages:

- **Organizer/Planner signature**: Placed at the bottom-left of the last page
- **Client/Vendor signature**: Placed at the bottom-right of the last page
- Each signature includes the signer's name, role, date, and email below the image

**Implementation**: `pdf-lib` for Node.js to embed base64 PNG images into precise PDF coordinates

## File Structure

```
knot-master/
├── api/                              # Vercel Serverless Functions
│   ├── tsconfig.json                 # TypeScript config for API
│   ├── finalize-document.ts          # Main signing endpoint
│   └── _lib/
│       └── pdf-processor.ts          # Core PDF processing utilities
├── certs/                            # OpenSSL certificates (gitignored)
│   ├── certificate.pem               # Public certificate
│   └── key.pem                       # Private key
├── scripts/
│   └── generate-cert.sh              # Certificate generation script
├── src/
│   ├── components/documents/
│   │   ├── EnhancedSignatureCanvas.tsx   # Draw + Type-to-sign component
│   │   ├── SignDocumentDialog.tsx        # Updated organizer signing dialog
│   │   └── ...
│   ├── pages/
│   │   └── SignDocument.tsx              # Updated public signing page
│   ├── services/
│   │   └── pdfSigningService.ts          # Frontend PDF signing service
│   └── types/
│       └── index.ts                      # Updated with new types
└── supabase/migrations/
    └── 20250420000000_add_pdf_signing_columns.sql
```

## API Endpoints

### `POST /api/finalize-document`

The main endpoint that orchestrates the complete signing pipeline.

**Request Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "documentId": "uuid",
  "pdfUrl": "https://signed-url-to-original-pdf",
  "signatures": [
    {
      "signatureImage": "data:image/png;base64,...",
      "signerRole": "planner",
      "signerName": "John Doe",
      "signerEmail": "john@example.com",
      "signedAt": "2024-01-15T10:30:00Z"
    },
    {
      "signatureImage": "data:image/png;base64,...",
      "signerRole": "client",
      "signerName": "Jane Smith",
      "signerEmail": "jane@example.com",
      "signedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "storagePath": "user-id/document-name.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "finalPdfPath": "user-id/document-name-signed.pdf",
  "documentId": "uuid",
  "signatureCount": 2,
  "cryptoWarning": null
}
```

## Setup Instructions

### 1. Generate Certificates

```bash
chmod +x scripts/generate-cert.sh
./scripts/generate-cert.sh
```

### 2. Configure Environment Variables

**In `.env` (frontend):**
```
VITE_API_BASE_URL=                          # Empty for same-origin
```

**In Vercel Environment Variables (server-side):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CERTIFICATE_PEM=<base64-encoded certificate>
KEY_PEM=<base64-encoded private key>
```

> **Note:** Authentication is handled via Supabase JWT tokens. The client sends the user's Supabase access token in the `Authorization: Bearer <token>` header. No separate API key is needed.

To encode certificates for environment variables:
```bash
base64 -i certs/certificate.pem | pbcopy
base64 -i certs/key.pem | pbcopy
```

### 3. Run Database Migration

Execute the migration SQL in the Supabase SQL Editor:
```bash
# Content of supabase/migrations/20250420000000_add_pdf_signing_columns.sql
```

### 4. Deploy

```bash
# Deploy to Vercel (API functions are automatically included)
vercel --prod
```

## Signing Flow

```
┌──────────────────┐     ┌──────────────────┐
│  Organizer signs  │     │   Client signs    │
│  (in CRM via      │     │   (via email link │
│   SignDocument    │     │    /sign/:token)  │
│   Dialog)         │     │                   │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────────────────────────────┐
│  createElectronicSignature()             │
│  - Stores base64 PNG in DB               │
│  - Records IP, timestamp, consent        │
│  - Checks if all parties have signed     │
└────────────────┬─────────────────────────┘
                 │
                 ▼ (when both parties signed)
┌──────────────────────────────────────────┐
│  finalizePdfDocument()                   │
│  - Calls /api/finalize-document          │
│  ┌────────────────────────────────────┐  │
│  │ Layer 2: embedVisualSignatures()   │  │
│  │ - pdf-lib embeds PNG images        │  │
│  │ - Places at precise coordinates    │  │
│  │ - Adds signer metadata text        │  │
│  └────────────────┬───────────────────┘  │
│                   ▼                       │
│  ┌────────────────────────────────────┐  │
│  │ Layer 1: applyCryptographicSig()   │  │
│  │ - node-signpdf signs the PDF       │  │
│  │ - Uses OpenSSL certificate         │  │
│  │ - Permanently locks the document   │  │
│  └────────────────┬───────────────────┘  │
│                   ▼                       │
│  - Uploads signed PDF to Supabase Storage│
│  - Updates documents.final_pdf_url       │
└──────────────────────────────────────────┘
```

## Security Considerations

1. **JWT Authentication**: All requests to `/api/finalize-document` require a valid Supabase JWT token in the `Authorization: Bearer` header
2. **Certificate Storage**: Private keys are never committed to version control
3. **Environment Variables**: Sensitive credentials are stored as Vercel environment variables
4. **Graceful Degradation**: If cryptographic signing fails, visual signatures are still applied
5. **Input Validation**: All API inputs are validated before processing
6. **CORS**: API endpoints have proper CORS headers configured

## Components Reference

### `EnhancedSignatureCanvas`
- **Modes**: Draw (mouse/touch) and Type-to-sign (cursive font)
- **Output**: Base64 PNG string via `onSave` callback
- **Fonts**: Dancing Script, Great Vibes, Sacramento (loaded from Google Fonts)

### `pdfSigningService`
- `finalizePdfDocument(documentId)` - Main entry point for finalization
- `embedSingleSignature(documentId, signature)` - Incremental signing
- `isDocumentReadyForFinalization(documentId)` - Check readiness
- `getFinalSignedPdfUrl(documentId)` - Get download URL

### `pdf-processor` (API)
- `embedVisualSignatures(pdfBytes, signatures, placements?)` - Layer 2
- `applyCryptographicSignature(pdfBytes, cert, key, signerInfo?)` - Layer 1
- `finalizeDocument(pdfBytes, signatures, cert, key, placements?)` - Combined pipeline
- `loadCertificates()` - Load from env vars or file system
