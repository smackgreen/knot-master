# Knot To It - Wedding Planner CRM Documentation

## Overview

Knot To It is a comprehensive Customer Relationship Management (CRM) system designed specifically for wedding planners. The application helps wedding planners manage their clients, vendors, tasks, budgets, invoices, quotations, guest lists, seating arrangements, and provides AI-powered design and meal planning suggestions.

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Shadcn UI components
- **State Management**: React Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Internationalization**: i18next
- **AI Integration**: OpenAI API and Deepseek API

## Application Structure

### Core Directories

- **src/components**: Reusable UI components
- **src/context**: React context providers for global state
- **src/hooks**: Custom React hooks
- **src/integrations**: External service integrations (Supabase)
- **src/lib**: Utility functions and shared code
- **src/locales**: Internationalization files (en, fr)
- **src/pages**: Page components for each route
- **src/services**: Service modules for API interactions
- **src/types**: TypeScript type definitions
- **src/utils**: Helper functions

## Key Features

1. **Authentication System**
   - Email/password authentication
   - User profile management
   - Company profile settings

2. **Client Management**
   - Add, edit, and delete clients
   - Track client details and wedding information
   - Client dashboard with overview of tasks, budget, and timeline

3. **Vendor Management**
   - Categorized vendor tracking
   - Vendor contact information
   - Payment status tracking

4. **Task Management**
   - Task creation and assignment
   - Due date tracking
   - Status updates (not started, in progress, completed, overdue)
   - Priority levels (low, medium, high)

5. **Budget Tracking**
   - Total budget management
   - Categorized budget allocation
   - Expense tracking
   - Visual budget reports

6. **Invoice and Quotation System**
   - Create and send invoices
   - Generate quotations
   - Track payment status
   - Download as PDF

7. **Guest Management**
   - Guest list creation
   - RSVP tracking
   - Meal preferences
   - Family grouping (couples and children)
   - Excel import functionality

8. **Seating Chart Designer**
   - Visual table arrangement
   - Guest assignment to tables
   - Different table shapes and sizes
   - Drag-and-drop interface

9. **AI-Powered Design Suggestions**
   - Color scheme generation
   - Decor ideas based on themes and preferences
   - Venue visualization

10. **AI-Powered Meal Planning**
    - Menu suggestions based on preferences
    - Dietary restriction handling
    - Seasonal and regional considerations
    - Cost estimates

11. **Internationalization**
    - Multi-language support (English and French)
    - Language switcher

## Data Models

### Core Entities

1. **Client**
   - Basic information (name, partner name, email, phone)
   - Wedding details (date, venue)
   - Status (active, completed, cancelled)

2. **Vendor**
   - Contact information
   - Category (venue, catering, photography, etc.)
   - Cost and payment status

3. **Task**
   - Title and description
   - Due date
   - Status and priority
   - Category

4. **Budget**
   - Total budget amount
   - Categorized allocations
   - Expense tracking

5. **Invoice/Quotation**
   - Client reference
   - Line items
   - Tax and total calculations
   - Status tracking

6. **Guest**
   - Contact information
   - RSVP status
   - Meal preferences
   - Family grouping
   - Table assignment

7. **Seating Chart**
   - Tables with positions and dimensions
   - Guest assignments

8. **Design Suggestion**
   - Color schemes
   - Decor ideas
   - Visualizations

9. **Meal Plan**
   - Menu items
   - Dietary information
   - Cost estimates
   - Seasonality and region data

## Key Components

### Authentication Components
- **AuthContext**: Manages user authentication state
- **Login/Signup**: User authentication forms
- **ProtectedRoute**: Route guard for authenticated pages

### Layout Components
- **Layout**: Main application layout with sidebar and header
- **Sidebar**: Navigation menu
- **Header**: Top navigation bar with user menu

### Client Management
- **ClientList**: Displays all clients
- **ClientDetails**: Shows detailed client information
- **AddClientForm**: Form for adding new clients

