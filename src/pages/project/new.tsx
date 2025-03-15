import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { projectLimitService } from '../../services/projectLimitService';
import { trackEvent } from '../../lib/mixpanelClient';

export default function NewProject() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [limitStatus, setLimitStatus] = useState<{
    canCreateProject: boolean;
    currentProjects: number;
    maxProjects: number;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkProjectLimit = async () => {
      if (user) {
        setIsChecking(true);
        try {
          const status = await projectLimitService.checkCanCreateProject();
          setLimitStatus(status);
        } catch (error) {
          console.error('Error checking project limit:', error);
          setError('Failed to check project limits. Please try again.');
        } finally {
          setIsChecking(false);
        }
      }
    };

    if (!authLoading && user) {
      checkProjectLimit();
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      // Double-check limit before proceeding
      const status = await projectLimitService.checkCanCreateProject();
      if (!status.canCreateProject) {
        setError(`You have reached your limit of ${status.maxProjects} projects. Please upgrade your plan to create more projects.`);
        setIsCreating(false);
        return;
      }

      const project = await projectService.createProject({ 
        name, 
        description,
        content: {}
      });
      
      if (project) {
        // Track the project creation event
        trackEvent('Project Created', {
          'Project Name': name,
        });
        
        router.push(`/project/${project.id}`);
      } else {
        setError('Failed to create project. Please try again.');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setError('An error occurred while creating the project. Please try again.');
      setIsCreating(false);
    }
  };

  const handleUpgradeClick = () => {
    trackEvent('Upgrade Clicked', {
      'Source': 'Project Limit Reached',
    });
    
    router.push('/upgrade');
  };

  if (authLoading || isChecking) {
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

  if (!user) {
    return null; // Router will redirect to login
  }

  // If user has reached their project limit, show the limit reached screen
  if (limitStatus && !limitStatus.canCreateProject) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
                <Link href="/projects" className="hover:text-[#111827] transition-colors">Projects</Link>
                <span>/</span>
                <span className="text-[#111827]">New Project</span>
              </div>
              <h1 className="text-3xl font-bold text-[#111827]">Project Limit Reached</h1>
              <p className="text-[#6b7280] mt-2">You have reached your limit of {limitStatus.maxProjects} project(s)</p>
            </div>

            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F0FDF4] mb-4">
                  <svg className="w-8 h-8 text-[#16a34a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#111827]">Upgrade to Create More Projects</h2>
                <p className="text-[#6b7280] mt-2">Get access to unlimited projects and additional features</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Create unlimited projects</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Priority support</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Advanced AI capabilities</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Export to multiple formats</p>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleUpgradeClick}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0F533A]/90 transition-colors w-full sm:w-auto"
                >
                  Upgrade Now
                </button>
              </div>
            </div>

            <div className="text-center">
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

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
              <Link href="/projects" className="hover:text-[#111827] transition-colors">Projects</Link>
              <span>/</span>
              <span className="text-[#111827]">New Project</span>
            </div>
            <h1 className="text-3xl font-bold text-[#111827]">Create a new project</h1>
            <p className="text-[#6b7280] mt-2">Set up a new project to organize your product documentation</p>
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

          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-2">
                    Project name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#111827] mb-2">
                    Description <span className="text-[#6b7280]">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors min-h-[100px]"
                    placeholder="Short description of your project"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-[#6b7280] hover:text-[#111827] hover:bg-[#f0f2f5] transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#0F533A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 