import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Trello API configuration
const TRELLO_API_KEY = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
const TRELLO_AUTH_URL = 'https://trello.com/1/authorize';

// Local storage key
const TRELLO_TOKEN_KEY = 'trello_token';

interface TrelloIntegrationProps {
  onStatusChange?: (status: { connected: boolean; token: string | null }) => void;
  customReturnUrl?: string;
}

export default function TrelloIntegration({ onStatusChange, customReturnUrl }: TrelloIntegrationProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Check for token in localStorage or URL params
  useEffect(() => {
    const checkTrelloAuth = async () => {
      try {
        // First check localStorage
        const storedToken = localStorage.getItem(TRELLO_TOKEN_KEY);
        
        if (storedToken) {
          console.log('Found Trello token in localStorage');
          setToken(storedToken);
          setIsConnected(true);
          if (onStatusChange) {
            onStatusChange({ connected: true, token: storedToken });
          }
          setIsLoading(false);
          return;
        }
        
        // Try Supabase as a secondary option (if available)
        try {
          if (user) {
            const { data, error } = await supabase
              .from('user_integrations')
              .select('integration_data')
              .eq('user_id', user.id)
              .eq('integration_type', 'trello')
              .single();

            if (!error && data && data.integration_data && data.integration_data.token) {
              console.log('Found Trello token in Supabase');
              const supabaseToken = data.integration_data.token;
              
              // Also save to localStorage for future use
              localStorage.setItem(TRELLO_TOKEN_KEY, supabaseToken);
              
              setToken(supabaseToken);
              setIsConnected(true);
              if (onStatusChange) {
                onStatusChange({ connected: true, token: supabaseToken });
              }
              setIsLoading(false);
              return;
            }
          }
        } catch (supabaseError) {
          console.log('Supabase storage not available:', supabaseError);
          // Continue with other methods if Supabase fails
        }

        // Check URL for token (after OAuth redirect)
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
          console.log('Found Trello token in URL');
          
          // Save to localStorage
          localStorage.setItem(TRELLO_TOKEN_KEY, tokenFromUrl);
          
          // Try to save to Supabase if available
          try {
            if (user) {
              await supabase
                .from('user_integrations')
                .upsert({
                  user_id: user.id,
                  integration_type: 'trello',
                  integration_data: { token: tokenFromUrl },
                  created_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id,integration_type'
                });
            }
          } catch (supabaseError) {
            console.log('Could not save to Supabase, using localStorage only:', supabaseError);
          }
          
          // Update state
          setToken(tokenFromUrl);
          setIsConnected(true);
          
          // Notify parent component
          if (onStatusChange) {
            onStatusChange({ connected: true, token: tokenFromUrl });
          }
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking Trello auth:', error);
        setIsLoading(false);
      }
    };

    checkTrelloAuth();
  }, [user]); // Only re-run when user changes

  const handleConnect = () => {
    // Trello API key - should be in env vars in production
    const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || 'your-trello-api-key';
    
    // Return URL after OAuth
    const returnUrl = customReturnUrl || `${window.location.origin}${window.location.pathname}`;
    
    // Scopes needed
    const scope = 'read,write,account';
    
    // Name of the app
    const appName = '021 App';
    
    // Redirect to Trello auth
    const authUrl = `https://trello.com/1/authorize?expiration=never&name=${appName}&scope=${scope}&response_type=token&key=${apiKey}&return_url=${returnUrl}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnectClick = () => {
    setShowDisconnectModal(true);
  };

  const handleCancelDisconnect = () => {
    setShowDisconnectModal(false);
  };

  const handleConfirmDisconnect = async () => {
    try {
      setIsLoading(true);
      setShowDisconnectModal(false);
      
      // Remove from localStorage
      localStorage.removeItem(TRELLO_TOKEN_KEY);
      
      // Try to remove from Supabase if available
      try {
        if (user) {
          await supabase
            .from('user_integrations')
            .delete()
            .eq('user_id', user.id)
            .eq('integration_type', 'trello');
        }
      } catch (supabaseError) {
        console.log('Could not remove from Supabase:', supabaseError);
        // Continue anyway since we've removed from localStorage
      }
      
      // Update state
      setToken(null);
      setIsConnected(false);
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange({ connected: false, token: null });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error disconnecting Trello:', error);
      setIsLoading(false);
    }
  };

  // Disconnect confirmation modal
  const DisconnectModal = () => {
    if (!showDisconnectModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="text-center mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Disconnect from Trello?</h3>
            <p className="text-sm text-gray-500 mt-2">
              This will remove the connection between your account and Trello. You'll need to reconnect to use Trello features again.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={handleCancelDisconnect}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0079BF]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDisconnect}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0079BF] opacity-70"
      >
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </button>
    );
  }

  if (isConnected) {
    return (
      <>
        <button
          onClick={handleDisconnectClick}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Disconnect from Trello
        </button>
        <DisconnectModal />
      </>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0079BF] hover:bg-[#0079BF]/90"
    >
      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Connect to Trello
    </button>
  );
} 