### Task Management
- **TaskList**: Displays tasks in list view
- **TaskTimeline**: Shows tasks in calendar view
- **TaskCard**: Individual task display
- **AddTaskDialog**: Form for creating new tasks

### Budget Management
- **BudgetOverview**: Summary of budget allocation
- **BudgetCategoryList**: Breakdown by category
- **ExpenseTracker**: Tracks expenses against budget

### Invoice and Quotation
- **InvoiceList**: Displays all invoices
- **InvoiceForm**: Creates new invoices
- **InvoicePreview**: Displays invoice for review
- **QuotationList/Form/Preview**: Similar components for quotations

### Guest Management
- **GuestList**: Displays all guests
- **GuestForm**: Adds/edits guest information
- **ImportGuests**: Imports guests from Excel

### Seating Chart
- **SeatingChartDesigner**: Main seating chart interface
- **TableComponent**: Represents a table in the seating chart
- **GuestAssignment**: Interface for assigning guests to tables

### AI Features
- **DesignSuggestions**: Interface for generating design ideas
- **ColorPalette**: Displays generated color schemes
- **MealPlanningTool**: Interface for generating meal suggestions

## Services

### aiService.ts
The AI service handles interactions with OpenAI and Deepseek APIs for:
- Generating color schemes based on wedding themes
- Creating decor ideas for different categories
- Suggesting meal options based on preferences and dietary restrictions

### Database Integration
- **Supabase Client**: Connects to the Supabase backend
- **Row-Level Security**: Ensures users only access their own data
- **Real-time Updates**: Syncs data changes in real-time

## Internationalization

The application supports both English and French languages with:
- Translation files in JSON format
- Language detection based on browser settings
- Manual language switching
- Translations for all UI elements

## Subscription Plans

The application offers three subscription tiers:
- **Free**: Basic client and task management
- **Starter**: Adds invoicing and budget features
- **Pro**: Includes all features (AI suggestions, meal planning, seating chart)

## Detailed Component Breakdown

### Authentication Flow

1. **Login Process**:
   - User enters email and password
   - `AuthContext.signIn()` calls Supabase authentication
   - On success, user data is stored in context
   - User is redirected to dashboard

2. **Signup Process**:
   - User enters email, password, and profile information
   - `AuthContext.signUp()` registers user with Supabase
   - A profile record is created in the database
   - Email verification may be required depending on settings

3. **Session Management**:
   - `AuthContext` listens for auth state changes
   - Sessions are persisted in local storage
   - Auto-refresh of tokens is handled by Supabase client

### Data Flow

1. **Client Creation**:
   - User fills out client form
   - Data is validated client-side
   - `AppContext.addClient()` sends data to Supabase
   - Real-time subscription updates the UI

2. **Task Management**:
   - Tasks are associated with clients
   - Drag-and-drop interface for status changes
   - Calendar view shows tasks by due date
   - Filtering by status, priority, and category

3. **Budget Calculations**:
   - Budget is calculated based on vendor costs
   - Paid and unpaid amounts are tracked separately
   - Visual indicators show budget health

### AI Integration

1. **Design Suggestions**:
   - User enters theme, season, and preferences
   - Request is sent to OpenAI or Deepseek API
   - Response is parsed and displayed as color schemes and decor ideas
   - Fallback to mock data if API is unavailable

2. **Meal Planning**:
   - Collects dietary restrictions and preferences
   - Generates complete menus with multiple courses
   - Each dish includes dietary information and cost estimates
   - Users can regenerate individual dishes

## Database Schema

The application uses Supabase (PostgreSQL) with the following key tables:

### User-Related Tables
- **auth.users**: Managed by Supabase Auth
- **profiles**: Extends auth.users with additional user information
  - Contains company profile information (name, address, logo, etc.)

### Client Management
- **clients**: Stores client information
  - Fields: id, user_id, name, partner_name, email, phone, wedding_date, venue, notes, status
