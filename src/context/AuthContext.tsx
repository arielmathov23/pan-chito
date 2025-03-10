import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { 
  User, 
  AuthState, 
  AuthContextType, 
  LoginCredentials, 
  SignupCredentials 
} from '../types/auth';
import { supabase } from '../lib/supabaseClient';

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  signup: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  
  const router = useRouter();

  // Initialize auth state from Supabase session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            createdAt: session.user.created_at || new Date().toISOString(),
          };

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            createdAt: session.user.created_at || new Date().toISOString(),
          };

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    // Initialize auth
    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        throw error;
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        // Redirect to stored path or projects page after successful login
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath || '/projects');
      }
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
    }
  };

  // Signup function
  const signup = async (credentials: SignupCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        throw error;
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        // Redirect to stored path or projects page after successful signup
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath || '/projects');
      }
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Signup failed',
      }));
    }
  };

  // Login with Google function
  const loginWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Force the production URL for all environments to ensure consistent behavior
      const productionUrl = 'https://from021.io';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${productionUrl}/auth/callback`,
          queryParams: {
            // Force the redirect URL to be the production URL
            redirect_to: productionUrl
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // The redirect will happen automatically by Supabase
      // When the user returns, the session will be handled by the auth state listener
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Google login failed',
      }));
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      // Redirect to login page after logout
      router.push('/login');
    } catch (error: any) {
      console.error('Error during logout:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.message || 'Logout failed',
      }));
    }
  };

  // Clear error function
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  // Combine state and functions to provide through context
  const contextValue: AuthContextType = {
    ...authState,
    login,
    signup,
    loginWithGoogle,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;
    
    // If no user is logged in and we're not on a public route, redirect to login
    if (!user && !isPublicRoute(router.pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Check if we're on the client and still loading
  if (isClient && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
};

// Helper function to determine if a route is public
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/auth/callback',
    '/auth/reset-password',
    '/upgrade',
    '/privacy',
    '/terms',
  ];
  
  // Check if the current path is in the public routes list
  // or starts with a public route prefix
  return publicRoutes.includes(pathname) || 
         pathname.startsWith('/auth/');
} 