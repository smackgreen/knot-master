# Deploying Supabase Edge Functions with GitHub Actions

This document explains how to set up and use GitHub Actions to deploy your Supabase Edge Functions without requiring Docker locally.

## Overview

GitHub Actions allows you to automate the deployment of your Supabase Edge Functions directly from your GitHub repository. This approach has several advantages:

1. No need for Docker on your local machine
2. Automated deployments when you push changes
3. Consistent deployment environment
4. Secure handling of secrets

## Setup Instructions

### 1. Add GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click on "New repository secret"
4. Add the following secrets:

   - **SUPABASE_ACCESS_TOKEN**: Your Supabase access token
     - Get this from https://supabase.com/dashboard/account/tokens
   
   - **SUPABASE_PROJECT_REF**: Your Supabase project reference
     - This is `ocrjmlizddgjlcwxpqmq` for your project
   
   - **RESEND_API_KEY**: Your Resend API key
     - This is `re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc` for your project

### 2. GitHub Actions Workflow

The workflow file (`.github/workflows/deploy-functions.yml`) is already set up to:

1. Run when changes are pushed to the `supabase/functions` directory
2. Deploy the `resend-email` function to your Supabase project
3. Set the Resend API key as a secret

You can also manually trigger the workflow by:
1. Going to the "Actions" tab in your GitHub repository
2. Selecting the "Deploy Supabase Edge Functions" workflow
3. Clicking "Run workflow"

## Manual Deployment

If you need to deploy manually without Docker, you can use the `deploy-edge-function-direct.bat` script:

```
deploy-edge-function-direct.bat
```

This script will:
1. Log you in to Supabase (if not already logged in)
2. Deploy the Edge Function directly to your Supabase project
3. Set the Resend API key

## Troubleshooting

If you encounter issues with the GitHub Actions deployment:

1. Check the workflow run logs in the "Actions" tab
2. Verify that your secrets are set correctly
3. Make sure your Supabase access token has the necessary permissions

## Updating the Edge Function

When you make changes to your Edge Function:

1. Update the files in `supabase/functions/resend-email/`
2. Commit and push your changes
3. The GitHub Actions workflow will automatically deploy the updated function

Alternatively, you can manually trigger the workflow from the "Actions" tab.
