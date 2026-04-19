# Google OAuth Setup Guide — Step-by-Step Deployment

This guide walks you through deploying Google OAuth for the Knot To It Wedding Planner CRM using Supabase Auth.

## Prerequisites

- Access to the [Supabase Dashboard](https://app.supabase.com/) for project `zkrtaixltensetceanmv`
- A [Google Cloud Console](https://console.cloud.google.com/) account
- Access to the Vercel deployment for `knot-master`

## Phase 0: Verify PKCE Migration (Already Deployed)

The codebase has been migrated from `implicit` to `pkce` flow. Verify:

1. `src/integrations/supabase/client.ts` has `flowType: 'pkce'`
2. `src/pages/AuthCallback.tsx` handles `?code=` via `exchangeCodeForSession()`
3. `src/pages/AuthCallback.tsx` handles `?token_hash=` + `?type=` via `verifyOtp()`

## Phase 1: Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Knot To It Auth"
4. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - App name: `Knot To It`
   - User support email: your email
   - Developer contact email: your email
4. Click **Save and Continue**
5. Add scopes: `email`, `profile`, `openid`
6. Add test users if in testing mode
7. Click **Save and Continue**

### Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Knot To It - Supabase`
5. **Authorized JavaScript origins**:
   - `https://knot-master.vercel.app`
6. **Authorized redirect URIs**:
   - `https://zkrtaixltensetceanmv.supabase.co/auth/v1/callback`
7. Click **Create**
8. **Copy the Client ID and Client Secret**

## Phase 2: Supabase Dashboard Configuration

### Step 4: Enable Google Provider

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select project `zkrtaixltensetceanmv`
3. Navigate to **Authentication** → **Providers**
4. Click **Google**
5. Toggle **Enable Google provider** to ON
6. Paste the **Client ID** and **Client Secret** from Step 3
7. Click **Save**

### Step 5: Configure Redirect URLs

1. Navigate to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://knot-master.vercel.app`
3. Add **Redirect URLs**:
   ```
   https://knot-master.vercel.app/auth/callback
   ```
4. Click **Save**

### Step 6: Configure Account Linking (Recommended)

1. In **Authentication** → **Providers** → **Google**
2. Enable **Link accounts with same email**
3. This allows users who signed up with email to also use Google login

## Phase 3: Deploy Code Changes

### Step 7: Merge to Main Branch

All code changes should be merged as a single commit:

- `src/integrations/supabase/client.ts` — PKCE flow type
- `src/components/auth/GoogleAuthButton.tsx` — new Google button component
- `src/components/auth/EmailAuthForm.tsx` — integrated Google button
- `src/components/ProtectedRoute.tsx` — deep link capture
- `src/context/AuthContext.tsx` — signInWithGoogle method + OAuth state recovery
- `src/pages/AuthCallback.tsx` — PKCE callback handler
- `src/locales/en/common.json` — English translations
- `src/locales/fr/common.json` — French translations

### Step 8: Verify Vercel Environment Variables

Ensure these are set in Vercel Dashboard → Settings → Environment Variables:

- `VITE_SUPABASE_URL` = `https://zkrtaixltensetceanmv.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (your anon key)

No new environment variables are needed for Google OAuth.

## Phase 4: Testing Checklist

### Step 9: Test Google OAuth Flow

- [ ] Visit `/login` and see "Continue with Google" button
- [ ] Click button → redirects to Google consent screen
- [ ] Complete consent → redirects to `/auth/callback?code=...`
- [ ] Session established → redirects to `/app/dashboard`
- [ ] User profile created in `profiles` table
- [ ] Complimentary Pro subscription provisioned

### Step 10: Test Account Linking

- [ ] Sign up with email `test@example.com`
- [ ] Sign out
- [ ] Sign in with Google using same email
- [ ] Verify accounts are linked (same user ID)

### Step 11: Test Plan Persistence

- [ ] Visit `/signup?plan=premium`
- [ ] Click "Continue with Google"
- [ ] After OAuth → redirects to `/account/subscription?plan=premium`

### Step 12: Test Deep Link Return

- [ ] While logged out, visit `/app/clients`
- [ ] Redirected to `/login`
- [ ] Click "Continue with Google"
- [ ] After OAuth → redirects to `/app/clients` (not just dashboard)

### Step 13: Test Email Login Not Affected

- [ ] While logged out, visit `/app/clients` (saves deep link)
- [ ] Sign in with email/password (NOT Google)
- [ ] Verify redirect follows normal email login flow (not to `/app/clients`)

### Step 14: Test Error Scenarios

- [ ] Deny Google consent → error shown
- [ ] Already signed in + visit `/login` → redirect to dashboard
- [ ] Mobile browser → responsive layout works

## Phase 5: Production Readiness

### Step 15: Publish OAuth Consent Screen

1. In Google Cloud Console → **OAuth consent screen**
2. Click **Publish App**
3. This removes the 100-user limit

### Step 16: Remove Transitional Fallback (After 48 Hours)

After 48 hours, remove the hash-fragment fallback block in `src/pages/AuthCallback.tsx` marked with the TODO comment about pre-PKCE confirmation links.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "This sign-in link has expired" | PKCE code already used or expired. Start a new sign-in. |
| Nothing happens on button click | Check CSP `form-action` directive allows `accounts.google.com` |
| "Account already exists" error | Enable account linking in Supabase, or sign in with email first |
| Blank page after Google redirect | Check browser console for `exchangeCodeForSession` errors |
| Profile not created | Verify `profiles` table has INSERT RLS policy for `auth.uid()` |
