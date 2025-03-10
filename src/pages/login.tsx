import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { withAuth } from '../middleware/withAuth';
import AnimatedBackground from '../components/AnimatedBackground';
import PasswordInput from '../components/PasswordInput';

const Login = () => {
  const { login, loginWithGoogle, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;

    // Clear previous errors
    clearError();
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await login({ email, password });
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full glass-card p-6 rounded-2xl">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-center">
                <svg className="w-12 h-12 logo-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#052e1d' }} />
                      <stop offset="100%" style={{ stopColor: '#10b945' }} />
                    </linearGradient>
                  </defs>
                  <path d="M4.5 16.5L12 3L19.5 16.5H4.5Z" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V12" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L16.5 16.5" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L7.5 16.5" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.5 16.5C4.5 18.5 6 21 12 21C18 21 19.5 18.5 19.5 16.5" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Welcome to <span className="animated-gradient-text text-3xl">021</span>
                </h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Sign in to continue building your products
                </p>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Google Sign In Button */}
            <div>
              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F533A] transition-all duration-200 hover:translate-y-[-2px]"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Sign in with Google
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 text-xs">Or sign in with email</span>
              </div>
            </div>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label htmlFor="email-address" className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    } bg-white rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10b945] focus:border-transparent transition-all duration-200 text-sm`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
                  )}
                </div>
                
                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hasError={!!validationErrors.password}
                  errorMessage={validationErrors.password}
                  autoComplete="current-password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#0F533A] hover:bg-[#10b945] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F533A] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Sign in with Email'
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-xs text-center">
              <p className="text-gray-500">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-[#0F533A] hover:text-[#10b945] transition-colors duration-200">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default withAuth(Login); 