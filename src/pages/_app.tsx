import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import authDebug from '../utils/authDebug';
import { supabase } from '../lib/supabaseClient';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.includes(router.pathname);

  // Handle OAuth callback and errors
  useEffect(() => {
    // Check for OAuth error in URL
    const { error, error_description } = router.query;
    if (error && error === 'invalid_request' && error_description) {
      console.error('OAuth Error:', error_description);
      
      // If there's a bad_oauth_state error, clear the session and redirect to login
      if (router.query.error_code === 'bad_oauth_state') {
        supabase.auth.signOut().then(() => {
          router.push('/login');
        });
      }
    }

    // Handle auth state change from OAuth redirect
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect to projects if the user just signed in and is on a login-related page
      // This prevents redirects when returning to tabs with upgrade or project pages
      if (event === 'SIGNED_IN' && session) {
        const currentPath = router.pathname;
        const loginRelatedPages = ['/login', '/signup', '/auth/callback', '/'];
        
        if (loginRelatedPages.includes(currentPath)) {
          router.push('/projects');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Debug navigation in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleRouteChange = (url: string) => {
        authDebug.logNavigation(`Route changed to: ${url}`);
      };

      router.events.on('routeChangeStart', handleRouteChange);
      
      return () => {
        router.events.off('routeChangeStart', handleRouteChange);
      };
    }
  }, [router.events]);

  return (
    <>
      <Head>
        <title>021 - From Zero to One</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F533A" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <AuthProvider>
        {isPublicRoute ? (
          // Public routes don't need the ProtectedRoute wrapper
          <Component {...pageProps} />
        ) : (
          // Protected routes use the ProtectedRoute wrapper
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </AuthProvider>
    </>
  );
}

export default MyApp; 