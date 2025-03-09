import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';
import authDebug from '../utils/authDebug';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.includes(router.pathname);

  // Log current route status for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      authDebug.logNavigation(router.pathname);
      authDebug.isPublicRoute(router.pathname, publicRoutes);
      authDebug.logAuthState();
    }
  }, [router.pathname]);

  useEffect(() => {
    // Only redirect to login if not authenticated AND not on a public route
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      // Store the current path to redirect back after login
      // Make sure to store the full URL including query parameters for project pages
      const fullPath = router.asPath; // Use asPath instead of pathname to include query params
      sessionStorage.setItem('redirectAfterLogin', fullPath);
      
      if (process.env.NODE_ENV === 'development') {
        authDebug.logRedirect(
          fullPath, 
          '/login', 
          'User not authenticated on protected route'
        );
      }
      
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, isPublicRoute]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Always render children for public routes, otherwise only when authenticated
  return isPublicRoute || isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute; 