- **vendors**: Stores vendor information for each client
  - Fields: id, user_id, client_id, name, category, contact_name, email, phone, website, notes, cost, is_paid

### Task Management
- **tasks**: Stores tasks for each client
  - Fields: id, user_id, client_id, title, description, due_date, status, priority, category

### Financial Management
- **budgets**: Stores budget information for each client
  - Fields: id, user_id, client_id, total_budget
- **budget_categories**: Stores budget allocations by category
  - Fields: id, budget_id, category, allocated, spent
- **invoices**: Stores invoice information
  - Fields: id, user_id, client_id, number, issue_date, due_date, status, subtotal, tax, total, notes
- **invoice_items**: Stores line items for invoices
  - Fields: id, invoice_id, description, quantity, unit_price, total
- **quotations**: Similar structure to invoices
- **quotation_items**: Similar structure to invoice_items

### Guest Management
- **guests**: Stores guest information
  - Fields: id, user_id, client_id, first_name, last_name, email, phone, address, status, meal_preference, is_couple, partner_first_name, partner_last_name, has_children, children, table_id
- **tables**: Stores table information for seating charts
  - Fields: id, user_id, client_id, name, shape, width, height, position_x, position_y, capacity, rotation
- **seating_charts**: Stores seating chart layouts
  - Fields: id, user_id, client_id, name, width, height

### AI Features
- **design_suggestions**: Stores design suggestions
  - Fields: id, user_id, client_id, name, theme, season, preferences
- **color_schemes**: Stores color schemes for design suggestions
  - Fields: id, suggestion_id, name, type, hex_value
- **decor_ideas**: Stores decor ideas for design suggestions
  - Fields: id, suggestion_id, category, description, image_url
- **meal_plans**: Stores meal plans
  - Fields: id, user_id, client_id, name, event_date, meal_type, guest_count, budget_per_person, location, season, cultural_requirements, preferences, notes
- **meal_items**: Stores individual dishes in meal plans
  - Fields: id, meal_plan_id, name, description, course, dietary flags, estimated_cost_per_person, image_url, seasonality, region

### Subscription Management
- **subscriptions**: Stores subscription information
  - Fields: id, user_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end

