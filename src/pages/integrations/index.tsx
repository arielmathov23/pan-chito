import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { TrelloIntegration } from '../../components/integrations';

// Trello API configuration
const TRELLO_API_KEY = 'your-trello-api-key'; // Replace with your actual Trello API key
const TRELLO_AUTH_URL = 'https://trello.com/1/authorize';

// Define integration status type
interface IntegrationStatus {
  trello?: {
    connected: boolean;
    token: string | null;
  };
}

// Define integration data
const integrations = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub repositories to track development progress and sync your PRDs with code implementation.',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#181717" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C18.2072 22.5807 20.2772 21.0497 21.7437 19.0074C23.2101 16.965 23.9993 14.5143 24 12C24 5.37 18.63 0 12 0Z" />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync your 021 PRDs with Linear to automatically create and track tasks based on your product requirements.',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 100 100" fill="#5E6AD2" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.22541 61.5228C-0.965386 59.3319 -0.965387 55.7696 1.22541 53.5788L53.5788 1.22538C55.7696 -0.965415 59.3319 -0.965415 61.5228 1.22538L98.7746 38.4772C100.965 40.6681 100.965 44.2304 98.7746 46.4212L46.4212 98.7746C44.2304 100.965 40.6681 100.965 38.4772 98.7746L1.22541 61.5228Z" />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications in Slack when PRDs are updated, briefs are created, or technical documentation is ready for review.',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#4A154B" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 'workday',
    name: 'Workday',
    description: 'Connect your organizational structure to assign product owners and stakeholders to your 021 projects automatically.',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#0875E1" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        <path d="M12 17.5c3.04 0 5.5-2.46 5.5-5.5S15.04 6.5 12 6.5 6.5 8.96 6.5 12s2.46 5.5 5.5 5.5z" />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Export your 021 project features and requirements directly to Trello boards for agile development tracking.',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#0079BF" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.27 0H4.73C2.11 0 0 2.11 0 4.73v14.54C0 21.89 2.11 24 4.73 24h14.54c2.62 0 4.73-2.11 4.73-4.73V4.73C24 2.11 21.89 0 19.27 0zM10.64 17.82c0 .6-.49 1.09-1.09 1.09H5.45c-.6 0-1.09-.49-1.09-1.09V5.45c0-.6.49-1.09 1.09-1.09h4.09c.6 0 1.09.49 1.09 1.09v12.37zm9 0c0 .6-.49 1.09-1.09 1.09h-4.09c-.6 0-1.09-.49-1.09-1.09V5.45c0-.6.49-1.09 1.09-1.09h4.09c.6 0 1.09.49 1.09 1.09v12.37z" />
      </svg>
    ),
    status: 'available'
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Transform your 021 PRDs into Jira epics and stories to streamline your development workflow and sprint planning.',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="jira-gradient" x1="98.031%" y1="0.161%" x2="58.888%" y2="40.766%">
            <stop stopColor="#0052CC" offset="0%" />
            <stop stopColor="#2684FF" offset="100%" />
          </linearGradient>
        </defs>
        <path fill="url(#jira-gradient)" d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z" />
        <path fill="#2684FF" d="M5.946 6.558c0-.554.45-1.004 1.005-1.004h6.31v6.31c0 .554.45 1.004 1.004 1.004H24V5.554A5.554 5.554 0 0 0 18.446 0H5.946v6.558z" />
        <path fill="url(#jira-gradient)" d="M16.829 11.513c-.554 0-1.005.45-1.005 1.005V24l6.63-6.631a5.224 5.224 0 0 0 1.546-3.714 5.212 5.212 0 0 0-5.215-5.142h-1.956z" />
      </svg>
    ),
    status: 'coming-soon'
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Connect your Figma designs to your 021 projects to keep your screens and UI components in sync with your PRDs.',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 24C10.2091 24 12 22.2091 12 20V16H8C5.79086 16 4 17.7909 4 20C4 22.2091 5.79086 24 8 24Z" fill="#0ACF83"/>
        <path d="M4 12C4 9.79086 5.79086 8 8 8H12V16H8C5.79086 16 4 14.2091 4 12Z" fill="#A259FF"/>
        <path d="M4 4C4 1.79086 5.79086 0 8 0H12V8H8C5.79086 8 4 6.20914 4 4Z" fill="#F24E1E"/>
        <path d="M12 0H16C18.2091 0 20 1.79086 20 4C20 6.20914 18.2091 8 16 8H12V0Z" fill="#FF7262"/>
        <path d="M20 12C20 14.2091 18.2091 16 16 16C13.7909 16 12 14.2091 12 12C12 9.79086 13.7909 8 16 8C18.2091 8 20 9.79086 20 12Z" fill="#1ABCFE"/>
      </svg>
    ),
    status: 'coming-soon'
  }
];

export default function Integrations() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({});

  // Handle Trello integration status change
  const handleTrelloStatusChange = (status: { connected: boolean; token: string | null }) => {
    setIntegrationStatus(prev => ({
      ...prev,
      trello: status
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F533A]"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-6 flex-grow">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">Integrations</h1>
              <p className="text-[#6b7280] mt-2">Connect your tools and services to enhance your workflow</p>
            </div>
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations
            .sort((a, b) => {
              // First, check if the integration is connected based on integrationStatus
              const aConnected = a.id === 'trello' && integrationStatus.trello?.connected;
              const bConnected = b.id === 'trello' && integrationStatus.trello?.connected;
              
              // Connected integrations come first
              if (aConnected && !bConnected) return -1;
              if (!aConnected && bConnected) return 1;
              
              // Then sort by status: 'available' comes before 'coming-soon'
              if (a.status === 'available' && b.status !== 'available') return -1;
              if (a.status !== 'available' && b.status === 'available') return 1;
              
              // Finally sort alphabetically by name
              return a.name.localeCompare(b.name);
            })
            .map((integration) => (
            <div 
              key={integration.id}
              className={`bg-white rounded-2xl border ${
                integration.id === 'trello' && integrationStatus.trello?.connected
                  ? 'border-green-100 shadow-sm'
                  : 'border-gray-200 shadow-sm'
              } overflow-hidden hover:shadow-md transition-shadow`}
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 rounded-xl p-3 relative ${
                    integration.id === 'trello' && integrationStatus.trello?.connected
                      ? 'bg-green-50 border border-green-100'
                      : integration.status === 'available' 
                        ? 'bg-[#0F533A]/10 text-[#0F533A]' 
                        : 'bg-white border border-gray-100'
                  }`}>
                    {integration.logo}
                    {integration.id === 'trello' && integrationStatus.trello?.connected && (
                      <div className="absolute -top-1.5 -right-1.5 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
                <div className="mt-5">
                  {integration.id === 'trello' ? (
                    <TrelloIntegration onStatusChange={handleTrelloStatusChange} />
                  ) : (
                    <button
                      disabled
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-400 bg-gray-100 cursor-not-allowed"
                    >
                      Coming soon
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-3 border-t border-gray-100 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <div className="flex items-center mb-2 md:mb-0">
              <span>021 is in </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mx-1">
                BETA
              </span>
              <span>version</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Built by Panchito studio</span>
              <a 
                href="https://x.com/arielmathov" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#0F533A] hover:text-[#0a3f2c] transition-colors flex items-center"
              >
                <span className="mr-1">Get in touch</span>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 