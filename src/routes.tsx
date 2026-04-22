import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import AddClient from './pages/AddClient';
import Tasks from './pages/Tasks';
import WeddingTasks from './pages/WeddingTasks';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import NotFound from './pages/NotFound';
import IntakeForm from './pages/IntakeForm';
import Vendors from './pages/Vendors';
import Invoices from './pages/Invoices';
import Contracts from './pages/Contracts';
import ContractDetails from './pages/ContractDetails';
import ContractTemplates from './pages/ContractTemplates';
import Documents from './pages/Documents';
import DocumentDetails from './pages/DocumentDetails';
import Signatures from './pages/Signatures';
import SignDocument from './pages/SignDocument';
import SignatureSuccess from './pages/SignatureSuccess';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Resources from './pages/Resources';
import GoogleCalendarCallback from './pages/auth/GoogleCalendarCallback';
import AuthCallback from './pages/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

// Marketing pages
import HomePage from './pages/marketing/HomePage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import NewIndex from './pages/NewIndex';

// Account pages
import AccountPage from './pages/account/AccountPage';

// Marketing layout
import MarketingLayout from './components/MarketingLayout';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

// Root layout with providers
const RootLayout = () => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppProvider>
          <Outlet />
        </AppProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

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
            element: <NewIndex />,
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
      {
        path: '/signup',
        element: (
          <PublicRoute>
            <Signup />
          </PublicRoute>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        ),
      },
      {
        path: '/auth/google-calendar-callback',
        element: (
          <ProtectedRoute>
            <GoogleCalendarCallback />
          </ProtectedRoute>
        ),
      },
      {
        path: '/auth/callback',
        element: <AuthCallback />,
      },

      // Electronic signature routes (public)
      {
        path: '/sign/:token',
        element: <SignDocument />,
      },
      {
        path: '/signature-success',
        element: <SignatureSuccess />,
      },

      // Account routes (protected)
      {
        path: '/account',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/account/subscription',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/account/settings',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },

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
          {
            path: 'clients',
            element: <Clients />,
          },
          {
            path: 'clients/add',
            element: <AddClient />,
          },
          {
            path: 'clients/:id',
            element: <ClientDetails />,
          },
          {
            path: 'vendors',
            element: <Vendors />,
          },
          {
            path: 'tasks',
            element: <Tasks />,
          },
          {
            path: 'tasks/wedding/:clientId',
            element: <WeddingTasks />,
          },
          {
            path: 'calendar',
            element: <Calendar />,
          },
          {
            path: 'invoices',
            element: <Invoices />,
          },
          {
            path: 'contracts',
            element: <Contracts />,
          },
          {
            path: 'contracts/:id',
            element: <ContractDetails />,
          },
          {
            path: 'contract-templates',
            element: <ContractTemplates />,
          },
          {
            path: 'documents',
            element: <Documents />,
          },
          {
            path: 'documents/:id',
            element: <DocumentDetails />,
          },
          {
            path: 'signatures',
            element: <Signatures />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
          {
            path: 'intake-form',
            element: <IntakeForm />,
          },
          {
            path: 'profile',
            element: <Profile />,
          },
          {
            path: 'analytics',
            element: <Analytics />,
          },
          {
            path: 'resources',
            element: <Resources />,
          },
        ],
      },

      // Fallback routes
      {
        path: '/index',
        element: <Navigate to="/" replace />,
      },
      {
        path: '*',
        element: <NotFound />,
      }
    ]
  }
]);

export default router;
