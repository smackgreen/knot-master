# Electronic Signature Workflow — Technical Documentation

> **Knot To It** — Wedding Planner CRM  
> Comprehensive guide covering the electronic signature lifecycle, contract management, document handling, and step-by-step deployment instructions.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model](#2-data-model)
3. [Document Management](#3-document-management)
4. [Contract Creation & Templates](#4-contract-creation--templates)
5. [Signature Request Lifecycle](#5-signature-request-lifecycle)
6. [Signature Capture & Verification](#6-signature-capture--verification)
7. [Email Notification System](#7-email-notification-system)
8. [SMS Verification](#8-sms-verification)
9. [Audit Trail & Signature Events](#9-audit-trail--signature-events)
10. [Public Signing Page](#10-public-signing-page)
11. [Frontend Component Reference](#11-frontend-component-reference)
12. [Service Layer Reference](#12-service-layer-reference)
13. [Database Schema](#13-database-schema)
14. [Deployment Guide](#14-deployment-guide)
15. [Environment Variables](#15-environment-variables)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Architecture Overview

The electronic signature system is a fully integrated module within the Knot To It CRM platform. It enables wedding planners to upload documents, create contracts from templates, request signatures from clients and vendors, and track the entire signing process through an auditable workflow.

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | SPA with signature canvas components |
| **UI Components** | shadcn/ui (Radix primitives) | Dialog forms, tables, badges |
| **Backend** | Supabase (PostgreSQL) | Database, Auth, Storage, Edge Functions |
| **Email Delivery** | Resend (via Supabase Edge Function) | Signature request & confirmation emails |
| **File Storage** | Supabase Storage | Private document bucket with signed URLs |
| **SMS Verification** | Supabase (verification_codes table) | Identity verification via phone |
| **Hosting** | Vercel (recommended) | Static SPA hosting with global CDN |

### High-Level Flow

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Planner UI  │────▶│  Document Upload  │────▶│  Supabase Store  │
│  (Dashboard) │     │  (UppyUploader)   │     │  (documents)     │
└──────────────┘     └──────────────────┘     └────────┬────────┘
                                                        │
                       ┌──────────────────┐              │
                       │  Signature Req.   │◀────────────┘
                       │  Creation         │
                       └────────┬─────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Email Notification    │
                    │  (Resend Edge Fn)      │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Public Signing Page   │
                    │  (/sign/{token})       │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                   │
    ┌─────────▼──────┐  ┌──────▼───────┐  ┌───────▼──────┐
    │  SMS Verify    │  │  Review Doc  │  │  Draw Sig.   │
    │  (optional)    │  │  + Consent   │  │  (Canvas)    │
    └────────────────┘  └──────────────┘  └──────┬───────┘
                                                   │
                                       ┌───────────▼───────────┐
                                       │  electronic_signatures │
                                       │  + signature_events    │
                                       └───────────────────────┘
```

---

## 2. Data Model

### Core Types

The type definitions reside in [`src/types/index.ts`](src/types/index.ts:297).

#### Enums / Union Types

| Type | Values | Description |
|------|--------|-------------|
| [`DocumentStatus`](src/types/index.ts:308) | `'pending' \| 'signed' \| 'expired' \| 'cancelled'` | Document lifecycle states |
| [`SignerRole`](src/types/index.ts:309) | `'client' \| 'vendor' \| 'planner'` | Who is signing |
| [`SignatureRequestStatus`](src/types/index.ts:310) | `'pending' \| 'completed' \| 'expired' \| 'cancelled'` | Request lifecycle states |
| [`SignatureEventType`](src/types/index.ts:311) | `'created' \| 'viewed' \| 'signed' \| 'expired' \| 'cancelled'` | Audit event types |
| [`ContractStatus`](src/types/index.ts:297) | `'draft' \| 'sent' \| 'signed' \| 'expired' \| 'cancelled'` | Contract lifecycle |
| [`ContractCategory`](src/types/index.ts:298) | `'client' \| 'vendor' \| 'planning' \| 'other'` | Template classification |

#### [`Document`](src/types/index.ts:313)

```typescript
interface Document {
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
```

Documents can be linked to a contract, quotation, or invoice. They hold an array of [`ElectronicSignature`](src/types/index.ts:329) records and associated [`SignatureRequest`](src/types/index.ts:341) entries.

#### [`ElectronicSignature`](src/types/index.ts:329)

```typescript
interface ElectronicSignature {
  id: string;
  documentId: string;
  signerName: string;
  signerEmail: string;
  signerRole: SignerRole;
  signatureImage: string; // Base64 encoded PNG
  ipAddress?: string;
  consentTimestamp: string;
  createdAt: string;
}
```

Each signature captures the signer's identity, role, a base64-encoded image of the handwritten signature drawn on the canvas, the IP address, and a consent timestamp.

#### [`SignatureRequest`](src/types/index.ts:341)

```typescript
interface SignatureRequest {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  recipientRole: SignerRole;
  status: SignatureRequestStatus;
  token: string;          // UUID token for public signing URL
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
```

The `token` field is a UUID (`v4`) used to construct the public signing URL: `{APP_URL}/sign/{token}`.

#### [`SignatureEvent`](src/types/index.ts:360)

```typescript
interface SignatureEvent {
  id: string;
  documentId: string;
  eventType: SignatureEventType;
  actor?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
```

Provides a full audit trail for every action performed on a document within a signature request.

#### [`Contract`](src/types/index.ts:381)

```typescript
interface Contract {
  id: string;
  templateId?: string;
  clientId?: string;
  vendorId?: string;
  name: string;
  content: string;       // HTML content
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
```

Contracts support three-party signing (client, vendor, planner) with separate [`Signature`](src/types/index.ts:300) objects for each role.

#### [`ContractTemplate`](src/types/index.ts:371)

```typescript
interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;        // HTML with placeholders
  category: ContractCategory;
  createdAt: string;
  updatedAt: string;
}
```

Templates contain HTML with placeholder tokens (e.g., `{{client_name}}`) that are merged with actual data at creation time.

---

## 3. Document Management

### Document Upload

Documents are uploaded to the **private** Supabase Storage bucket named `documents`. The upload flow uses the [`UppyUploader`](src/components/documents/UppyUploader.tsx) component, which integrates with Supabase Storage.

**Upload path convention:** `{user_id}/{uuid}-{filename}`

**Supported file types:**

| MIME Type | Extension |
|-----------|-----------|
| `application/pdf` | `.pdf` |
| `image/png` | `.png` |
| `image/jpeg` | `.jpg`, `.jpeg` |
| `image/webp` | `.webp` |
| `application/msword` | `.doc` |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.docx` |
| `application/vnd.ms-excel` | `.xls` |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` |
| `text/plain` | `.txt` |
| `text/csv` | `.csv` |

**Maximum file size:** 50 MB

### Document Access

All document reads use **signed URLs** generated by [`getSignedUrl()`](src/services/storageService.ts) with a **1-hour expiry**. No public access is granted to the `documents` bucket.

### Document Service API

The [`documentService.ts`](src/services/documentService.ts) provides the following key functions:

| Function | Description |
|----------|-------------|
| `createDocument()` | Creates a document record in the database |
| `createDocumentWithPath()` | Creates a document with a pre-uploaded file path |
| `getDocumentById()` | Retrieves a single document by ID |
| `getDocumentsByInvoiceId()` | Gets documents linked to an invoice |
| `getDocumentsByQuotationId()` | Gets documents linked to a quotation |
| `getDocumentsByContractId()` | Gets documents linked to a contract |
| `createSignatureRequest()` | Creates a signature request for a document |
| `getSignatureRequestByToken()` | Retrieves a signature request by its token |
| `createElectronicSignature()` | Records an electronic signature |
| `createSignatureEvent()` | Logs a signature event for audit |

### Document Upload for Signature

The [`UploadDocumentForSignatureDialog`](src/components/signatures/UploadDocumentForSignatureDialog.tsx) component provides a dedicated upload flow within the signature workflow. It:

1. Opens a dialog with a file name field and the Uppy uploader
2. Uploads the file to Supabase Storage via `createDocumentWithPath()`
3. Returns the uploaded document metadata to the parent component
4. Handles storage bucket errors and RLS policy violations gracefully

---

## 4. Contract Creation & Templates

### Template System

Contract templates are managed through the [`ContractTemplateForm`](src/components/contracts/ContractTemplateForm.tsx) component. Templates use a **placeholder syntax** defined in [`contractUtils.ts`](src/utils/contractUtils.ts:3):

| Placeholder | Replaced With |
|-------------|--------------|
| `{{client_name}}` | Client's full name |
| `{{partner_name}}` | Client's partner name |
| `{{wedding_date}}` | Formatted wedding date |
| `{{venue}}` | Wedding venue |
| `{{budget}}` | Total budget (formatted) |
| `{{vendor_name}}` | Vendor's name |
| `{{vendor_category}}` | Vendor's service category |
| `{{vendor_cost}}` | Vendor cost (formatted) |
| `{{planner_name}}` | Planner's name |
| `{{company_name}}` | Planner's company name |
| `{{company_address}}` | Company address |
| `{{company_city}}` | Company city |
| `{{company_phone}}` | Company phone |
| `{{company_email}}` | Company email |
| `{{company_website}}` | Company website |
| `{{today_date}}` | Current date |
| `{{contract_id}}` | Contract ID |
| `{{contract_name}}` | Contract name |
| `{{expiration_date}}` | Contract expiration date |

### Template Merge Process

The [`mergeTemplateWithData()`](src/utils/contractUtils.ts:28) function performs regex-based replacement of all placeholders with actual data from the client, vendor, user profile, and contract objects:

```
Template Content → mergeTemplateWithData(client, vendor, userData, contract) → Final HTML
```

### Default Templates

Two built-in templates are provided via [`contractUtils.ts`](src/utils/contractUtils.ts):

1. **[`getDefaultClientTemplate()`](src/utils/contractUtils.ts:119)** — A wedding planning agreement between planner and client, covering services, payment terms, cancellation, and signature blocks.

2. **[`getDefaultVendorTemplate()`](src/utils/contractUtils.ts:170)** — A three-party vendor agreement between planner, client, and vendor, covering services, payment, cancellation, and tri-party signature blocks.

### Contract Creation Flow

1. Planner navigates to **Contracts** page (`/app/contracts`)
2. Clicks **Add Contract** → opens [`AddContractDialog`](src/components/contracts/AddContractDialog.tsx)
3. Optionally selects a template, client, and vendor
4. If a template is selected, content is pre-filled via [`ContractForm`](src/components/contracts/ContractForm.tsx) and merged with client/vendor data
5. Contract is saved with `draft` status
6. Planner can **Send** the contract (changes status to `sent`)
7. Recipients sign via [`SignContractDialog`](src/components/contracts/SignContractDialog.tsx)

### Contract Categories

| Category | Description |
|----------|-------------|
| `client` | Client-facing agreements |
| `vendor` | Vendor agreements |
| `planning` | Internal planning documents |
| `other` | Miscellaneous contracts |

---

## 5. Signature Request Lifecycle

### State Machine

```
                    ┌───────────┐
                    │  Created   │
                    │ (pending)  │
                    └─────┬─────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────▼─────┐ ┌──▼───┐ ┌────▼────┐
        │  Viewed    │ │Signed│ │Expired  │
        │ (pending)  │ │      │ │(auto)   │
        └─────┬──────┘ └──┬───┘ └─────────┘
              │           │
        ┌─────▼─────┐ ┌──▼────────┐
        │  Signed    │ │ Completed  │
        │ (pending)  │ │           │
        └────────────┘ └───────────┘

        At any point during 'pending':
        ┌─────────────┐
        │  Cancelled   │
        │ (cancelled)  │
        └─────────────┘
```

### Creating a Signature Request

The creation flow is handled by [`createSignatureRequest()`](src/services/signatureService.ts:99) in `signatureService.ts`:

1. **Token Generation** — A UUID v4 token is generated for the public signing URL
2. **Expiration Calculation** — `expiresAt = currentDate + expiresInDays` (default: 7 days, max: 30)
3. **Database Insert** — A record is inserted into `signature_requests` with status `pending`
4. **Document Association** — Documents are linked via the `signature_request_documents` junction table
5. **Source Resolution** — If `invoiceId`, `quotationId`, or `contractId` is provided, associated documents are automatically fetched and attached
6. **Metadata Storage** — Source references (invoice/quotation/contract IDs) are stored in the request's `metadata` JSONB field
7. **Event Creation** — A `created` signature event is logged for each document
8. **Email Notification** — A signature request email is sent via the Resend Edge Function

### Request Parameters

```typescript
{
  recipientName: string;        // Full name of the signer
  recipientEmail: string;       // Email address for notification
  recipientPhone?: string;      // Optional phone for SMS verification
  recipientRole: SignerRole;    // 'client' | 'vendor' | 'planner'
  expiresInDays: number;        // 1-30 days
  documentIds: string[];        // Documents to sign
  invoiceId?: string;           // Optional: link to invoice
  quotationId?: string;         // Optional: link to quotation
  contractId?: string;          // Optional: link to contract
}
```

### Managing Requests

The [`SignatureRequestsList`](src/components/signatures/SignatureRequestsList.tsx) component provides a tabbed interface for managing requests by status:

| Action | Description | Service Function |
|--------|-------------|-----------------|
| **Copy Link** | Copies the signing URL to clipboard | N/A (client-side) |
| **Resend** | Re-sends the email notification | [`resendSignatureRequest()`](src/services/signatureService.ts:428) |
| **Cancel** | Cancels the request and logs events | [`cancelSignatureRequest()`](src/services/signatureService.ts:374) |

### Expiration Handling

When a signing link is accessed, [`verifySignatureRequest()`](src/services/signatureService.ts:523) checks:

1. **Token validity** — Looks up the request by token
2. **Expiration** — If `expiresAt < now`, updates status to `expired` and creates `expired` events
3. **Completion** — If status is already `completed`, returns `null`
4. Returns the valid request with all associated documents

---

## 6. Signature Capture & Verification

### Signature Canvas Components

Two signature canvas implementations are available:

#### 1. Contracts Signature Canvas ([`contracts/SignatureCanvas.tsx`](src/components/contracts/SignatureCanvas.tsx))

A **custom HTML5 Canvas** implementation:

- Uses native `getContext('2d')` for drawing
- Supports both mouse and touch events
- Line style: 2px width, round caps, black stroke
- Handles window resize with signature preservation
- Exports as base64 PNG via `canvas.toDataURL('image/png')`

#### 2. Documents Signature Pad ([`documents/SignatureCanvas.tsx`](src/components/documents/SignatureCanvas.tsx))

Uses the **`react-signature-canvas`** library:

- Wraps the `SignatureCanvas` React component
- Responsive width (max 500px, adapts to container)
- Fixed height: 200px
- Pen color: black
- Exports as base64 PNG via `sigCanvas.toDataURL('image/png')`

### Multi-Step Signing Process

The public signing page ([`SignDocument.tsx`](src/pages/SignDocument.tsx)) implements a four-step process:

#### Step 1: Verify (Conditional)

If the signature request includes a `recipientPhone`, the signer must complete SMS verification before proceeding:

```
┌──────────────────────────┐
│   Verify Identity         │
│   ─────────────────────   │
│   SMS code sent to        │
│   (XXX) XXX-XXXX          │
│                            │
│   [______] 6-digit code   │
│   [Verify] [Resend in 60s]│
└──────────────────────────┘
```

If no phone number is provided, this step is skipped and the flow goes directly to **Review**.

#### Step 2: Review

The signer reviews their information and the document:

```
┌──────────────────┐  ┌──────────────────┐
│  Review Info      │  │  PDF Preview      │
│  ────────────     │  │  ────────────     │
│  Name: [____]     │  │  [Document PDF    │
│  Email: [____]    │  │   rendered in     │
│  ☐ I consent...   │  │   iframe]         │
│  [Continue]       │  │                   │
└──────────────────┘  └──────────────────┘
```

**Validation:** Name, email, and consent checkbox are all required before proceeding.

#### Step 3: Sign

The signer draws their signature:

```
┌──────────────────┐  ┌──────────────────┐
│  Draw Signature   │  │  PDF Preview      │
│  ────────────     │  │  ────────────     │
│  [Canvas area     │  │  [Document PDF    │
│   for drawing]    │  │   rendered in     │
│                   │  │   iframe]         │
│  [Clear] [Sign]   │  │                   │
└──────────────────┘  └──────────────────┘
```

**On submit:**

1. IP address is fetched from `https://api.ipify.org?format=json`
2. [`createElectronicSignature()`](src/services/documentService.ts:977) is called with:
   - `documentId`, `signerName`, `signerEmail`, `signerRole`
   - `signatureImage` (base64 PNG from canvas)
   - `ipAddress`
3. A `signed` event is logged via `createSignatureEvent()`
4. If the document has more documents in the request, moves to the next document
5. If all documents are signed, transitions to **Success**

#### Step 4: Success

Redirects to [`/signature-success`](src/pages/SignatureSuccess.tsx) which displays a confirmation message.

### Contract Signing (Authenticated)

For contracts signed within the authenticated application, the [`SignContractDialog`](src/components/contracts/SignContractDialog.tsx) provides a streamlined two-phase flow:

1. **Identity Form** — Collects signer name and email (pre-filled from auth context)
2. **Signature Canvas** — Uses the custom canvas component for drawing

The signature is saved via `signContract()` from [`AppContext`](src/context/AppContext.tsx), which creates a [`Signature`](src/types/index.ts:300) object with name, email, base64 signature image, timestamp, and IP address.

---

## 7. Email Notification System

### Architecture

Emails are sent through a **Supabase Edge Function** ([`resend-email`](supabase/functions/resend-email/index.ts)) that uses the **Resend** API.

```
Frontend (emailService.ts)
    │
    ├──▶ supabase.functions.invoke('resend-email', { body })
    │
    └──▶ Fallback: Direct fetch to EDGE_FUNCTION_URL
              │
              ▼
        Supabase Edge Function (Deno)
              │
              ▼
        Resend API → Recipient Inbox
```

### Email Templates

#### Signature Request Email

Triggered by [`sendSignatureRequestEmail()`](src/services/emailService.ts:23):

- **Subject:** "Document Signature Request"
- **Content:** Branded HTML email with:
  - Recipient name greeting
  - "View & Sign Documents" call-to-action button
  - Fallback text link (`{APP_URL}/sign/{token}`)
  - Footer with copyright notice

#### Signature Confirmation Email

Triggered by [`sendSignatureConfirmationEmail()`](src/services/emailService.ts:83):

- **Subject:** "Document Signed Successfully"
- **Content:** Branded HTML email confirming the signature with document names listed

#### Test Email

Triggered by [`sendTestEmail()`](src/services/emailService.ts):

- **Subject:** "Test Email from Knot To It"
- **Content:** Simple test message to verify email delivery

### Edge Function Details

The [`resend-email`](supabase/functions/resend-email/index.ts) Edge Function:

- Runs on **Deno** runtime within Supabase
- Accepts POST requests with JSON body
- Required fields: `to` (recipient email), `subject`
- Template modes: `signature_request`, `signature_confirmation`, `test`
- Uses `RESEND_API_KEY` environment variable (set in Supabase Dashboard)
- Default sender: `onboarding@resend.dev` (for development)
- **Production:** Requires a verified custom domain at [resend.com/domains](https://resend.com/domains)

---

## 8. SMS Verification

### Overview

The SMS verification system adds an optional identity verification step before a signer can access documents. It is implemented in [`SMSVerification.tsx`](src/components/signatures/SMSVerification.tsx) and [`smsService.ts`](src/services/smsService.ts).

### Verification Flow

```
1. Signer opens /sign/{token}
2. System checks if recipientPhone exists
3. If yes:
   a. Generate 6-digit code (100000-900000)
   b. Store in verification_codes table (expires in 10 min)
   c. Send via SMS provider (currently logged to console for demo)
   d. Signer enters code
   e. Verify against stored code
   f. Allow max attempts (tracked via attempts counter)
4. If no phone: skip to Review step
```

### Database Record

The `verification_codes` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `phone_number` | string | Recipient phone |
| `code` | string | 6-digit verification code |
| `expires_at` | timestamp | 10 minutes from creation |
| `attempts` | integer | Failed attempt counter |
| `verified` | boolean | Whether successfully verified |
| `verified_at` | timestamp | When verification occurred |

### Rate Limiting

- **Resend cooldown:** 60 seconds between code resends
- **Expiration:** 10 minutes from generation
- **Attempt tracking:** Failed attempts increment the counter

### Production SMS Integration

> **Note:** The current implementation logs verification codes to the console. For production, integrate with an SMS provider (e.g., Twilio, Vonage) by modifying [`sendVerificationCode()`](src/services/smsService.ts:8) to make an API call instead of `console.log()`.

---

## 9. Audit Trail & Signature Events

### Event Types

Every significant action in the signature workflow is logged as a [`SignatureEvent`](src/types/index.ts:360):

| Event Type | Trigger | Actor |
|-----------|---------|-------|
| `created` | Signature request created | Requester email |
| `viewed` | Document viewed by signer | Signer email |
| `signed` | Document signed | Signer email |
| `expired` | Request expired (auto) | System (null) |
| `cancelled` | Request cancelled | Requester email |

### Event Data Captured

```typescript
{
  document_id: string;
  event_type: SignatureEventType;
  actor?: string;        // Email of the person performing the action
  actor_role?: string;   // 'client' | 'vendor' | 'planner'
  ip_address?: string;   // IP address of the actor
  user_agent?: string;   // Browser user agent
}
```

### Event Creation

Events are created via [`createSignatureEvent()`](src/services/signatureService.ts:487), which is called automatically by:

- [`processSignatureRequestCreation()`](src/services/signatureService.ts:173) — Creates `created` events
- [`cancelSignatureRequest()`](src/services/signatureService.ts:374) — Creates `cancelled` events
- [`verifySignatureRequest()`](src/services/signatureService.ts:523) — Creates `expired` events
- [`createElectronicSignature()`](src/services/documentService.ts:977) — Creates `signed` events

---

## 10. Public Signing Page

### Route

The public signing page is accessible at **`/sign/{token}`** and rendered by [`SignDocument.tsx`](src/pages/SignDocument.tsx). This route is **not** protected by authentication — anyone with a valid token can access it.

### Route Configuration

In [`routes.tsx`](src/routes.tsx:22), the route is defined as:

```typescript
{ path: 'sign/:token', element: <SignDocument /> }
```

The [`vercel.json`](vercel.json) configuration ensures client-side routing works on Vercel:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Page Behavior

| Condition | Behavior |
|-----------|----------|
| Valid token, not expired | Shows signing flow |
| Valid token, expired | Shows error: "Request not found" |
| Invalid token | Shows error: "Invalid token" |
| Already completed | Shows error: "Request not found" |
| Has phone number | Starts with SMS verification |
| No phone number | Starts directly at Review step |

### Multi-Document Signing

When a signature request contains multiple documents:

1. Documents are presented one at a time
2. After signing each document, the canvas is cleared
3. A toast notification indicates progress: "Document signed, continue with next"
4. After the last document, the signer is redirected to `/signature-success`

---

## 11. Frontend Component Reference

### Signature Components (`src/components/signatures/`)

| Component | File | Purpose |
|-----------|------|---------|
| [`CreateSignatureRequestDialog`](src/components/signatures/CreateSignatureRequestDialog.tsx) | 49K | Main dialog for creating signature requests with document selection, client auto-fill, and role assignment |
| [`SignatureRequestsList`](src/components/signatures/SignatureRequestsList.tsx) | 9.7K | Tabbed table view of requests with actions (copy link, resend, cancel) |
| [`SMSVerification`](src/components/signatures/SMSVerification.tsx) | 5.8K | Phone number verification with code input, countdown timer, and resend |
| [`UploadDocumentForSignatureDialog`](src/components/signatures/UploadDocumentForSignatureDialog.tsx) | 6.7K | Document upload dialog specifically for the signature workflow |
| [`TestEmailButton`](src/components/signatures/TestEmailButton.tsx) | 2.3K | Utility button to test email delivery |

### Contract Components (`src/components/contracts/`)

| Component | File | Purpose |
|-----------|------|---------|
| [`ContractForm`](src/components/contracts/ContractForm.tsx) | 11.4K | Form for creating/editing contracts with template selection and data merging |
| [`ContractTemplateForm`](src/components/contracts/ContractTemplateForm.tsx) | 13.8K | Form for creating/editing contract templates with placeholder insertion |
| [`ContractCard`](src/components/contracts/ContractCard.tsx) | 4.6K | Card display for contract list items |
| [`ContractPreview`](src/components/contracts/ContractPreview.tsx) | 4.8K | HTML preview of contract content |
| [`ContractTemplateCard`](src/components/contracts/ContractTemplateCard.tsx) | 3.0K | Card display for template list items |
| [`SignContractDialog`](src/components/contracts/SignContractDialog.tsx) | 5.1K | Authenticated contract signing dialog |
| [`SignatureCanvas`](src/components/contracts/SignatureCanvas.tsx) | 4.8K | Custom HTML5 Canvas signature drawing component |
| [`SignatureDisplay`](src/components/contracts/SignatureDisplay.tsx) | 1.0K | Read-only signature image display |
| [`AddContractDialog`](src/components/contracts/AddContractDialog.tsx) | 2.0K | Wrapper dialog for creating contracts |
| [`EditContractDialog`](src/components/contracts/EditContractDialog.tsx) | 1.9K | Wrapper dialog for editing contracts |
| [`AddTemplateDialog`](src/components/contracts/AddTemplateDialog.tsx) | 2.2K | Wrapper dialog for creating templates |
| [`EditTemplateDialog`](src/components/contracts/EditTemplateDialog.tsx) | 1.8K | Wrapper dialog for editing templates |

### Document Components (`src/components/documents/`)

| Component | File | Purpose |
|-----------|------|---------|
| [`DocumentsList`](src/components/documents/DocumentsList.tsx) | 10.1K | Main document listing with actions |
| [`PDFViewer`](src/components/documents/PDFViewer.tsx) | 3.4K | PDF rendering component using iframe |
| [`UploadDocumentDialog`](src/components/documents/UploadDocumentDialog.tsx) | 7.3K | General document upload dialog |
| [`UppyUploader`](src/components/documents/UppyUploader.tsx) | 19K | Full-featured file upload component using Uppy.js |
| [`RequestSignatureDialog`](src/components/documents/RequestSignatureDialog.tsx) | 6.1K | Dialog to request a signature on a specific document |
| [`SignDocumentDialog`](src/components/documents/SignDocumentDialog.tsx) | 7.8K | Authenticated document signing dialog |
| [`SignatureCanvas`](src/components/documents/SignatureCanvas.tsx) | 2.1K | Signature pad using react-signature-canvas library |
| [`SignatureDisplay`](src/components/documents/SignatureDisplay.tsx) | 2.0K | Read-only signature image display |

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| [`Signatures`](src/pages/Signatures.tsx) | `/app/signatures` | Main signature management page with tabbed request list |
| [`SignDocument`](src/pages/SignDocument.tsx) | `/sign/:token` | Public signing page (no auth required) |
| [`SignatureSuccess`](src/pages/SignatureSuccess.tsx) | `/signature-success` | Post-signing confirmation page |
| [`Contracts`](src/pages/Contracts.tsx) | `/app/contracts` | Contract listing and management |
| [`ContractDetails`](src/pages/ContractDetails.tsx) | `/app/contracts/:id` | Single contract view with signing |
| [`ContractTemplates`](src/pages/ContractTemplates.tsx) | `/app/contract-templates` | Template management |
| [`Documents`](src/pages/Documents.tsx) | `/app/documents` | Document listing and management |

---

## 12. Service Layer Reference

### [`signatureService.ts`](src/services/signatureService.ts)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getSignatureRequests()` | `status` | `SignatureRequest[]` | Fetches requests by status with documents |
| `getDocumentsForSignature()` | — | `Document[]` | Gets all pending documents available for signing |
| `createSignatureRequest()` | params object | `boolean` | Creates a new signature request with email notification |
| `cancelSignatureRequest()` | `requestId` | `boolean` | Cancels a pending request |
| `resendSignatureRequest()` | `requestId` | `boolean` | Re-sends the email notification |
| `createSignatureEvent()` | event details | `boolean` | Logs a signature audit event |
| `verifySignatureRequest()` | `token` | `SignatureRequest \| null` | Validates token and checks expiration |

### [`documentService.ts`](src/services/documentService.ts)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `createDocument()` | document data | `Document \| null` | Creates a document record |
| `createDocumentWithPath()` | path, name, type, size | `Document \| null` | Creates document with pre-uploaded file |
| `getDocumentById()` | `id` | `Document \| null` | Gets document with signatures and requests |
| `getDocumentsByInvoiceId()` | `invoiceId` | `Document[]` | Gets documents for an invoice |
| `getDocumentsByQuotationId()` | `quotationId` | `Document[]` | Gets documents for a quotation |
| `getDocumentsByContractId()` | `contractId` | `Document[]` | Gets documents for a contract |
| `createSignatureRequest()` | doc ID, recipient info | `SignatureRequest \| null` | Creates request for single document |
| `getSignatureRequestByToken()` | `token` | `SignatureRequest \| null` | Gets request by token |
| `createElectronicSignature()` | signature data | `ElectronicSignature \| null` | Records an electronic signature |

### [`emailService.ts`](src/services/emailService.ts)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `sendSignatureRequestEmail()` | request ID, email, name, token | `boolean` | Sends signing invitation email |
| `sendSignatureConfirmationEmail()` | email, name, doc names | `boolean` | Sends signing confirmation email |
| `sendTestEmail()` | email, name | `boolean` | Sends test email for verification |

### [`smsService.ts`](src/services/smsService.ts)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `sendVerificationCode()` | `phoneNumber` | `boolean` | Generates and stores a 6-digit code |
| `verifyCode()` | `phoneNumber`, `code` | `boolean` | Validates the code against stored record |

---

## 13. Database Schema

### Required Tables

#### `documents`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Document identifier |
| `contract_id` | UUID (FK, nullable) | Linked contract |
| `quotation_id` | UUID (FK, nullable) | Linked quotation |
| `invoice_id` | UUID (FK, nullable) | Linked invoice |
| `name` | text | Display name |
| `file_path` | text | Storage path |
| `file_type` | text | MIME type |
| `file_size` | bigint | Size in bytes |
| `status` | text | `pending` / `signed` / `expired` / `cancelled` |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

#### `signature_requests`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Request identifier |
| `recipient_name` | text | Signer's full name |
| `recipient_email` | text | Signer's email |
| `recipient_phone` | text (nullable) | Signer's phone |
| `recipient_role` | text | `client` / `vendor` / `planner` |
| `status` | text | `pending` / `completed` / `expired` / `cancelled` |
| `token` | UUID | Unique signing token |
| `expires_at` | timestamptz | Expiration timestamp |
| `metadata` | JSONB (nullable) | Invoice/quotation/contract references |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

#### `signature_request_documents` (Junction Table)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Junction record ID |
| `signature_request_id` | UUID (FK) | References `signature_requests.id` |
| `document_id` | UUID (FK) | References `documents.id` |

#### `electronic_signatures`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Signature identifier |
| `document_id` | UUID (FK) | References `documents.id` |
| `signer_name` | text | Signer's name at time of signing |
| `signer_email` | text | Signer's email |
| `signer_role` | text | `client` / `vendor` / `planner` |
| `signature_image` | text | Base64-encoded PNG signature |
| `ip_address` | text (nullable) | Signer's IP address |
| `consent_timestamp` | timestamptz | When consent was given |
| `created_at` | timestamptz | Creation timestamp |

#### `signature_events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Event identifier |
| `document_id` | UUID (FK) | References `documents.id` |
| `event_type` | text | `created` / `viewed` / `signed` / `expired` / `cancelled` |
| `actor` | text (nullable) | Email of the actor |
| `actor_role` | text (nullable) | Role of the actor |
| `ip_address` | text (nullable) | Actor's IP address |
| `user_agent` | text (nullable) | Actor's browser user agent |
| `created_at` | timestamptz | Event timestamp |

#### `verification_codes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Code record ID |
| `phone_number` | text | Recipient phone number |
| `code` | text | 6-digit verification code |
| `expires_at` | timestamptz | Expiration (10 min) |
| `attempts` | integer | Failed attempt count |
| `verified` | boolean | Whether verified |
| `verified_at` | timestamptz (nullable) | Verification timestamp |

#### `contracts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Contract identifier |
| `template_id` | UUID (FK, nullable) | Source template |
| `client_id` | UUID (FK, nullable) | Linked client |
| `vendor_id` | UUID (FK, nullable) | Linked vendor |
| `name` | text | Contract name |
| `content` | text | HTML content |
| `status` | text | `draft` / `sent` / `signed` / `expired` / `cancelled` |
| `client_signature` | JSONB (nullable) | Client signature object |
| `vendor_signature` | JSONB (nullable) | Vendor signature object |
| `planner_signature` | JSONB (nullable) | Planner signature object |
| `sent_at` | timestamptz (nullable) | When sent |
| `expires_at` | timestamptz (nullable) | Expiration date |
| `signed_at` | timestamptz (nullable) | When fully signed |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

#### `contract_templates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Template identifier |
| `name` | text | Template name |
| `description` | text (nullable) | Template description |
| `content` | text | HTML content with placeholders |
| `category` | text | `client` / `vendor` / `planning` / `other` |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### Storage Bucket

A **private** storage bucket named `documents` must be created in Supabase Storage. See [`SUPABASE_STORAGE_SETUP.md`](SUPABASE_STORAGE_SETUP.md) for complete RLS policy definitions.

---

## 14. Deployment Guide

### Prerequisites

- [Node.js](https://nodejs.org) 18+ and npm
- [Git](https://git-scm.com)
- A [Supabase](https://supabase.com) account and project
- A [Resend](https://resend.com) account (for email delivery)
- A [Vercel](https://vercel.com) account (recommended hosting)
- A [GitHub](https://github.com) account

### Step 1: Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/knot-master.git
cd knot-master
npm install
```

### Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and note:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon/public key** (`eyJ...`)
3. Run the SQL migrations to create the required tables:
   - `documents`
   - `signature_requests`
   - `signature_request_documents`
   - `electronic_signatures`
   - `signature_events`
   - `verification_codes`
   - `contracts`
   - `contract_templates`
4. Create the `documents` storage bucket (private, 50MB limit)
5. Apply RLS policies from [`SUPABASE_STORAGE_SETUP.md`](SUPABASE_STORAGE_SETUP.md) and [`fix_documents_rls_policies.sql`](fix_documents_rls_policies.sql)

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:8080
VITE_RESEND_API_KEY=re_xxxxxxxx
```

### Step 4: Deploy the Resend Edge Function

The email-sending Edge Function must be deployed to Supabase:

```bash
# Using the Supabase CLI
supabase functions deploy resend-email --project-ref your-project-ref

# Set the Resend API key as a secret
supabase secrets set RESEND_API_KEY=re_xxxxxxxx --project-ref your-project-ref
```

Alternatively, use the provided batch file:

```bash
deploy-resend-function.bat
```

### Step 5: Verify Local Build

```bash
npm run build
```

This should produce a `dist/` directory with compiled static files. Fix any TypeScript or build errors before proceeding.

### Step 6: Deploy to Vercel

#### Via Vercel Dashboard (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import your GitHub repository
4. Verify build settings:

   | Setting | Value |
   |---------|-------|
   | Framework Preset | `Vite` (auto-detected) |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

5. Add **Environment Variables** (see [Section 15](#15-environment-variables))
6. Click **Deploy**

#### Via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

### Step 7: Configure Supabase Auth

After deployment, update Supabase authentication settings:

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g., `https://your-app.vercel.app`)
3. Add **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `http://localhost:8080/**` (for local development)

### Step 8: Update `VITE_APP_URL`

1. In Vercel Dashboard → **Settings → Environment Variables**
2. Update `VITE_APP_URL` to your production URL
3. **Redeploy** (environment variables are baked in at build time for Vite apps)

### Step 9: Verify Resend Domain (Production)

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add and verify your custom domain
3. Update the `DEFAULT_FROM_EMAIL` in the Edge Function to use your verified domain
4. Redeploy the Edge Function

### Step 10: Custom Domain (Optional)

1. In Vercel Dashboard → **Settings → Domains**
2. Add your custom domain
3. Configure DNS: `CNAME` record pointing to `cname.vercel-dns.com`
4. Update `VITE_APP_URL` and Supabase Auth URLs to the custom domain

### Ongoing Maintenance

#### Automatic Deployments

Pushing to the `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Your changes"
git push
# Vercel auto-deploys in ~1-2 minutes
```

#### Preview Deployments

Every pull request gets a unique preview URL for testing before merging.

#### Environment Variable Updates

After changing environment variables in Vercel, you **must redeploy** since Vite injects them at build time.

---

## 15. Environment Variables

### Frontend (Vite)

All frontend environment variables must be prefixed with `VITE_` to be accessible via `import.meta.env`.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_APP_URL` | ✅ | Public URL of the application | `https://your-app.vercel.app` |
| `VITE_RESEND_API_KEY` | ⚠️ | Resend API key (used in fallback) | `re_xxxxxxxx` |

### Supabase Edge Function (Secrets)

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | ✅ | Resend API key for sending emails |

### Security Notes

- **Never** commit `.env` files to version control (included in `.gitignore`)
- The Supabase `anon_key` is safe to expose publicly — access is controlled by RLS policies
- **Never** use the Supabase `service_role` key in frontend code
- The `RESEND_API_KEY` should be set as a Supabase secret, not in the frontend

---

## 16. Troubleshooting

### Signature request email not sent

1. Verify `RESEND_API_KEY` is set as a Supabase Edge Function secret
2. Check Edge Function logs: **Supabase Dashboard → Edge Functions → resend-email → Logs**
3. If using `onboarding@resend.dev` as sender, you can only send to your own verified email — verify a custom domain at [resend.com/domains](https://resend.com/domains)
4. Check the browser console for fallback error messages

### Document upload fails with "Storage bucket does not exist"

1. Go to **Supabase Dashboard → Storage**
2. Create a bucket named `documents` (private)
3. Apply RLS policies from [`fix_storage_bucket_policies.sql`](fix_storage_bucket_policies.sql)

### Document upload fails with "Permission denied" or RLS error

1. Ensure the user is authenticated
2. Verify RLS policies are applied correctly from [`fix_documents_rls_policies.sql`](fix_documents_rls_policies.sql)
3. Check that the file path follows the `{user_id}/{filename}` convention

### Signing link returns "Request not found"

1. Check if the signature request has expired (default: 7 days)
2. Verify the token in the URL matches a record in `signature_requests`
3. Check if the request status is already `completed` or `cancelled`

### Signature canvas not working on mobile

1. Ensure touch events are not being intercepted by parent containers
2. The `touch-none` CSS class on the canvas prevents default touch scrolling
3. Test with both mouse and touch events — the canvas handles both

### 404 on `/sign/{token}` after deployment

1. Verify [`vercel.json`](vercel.json) includes the SPA rewrite rule
2. Ensure the route is defined in [`routes.tsx`](src/routes.tsx)
3. Redeploy after any route changes

### SMS verification codes not received

1. The current implementation logs codes to the server console (demo mode)
2. For production SMS delivery, integrate with Twilio or similar provider
3. Check the `verification_codes` table to see generated codes

### Build fails with "out of memory"

Add to `vercel.json`:

```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

### Environment variables not taking effect

- Vite only exposes variables prefixed with `VITE_`
- After changing env vars in Vercel, you **must redeploy** (they're injected at build time)
- Verify with: `console.log(import.meta.env.VITE_SUPABASE_URL)`

---

## Appendix: File Map

### Signature-Related Files

```
src/
├── components/
│   ├── signatures/
│   │   ├── CreateSignatureRequestDialog.tsx    # Main request creation dialog
│   │   ├── SignatureRequestsList.tsx           # Request management table
│   │   ├── SMSVerification.tsx                 # Phone verification component
│   │   ├── UploadDocumentForSignatureDialog.tsx # Document upload for signing
│   │   └── TestEmailButton.tsx                 # Email delivery test button
│   ├── contracts/
│   │   ├── AddContractDialog.tsx               # Create contract wrapper
│   │   ├── AddTemplateDialog.tsx               # Create template wrapper
│   │   ├── ContractCard.tsx                    # Contract list card
│   │   ├── ContractForm.tsx                    # Contract creation form
│   │   ├── ContractPreview.tsx                 # HTML contract preview
│   │   ├── ContractTemplateCard.tsx            # Template list card
│   │   ├── ContractTemplateForm.tsx            # Template creation form
│   │   ├── EditContractDialog.tsx              # Edit contract wrapper
│   │   ├── EditTemplateDialog.tsx              # Edit template wrapper
│   │   ├── SignatureCanvas.tsx                 # Custom canvas (contracts)
│   │   ├── SignatureDisplay.tsx                # Signature image display
│   │   └── SignContractDialog.tsx              # Authenticated signing dialog
│   └── documents/
│       ├── DocumentsList.tsx                   # Document listing
│       ├── PDFViewer.tsx                       # PDF rendering
│       ├── RequestSignatureDialog.tsx          # Request signature on document
│       ├── SignDocumentDialog.tsx              # Authenticated doc signing
│       ├── SignatureCanvas.tsx                 # Signature pad (documents)
│       ├── SignatureDisplay.tsx                # Signature image display
│       ├── UploadDocumentDialog.tsx            # General upload dialog
│       └── UppyUploader.tsx                    # File upload component
├── pages/
│   ├── SignDocument.tsx                        # Public signing page (/sign/:token)
│   ├── SignatureSuccess.tsx                    # Post-signing confirmation
│   ├── Signatures.tsx                          # Signature management page
│   ├── Contracts.tsx                           # Contract listing page
│   ├── ContractDetails.tsx                     # Single contract view
│   └── ContractTemplates.tsx                   # Template management page
├── services/
│   ├── signatureService.ts                     # Core signature request logic
│   ├── documentService.ts                      # Document + signature persistence
│   ├── emailService.ts                         # Email notification service
│   ├── smsService.ts                           # SMS verification service
│   └── storageService.ts                       # File storage operations
├── types/
│   └── index.ts                                # Type definitions
└── utils/
    └── contractUtils.ts                        # Template merge + default templates

supabase/
└── functions/
    └── resend-email/
        └── index.ts                            # Email sending Edge Function
```

---

*Generated on 2026-04-19 — Knot To It Electronic Signature Documentation*
