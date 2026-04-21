#!/bin/bash
# =============================================================================
# OpenSSL Certificate Generation Script for PDF Digital Signatures
# =============================================================================
# This script generates a self-signed certificate, private key, and PKCS#12
# bundle used by node-signpdf to apply cryptographic digital signatures to
# PDF documents.
#
# Usage: ./scripts/generate-cert.sh
#
# Output:
#   - certs/certificate.pem  (public certificate)
#   - certs/key.pem          (private key)
#   - certs/cert.p12         (PKCS#12 bundle for node-signpdf)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CERT_DIR="$PROJECT_DIR/certs"

echo "🔐 Generating self-signed certificate for PDF digital signatures..."

# Create certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Check if certificates already exist
if [ -f "$CERT_DIR/certificate.pem" ] && [ -f "$CERT_DIR/key.pem" ] && [ -f "$CERT_DIR/cert.p12" ]; then
  echo "⚠️  Certificates already exist in $CERT_DIR"
  read -p "Do you want to regenerate them? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Keeping existing certificates."
    exit 0
  fi
fi

# Generate the private key and certificate
# -x509: output a self-signed certificate instead of a certificate request
# -sha256: use SHA-256 for the signature algorithm
# -days 3650: certificate valid for 10 years
# -nodes: no DES encryption (private key won't be password-protected)
# -newkey rsa:2048: generate a new RSA key of 2048 bits
openssl req -x509 \
  -sha256 \
  -days 3650 \
  -nodes \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/certificate.pem" \
  -subj "/C=FR/ST=Paris/L=Paris/O=KnotToIt/CN=KnotToIt Document Signing/emailAddress=signing@knottoit.com"

# Create PKCS#12 bundle (required by node-signpdf)
openssl pkcs12 -export -out "$CERT_DIR/cert.p12" \
  -inkey "$CERT_DIR/key.pem" \
  -in "$CERT_DIR/certificate.pem" \
  -passout pass:

# Verify the certificate
echo ""
echo "✅ Certificate generated successfully!"
echo ""
echo "Certificate details:"
openssl x509 -in "$CERT_DIR/certificate.pem" -text -noout | head -20
echo ""
echo "📁 Files created:"
echo "   Private key: $CERT_DIR/key.pem"
echo "   Certificate: $CERT_DIR/certificate.pem"
echo "   PKCS#12 bundle: $CERT_DIR/cert.p12"
echo ""
echo "⚠️  IMPORTANT: certs/*.pem and certs/*.p12 are in .gitignore!"
echo "   Never commit private keys or PKCS#12 bundles to version control."
