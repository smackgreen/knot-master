// CORS headers for Edge Functions
// Dynamically validates origins to support localhost, production, and Vercel preview URLs

const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'https://knot-master.vercel.app',
];

// Regex pattern for Vercel preview deployment URLs:
// Matches any subdomain of .vercel.app (e.g., knot-master-abc123-smackgreens-projects.vercel.app)
const VERCEL_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

/**
 * Check if a given origin is allowed based on static list or Vercel preview pattern.
 */
function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (VERCEL_PREVIEW_PATTERN.test(origin)) return true;
  return false;
}

/**
 * Build CORS headers dynamically based on the incoming request's Origin.
 * Falls back to the production URL if the origin is not recognized.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = isOriginAllowed(origin)
    ? origin
    : 'https://knot-master.vercel.app'; // safe fallback: production URL

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Static CORS headers for cases where the request object is unavailable.
 * Uses the production URL as the default origin.
 * NOTE: Prefer getCorsHeaders(req) when the request is available.
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': 'https://knot-master.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
