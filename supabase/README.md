# Supabase Database Setup

This directory contains the database schema and migrations for the Wedding Planner CRM application.

## Database Schema

The application uses the following tables:

1. **profiles** - User profiles
2. **clients** - Client information
3. **vendors** - Vendor information
4. **tasks** - Tasks related to clients
5. **budgets** - Budget information for clients
6. **budget_categories** - Categories within budgets
7. **invoices** - Invoices for clients
8. **quotations** - Quotations for clients

## Setting Up the Database

To set up the database, you need to run the migrations in the Supabase dashboard or using the Supabase CLI.

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file (`migrations/20240101000000_create_tables.sql`)
4. Paste it into the SQL Editor and run the query

### Using Supabase CLI

1. Install the Supabase CLI if you haven't already:
   ```
   npm install -g supabase
   ```

2. Link your project:
   ```
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Push the migrations:
   ```
   supabase db push
   ```

## Row Level Security (RLS)

The database uses Row Level Security to ensure that users can only access their own data. Each table has policies that restrict access based on the user's ID.

## Relationships

- Each user can have multiple clients
- Each client can have multiple vendors, tasks, and a budget
- Each budget can have multiple budget categories
- Each client can have multiple invoices and quotations

## Triggers

The database uses triggers to automatically update the `updated_at` column whenever a record is updated.
