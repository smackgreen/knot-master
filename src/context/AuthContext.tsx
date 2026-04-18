
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';
import { ExtendedUser, UserProfile } from "@/types/auth";
import { shouldRedirectForEvent, resetInitialSignIn } from "@/utils/authEvents";

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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId);

      // Only select the specific fields we need instead of '*'
      // This significantly reduces the data size being transferred
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          profile_image,
          created_at,
          company_name,
          company_address,
          company_city,
          company_phone,
          company_email,
          company_website,
          company_logo,
          company_description
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      if (data) {
        // Map database fields to our UserProfile type
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          profileImage: data.profile_image,
          created_at: data.created_at,
          // Company profile fields
          companyName: data.company_name,
          companyAddress: data.company_address,
          companyCity: data.company_city,
          companyPhone: data.company_phone,
          companyEmail: data.company_email,
          companyWebsite: data.company_website,
          companyLogo: data.company_logo,
          companyDescription: data.company_description
        } as UserProfile;
      }

      // If no profile exists, create one
      if (!data) {
        const authUserResponse = await supabase.auth.getUser();
        if (authUserResponse.error) throw authUserResponse.error;

        const authUser = authUserResponse.data.user;
        if (!authUser) return null;

        // Create a new profile with minimal data
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || '',
            profile_image: authUser.user_metadata?.avatar_url
          })
          .select(`
            id,
            name,
            email,
            profile_image,
            created_at,
            company_name,
            company_address,
            company_city,
            company_phone,
            company_email,
            company_website,
            company_logo,
            company_description
          `)
          .single();

        if (insertError) throw insertError;

        return {
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          profileImage: newProfile.profile_image,
          created_at: newProfile.created_at,
          // Company profile fields
          companyName: newProfile.company_name,
          companyAddress: newProfile.company_address,
          companyCity: newProfile.company_city,
          companyPhone: newProfile.company_phone,
          companyEmail: newProfile.company_email,
          companyWebsite: newProfile.company_website,
          companyLogo: newProfile.company_logo,
          companyDescription: newProfile.company_description
        } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const mergeUserWithProfile = async (authUser: any) => {
    if (!authUser) return null;

    const profileData = await fetchUserProfile(authUser.id);

    const extendedUser: ExtendedUser = {
      ...authUser,
      name: profileData?.name || authUser.user_metadata?.full_name || '',
      email: authUser.email || profileData?.email || '',
      profileImage: profileData?.profileImage || authUser.user_metadata?.avatar_url || null,
      created_at: authUser.created_at,
      // Company profile fields
      companyName: profileData?.companyName || '',
      companyAddress: profileData?.companyAddress || '',
      companyCity: profileData?.companyCity || '',
      companyPhone: profileData?.companyPhone || '',
      companyEmail: profileData?.companyEmail || '',
      companyWebsite: profileData?.companyWebsite || '',
      companyLogo: profileData?.companyLogo || '',
      companyDescription: profileData?.companyDescription || ''
    };

    return extendedUser;
  };

  // Use a ref to prevent duplicate profile fetches
  const isProfileFetchingRef = useRef(false);

  // Idempotently ensure every new/verified user has a complimentary 3-month Pro
  // subscription. Safe to call on every SIGNED_IN event - it does nothing if a
  // subscription row already exists for the user.
  const ensureProSubscription = async (userId: string) => {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing subscription:', checkError);
        return;
      }
      if (existing) return;

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 3);

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'pro',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          billing_cycle: 'monthly',
        });

      if (insertError) {
        console.error('Error creating complimentary Pro subscription:', insertError);
      }
    } catch (err) {
      console.error('Unexpected error provisioning subscription:', err);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");

    setIsLoading(true);

    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);

        // Update session state immediately
        setSession(currentSession);

        if (currentSession?.user) {
          console.log("User authenticated:", currentSession.user.id);
          // Set user immediately with available data
          const basicUser = {
            ...currentSession.user,
            name: currentSession.user.user_metadata?.full_name || '',
            email: currentSession.user.email || '',
            profileImage: currentSession.user.user_metadata?.avatar_url
          };

          setUser(basicUser);

          // Set loading to false immediately after setting basic user data
          // This allows the dashboard to render with basic user info
          setIsLoading(false);

          // Then fetch profile data asynchronously in the background
          // without blocking the UI
          setTimeout(async () => {
            // Prevent duplicate profile fetches
            if (isProfileFetchingRef.current) return;
            isProfileFetchingRef.current = true;

            try {
              const extendedUser = await mergeUserWithProfile(currentSession.user);
              setUser(extendedUser);

              // Provision the complimentary Pro subscription on the first
              // authenticated session. This covers both the "no email
              // confirmation" path (fires right after signUp) and the
              // "email confirmation required" path (fires when the user
              // clicks the verification link and the session becomes active).
              if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
                void ensureProSubscription(currentSession.user.id);
              }

              // We no longer handle redirects here - components will handle their own redirects
              if (shouldRedirectForEvent(event)) {
                console.log(`${event} event would normally trigger redirect to dashboard`);
                // No longer using navigate here
              } else {
                console.log(`${event} event did not trigger redirect`);
              }
            } catch (error) {
              console.error("Error fetching extended user profile:", error);
            } finally {
              // Authentication process is complete
              setIsAuthenticating(false);
              isProfileFetchingRef.current = false;
            }
          }, 0);
        } else {
          setUser(null);
          if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            resetInitialSignIn(); // Reset the initial sign-in flag
            // No longer using navigate here
          }

          // Authentication process is complete
          setIsAuthenticating(false);
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession?.user?.id);

      setSession(currentSession);

      if (currentSession?.user) {
        console.log("User has existing session:", currentSession.user.id);
        // Set user immediately with available data
        const basicUser = {
          ...currentSession.user,
          name: currentSession.user.user_metadata?.full_name || '',
          email: currentSession.user.email || '',
          profileImage: currentSession.user.user_metadata?.avatar_url
        };

        setUser(basicUser);
        // Set loading to false immediately to show the dashboard
        setIsLoading(false);

        // Then fetch full profile asynchronously in the background
        setTimeout(async () => {
          // Prevent duplicate profile fetches
          if (isProfileFetchingRef.current) return;
          isProfileFetchingRef.current = true;

          try {
            const extendedUser = await mergeUserWithProfile(currentSession.user);
            setUser(extendedUser);
          } catch (error) {
            console.error("Error fetching extended user profile:", error);
          } finally {
            isProfileFetchingRef.current = false;
          }
        }, 0);
      } else {
        console.log("No existing session found");
        setUser(null);
        setIsLoading(false);
      }
    }).catch(error => {
      console.error("Error checking session:", error);
      setIsLoading(false);
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  // Google login method removed

  // Login with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsAuthenticating(true);
      console.log("Initiating email login for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        // Set user and session immediately
        setUser({
          ...data.user,
          name: data.user.user_metadata?.full_name || '',
          email: data.user.email || '',
          profileImage: data.user.user_metadata?.avatar_url
        });
        setSession(data.session);

        // Show success message
        toast({
          title: "Logged in successfully",
          description: `Welcome back, ${data.user.email}!`,
        });

        // No longer redirecting here - components will handle redirects
        return { success: true };
      }
    } catch (error: any) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "There was a problem signing you in. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setIsAuthenticating(true);
      console.log("Initiating email signup for:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: metadata || {}
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        if (data.session) {
          // User is signed in immediately
          setUser({
            ...data.user,
            name: data.user.user_metadata?.full_name || '',
            email: data.user.email || '',
            profileImage: data.user.user_metadata?.avatar_url
          });
          setSession(data.session);

          // Create a profile record
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || '',
            profile_image: data.user.user_metadata?.avatar_url,
          });

          if (profileError) {
            console.error("Error creating profile:", profileError);
          }

          // Provision the complimentary 3-month Pro subscription. The
          // onAuthStateChange listener will also call this idempotently,
          // which covers the email-confirmation flow where `data.session`
          // is null here.
          await ensureProSubscription(data.user.id);

          // Show success message
          toast({
            title: "Account created successfully",
            description: "You are now logged in.",
          });

          // No longer redirecting here - components will handle redirects
          return { success: true, requiresEmailConfirmation: false };
        } else {
          // Email confirmation required
          toast({
            title: "Verification email sent",
            description: "Please check your email to confirm your account.",
          });
          return { success: true, requiresEmailConfirmation: true };
        }
      }
      return { success: false };
    } catch (error: any) {
      console.error("Email signup error:", error);
      toast({
        title: "Signup failed",
        description: error.message || "There was a problem creating your account. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Demo login method removed

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Reset the initial sign-in flag before signing out
      resetInitialSignIn();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);

      toast({
        title: "Logged out successfully",
      });

      // No longer redirecting here - components will handle redirects
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    console.log("updateUserProfile called with data:", data);
    setIsLoading(true);
    try {
      // Update user metadata if name is provided
      if (data.name) {
        await supabase.auth.updateUser({
          data: { full_name: data.name }
        });
      }

      // Prepare profile data for upsert
      const profileData: any = {
        id: user.id,
        email: user.email
      };

      // Only include fields that are provided or already exist
      if (data.name !== undefined) profileData.name = data.name;
      if (data.profileImage !== undefined) profileData.profile_image = data.profileImage;

      // Company profile fields
      if (data.companyName !== undefined) profileData.company_name = data.companyName;
      if (data.companyAddress !== undefined) profileData.company_address = data.companyAddress;
      if (data.companyCity !== undefined) profileData.company_city = data.companyCity;
      if (data.companyPhone !== undefined) profileData.company_phone = data.companyPhone;
      if (data.companyEmail !== undefined) profileData.company_email = data.companyEmail;
      if (data.companyWebsite !== undefined) profileData.company_website = data.companyWebsite;
      if (data.companyDescription !== undefined) profileData.company_description = data.companyDescription;

      // Handle company logo the same way as profile image
      if (data.companyLogo !== undefined) {
        console.log("Setting company_logo in profileData");
        profileData.company_logo = data.companyLogo;
      }

      console.log("Upserting profile data:", profileData);

      // Upsert profile data
      const { error, data: upsertData } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select(`
          id,
          name,
          email,
          profile_image,
          created_at,
          company_name,
          company_address,
          company_city,
          company_phone,
          company_email,
          company_website,
          company_logo,
          company_description
        `);

      console.log("Upsert response:", { error, data: upsertData });

      if (error) throw error;

      // Update local user state
      setUser(prev => {
        if (!prev) return null;

        console.log("Updating user state with:", data);

        // Create a new user object with the updated data
        const updatedUser = { ...prev };

        // Update company profile fields
        if (data.companyName !== undefined) updatedUser.companyName = data.companyName;
        if (data.companyAddress !== undefined) updatedUser.companyAddress = data.companyAddress;
        if (data.companyCity !== undefined) updatedUser.companyCity = data.companyCity;
        if (data.companyPhone !== undefined) updatedUser.companyPhone = data.companyPhone;
        if (data.companyEmail !== undefined) updatedUser.companyEmail = data.companyEmail;
        if (data.companyWebsite !== undefined) updatedUser.companyWebsite = data.companyWebsite;
        if (data.companyDescription !== undefined) updatedUser.companyDescription = data.companyDescription;

        // Special handling for logo to ensure it's properly updated - same as profile image
        if (data.companyLogo !== undefined) {
          console.log("Updating company logo in user state");
          updatedUser.companyLogo = data.companyLogo;
        }

        console.log("Updated user state:", updatedUser);

        return updatedUser;
      });

      // Fetch the updated profile to ensure we have the latest data
      const updatedProfile = await fetchUserProfile(user.id);
      if (updatedProfile) {
        console.log("Fetched updated profile:", updatedProfile);

        // Create a new user object with the updated profile data
        const mappedProfile = {
          ...user,
          companyName: updatedProfile.companyName,
          companyAddress: updatedProfile.companyAddress,
          companyCity: updatedProfile.companyCity,
          companyPhone: updatedProfile.companyPhone,
          companyEmail: updatedProfile.companyEmail,
          companyWebsite: updatedProfile.companyWebsite,
          companyLogo: updatedProfile.companyLogo,
          companyDescription: updatedProfile.companyDescription
        };

        console.log("Setting user state with mapped profile:", mappedProfile);

        // Set the user state directly with the new object
        setUser(mappedProfile);
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Profile update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password (forgot password)
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  // Update password with token
  const updatePassword = async (token: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Update password error:", error);
      throw error;
    }
  };

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
