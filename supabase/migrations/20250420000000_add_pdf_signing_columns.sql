-- Migration: Add PDF signing columns for two-layer signature process
-- Layer 1: Visual signature embedding into PDF
-- Layer 2: Cryptographic digital certificate signing

-- Add final_pdf_url column to store the path to the fully signed PDF
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS final_pdf_url TEXT;

-- Add certificate_serial to track which certificate was used for Layer 2
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS certificate_serial TEXT;

-- Add document_hash to store the SHA-256 hash of the final signed PDF for integrity verification
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_hash TEXT;

-- Add crypto_signed_at timestamp for when Layer 2 was applied
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS crypto_signed_at TIMESTAMPTZ;

-- Add index for faster lookups on final_pdf_url
CREATE INDEX IF NOT EXISTS idx_documents_final_pdf_url ON documents(final_pdf_url) WHERE final_pdf_url IS NOT NULL;

-- Add index for document_hash lookups (verification)
CREATE INDEX IF NOT EXISTS idx_documents_document_hash ON documents(document_hash) WHERE document_hash IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN documents.final_pdf_url IS 'URL/path to the final PDF with both visual signatures embedded and cryptographic certificate applied';
COMMENT ON COLUMN documents.certificate_serial IS 'Serial number of the digital certificate used for cryptographic signing (Layer 2)';
COMMENT ON COLUMN documents.document_hash IS 'SHA-256 hash of the final signed PDF for integrity verification';
COMMENT ON COLUMN documents.crypto_signed_at IS 'Timestamp when the cryptographic digital signature (Layer 2) was applied';
