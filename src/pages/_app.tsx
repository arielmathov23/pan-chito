import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import authDebug from '../utils/authDebug';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.includes(router.pathname);

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