/**
 * Utility for role-based dashboard redirects.
 * Checks the user's role from the profiles table and returns
 * the appropriate dashboard path.
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Get the default dashboard path for a user based on their role.
 * Queries the profiles table to check if the user is an admin.
 * Returns '/admin/dashboard' for admins, '/app/dashboard' otherwise.
 */
export const getDashboardPath = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user role for redirect:', error);
      return '/app/dashboard';
    }

    return data?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard';
  } catch (err) {
    console.error('Unexpected error checking user role:', err);
    return '/app/dashboard';
  }
};

/**
 * Synchronous check — use when the user object with role is already available.
 * Returns '/admin/dashboard' for admins, '/app/dashboard' otherwise.
 */
export const getDefaultDashboard = (user?: { role?: string | null } | null): string => {
  return user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard';
};
