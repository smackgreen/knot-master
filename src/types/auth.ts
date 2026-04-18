
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  profileImage?: string;
  created_at?: string;
  // Company profile information
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;
  companyDescription?: string;
}

export type ExtendedUser = SupabaseUser & UserProfile;
