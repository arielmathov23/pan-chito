import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navbar = () => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/') 
      ? 'border-[#0F533A] text-[#111827] font-medium' 
      : 'border-transparent text-[#6b7280] hover:text-[#111827] hover:border-[#e5e7eb]';
  };

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-sm bg-white/90 border-b border-[#e5e7eb] supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#0F533A' }} />
                    <stop offset="100%" style={{ stopColor: '#16a34a' }} />
                  </linearGradient>
                </defs>
                <path d="M4.5 16.5L12 3L19.5 16.5H4.5Z" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V12" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12L16.5 16.5" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12L7.5 16.5" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.5 16.5C4.5 18.5 6 21 12 21C18 21 19.5 18.5 19.5 16.5" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xl font-bold bg-gradient-to-br from-[#0F533A] to-[#16a34a] text-transparent bg-clip-text">021</span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link
                href="/projects"
                className={`${isActive('/projects')} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-colors`}
              >
                Projects
              </Link>
              <Link
                href="/prds"
                className={`${isActive('/prds')} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-colors`}
              >
                All PRDs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 