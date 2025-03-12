import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
  admin_notes: string | null;
  plan_interest: string | null;
}

export default function ContactMessages() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
        } else {
          // Fetch contact messages
          fetchMessages();
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

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: isRead })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_read: isRead } : msg
      ));
      
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, is_read: isRead });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedMessage.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === selectedMessage.id ? { ...msg, admin_notes: adminNotes } : msg
      ));
      
      setSelectedMessage({ ...selectedMessage, admin_notes: adminNotes });
    } catch (error) {
      console.error('Error saving admin notes:', error);
    }
  };

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setAdminNotes(message.admin_notes || '');
    setIsViewModalOpen(true);
    
    // If message is not read, mark it as read
    if (!message.is_read) {
      handleMarkAsRead(message.id, true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">Contact Messages</h1>
              <p className="text-[#6b7280] mt-2">View and manage contact form submissions</p>
            </div>
            <Link 
              href="/admin" 
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Admin
            </Link>
          </div>

          {messages.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">When users submit the contact form, their messages will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan Interest
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr 
                        key={message.id} 
                        className={`hover:bg-gray-50 ${!message.is_read ? 'bg-blue-50' : ''} cursor-pointer`}
                        onClick={() => handleViewMessage(message)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              message.is_read 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {message.is_read ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{message.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{message.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{message.company || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {message.plan_interest ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {message.plan_interest}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(message.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {isViewModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.name}</h2>
                  <p className="text-sm text-gray-500">{selectedMessage.email}</p>
                  {selectedMessage.company && (
                    <p className="text-sm text-gray-500">Company: {selectedMessage.company}</p>
                  )}
                  {selectedMessage.plan_interest && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Plan Interest: {selectedMessage.plan_interest}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Received: {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Message:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes:
                </label>
                <textarea
                  id="admin-notes"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F533A] focus:border-[#0F533A]"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add private notes about this message..."
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0F533A] hover:bg-[#0F533A]/90"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <div className="flex space-x-3">
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[#0F533A] bg-[#0F533A]/10 hover:bg-[#0F533A]/20"
                  >
                    Reply via Email
                  </a>
                  <button
                    onClick={() => handleMarkAsRead(selectedMessage.id, !selectedMessage.is_read)}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                      selectedMessage.is_read
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {selectedMessage.is_read ? 'Mark as Unread' : 'Mark as Read'}
                  </button>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 