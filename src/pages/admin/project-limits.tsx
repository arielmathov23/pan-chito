import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { projectLimitService, UpgradeRequest } from '../../services/projectLimitService';
import { supabase } from '../../lib/supabaseClient';

export default function AdminProjectLimits() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [userLimit, setUserLimit] = useState(1);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      }
    };
    
    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAdmin) return;
      
      setIsLoading(true);
      try {
        // Load upgrade requests
        const requests = await projectLimitService.getUpgradeRequests();
        setUpgradeRequests(requests);
      } catch (error) {
        console.error('Error loading admin data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);
  
  const handleUpdateUserLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    if (!userId.trim()) {
      setError('Please enter a user ID.');
      setIsSubmitting(false);
      return;
    }
    
    // Validate user ID format (basic UUID validation)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(userId)) {
      setError('Please enter a valid user ID (UUID format).');
      setIsSubmitting(false);
      return;
    }
    
    // Validate max projects
    if (userLimit < 1) {
      setError('Max projects must be at least 1.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Better debugging
      console.log(`Checking for user with ID: ${userId}`);
      
      // First try direct query by primary key
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId);
      
      console.log('Query result:', userData, userError);
      
      // Check if any data was returned (note: removed .single())
      if (!userData || userData.length === 0) {
        setError(`User with ID ${userId} not found in profiles table.`);
        setIsSubmitting(false);
        return;
      }
      
      // Use the first matching profile
      const userProfile = userData[0];
      
      // Continue with the update
      const success = await projectLimitService.updateUserProjectLimit(userId, userLimit);
      
      if (success) {
        setSuccess(`Project limit for user ${userProfile.email || userId} updated successfully to ${userLimit} projects!`);
        setUserId('');
        setUserLimit(1);
      } else {
        setError('Failed to update user limit. Please try again.');
      }
    } catch (error) {
      console.error('Error in user limit update:', error);
      setError(`Error updating limit: ${error.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

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
            <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
              <Link href="/projects" className="hover:text-[#111827] transition-colors">Projects</Link>
              <span>/</span>
              <span className="text-[#111827]">Admin</span>
              <span>/</span>
              <span className="text-[#111827]">Project Limits</span>
            </div>
            <h1 className="text-3xl font-bold text-[#111827]">Project Limits Admin</h1>
            <p className="text-[#6b7280] mt-2">Manage user project limits</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* User Specific Limit Section */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-[#111827] mb-4">Set User-Specific Project Limit</h2>
            <p className="text-[#6b7280] mb-4">Set a custom project limit for a specific user.</p>
              
              <form onSubmit={handleUpdateUserLimit} className="space-y-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-[#111827] mb-2">
                  User ID (UUID format)
                  </label>
                  <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                  placeholder="Enter user ID (UUID format)"
                    required
                  />
                <p className="mt-1 text-xs text-[#6b7280]">
                  Find the user ID in the database or from the user's profile
                </p>
                </div>
                
                <div>
                  <label htmlFor="userLimit" className="block text-sm font-medium text-[#111827] mb-2">
                    Max Projects
                  </label>
                  <input
                    type="number"
                    id="userLimit"
                    min="1"
                    value={userLimit}
                    onChange={(e) => setUserLimit(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                  />
                <p className="mt-1 text-xs text-[#6b7280]">
                  This will override the default limit from the user's plan
                </p>
                </div>
                
                <div>
                  <button
                    type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center justify-center ${
                    isSubmitting ? 'bg-[#0F533A]/70' : 'bg-[#0F533A] hover:bg-[#0F533A]/90'
                  } text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                  >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                          ) : (
                    'Set User Limit'
                  )}
                            </button>
              </div>
            </form>
          </div>

          {/* Upgrade requests section */}
          <div id="upgrade-requests" className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#111827] mb-4">Upgrade Requests & Feedback</h2>
            
            {upgradeRequests.length === 0 ? (
              <p className="text-[#6b7280]">No upgrade requests or feedback yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e5e7eb]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">User Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Satisfaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Best Feature</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Worst Feature</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Additional Thoughts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e5e7eb]">
                    {upgradeRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 text-sm text-[#111827]">
                          {request.userEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b7280]">
                          {new Date(request.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#111827]">
                          {request.satisfaction !== undefined ? (
                            <div className="flex items-center">
                              <span className="font-medium mr-2">{request.satisfaction}/10</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-green-600 h-2.5 rounded-full" 
                                  style={{ width: `${(request.satisfaction / 10) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#6b7280]">(Not provided)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#111827]">
                          {request.bestFeature || '(Not provided)'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#111827]">
                          {request.worstFeature || '(Not provided)'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#111827]">
                          {request.additionalThoughts || '(Not provided)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 