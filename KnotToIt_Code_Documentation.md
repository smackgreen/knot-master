# Knot To It - Code Documentation

## Table of Contents

1. [Project Structure](#project-structure)
2. [Entry Points](#entry-points)
3. [Routing](#routing)
4. [Context Providers](#context-providers)
5. [Components](#components)
6. [Pages](#pages)
7. [Services](#services)
8. [Integrations](#integrations)
9. [Types](#types)
10. [Utilities](#utilities)
11. [Internationalization](#internationalization)

## Project Structure

The Knot To It Wedding Planner CRM is a React application built with TypeScript, Vite, and Supabase. The project follows a modular structure with clear separation of concerns:

```
src/
├── components/           # Reusable UI components
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── integrations/         # External service integrations
├── lib/                  # Utility functions
├── locales/              # Internationalization files
├── pages/                # Page components
├── services/             # Service modules
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
├── App.tsx               # Main App component
├── main.tsx              # Application entry point
├── routes.tsx            # Route definitions
└── i18n.ts               # i18n configuration
```

## Entry Points

### main.tsx

The main entry point of the application that renders the root component.

```typescript
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import router from './routes.tsx'
import './index.css'
// Import i18n configuration
import './i18n';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);
```

This file:
- Creates a React Query client for data fetching
- Sets up UI providers (TooltipProvider, Toaster)
- Renders the router with the RouterProvider
- Imports the i18n configuration for internationalization

### App.tsx

The main application component that defines the routing structure.

```typescript
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/intake-form" element={<IntakeForm />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Root path redirect */}
              <Route index element={<Navigate to="/login" replace />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/:id" element={<ClientDetails />} />
                  <Route path="clients/add" element={<AddClient />} />
                  <Route path="clients/:clientId/design-suggestions" element={<DesignSuggestions />} />
                  <Route path="vendors" element={<Vendors />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

This file:
- Sets up the application providers (Auth, App)
- Defines public and protected routes
- Uses the ProtectedRoute component to guard authenticated routes
- Wraps authenticated routes in the Layout component

## Routing

### routes.tsx

Defines the application's routing structure using React Router.

```typescript
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
// ... other imports

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Marketing routes
      {
        path: '/',
        element: <MarketingLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'features',
            element: <FeaturesPage />,
          },
          {
            path: 'pricing',
            element: <PricingPage />,
          },
        ],
      },

      // Auth routes
      {
        path: '/login',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      // ... other auth routes

      // App routes (protected)
      {
        path: '/app',
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          // ... other app routes
        ],
      },
    ],
  },
]);

export default router;
```

This file:
- Creates a browser router with nested routes
- Defines marketing, auth, and app routes
- Uses layout components to wrap different sections
- Protects routes that require authentication

## Context Providers

### AuthContext.tsx

Manages authentication state and provides authentication-related functions.

```typescript
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';
import { ExtendedUser, UserProfile } from "@/types/auth";

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Functions for authentication
  const signIn = async (email: string, password: string) => {/* ... */};
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {/* ... */};
  const signOut = async () => {/* ... */};
  const resetPassword = async (email: string) => {/* ... */};
  const updatePassword = async (token: string, newPassword: string) => {/* ... */};
  const updateUserProfile = async (data: Partial<UserProfile>) => {/* ... */};

  // Effect to set up auth state listener
  useEffect(() => {/* ... */}, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isAuthenticating,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

This context:
- Manages user authentication state
- Provides functions for sign in, sign up, sign out
- Handles password reset and update
- Manages user profile data
- Uses Supabase for authentication
- Provides a custom hook (useAuth) for accessing auth state

### AppContext.tsx

Manages application state and provides data operations.

```typescript
import { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import {
  Client, Vendor, Task, Budget, Invoice, Quotation, Guest, GuestStatus,
  Table, SeatingChart, TableShape, DesignSuggestion, ColorScheme, DecorIdea,
  VisualizationProject, MealPlan, MealItem, MealType, CourseType
} from '../types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import {
  addMealPlan as addMealPlanOperation,
  updateMealPlan as updateMealPlanOperation,
  deleteMealPlan as deleteMealPlanOperation,
  addMealItem as addMealItemOperation,
  updateMealItem as updateMealItemOperation,
  deleteMealItem as deleteMealItemOperation,
  fetchMealPlans,
  fetchMealItems
} from './meal-planning-operations';

interface AppContextType {
  clients: Client[];
  vendors: Vendor[];
  tasks: Task[];
  budgets: Budget[];
  invoices: Invoice[];
  quotations: Quotation[];
  guests: Guest[];
  tables: Table[];
  seatingCharts: SeatingChart[];
  designSuggestions: DesignSuggestion[];
  mealPlans: MealPlan[];
  isLoading: boolean;
  // Getter functions
  getClientById: (id: string) => Client | undefined;
  getVendorsByClientId: (clientId: string) => Vendor[];
  getTasksByClientId: (clientId: string) => Task[];
  // ... other getter functions
  // CRUD operations
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  // ... other CRUD operations
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  // ... other state variables

  // Effect to fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchClients();
      fetchVendors();
      fetchTasks();
      // ... fetch other data
    }
  }, [user]);

  // Getter functions
  const getClientById = (id: string) => clients.find(client => client.id === id);
  const getVendorsByClientId = (clientId: string) => vendors.filter(vendor => vendor.clientId === clientId);
  // ... other getter functions

  // CRUD operations
  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {/* ... */};
  const updateClient = async (id: string, client: Partial<Client>) => {/* ... */};
  const deleteClient = async (id: string) => {/* ... */};
  // ... other CRUD operations

  return (
    <AppContext.Provider value={{
      clients,
      vendors,
      tasks,
      // ... other state variables
      isLoading,
      // Getter functions
      getClientById,
      getVendorsByClientId,
      getTasksByClientId,
      // ... other getter functions
      // CRUD operations
      addClient,
      updateClient,
      deleteClient,
      // ... other CRUD operations
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
```

This context:
- Manages application data (clients, vendors, tasks, etc.)
- Provides getter functions for retrieving data
- Provides CRUD operations for all data types
- Uses Supabase for data persistence
- Fetches data when the user changes
- Provides a custom hook (useApp) for accessing app state

## Components

### Layout Components

#### Layout.tsx

The main layout component that wraps authenticated pages.

```typescript
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
```

This component:
- Creates a two-column layout with a sidebar and main content area
- Includes the Header component at the top of the main content
- Uses React Router's Outlet to render the current route's component
- Handles overflow with scrolling in the main content area

#### Sidebar.tsx

The navigation sidebar component.

```typescript
import { NavLink } from "react-router-dom";
import {
  Users,
  Truck,
  CheckSquare,
  Settings,
  Calendar,
  HeartHandshake,
  FileText,
  Palette,
  DollarSign
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className="w-64 h-full bg-white border-r flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2 text-wedding-navy">
          <HeartHandshake className="text-wedding-blush" size={24} />
          <span>Knot To It</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('app.title')}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink to="/dashboard" className={({ isActive }) =>
          `flex items-center p-2 rounded-md ${isActive ? 'bg-wedding-ivory text-wedding-navy font-medium' : 'text-muted-foreground hover:bg-muted'}`
        }>
          <Calendar className="mr-2 h-5 w-5" />
          <span>{t('sidebar.dashboard')}</span>
        </NavLink>

        {/* Other navigation links */}
      </nav>
    </div>
  );
};

export default Sidebar;
```

This component:
- Renders the application logo and title
- Provides navigation links to different sections of the app
- Uses React Router's NavLink for active state styling
- Uses i18next for translation
- Includes icons from Lucide React

### Task Components

#### TaskCard.tsx

A card component for displaying a task.

```typescript
import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Tag, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Client, Task } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatDate, getTaskStatusInfo, getPriorityBadge } from "@/utils/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskCardProps {
  task: Task;
  clients: Client[];
  isDragging?: boolean;
  onEditTask?: (taskId: string) => void;
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, clients, isDragging, onEditTask }, ref) => {
    const { updateTask, deleteTask } = useApp();
    const client = clients.find(c => c.id === task.clientId);
    const { color, icon: StatusIcon } = getTaskStatusInfo(task.status);
    const priorityBadge = getPriorityBadge(task.priority);

    const handleComplete = async () => {
      await updateTask(task.id, { status: 'completed' });
    };

    const handleDelete = async () => {
      await deleteTask(task.id);
    };

    return (
      <div
        ref={ref}
        className={`bg-white rounded-lg border p-4 shadow-sm ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{task.title}</h3>
          <div className="flex gap-1">
            <StatusIcon className={`h-5 w-5 ${color}`} />
            {priorityBadge}
          </div>
        </div>

        {task.description && (
          <p className="text-muted-foreground text-sm mb-3">{task.description}</p>
        )}

        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Due: {formatDate(task.dueDate)}
            </span>
            {client && (
              <Link
                to={`/clients/${client.id}`}
                className="text-xs text-blue-600 hover:underline flex items-center"
              >
                <Users className="h-3 w-3 mr-1" />
                {client.name}
              </Link>
            )}
          </div>

          <div className="flex gap-1">
            {task.status !== 'completed' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleComplete}
                title="Mark as completed"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditTask?.(task.id)}
              title="Edit task"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete task">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    );
  }
);

TaskCard.displayName = "TaskCard";

export default TaskCard;
```

This component:
- Displays task information (title, description, due date, status, priority)
- Shows the associated client
- Provides buttons for completing, editing, and deleting tasks
- Uses a confirmation dialog for delete actions
- Supports drag-and-drop with the ref and isDragging props
- Uses the AppContext for task operations

## Services

### aiService.ts

Service for AI-powered features using OpenAI and Deepseek APIs.

```typescript
/**
 * AI Service for Design Suggestions and Meal Planning
 *
 * This service handles interactions with AI APIs (OpenAI or Deepseek)
 * for generating design suggestions, color schemes, decor ideas,
 * and meal planning suggestions.
 */

import { ColorScheme, ColorSchemeType, DecorIdea, MealItem, CourseType, MealType } from "@/types";

// API keys - in production, these should be stored securely
// and accessed via environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

// API URLs
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface ColorPalette {
  name: string;
  colors: {
    type: ColorSchemeType;
    hexValue: string;
  }[];
}

interface GenerateColorSchemesParams {
  theme?: string;
  season?: string;
  preferences?: string;
}

interface GenerateDecorIdeasParams {
  theme?: string;
  season?: string;
  preferences?: string;
  budget?: string;
  culture?: string;
  category: string; // 'centerpiece', 'backdrop', 'lighting'
}

/**
 * Generate color schemes based on wedding theme, season, and preferences
 */
export const generateColorSchemes = async (
  params: GenerateColorSchemesParams
): Promise<ColorPalette[]> => {
  const { theme, season, preferences } = params;

  if (!OPENAI_API_KEY) {
    // If no API key is available, return mock data
    return getMockColorSchemes(theme, season, preferences);
  }

  try {
    const prompt = `
      Generate 3 color palettes for a wedding with the following details:
      ${theme ? `Theme: ${theme}` : ''}
      ${season ? `Season: ${season}` : ''}
      ${preferences ? `Preferences: ${preferences}` : ''}

      For each palette, provide:
      1. A descriptive name for the palette
      2. 5-7 colors with their hex codes
      3. Label each color as "primary", "accent", or "neutral"

      Format the response as a JSON array of objects with this structure:
      [
        {
          "name": "Palette Name",
          "colors": [
            { "type": "primary", "hexValue": "#HEXCODE" },
            { "type": "accent", "hexValue": "#HEXCODE" },
            ...
          ]
        },
        ...
      ]
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a wedding design expert specializing in color theory and aesthetics."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return getMockColorSchemes(theme, season, preferences);
    }

    const content = data.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    return parsedContent.palettes || [];
  } catch (error) {
    console.error("Error generating color schemes:", error);
    return getMockColorSchemes(theme, season, preferences);
  }
};

// Other functions: generateDecorIdeas, generateMealSuggestions, regenerateSingleMealItem, etc.
```

This service:
- Provides functions for generating color schemes, decor ideas, and meal suggestions
- Uses OpenAI's GPT-4 model as the primary AI provider
- Falls back to Deepseek API when OpenAI is unavailable
- Includes fallback mock data for when no API keys are available
- Formats prompts with specific instructions for consistent AI responses
- Handles API errors and provides fallback mechanisms

## Integrations

### Supabase Integration

#### client.ts

Sets up the Supabase client for database and authentication.

```typescript
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables if available, otherwise fall back to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ocrjmlizddgjlcwxpqmq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcmptbGl6ZGRnamxjd3hwcW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTI1OTIsImV4cCI6MjA2MDQ4ODU5Mn0.SMff_WPT1XWLONUg-bNK1B7y5kQUYrHCP3LeKJqxKUA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create Supabase client with custom configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Increase the refresh margin to reduce frequency of refreshes
    flowType: 'implicit',
  },
});
```

This file:
- Creates a Supabase client with the provided URL and key
- Configures authentication options
- Exports the client for use throughout the application
- Uses TypeScript generics with the Database type for type safety

## Types

### index.ts

Defines the core data types used throughout the application.

```typescript
export interface Client {
  id: string;
  name: string;
  partnerName: string;
  email: string;
  phone: string;
  weddingDate: Date | string;
  venue: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date | string;
  budget?: Budget;
  vendors?: Vendor[];
  tasks?: Task[];
  guests?: Guest[];
  mealPlans?: MealPlan[];
}

export interface Vendor {
  id: string;
  clientId: string;
  name: string;
  category: VendorCategory;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  cost?: number;
  isPaid?: boolean;
}

export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'florist'
  | 'music'
  | 'cake'
  | 'attire'
  | 'hair_makeup'
  | 'transportation'
  | 'rentals'
  | 'stationery'
  | 'gifts'
  | 'other';

export interface Budget {
  id: string;
  clientId: string;
  totalBudget: number;
  spentSoFar: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  category: VendorCategory;
  allocated: number;
  spent: number;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  dueDate: Date | string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date | string;
  category?: VendorCategory;
}

// Additional types for invoices, guests, seating charts, meal planning, etc.
```

This file:
- Defines interfaces for all data entities in the application
- Uses TypeScript's type system for type safety
- Includes relationships between entities (e.g., clients have vendors, tasks, etc.)
- Defines enum-like types for categories, statuses, and priorities

### auth.ts

Defines authentication-related types.

```typescript
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  created_at?: string;
  // Company profile fields
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;
  companyDescription?: string;
}

export interface ExtendedUser extends User, UserProfile {}
```

This file:
- Extends Supabase's User type with additional profile information
- Defines the UserProfile interface for user profile data
- Includes company profile fields for wedding planners

## Internationalization

### i18n.ts

Configures internationalization for the application.

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';

// Configure i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'fr', // Default to French
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Don't enable returnObjects globally as it can cause issues with React rendering
    resources: {
      en: {
        common: enCommon,
      },
      fr: {
        common: frCommon,
      },
    },
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

This file:
- Configures i18next for internationalization
- Sets up language detection based on browser settings
- Loads translation files for English and French
- Configures caching and fallback language
- Exports the configured i18n instance

### Translation Usage Example

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('common.description')}</p>

      <div>
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('fr')}>Français</button>
      </div>
    </div>
  );
};
```

This example:
- Uses the useTranslation hook to access translation functions
- Translates text using the t function
- Provides buttons to change the language
- Accesses translations from the common namespace

## Pages

### Dashboard.tsx

The main dashboard page that displays an overview of the wedding planner's business.

```typescript
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, CheckSquare, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import UpcomingWeddings from "@/components/dashboard/UpcomingWeddings";
import TaskSummary from "@/components/dashboard/TaskSummary";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import RecentClients from "@/components/dashboard/RecentClients";

const Dashboard = () => {
  const { t } = useTranslation();
  const { clients, tasks, budgets } = useApp();
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate summary statistics
  const activeClients = clients.filter(client => client.status === 'active').length;
  const upcomingTasks = tasks.filter(task =>
    task.status !== 'completed' &&
    new Date(task.dueDate) > new Date()
  ).length;
  const overdueTasks = tasks.filter(task => task.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">{t('dashboard.title')}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.activeClients')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
          </CardContent>
        </Card>

        {/* Other summary cards */}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="weddings">{t('dashboard.weddings')}</TabsTrigger>
          <TabsTrigger value="tasks">{t('dashboard.tasks')}</TabsTrigger>
          <TabsTrigger value="budgets">{t('dashboard.budgets')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UpcomingWeddings limit={3} />
            <TaskSummary limit={5} />
          </div>
          <RecentClients limit={5} />
        </TabsContent>

        <TabsContent value="weddings">
          <UpcomingWeddings />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskSummary />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
```

This page:
- Displays summary statistics (active clients, upcoming tasks, etc.)
- Uses tabs to organize different sections of the dashboard
- Includes components for upcoming weddings, task summary, budget overview, and recent clients
- Uses the AppContext to access application data
- Uses i18next for translations

### Tasks.tsx

The tasks management page that displays and manages tasks.

```typescript
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { DropResult } from "react-beautiful-dnd";
import { Task } from "@/types";
import { toast } from "sonner";
import WeddingCountdown from "@/components/WeddingCountdown";
import TaskTimeline from "@/components/TaskTimeline";
import TaskHeader from "@/components/tasks/TaskHeader";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskListView from "@/components/tasks/TaskListView";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import EditTaskDialog from "@/components/tasks/EditTaskDialog";

const Tasks = () => {
  const { tasks, clients, updateTask } = useApp();
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    client: "all",
    category: "all",
  });

  // Get the task being edited
  const editingTask = editingTaskId
    ? tasks.find((task) => task.id === editingTaskId)
    : null;

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.client !== "all" && task.clientId !== filters.client) return false;
    if (filters.category !== "all" && task.category !== filters.category) return false;
    return true;
  });

  // Handle drag and drop for task status changes
  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStatus = destination.droppableId as Task["status"];
    const taskId = draggableId;

    try {
      await updateTask(taskId, { status: newStatus });
      toast.success("Task status updated");
    } catch (error) {
      toast.error("Failed to update task status");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <TaskHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddTaskClick={() => setIsAddTaskOpen(true)}
      />

      <TaskFilters
        filters={filters}
        setFilters={setFilters}
        clients={clients}
      />

      {viewMode === "list" ? (
        <TaskListView
          tasks={filteredTasks}
          clients={clients}
          onDragEnd={handleDragEnd}
          onEditTask={setEditingTaskId}
        />
      ) : (
        <TaskTimeline tasks={filteredTasks} clients={clients} />
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          open={!!editingTaskId}
          onOpenChange={(open) => {
            if (!open) setEditingTaskId(null);
          }}
          task={editingTask}
        />
      )}
    </div>
  );
};

