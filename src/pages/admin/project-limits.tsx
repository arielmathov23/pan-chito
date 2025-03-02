import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { projectLimitService, ProjectLimit, UpgradeRequest } from '../../services/projectLimitService';
import { supabase } from '../../lib/supabaseClient';

export default function AdminProjectLimits() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [projectLimits, setProjectLimits] = useState<ProjectLimit[]>([]);
  const [defaultLimit, setDefaultLimit] = useState(1);
  const [newDefaultLimit, setNewDefaultLimit] = useState(1);
  const [userIdToEdit, setUserIdToEdit] = useState('');
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
        
        // Load all project limits - this is a custom admin query
        const { data: limits } = await supabase
          .from('project_limits')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (limits) {
          setProjectLimits(limits.map(limit => ({
            id: limit.id,
            userId: limit.user_id,
            maxProjects: limit.max_projects,
            createdAt: limit.created_at,
            updatedAt: limit.updated_at
          })));
        }
        
        // Load default limit
        const { data: settings } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'default_project_limit')
          .single();
          
        if (settings) {
          setDefaultLimit(settings.value.max_projects);
          setNewDefaultLimit(settings.value.max_projects);
        }
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

  const handleUpdateDefaultLimit = async () => {
    setError('');
    setSuccess('');
    
    try {
      const success = await projectLimitService.updateDefaultProjectLimit(newDefaultLimit);
      
      if (success) {
        setDefaultLimit(newDefaultLimit);
        setSuccess('Default project limit updated successfully!');
      } else {
        setError('Failed to update default limit.');
      }
    } catch (error) {
      console.error('Error updating default limit:', error);
      setError('An error occurred while updating the default limit.');
    }
  };
  
  const handleUpdateUserLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!userId.trim()) {
      setError('Please enter a user ID.');
      return;
    }
    
    try {
      const success = await projectLimitService.updateUserProjectLimit(userId, userLimit);
      
      if (success) {
        // Refresh the list
        const { data: limits } = await supabase
          .from('project_limits')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (limits) {
          setProjectLimits(limits.map(limit => ({
            id: limit.id,
            userId: limit.user_id,
            maxProjects: limit.max_projects,
            createdAt: limit.created_at,
            updatedAt: limit.updated_at
          })));
        }
        
        setSuccess(`Project limit for user ${userId} updated successfully!`);
        setUserId('');
        setUserLimit(1);
      } else {
        setError('Failed to update user limit.');
      }
    } catch (error) {
      console.error('Error updating user limit:', error);
      setError('An error occurred while updating the user limit.');
    }
  };
  
  const startEditUserLimit = (limit: ProjectLimit) => {
    setUserIdToEdit(limit.userId);
    setUserLimit(limit.maxProjects);
  };
  
  const saveUserLimitEdit = async (userId: string) => {
    setError('');
    setSuccess('');
    
    try {
      const success = await projectLimitService.updateUserProjectLimit(userId, userLimit);
      
      if (success) {
        // Refresh the list
        const { data: limits } = await supabase
          .from('project_limits')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (limits) {
          setProjectLimits(limits.map(limit => ({
            id: limit.id,
            userId: limit.user_id,
            maxProjects: limit.max_projects,
            createdAt: limit.created_at,
            updatedAt: limit.updated_at
          })));
        }
        
        setSuccess(`Project limit updated successfully!`);
        setUserIdToEdit('');
      } else {
        setError('Failed to update user limit.');
      }
    } catch (error) {
      console.error('Error updating user limit:', error);
      setError('An error occurred while updating the user limit.');
    }
  };
  
  const cancelEditUserLimit = () => {
    setUserIdToEdit('');
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
            <p className="text-[#6b7280] mt-2">Manage user project limits and view upgrade requests</p>
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

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Default limit section */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
              <h2 className="text-xl font-bold text-[#111827] mb-4">Default Project Limit</h2>
              <p className="text-[#6b7280] mb-4">This limit applies to all new users who don't have a custom limit.</p>
              
              <div className="flex items-center space-x-4 mb-4">
                <div>
                  <label htmlFor="defaultLimit" className="block text-sm font-medium text-[#111827] mb-2">
                    Max Projects
                  </label>
                  <input
                    type="number"
                    id="defaultLimit"
                    min="1"
                    value={newDefaultLimit}
                    onChange={(e) => setNewDefaultLimit(parseInt(e.target.value) || 1)}
                    className="w-24 px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                  />
                </div>
                
                <div className="pt-8">
                  <button
                    onClick={handleUpdateDefaultLimit}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F533A]/90 transition-colors"
                  >
                    Update Default
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-[#6b7280]">
                Current default: <span className="font-semibold text-[#111827]">{defaultLimit} project(s)</span>
              </div>
            </div>
            
            {/* User limit section */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
              <h2 className="text-xl font-bold text-[#111827] mb-4">Set User-Specific Limit</h2>
              <p className="text-[#6b7280] mb-4">Override the default limit for a specific user.</p>
              
              <form onSubmit={handleUpdateUserLimit} className="space-y-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-[#111827] mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                    placeholder="Enter user ID"
                    required
                  />
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
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F533A]/90 transition-colors"
                  >
                    Set User Limit
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Existing user limits */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-[#111827] mb-4">Current User Limits</h2>
            
            {projectLimits.length === 0 ? (
              <p className="text-[#6b7280]">No custom user limits set.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e5e7eb]">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Max Projects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e5e7eb]">
                    {projectLimits.map((limit) => (
                      <tr key={limit.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                          {limit.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                          {userIdToEdit === limit.userId ? (
                            <input
                              type="number"
                              min="1"
                              value={userLimit}
                              onChange={(e) => setUserLimit(parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 rounded border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A]"
                            />
                          ) : (
                            limit.maxProjects
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b7280]">
                          {new Date(limit.updatedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {userIdToEdit === limit.userId ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => saveUserLimitEdit(limit.userId)}
                                className="text-[#0F533A] hover:text-[#0F533A]/80"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditUserLimit}
                                className="text-[#6b7280] hover:text-[#111827]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditUserLimit(limit)}
                              className="text-[#0F533A] hover:text-[#0F533A]/80"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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