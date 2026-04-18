/**
 * Utility to track authentication events and prevent unwanted redirects
 */

// Track the initial sign-in event
let initialSignInCompleted = false;

// Track the last authentication event time
let lastAuthEventTime = 0;

// Minimum time between redirects (in milliseconds)
const MIN_REDIRECT_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if this is the initial sign-in event
 */
export const isInitialSignIn = (): boolean => {
  if (!initialSignInCompleted) {
    initialSignInCompleted = true;
    return true;
  }
  return false;
};

/**
 * Reset the initial sign-in flag (used for logout)
 */
export const resetInitialSignIn = (): void => {
  initialSignInCompleted = false;
};

/**
 * Check if we should allow a redirect based on time since last redirect
 */
export const shouldAllowRedirect = (): boolean => {
  const now = Date.now();
  
  // If it's been long enough since the last redirect, allow it
  if (now - lastAuthEventTime > MIN_REDIRECT_INTERVAL) {
    lastAuthEventTime = now;
    return true;
  }
  
  return false;
};

/**
 * Determine if an auth event should trigger a redirect
 * @param event The auth event name
 */
export const shouldRedirectForEvent = (event: string): boolean => {
  // Always redirect for these events
  if (event === 'SIGNED_IN' && isInitialSignIn()) {
    lastAuthEventTime = Date.now();
    return true;
  }
  
  if (event === 'SIGNED_OUT') {
    lastAuthEventTime = Date.now();
    resetInitialSignIn();
    return true;
  }
  
  // For token refresh events, only redirect if it's been a while
  if (event === 'TOKEN_REFRESHED') {
    return shouldAllowRedirect();
  }
  
  // Don't redirect for other events
  return false;
};
