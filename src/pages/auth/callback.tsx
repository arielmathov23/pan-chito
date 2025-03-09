import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Process the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error processing auth callback:', error.message);
          router.push('/login');
          return;
        }
        
        // Log the session for debugging
        console.log('Auth callback session:', data.session ? 'Session exists' : 'No session');
        
        // If we have a session, redirect to projects
        if (data.session) {
          // Force a hard redirect to the projects page to avoid any client-side routing issues
          window.location.href = '/projects';
        } else {
          // If no session, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        router.push('/login');
      }
    };

    // Only run if we're on the client side
    if (typeof window !== 'undefined') {
      // Add a small delay to ensure Supabase has time to process the auth state
      setTimeout(handleAuthCallback, 500);
    }
  }, [router]);

  // Show a loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-t-[#0F533A] border-gray-200 rounded-full animate-spin"></div>
      <p className="ml-4 text-gray-600">Processing authentication...</p>
    </div>
  );
} 