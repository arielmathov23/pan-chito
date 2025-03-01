import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import AnimatedBackground from './AnimatedBackground';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="py-6 bg-white/80 backdrop-blur-sm border-t border-gray-200">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} 021. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AnimatedBackground>
  );
};

export default Layout; 