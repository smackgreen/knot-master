# Configuring Supabase Email Authentication

This guide will help you set up email authentication in Supabase for your Knot To It Wedding Planner CRM.

## 1. Enable Email Authentication in Supabase

1. Go to the [Supabase Dashboard](https://app.supabase.io/)
2. Sign in and select your project (ID: `ocrjmlizddgjlcwxpqmq`)
3. Navigate to **Authentication** → **Providers**
4. Find the **Email** provider and make sure it's enabled
5. Configure the email provider settings:
   - **Confirm email**: You can choose whether to require email confirmation
   - **Secure email template**: Enable this for better security

## 2. Configure Email Templates (Optional)

If you want to customize the email templates:

1. Navigate to **Authentication** → **Email Templates**
2. You can customize the following templates:
   - **Confirmation**: Sent when a user signs up
   - **Invitation**: Sent when you invite a user
   - **Magic Link**: Sent for passwordless login
   - **Reset Password**: Sent when a user requests a password reset

## 3. Configure Site URL and Redirect URLs

1. Navigate to **Authentication** → **URL Configuration**
2. Update the following settings:
   - **Site URL**: `http://localhost:8081` (or whatever port your local development server uses)
   - **Redirect URLs**: Add the following URLs (one per line):
     ```
     http://localhost:8081/auth/callback
     http://localhost:8080/auth/callback
     http://localhost:3000/auth/callback
     ```
   - Click **Save** to apply the changes

## 4. Testing Email Authentication

### Creating a Test User

1. You can create a test user in two ways:
   - Use the signup form in the application
   - Create a user manually in the Supabase dashboard

### Creating a User Manually

1. Navigate to **Authentication** → **Users**
2. Click **+ Add User**
3. Enter the email and password
4. Click **Save**

### Troubleshooting Email Delivery

If you're not receiving emails:

1. Navigate to **Authentication** → **Users**
2. Find your user
3. Click on the user to view details
4. You can manually confirm the email or reset the password from here

## 5. Using the Email Authentication in Your Application

The application now supports three authentication methods:

1. **Email/Password**: Sign up and login with email and password
2. **Google OAuth**: Continue with Google (requires additional configuration)
3. **Demo Account**: For testing without creating an account

To use email authentication:

1. Go to the login page
2. Use the Email tab to either login or create a new account
3. If email confirmation is required, check your email for a confirmation link
4. After confirming your email, you can log in with your credentials

## 6. Additional Configuration Options

### Password Policies

You can configure password policies in Supabase:

1. Navigate to **Authentication** → **Policies**
2. Configure minimum password strength, length, etc.

### Rate Limiting

To prevent abuse, you can configure rate limiting:

1. Navigate to **Authentication** → **Rate Limits**
2. Configure limits for signup, login attempts, etc.

## 7. Security Best Practices

1. **Enable MFA**: Consider enabling Multi-Factor Authentication for additional security
2. **Regular Audits**: Regularly review user accounts and authentication logs
3. **Password Policies**: Enforce strong password policies
4. **Session Management**: Configure appropriate session durations

For more information, refer to the [Supabase Authentication documentation](https://supabase.com/docs/guides/auth).
