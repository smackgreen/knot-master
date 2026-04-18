# Deployment Guide — Knot To It

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | Vite + React + TypeScript |
| UI | shadcn/ui (Radix primitives) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Payments | Stripe (via Supabase Edge Function) |
| Email | Resend (via Supabase Edge Function) |
| Build output | Static SPA (`dist/` directory) |

**Key insight**: This is a **pure static SPA** — no server-side runtime is needed. The entire backend is handled by Supabase. This makes deployment extremely cheap and simple.

---

## Provider Comparison

### 1. Vercel ⭐ **RECOMMENDED**

| Feature | Details |
|---------|---------|
| **Free tier** | Hobby plan: 100 GB bandwidth/month, unlimited sites |
| **Build** | Automatic — detects Vite, runs `npm run build` |
| **Output** | Serves `dist/` as static files with global CDN |
| **Custom domains** | Free on Hobby plan |
| **SSL** | Automatic HTTPS (Let's Encrypt) |
| **Preview deployments** | Every PR gets a preview URL |
| **Environment variables** | Set in dashboard, encrypted at rest |
| **Vite compatibility** | First-class — zero-config detection |
| **Pricing after free** | Pro: $20/month/team |

**Why best**: Vercel was created by the Vite/Next.js team. Vite projects get zero-config detection, optimal build caching, and the most generous free tier for static SPAs.

### 2. Netlify

| Feature | Details |
|---------|---------|
| **Free tier** | Starter: 100 GB bandwidth/month, 300 build minutes/month |
| **Build** | Auto-detects Vite, runs `npm run build` |
| **Output** | Serves `dist/` with global CDN |
| **Custom domains** | Free |
| **SSL** | Automatic HTTPS |
| **Preview deployments** | Deploy previews on every PR |
| **Vite compatibility** | Excellent — auto-detects framework |
| **Pricing after free** | Pro: $19/month |

**Verdict**: Excellent alternative to Vercel. Slightly less generous build minutes on free tier. Choose if you prefer Netlify's UI or already use it.

### 3. Cloudflare Pages

| Feature | Details |
|---------|---------|
| **Free tier** | 500 builds/month, unlimited bandwidth, 500 builds/month |
| **Build** | Auto-detects Vite |
| **Output** | Global CDN via Cloudflare network |
| **Custom domains** | Free |
| **SSL** | Automatic |
| **Vite compatibility** | Good — auto-detects |
| **Pricing after free** | Pay-as-you-go at very low rates |

**Verdict**: Best bandwidth offering (unlimited free). Slightly less polished DX than Vercel. Great if you expect high traffic.

### 4. Railway

| Feature | Details |
|---------|---------|
| **Free tier** | $5 credit/month (trial), then usage-based |
| **Build** | Docker-based or Nixpacks auto-detect |
| **Output** | Runs as a container (overkill for static SPA) |
| **Pricing after free** | Usage-based (~$5/month for small apps) |

**Verdict**: Overkill for a static SPA. Better suited for apps needing server-side runtimes. Not recommended for this project.

### 5. Render

| Feature | Details |
|---------|---------|
| **Free tier** | Static sites: free (100 GB bandwidth) |
| **Build** | Auto-detects Vite |
| **Output** | Static site serving |
| **Pricing after free** | Static sites stay free; paid for services |

**Verdict**: Good free static hosting. Slower builds than Vercel/Netlify. Free tier static sites spin down after inactivity (longer cold starts).

### 6. Fly.io

| Feature | Details |
|---------|---------|
| **Free tier** | 3 shared VMs, 160 GB bandwidth |
| **Build** | Requires Dockerfile |
| **Output** | Runs as a container |
| **Pricing after free** | Usage-based |

**Verdict**: Requires a Dockerfile for a static SPA — unnecessary complexity. Better for backend services. Not recommended.

---

## Winner: Vercel (Free Hobby Plan)

Vercel is the clear winner for this project because:

1. **Zero-config Vite detection** — no build settings to customize
2. **Most generous free tier** — 100 GB bandwidth, unlimited sites
3. **Fastest builds** — build caching across deployments
4. **Preview deployments** — test every PR before merging
5. **Automatic HTTPS** — SSL certificates managed for you
6. **Custom domain support** — free on Hobby plan
7. **Edge network** — global CDN for fast loading worldwide

---

## Step-by-Step Deployment Guide (Vercel)

### Prerequisites

- A [GitHub](https://github.com) account
- Your project code pushed to a GitHub repository
- A [Vercel](https://vercel.com) account (sign up with GitHub)

---

### Step 1: Prepare Your Repository

Ensure your project has these files committed (they already exist):

```
├── package.json          # Build scripts defined
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
├── index.html            # Entry point
└── src/                  # Source code
```

**Verify the build works locally:**

```bash
npm install
npm run build
```

This should produce a `dist/` directory with your compiled static files.

---

### Step 2: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/knot-master.git
git push -u origin main
```

**Important**: Make sure `.gitignore` includes:

```gitignore
node_modules/
dist/
.env
*.local
```

Never commit your `.env` file with real API keys.

---

### Step 3: Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub repositories

---

### Step 4: Import Your Project

1. In the Vercel dashboard, click **Add New...** → **Project**
2. Under **Import Git Repository**, find your `knot-master` repo
3. Click **Import**

---

### Step 5: Configure Build Settings

Vercel auto-detects Vite. Verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `./` (default) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> **Note**: Vercel should auto-detect all of these. Only change if they're incorrect.

---

### Step 6: Set Environment Variables

**This is critical.** Before clicking **Deploy**, expand the **Environment Variables** section and add each variable:

| Name | Value | Where to find it |
|------|-------|------------------|
| `VITE_SUPABASE_URL` | `https://zkrtaixltensetceanmv.supabase.co` | Your Supabase project → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (your anon key) | Supabase → Settings → API → anon/public key |
| `VITE_APP_URL` | Your Vercel URL (e.g., `https://knot-master.vercel.app`) | Set after first deploy, or use your custom domain |
| `VITE_RESEND_API_KEY` | `re_xxxxxxxx` | [Resend dashboard](https://resend.com/api-keys) |

**To add each variable:**

1. In the Environment Variables section, enter the **Name** (e.g., `VITE_SUPABASE_URL`)
2. Enter the **Value**
3. Select **Production**, **Preview**, and **Development** environments
4. Click **Add**
5. Repeat for each variable

---

### Step 7: Deploy

1. Click **Deploy**
2. Wait for the build to complete (~1-3 minutes)
3. Vercel will show a success screen with your deployment URL

Your app is now live at: `https://your-project-name.vercel.app`

---

### Step 8: Update Supabase Auth Settings

After deploying, update your Supabase project to allow authentication from your new URL:

1. Go to [Supabase Dashboard](https://app.supabase.com) → Your project
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Site URL**, enter your Vercel URL: `https://your-project-name.vercel.app`
4. Under **Redirect URLs**, add:
   - `https://your-project-name.vercel.app/**`
   - `http://localhost:8080/**` (for local development)
5. Click **Save**

---

### Step 9: Update `VITE_APP_URL` Environment Variable

1. In Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Find `VITE_APP_URL`
3. Update its value to your production URL: `https://your-project-name.vercel.app`
4. Click **Save**
5. Go to **Deployments** → Click **...** on the latest deployment → **Redeploy**

This ensures features like OAuth callbacks and email links use the correct production URL.

---

### Step 10: (Optional) Add a Custom Domain

1. In Vercel dashboard → Your project → **Settings** → **Domains**
2. Enter your custom domain (e.g., `app.knottoit.com`)
3. Click **Add**
4. Follow the DNS instructions to point your domain to Vercel:
   - Add a `CNAME` record pointing to `cname.vercel-dns.com`
   - Or add an `A` record pointing to `76.76.21.21`
5. Vercel automatically provisions an SSL certificate
6. Update `VITE_APP_URL` to your custom domain
7. Update Supabase Auth **Site URL** and **Redirect URLs** to the custom domain

---

## Ongoing Maintenance

### Automatic Deployments

Vercel automatically deploys when you push to `main`:

```bash
git add .
git commit -m "Your commit message"
git push
# Vercel detects the push and deploys automatically (~1-2 min)
```

### Preview Deployments

Every pull request automatically gets a preview URL like:
`https://knot-master-git-feature-branch-yourusername.vercel.app`

This lets you test changes before merging to production.

### Environment Variable Changes

If you change environment variables:

1. Go to **Settings** → **Environment Variables** in Vercel
2. Edit the variable
3. **Redeploy** (Environment variables are baked in at build time for Vite apps)

### Monitoring

- **Vercel Dashboard** → **Analytics** tab for Web Vitals
- **Vercel Dashboard** → **Logs** tab for real-time function logs
- **Supabase Dashboard** → **Logs** for database/auth/storage logs

---

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| **Vercel** (Hobby) | **$0** (free tier) |
| **Supabase** (Free) | **$0** (500 MB DB, 1 GB storage, 50K auth users) |
| **Resend** (Free) | **$0** (100 emails/day) |
| **Domain** (optional) | ~$10-15/year |
| **Total** | **$0/month** |

### Scaling Costs (if you outgrow free tiers)

| Service | Paid Tier | Cost |
|---------|-----------|------|
| Vercel Pro | Needed for team features, higher limits | $20/month |
| Supabase Pro | 8 GB DB, 100 GB storage, 100K auth users | $25/month |
| Resend Pro | 10,000 emails/month | $20/month |

---

## Alternative: Netlify Quick Deploy

If you prefer Netlify, the process is nearly identical:

### Via Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Via Netlify Dashboard

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your GitHub repo
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add the same environment variables
7. Click **Deploy site**

---

## Troubleshooting

### Build fails with "out of memory"

Add to `vercel.json` (create if needed):

```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

### 404 on page refresh (client-side routing)

Vercel auto-handles this for Vite projects. If issues occur, create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment variables not working

- Vite only exposes variables prefixed with `VITE_`
- After changing env vars in Vercel, you **must redeploy** (they're injected at build time)
- Verify with: `console.log(import.meta.env.VITE_SUPABASE_URL)`

### CORS errors after deployment

1. Check that `VITE_SUPABASE_URL` is correct in Vercel env vars
2. In Supabase dashboard → **Authentication** → **URL Configuration**, ensure your production URL is listed
3. Supabase Storage CORS is managed at the platform level — no additional config needed

### Supabase connection issues

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match your active Supabase project
- The anon key is safe to expose publicly (it's restricted by RLS policies)
- Never use the `service_role` key in frontend code
