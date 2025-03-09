import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Process the OAuth callback
    const handleAuthCallback = async () => {
      // The hash contains the token
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error processing auth callback:', error.message);
        router.push('/login');
        return;
      }
      
      // Redirect to projects page on successful authentication
      router.push('/projects');
    };

    // Only run if we're on the client side
    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, [router]);

  // Show a loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-t-[#0F533A] border-gray-200 rounded-full animate-spin"></div>
    </div>
  );
} 