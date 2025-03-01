import { supabase } from '../lib/supabaseClient';

// Debug utility for authentication issues
export const authDebug = {
  // Log the current authentication state
  async logAuthState() {
    console.group('🔍 Auth Debug - Current State');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      
      if (data.session) {
        console.log('✅ User is authenticated');
        console.log('User ID:', data.session.user.id);
        console.log('User Email:', data.session.user.email);
        console.log('Session expires at:', new Date(data.session.expires_at! * 1000).toLocaleString());
      } else {
        console.log('❌ User is NOT authenticated');
      }
    } catch (error) {
      console.error('Error in logAuthState:', error);
    } finally {
      console.groupEnd();
    }
  },
  
  // Log navigation events
  logNavigation(pathname: string) {
    console.log(`🧭 Navigation: ${pathname}`);
  },
  
  // Log redirect events
  logRedirect(from: string, to: string, reason: string) {
    console.log(`↪️ Redirect: ${from} → ${to} (Reason: ${reason})`);
  },
  
  // Check if a route is public
  isPublicRoute(pathname: string, publicRoutes: string[]) {
    const isPublic = publicRoutes.includes(pathname);
    console.log(`🔒 Route ${pathname} is ${isPublic ? 'public' : 'protected'}`);
    return isPublic;
  }
};

export default authDebug; 