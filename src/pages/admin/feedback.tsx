import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { projectLimitService } from '../../services/projectLimitService';

interface FeedbackItem {
  id: string;
  user_id: string;
  user_email: string;
  message: string;
  created_at: string;
  type: string;
  rating?: number;
  category?: string;
}

interface UpgradeRequest {
  id: string;
  user_id: string;
  user_email: string;
  created_at: string;
  status: string;
  reason?: string;
  type: string;
  bestFeature?: string;
  worstFeature?: string;
  satisfaction?: number;
}

export default function AdminFeedback() {
  console.log('Rendering AdminFeedback component');
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase.auth.getUser();
        
        // Check if user has admin role in metadata
        const isUserAdmin = data.user?.app_metadata?.role === 'admin';
        console.log('User admin status:', isUserAdmin, 'App metadata:', data.user?.app_metadata);
        
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          router.push('/projects');
        } else {
          // Load data if user is admin
          loadFeedbackAndUpgradeRequests();
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

  const loadFeedbackAndUpgradeRequests = async () => {
    try {
      // Use the projectLimitService to fetch upgrade requests instead of direct Supabase query
      const upgradeData = await projectLimitService.getUpgradeRequests();
      
      console.log('Upgrade requests from service:', upgradeData);

      // Initialize empty arrays for feedback and upgrade requests
      const formattedFeedback: FeedbackItem[] = [];
      const formattedUpgrades: UpgradeRequest[] = [];

      // Process each item from the upgrade_requests table
      upgradeData.forEach((item: any) => {
        // Ensure we have a status value, defaulting to 'pending' if not present
        let status = 'pending';
        if (item.status) {
          status = item.status;
        }
        
        // Create the base item with common properties
        const baseItem = {
          id: item.id,
          user_id: item.userId,
          user_email: item.userEmail || 'Unknown',
          created_at: item.createdAt,
        };

        // Add to appropriate array based on content
        formattedUpgrades.push({
          ...baseItem,
          status: status,
          reason: item.additionalThoughts || item.additionalFeedback || item.bestFeature,
          type: 'upgrade',
          bestFeature: item.bestFeature,
          worstFeature: item.worstFeature,
          satisfaction: item.satisfaction
        });
      });

      console.log('Formatted upgrade requests:', formattedUpgrades);

      setFeedbackItems(formattedFeedback);
      setUpgradeRequests(formattedUpgrades);
    } catch (error) {
      console.error('Error loading feedback and upgrade requests:', error);
    }
  };

  const handleApproveUpgrade = async (id: string) => {
    try {
      // Find the upgrade request
      const upgradeRequest = upgradeRequests.find(req => req.id === id);
      if (!upgradeRequest) {
        console.error('Upgrade request not found');
        return;
      }

      // Update the user's project limit
      const success = await projectLimitService.updateUserProjectLimit(
        upgradeRequest.user_id,
        10 // Increase limit to 10 projects
      );

      if (!success) {
        throw new Error('Failed to update project limit');
      }

      // Update the upgrade request status
      const statusUpdateSuccess = await projectLimitService.updateUpgradeRequestStatus(id, 'approved');
      
      if (!statusUpdateSuccess) {
        console.log('Could not update status in database, but project limit was updated');
      }

      // Update local state
      setUpgradeRequests(
        upgradeRequests.map(req =>
          req.id === id ? { ...req, status: 'approved' } : req
        )
      );

      alert('Upgrade request approved. The user can now create up to 10 projects.');
      
      // Refresh the data
      loadFeedbackAndUpgradeRequests();
    } catch (error) {
      console.error('Error approving upgrade request:', error);
      alert('Error: Failed to approve upgrade request.');
    }
  };

  const handleRejectUpgrade = async (id: string) => {
    try {
      // Update the upgrade request status
      const statusUpdateSuccess = await projectLimitService.updateUpgradeRequestStatus(id, 'rejected');
      
      if (!statusUpdateSuccess) {
        console.log('Could not update status in database');
      }

      // Update local state
      setUpgradeRequests(
        upgradeRequests.map(req =>
          req.id === id ? { ...req, status: 'rejected' } : req
        )
      );

      alert('Upgrade request rejected.');
      
      // Refresh the data
      loadFeedbackAndUpgradeRequests();
    } catch (error) {
      console.error('Error rejecting upgrade request:', error);
      alert('Error: Failed to reject upgrade request.');
    }
  };

  const filteredItems = () => {
    let result;
    if (activeTab === 'all') {
      result = [...feedbackItems, ...upgradeRequests].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (activeTab === 'upgrade') {
      result = upgradeRequests;
    } else {
      // Default to all items if activeTab is not recognized
      result = [...feedbackItems, ...upgradeRequests].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    // If we're on the upgrade tab but there are no upgrade requests,
    // show a message indicating that all feedback is in the upgrade requests tab
    if (activeTab === 'upgrade' && result.length === 0) {
      console.log('No upgrade requests found. All feedback is in the upgrade requests tab.');
    }
    
    console.log('Filtered items for tab', activeTab, ':', result);
    return result;
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center text-sm text-[#6b7280] mb-4 space-x-2">
            <Link href="/admin" className="hover:text-[#111827] transition-colors flex items-center">
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Admin Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#111827]">Upgrade Requests</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#111827]">Upgrade Requests</h1>
            <p className="text-[#6b7280] mt-2">Manage user upgrade requests and feedback</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-[#e5e7eb]">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-4 text-sm font-medium ${
                  activeTab === 'all'
                    ? 'text-[#0F533A] border-b-2 border-[#0F533A]'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('upgrade')}
                className={`pb-4 text-sm font-medium ${
                  activeTab === 'upgrade'
                    ? 'text-[#0F533A] border-b-2 border-[#0F533A]'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                Upgrade Requests
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            {filteredItems().length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="text-lg font-medium text-[#111827] mb-2">No items found</h3>
                <p className="text-[#6b7280]">
                  {activeTab === 'all' 
                    ? 'No feedback or upgrade requests have been submitted yet.' 
                    : 'No upgrade requests have been submitted yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e5e7eb]">
                  <thead className="bg-[#f8f9fa]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Content
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e5e7eb]">
                    {filteredItems().map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8f9fa]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.type === 'feedback' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Feedback
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Upgrade
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                          {item.user_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#111827]">
                          {item.type === 'feedback' ? (
                            <div>
                              {(item as FeedbackItem).rating && (
                                <div className="flex items-center mb-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <svg 
                                      key={i}
                                      className={`w-4 h-4 ${i < (item as FeedbackItem).rating! ? 'text-yellow-400' : 'text-gray-300'}`} 
                                      fill="currentColor" 
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              )}
                              {(item as FeedbackItem).category && (
                                <div className="text-xs text-[#6b7280] mb-1">
                                  Category: {(item as FeedbackItem).category}
                                </div>
                              )}
                              <p className="text-sm">{(item as FeedbackItem).message}</p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center mb-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  (item as UpgradeRequest).status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  (item as UpgradeRequest).status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {(item as UpgradeRequest).status.charAt(0).toUpperCase() + (item as UpgradeRequest).status.slice(1)}
                                </span>
                              </div>
                              {(item as UpgradeRequest).reason && (
                                <p className="text-sm">{(item as UpgradeRequest).reason}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b7280]">
                          {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {item.type === 'upgrade' && (item as UpgradeRequest).status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveUpgrade(item.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectUpgrade(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-[#6b7280] hover:text-[#111827] hover:bg-[#f0f2f5] transition-colors"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 