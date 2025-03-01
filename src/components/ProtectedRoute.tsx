import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip redirect during initial loading
    if (isLoading) return;

    // If user is not authenticated and trying to access a protected route
    if (!isAuthenticated && !publicRoutes.includes(router.pathname)) {
      // Store the intended URL to redirect back after login
      if (router.pathname !== '/') {
        sessionStorage.setItem('redirectAfterLogin', router.asPath);
      }
      
      // Redirect to login page
      router.push('/login');
    }
    
    // If user is authenticated and trying to access login/signup pages
    if (isAuthenticated && publicRoutes.includes(router.pathname)) {
      // Redirect to home or stored redirect path
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router.pathname]);

  // Show loading screen while checking authentication or redirecting
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show nothing during redirect
  if (!isAuthenticated && !publicRoutes.includes(router.pathname)) {
    return null;
  }

  // Render children only when authenticated or on public routes
  return <>{children}</>;
};

export default ProtectedRoute; 