export default Tasks;
```

This page:
- Displays tasks in either list or timeline view
- Provides filtering options for tasks
- Supports drag-and-drop for changing task status
- Includes dialogs for adding and editing tasks
- Uses the AppContext for task operations

## Conclusion

The Knot To It Wedding Planner CRM is a comprehensive application built with modern web technologies. The codebase is well-structured and follows best practices for React and TypeScript development.

### Key Code Features

1. **Component-Based Architecture**: The application is built with reusable components that follow the single responsibility principle.

2. **Context API for State Management**: The application uses React's Context API for global state management, with separate contexts for authentication and application data.

3. **TypeScript for Type Safety**: All components, functions, and data structures are typed with TypeScript, providing better developer experience and catching errors at compile time.

4. **Supabase Integration**: The application uses Supabase for authentication, database, and storage, with a well-defined API for interacting with the backend.

5. **AI Integration**: The application integrates with OpenAI and Deepseek APIs for AI-powered features, with fallback mechanisms for when APIs are unavailable.

6. **Internationalization**: The application supports multiple languages with i18next, making it accessible to a wider audience.

7. **Responsive Design**: The UI components are designed to work on various screen sizes, using Tailwind CSS for responsive layouts.

8. **Form Validation**: The application uses React Hook Form and Zod for form validation, ensuring data integrity.

9. **Error Handling**: The application includes comprehensive error handling, with user-friendly error messages and fallback mechanisms.

10. **Performance Optimization**: The code includes optimizations like memoization, lazy loading, and efficient data fetching to ensure good performance.

The codebase is designed to be maintainable and extensible, allowing for future enhancements and features to be added with minimal changes to existing code.
