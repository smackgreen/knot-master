
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import AddClient from "./pages/AddClient";
import Vendors from "./pages/Vendors";
import Tasks from "./pages/Tasks";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import IntakeForm from "./pages/IntakeForm";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import DesignSuggestions from "./pages/DesignSuggestions";
import Signatures from "./pages/Signatures";
import SignDocument from "./pages/SignDocument";
import Pricing from "./pages/Pricing";
import AccountSubscription from "./pages/AccountSubscription";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <AppProvider>
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/intake-form" element={<IntakeForm />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/sign/:token" element={<SignDocument />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Root path redirect */}
              <Route index element={<Navigate to="/login" replace />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="app" element={<Layout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/:id" element={<ClientDetails />} />
                  <Route path="clients/add" element={<AddClient />} />
                  <Route path="clients/:clientId/design-suggestions" element={<DesignSuggestions />} />
                  <Route path="vendors" element={<Vendors />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="signatures" element={<Signatures />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="account/subscription" element={<AccountSubscription />} />
                </Route>
              </Route>

              {/* Admin-only routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route path="admin" element={<Layout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AppProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
