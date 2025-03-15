import { trackEvent } from '../../lib/mixpanelClient';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        
        // Track OAuth callback error
        trackEvent('OAuth Callback Error', {
          'Error Message': error.message
        });
        
        router.push('/login?error=auth');
        return;
      }
      
      if (data?.session?.user) {
        // Check if this is a new user (signup) or existing user (login)
        const { data: userData } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', data.session.user.id)
          .single();
        
        const isNewUser = userData?.created_at 
          ? (new Date().getTime() - new Date(userData.created_at).getTime()) < 60000 // Less than 1 minute old
          : false;
        
        if (isNewUser) {
          // Track successful OAuth signup
          trackEvent('Signup Successful', {
            'User ID': data.session.user.id,
            'Email Domain': data.session.user.email?.split('@')[1] || 'unknown',
            'Method': `OAuth - ${data.session.user.app_metadata.provider || 'unknown'}`
          });
        } else {
          // Track successful OAuth login
          trackEvent('Login Successful', {
            'User ID': data.session.user.id,
            'Email Domain': data.session.user.email?.split('@')[1] || 'unknown',
            'Method': `OAuth - ${data.session.user.app_metadata.provider || 'unknown'}`
          });
        }
        
        // Redirect to projects page
        router.push('/projects');
      } else {
        // No session, redirect to login
        router.push('/login');
      }
    };
    
    handleAuthCallback();
  }, [router]);

  // Show a loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A] mx-auto"></div>
        <p className="mt-4 text-[#6b7280]">Completing authentication...</p>
      </div>
    </div>
  );
} 