// CORS headers for Edge Functions
// Restrict to known application origins instead of wildcard
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'https://knot-master.vercel.app',
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.join(', '),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
