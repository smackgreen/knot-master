#!/bin/bash
# Deploy the Google Calendar Auth Edge Function to Supabase
# Run this script from the project root directory

set -e

PROJECT_REF="zkrtaixltensetceanmv"

echo "=============================================="
echo "Deploying Google Calendar Auth Edge Function"
echo "=============================================="
echo ""

# Step 1: Deploy the edge function
echo "Step 1: Deploying google-calendar-auth function..."
supabase functions deploy google-calendar-auth --project-ref $PROJECT_REF --no-verify-jwt

echo ""
echo "Step 2: Setting required secrets..."
echo ""
echo "IMPORTANT: You need to set the following secrets in Supabase:"
echo "  supabase secrets set --project-ref $PROJECT_REF GOOGLE_CLIENT_ID=your-google-client-id"
echo "  supabase secrets set --project-ref $PROJECT_REF GOOGLE_CLIENT_SECRET=your-google-client-secret"
echo "  supabase secrets set --project-ref $PROJECT_REF REDIRECT_URI=https://knot-master.vercel.app/auth/google-calendar-callback"
echo ""
echo "NOTE: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically"
echo "available to edge functions and do not need to be set manually."
echo ""

# Uncomment and fill in the lines below to set secrets automatically:
# supabase secrets set --project-ref $PROJECT_REF GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
# supabase secrets set --project-ref $PROJECT_REF GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
# supabase secrets set --project-ref $PROJECT_REF REDIRECT_URI=https://knot-master.vercel.app/auth/google-calendar-callback

echo "Step 3: Verifying deployment..."
supabase functions list --project-ref $PROJECT_REF

echo ""
echo "=============================================="
echo "Deployment complete!"
echo "=============================================="