## File Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/               # Base UI components from shadcn
│   ├── Layout.tsx        # Main layout component
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── tasks/            # Task-related components
│   ├── clients/          # Client-related components
│   ├── vendors/          # Vendor-related components
│   ├── invoices/         # Invoice-related components
│   ├── guests/           # Guest management components
│   ├── seating/          # Seating chart components
│   └── meal-planning/    # Meal planning components
├── context/              # React context providers
│   ├── AuthContext.tsx   # Authentication context
│   ├── AppContext.tsx    # Main application state
│   └── meal-planning-operations.ts # Meal planning operations
├── hooks/                # Custom React hooks
├── integrations/         # External service integrations
│   └── supabase/         # Supabase integration
├── lib/                  # Utility functions
├── locales/              # Internationalization files
│   ├── en/               # English translations
│   └── fr/               # French translations
├── pages/                # Page components
│   ├── auth/             # Authentication pages
│   ├── Dashboard.tsx     # Dashboard page
│   ├── Clients.tsx       # Clients list page
│   ├── ClientDetails.tsx # Client details page
│   ├── Tasks.tsx         # Tasks page
│   ├── Invoices.tsx      # Invoices page
│   ├── Settings.tsx      # Settings page
│   └── ...               # Other pages
├── services/             # Service modules
│   ├── aiService.ts      # AI service for OpenAI/Deepseek
│   └── ...               # Other services
├── types/                # TypeScript type definitions
│   ├── index.ts          # Main type definitions
│   └── auth.ts           # Auth-related types
├── utils/                # Helper functions
├── App.tsx               # Main App component
├── main.tsx              # Application entry point
├── routes.tsx            # Route definitions
└── i18n.ts               # i18n configuration
```

## AI Service Implementation

The `aiService.ts` file is a core component that handles all AI-related functionality in the application. It provides the following key features:

### Color Scheme Generation
- Function: `generateColorSchemes()`
- Parameters: theme, season, preferences
- Returns: Array of color palettes with primary, accent, and neutral colors
- Uses OpenAI's GPT-4 model with a specialized prompt
- Falls back to mock data if API is unavailable

### Decor Ideas Generation
- Function: `generateDecorIdeas()`
- Parameters: theme, season, preferences, budget, culture, category
- Returns: Array of decor ideas with descriptions
- Categories include centerpieces, backdrops, and lighting
- Uses OpenAI's GPT-4 model with category-specific prompts
- Falls back to mock data if API is unavailable

### Meal Suggestion Generation
- Function: `generateMealSuggestions()`
- Parameters: mealType, guestCount, season, location, budgetPerPerson, culturalRequirements, dietaryRestrictions, preferences, notes
- Returns: Array of meal items with detailed information
- Primary API: OpenAI GPT-4
- Fallback API: Deepseek
- Includes cache-busting mechanisms to ensure unique responses
- Detailed logging for debugging purposes

### Single Meal Item Regeneration
- Function: `regenerateSingleMealItem()`
- Allows replacing a specific dish while maintaining the overall menu theme
- Ensures dietary restrictions are respected
- Uses the same API fallback mechanism as the main meal generation

## User Interface Components

### Dashboard
- Shows upcoming weddings
- Displays task summaries
- Provides budget overview
- Quick access to recent clients

### Client Management
- Client list with search and filter
- Detailed client view with tabs for different sections:
  - Overview
  - Vendors
  - Tasks
  - Budget
  - Guests
  - Seating
  - Design
  - Meals
  - Invoices/Quotations

### Seating Chart Designer
- Canvas with zoom and pan controls
- Table management (add, edit, delete, rotate)
- Guest assignment interface
- Table shapes: round, rectangular, square, custom
- Drag-and-drop functionality

### Meal Planning Interface
- Form for collecting preferences and requirements
- Generated menu display with course sections
- Dietary information indicators
- Regeneration controls for individual dishes
- Cost summary

### Settings
- Company profile management
- Logo upload
- Subscription management
- Language preferences

## Security Implementation

- Row-Level Security (RLS) in Supabase ensures users can only access their own data
- Each table has policies for SELECT, INSERT, UPDATE, and DELETE operations
- Authentication tokens are securely managed by Supabase Auth
- API keys for OpenAI and Deepseek are stored in environment variables

## Performance Considerations

- Optimized database queries with proper indexes
- Lazy loading of components and data
- Background fetching of profile data after initial render
- Caching of frequently accessed data
- Debounced search inputs
- Virtualized lists for large data sets

## Conclusion

Knot To It is a comprehensive wedding planner CRM that combines traditional CRM functionality with specialized features for the wedding planning industry. The application is built with modern web technologies and follows best practices for performance, security, and user experience.

Key strengths of the application include:

1. **Industry-Specific Focus**: Designed specifically for wedding planners with features tailored to their unique needs.

2. **Comprehensive Client Management**: From initial contact to post-wedding follow-up, the application provides tools for every stage of the client relationship.

3. **AI-Powered Features**: Integration with AI services provides creative suggestions for design and meal planning, saving time and enhancing the planning process.

4. **Visual Planning Tools**: The seating chart designer and other visual tools make complex planning tasks more intuitive.

5. **Multi-Language Support**: French and English localization makes the application accessible to a wider audience.

6. **Scalable Architecture**: The application is built on a scalable architecture that can grow with the business, from free tier to professional usage.

7. **Secure Data Management**: Row-level security ensures that each user's data is protected and isolated.

The modular design of the application allows for future expansion with additional features and integrations, making it a valuable tool for wedding planners looking to streamline their business operations and provide better service to their clients.
