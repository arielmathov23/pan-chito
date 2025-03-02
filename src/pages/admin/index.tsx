import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase.auth.getUser();
        
        // Check if user has admin role in metadata
        const isUserAdmin = data.user?.app_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          router.push('/projects');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A]"></div>
              <p className="mt-4 text-[#6b7280]">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Router will redirect to home or projects
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#111827]">Admin Dashboard</h1>
            <p className="text-[#6b7280] mt-2">Manage your application settings and user data</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Project Limits Card */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-[#F0FDF4] p-3 rounded-lg">
                  <svg className="w-6 h-6 text-[#0F533A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-[#111827]">Project Limits</h2>
                  <p className="text-[#6b7280] mt-1">Manage user project limits and view upgrade requests</p>
                  <Link 
                    href="/admin/project-limits" 
                    className="inline-flex items-center mt-4 text-sm font-medium text-[#0F533A] hover:text-[#0F533A]/80"
                  >
                    Manage Project Limits
                    <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Feedback Card */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-[#FEF3C7] p-3 rounded-lg">
                  <svg className="w-6 h-6 text-[#D97706]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-[#111827]">Feedback</h2>
                  <p className="text-[#6b7280] mt-1">View user feedback and upgrade requests</p>
                  <Link 
                    href="/admin/feedback" 
                    className="inline-flex items-center mt-4 text-sm font-medium text-[#0F533A] hover:text-[#0F533A]/80"
                  >
                    View Feedback
                    <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-[#6b7280] hover:text-[#111827] hover:bg-[#f0f2f5] transition-colors"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 