import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import type { NextComponentType, NextPageContext } from 'next';
import type { AppProps } from 'next/app';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup'];

export function withAuth<P extends {}>(
  Component: NextComponentType<NextPageContext, any, P>
) {
  const AuthenticatedComponent = (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      // Only run this on the client side
      if (!isClient) return;
      
      // Don't do anything while auth is loading
      if (isLoading) return;
      
      const currentPath = router.pathname;
      
      // If user is not authenticated and trying to access a protected route
      if (!isAuthenticated && !publicRoutes.includes(currentPath)) {
        router.push('/login');
      }
      
      // If user is authenticated and trying to access login/signup
      if (isAuthenticated && publicRoutes.includes(currentPath)) {
        router.push('/projects');
      }
    }, [isAuthenticated, isLoading, router, isClient]);

    // Show nothing while loading or redirecting
    if (isLoading || !isClient) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="w-12 h-12 border-4 border-t-[#0F533A] border-gray-200 rounded-full animate-spin"></div>
        </div>
      );
    }

    // If on a public route or authenticated, render the component
    if (publicRoutes.includes(router.pathname) || isAuthenticated) {
      return <Component {...props} />;
    }

    // This should not be visible, but just in case
    return null;
  };

  return AuthenticatedComponent;
}

export default withAuth; 