import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { PRD, prdStore } from '../../utils/prdStore';
import { ScreenSet, screenStore, Screen as ScreenType } from '../../utils/screenStore';
import { generateScreens } from '../../utils/screenGenerator';
import MockNotification from '../../components/MockNotification';
import { isMockData } from '../../utils/mockDetector';
import { v4 as uuidv4 } from 'uuid';
import { AppFlow, FlowStep } from '../../utils/screenStore';
import Modal from '../../components/Modal';
import { briefService } from '../../services/briefService';
import screenService from '../../services/screenService';
import { prdService } from '../../services/prdService';
import { projectService } from '../../services/projectService';
import CheckIcon from '../../components/CheckIcon';
import { trackEvent } from '../../lib/mixpanelClient';
import UserJourneyFlowDiagram from '../../components/UserJourneyFlowDiagram';

export default function ScreensPage() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [prd, setPRD] = useState<PRD | null>(null);
  const [screenSet, setScreenSet] = useState<ScreenSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [stepDescription, setStepDescription] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState<string | undefined>();
  const [afterStepId, setAfterStepId] = useState<string | undefined>('start');
  const [isDeleteScreensModalOpen, setIsDeleteScreensModalOpen] = useState(false);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [screens, setScreens] = useState<ScreenType[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Update screens array when screenSet changes and reset currentScreenIndex
  useEffect(() => {
    if (screenSet && screenSet.screens) {
      // Reset to the first screen when screens are loaded or regenerated
      setCurrentScreenIndex(0);
    }
  }, [screenSet]);

  useEffect(() => {
    setUsingMockData(isMockData());
    setIsLoading(true);
    
    if (id) {
      console.log(`Screens page: Loading data for ID: ${id}`);
      
      // First, try to find a PRD with this ID
      const foundPRD = prdStore.getPRD(id as string);
      console.log(`Screens page: PRD lookup result:`, foundPRD);
      
      if (foundPRD) {
        // If we found a PRD, use it
        console.log(`Screens page: Using PRD with ID: ${foundPRD.id}`);
        setPRD(foundPRD);
        
        // Get the brief using the briefId from the PRD
        const foundBrief = briefStore.getBrief(foundPRD.briefId);
        console.log(`Screens page: Brief lookup result for briefId ${foundPRD.briefId}:`, foundBrief);
        
        if (foundBrief) {
          setBrief(foundBrief);
          const foundProject = projectStore.getProject(foundBrief.projectId);
          console.log(`Screens page: Project lookup result:`, foundProject);
          setProject(foundProject);
        } else {
          console.error(`Screens page: Brief not found for briefId: ${foundPRD.briefId}`);
          // Try to load the brief directly from local storage as a fallback
          const allBriefs = briefStore.getBriefs();
          console.log(`Screens page: Checking all briefs:`, allBriefs);
          const matchingBrief = allBriefs.find(b => b.id === foundPRD.briefId);
          
          if (matchingBrief) {
            console.log(`Screens page: Found matching brief in all briefs:`, matchingBrief);
            setBrief(matchingBrief);
            const foundProject = projectStore.getProject(matchingBrief.projectId);
            setProject(foundProject);
          } else {
            // If not found in localStorage, try to fetch from Supabase
            console.log(`Screens page: Brief not found in localStorage, trying to fetch from Supabase`);
            
            // Use an IIFE to allow async/await in useEffect
            (async () => {
              try {
                const supabaseBrief = await briefService.fetchBriefFromSupabase(foundPRD.briefId);
                
                if (supabaseBrief) {
                  console.log(`Screens page: Brief found in Supabase:`, supabaseBrief);
                  
                  // Convert Supabase brief to local format
                  const localBrief: Brief = {
                    id: supabaseBrief.id,
                    projectId: supabaseBrief.project_id,
                    productName: supabaseBrief.product_name,
                    problemStatement: supabaseBrief.brief_data?.problemStatement || '',
                    targetUsers: supabaseBrief.brief_data?.targetUsers || '',
                    proposedSolution: supabaseBrief.brief_data?.proposedSolution || '',
                    productObjectives: supabaseBrief.brief_data?.productObjectives || '',
                    createdAt: supabaseBrief.created_at,
                    content: JSON.stringify(supabaseBrief.brief_data),
                    briefData: supabaseBrief.brief_data,
                    formData: supabaseBrief.form_data,
                    isEditing: false,
                    showEditButtons: false
                  };
                  
                  setBrief(localBrief);
                  
                  // Also save to localStorage for future use
                  briefStore.updateBrief(localBrief.id, localBrief.briefData);
                  
                  const foundProject = projectStore.getProject(localBrief.projectId);
                  setProject(foundProject);
                } else {
                  console.error(`Screens page: Brief not found in Supabase for briefId: ${foundPRD.briefId}`);
                  setError("Brief not found. Please ensure you have created a brief before accessing this page.");
                }
              } catch (error) {
                console.error(`Screens page: Error fetching brief from Supabase:`, error);
                setError("Error loading brief. Please try again later.");
              } finally {
                // Make sure to set isLoading to false even if there's an error
                setIsLoading(false);
              }
            })();
          }
        }
        
        // Load screen set from Supabase
        (async () => {
          try {
            console.log(`Screens page: Loading screen set for PRD ID: ${foundPRD.id}`);
            const supabaseScreenSet = await screenService.getScreenSetByPrdId(foundPRD.id);
            
            console.log(`Screens page: Screen set found in Supabase:`, supabaseScreenSet);
            setScreenSet(supabaseScreenSet);
            setIsLoading(false);
          } catch (error) {
            console.error(`Screens page: Error loading screen set:`, error);
            setIsLoading(false);
          }
        })();
      } else {
        // If we didn't find a PRD in local storage, try to fetch it from Supabase
        console.log(`Screens page: PRD not found in local storage, trying to fetch from Supabase for ID: ${id}`);
        
        // Use an IIFE to allow async/await in useEffect
        (async () => {
          try {
            // Try to fetch the PRD from Supabase
            const supabasePRD = await prdService.getPRDById(id as string);
            
            if (supabasePRD) {
              console.log(`Screens page: PRD found in Supabase:`, supabasePRD);
              
              // Save to local store for future use
              prdStore.updatePRD(supabasePRD.id, { 
                title: supabasePRD.title,
                content: supabasePRD.content,
                featureSetId: supabasePRD.featureSetId
              });
              
              // Set the PRD in state
              setPRD(supabasePRD);
              
              // Now try to get the brief
              const supabaseBrief = await briefService.fetchBriefFromSupabase(supabasePRD.briefId);
              
              if (supabaseBrief) {
                console.log(`Screens page: Brief found in Supabase:`, supabaseBrief);
                
                // Convert Supabase brief to local format
                const localBrief: Brief = {
                  id: supabaseBrief.id,
                  projectId: supabaseBrief.project_id,
                  productName: supabaseBrief.product_name,
                  problemStatement: supabaseBrief.brief_data?.problemStatement || '',
                  targetUsers: supabaseBrief.brief_data?.targetUsers || '',
                  proposedSolution: supabaseBrief.brief_data?.proposedSolution || '',
                  productObjectives: supabaseBrief.brief_data?.productObjectives || '',
                  createdAt: supabaseBrief.created_at,
                  content: JSON.stringify(supabaseBrief.brief_data),
                  briefData: supabaseBrief.brief_data,
                  formData: supabaseBrief.form_data,
                  isEditing: false,
                  showEditButtons: false
                };
                
                // Save to local store for future use
                briefStore.updateBrief(localBrief.id, localBrief.briefData);
                
                // Set the brief in state
                setBrief(localBrief);
                
                // Get the project
                const foundProject = projectStore.getProject(localBrief.projectId);
                
                if (foundProject) {
                  setProject(foundProject);
                } else {
                  // Try to fetch the project from Supabase
                  const supabaseProject = await projectService.getProjectById(localBrief.projectId);
                  
                  if (supabaseProject) {
                    setProject(supabaseProject);
                  } else {
                    console.error(`Screens page: Project not found for projectId: ${localBrief.projectId}`);
                    setError("Project not found. Please ensure the project exists.");
                  }
                }
                
                // Now try to load the screen set
                const supabaseScreenSet = await screenService.getScreenSetByPrdId(supabasePRD.id);
                
                console.log(`Screens page: Screen set found in Supabase:`, supabaseScreenSet);
                setScreenSet(supabaseScreenSet);
              } else {
                console.error(`Screens page: Brief not found in Supabase for briefId: ${supabasePRD.briefId}`);
                setError("Brief not found. Please ensure you have created a brief before accessing this page.");
              }
            } else {
              console.error(`Screens page: Neither PRD nor brief found with ID: ${id}`);
              setError("PRD not found. Please ensure you have created a PRD before accessing this page.");
            }
          } catch (error) {
            console.error(`Screens page: Error fetching data from Supabase:`, error);
            setError("Error loading data. Please try again later.");
          } finally {
            setIsLoading(false);
          }
        })();
      }
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const handleGenerateScreens = async () => {
    if (!brief || !prd) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // Track the start of screen generation
      trackEvent('Screen Generation Started', {
        'PRD ID': prd.id,
        'Project ID': brief.projectId,
      });
      
      // Initialize progress
      setProgressPercentage(10);
      setGenerationStatus('Initializing screen generation...');
      
      try {
        // Analyzing features
        setProgressPercentage(30);
        setGenerationStatus('Analyzing features and requirements...');
        
        // Generating content
        setProgressPercentage(50);
        setGenerationStatus('Generating screen layouts and content...');
        
        // Generate screens using OpenAI
        const { screens, appFlow } = await generateScreens(brief, prd);
        
        // Processing content
        setProgressPercentage(70);
        setGenerationStatus('Processing generated screens...');
        
        // Parsing and validating
        setProgressPercentage(80);
        setGenerationStatus('Parsing and validating screen data...');
        
        // Save screens to Supabase
        setProgressPercentage(90);
        setGenerationStatus('Saving screens...');
        await screenService.saveScreenSet(prd.id, screens, appFlow);
        
        // Update local state
        setScreenSet({
          screens,
          appFlow
        });
        
        // Complete
        setProgressPercentage(100);
        setGenerationStatus('Completed! Loading screens...');
        
        // Track successful screen generation
        trackEvent('Screens Generated Successfully', {
          'PRD ID': prd.id,
          'Project ID': brief.projectId,
          'Screen Count': screens.length,
          'App Flow Steps': appFlow.steps.length,
          'Generation Time (ms)': Date.now() - (window.performance && window.performance.now ? window.performance.now() : 0)
        });
        
        // Check if these are fallback screens
        const isFallbackScreens = screens.length <= 2 && 
                                 screens.some(s => s.name === "Login Screen") && 
                                 screens.every(s => s.elements.length <= 4);
        
        if (isFallbackScreens) {
          setError('We encountered an issue generating detailed screens. Basic screens have been created instead. You can try again later or continue with these screens.');
          
          // Track fallback screens generation
          trackEvent('Fallback Screens Generated', {
            'PRD ID': prd.id,
            'Project ID': brief.projectId,
            'Screen Count': screens.length
          });
        }
        
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationStatus('');
          setProgressPercentage(0);
        }, 1000);
        
      } catch (err) {
        console.error('Error in primary screen generation:', err);
        
        // Check if it's a timeout error (504) or if the API suggests using fallback screens
        const isTimeoutError = err.message && (err.message.includes('504') || err.message.includes('timeout') || err.message.includes('timed out'));
        const isFallbackSuggested = err.message && (err.message.includes('fallback screens') || err.message.includes('Gateway Timeout') || err.message.includes('Error parsing response') || err.message.includes('API request failed with status 502'));
        
        // Track the error
        trackEvent('Screen Generation Error', {
          'PRD ID': prd.id,
          'Project ID': brief.projectId,
          'Error Type': isTimeoutError ? 'Timeout' : 'API Error',
          'Error Message': err.message,
        });
        
        if (isTimeoutError && !isFallbackSuggested) {
          // For timeout errors without fallback suggestion, just show error and stop
          setIsGenerating(false);
          setGenerationStatus('');
          setProgressPercentage(0);
          setError('The screen generation process timed out. Please try again later when the server is less busy.');
          return;
        }
        
        // For fallback suggestion or other errors, try fallback generation
        try {
          setGenerationStatus('Creating basic screens instead...');
          setProgressPercentage(30);
          
          // Track fallback generation attempt
          trackEvent('Fallback Screen Generation Attempted', {
            'PRD ID': prd.id,
            'Project ID': brief.projectId,
            'Original Error': err.message
          });
          
          // Import the fallback generation functions directly from the screenGenerator
          const { generateFallbackAppFlow, generateFallbackScreens } = require('../../utils/screenGenerator');
          
          // Generate basic screens directly using the fallback functions
          setProgressPercentage(50);
          setGenerationStatus('Generating basic screens...');
          
          // First generate a fallback app flow
          const appFlow = generateFallbackAppFlow(brief, prd);
          
          // Then generate fallback screens based on that app flow
          const screens = generateFallbackScreens(brief, prd, appFlow);
          
          setProgressPercentage(80);
          setGenerationStatus('Processing and validating basic screens...');
          
          // Save screens to Supabase
          setProgressPercentage(90);
          setGenerationStatus('Saving basic screens...');
          await screenService.saveScreenSet(prd.id, screens, appFlow);
          
          // Update local state
          setScreenSet({
            screens,
            appFlow
          });
          
          setProgressPercentage(100);
          setGenerationStatus('Completed! Loading basic screens...');
          
          // Track successful fallback screen generation
          trackEvent('Fallback Screens Generated Successfully', {
            'PRD ID': prd.id,
            'Project ID': brief.projectId,
            'Screen Count': screens.length,
            'App Flow Steps': appFlow.steps.length
          });
          
          setTimeout(() => {
            setIsGenerating(false);
            setGenerationStatus('');
            setProgressPercentage(0);
          }, 1000);
          
          setError('We encountered an issue generating detailed screens. Basic screens have been created instead. You can try again later or continue with these screens.');
          
        } catch (fallbackErr) {
          console.error('Error in fallback screen generation:', fallbackErr);
          
          // Track fallback generation error
          trackEvent('Fallback Screen Generation Failed', {
            'PRD ID': prd.id,
            'Project ID': brief.projectId,
            'Original Error': err.message,
            'Fallback Error': fallbackErr.message
          });
          
          handleGenerationError(fallbackErr);
        }
      }
    } catch (err) {
      console.error('Error in overall screen generation process:', err);
      
      // Track overall process error
      trackEvent('Screen Generation Process Failed', {
        'PRD ID': prd.id,
        'Project ID': brief?.projectId,
        'Error Message': err.message
      });
      
      handleGenerationError(err);
    }
  };

  // Helper function to handle generation errors
  const handleGenerationError = (err: any) => {
    console.error('Error generating screens:', err);
    setIsGenerating(false);
    setProgressPercentage(0);
    setGenerationStatus('');
    
    // Provide more user-friendly error messages based on the error
    if (err.message && (err.message.includes('timed out') || err.message.includes('504') || err.message.includes('timeout'))) {
      setError('The screen generation process timed out. Please try again later when the server is less busy.');
    } else if (err.message && err.message.includes('Network error')) {
      setError('Network error. Please check your internet connection and try again.');
    } else if (err.message && (err.message.includes('API request failed with status 500') || 
                               err.message.includes('API request failed with status 400') ||
                               err.message.includes('API request failed with status 502') ||
                               err.message.includes('OpenAI API error'))) {
      setError('We encountered an issue with our AI service. Basic screens have been created instead. You can try again later or continue with these screens.');
    } else if (err.message && err.message.includes('Invalid response format from OpenAI')) {
      setError('We encountered an issue with our AI service. Basic screens have been created instead. You can try again later or continue with these screens.');
    } else if (err.message && (err.message.includes('fallback screens') || 
                              err.message.includes('Gateway Timeout') ||
                              err.message.includes('Error parsing response'))) {
      setError('We encountered an issue generating detailed screens. Basic screens have been created instead. You can try again later or continue with these screens.');
    } else {
      setError('Unable to generate detailed screens at this time. Basic screens have been created instead. You can try again later or continue with these screens.');
    }
  };

  const handleDeleteScreens = () => {
    if (!screenSet || !prd) return;
    setIsDeleteScreensModalOpen(true);
  };

  const confirmDeleteScreens = async () => {
    if (!screenSet || !prd) return;
    
    try {
      // Delete from Supabase
      await screenService.deleteScreenSet(screenSet.appFlow.id);
      
      // Also delete from local storage for backward compatibility
      screenStore.deleteScreenSet(screenSet.appFlow.id);
      
      // Track successful deletion
      trackEvent('Screens Deleted Successfully', {
        'PRD ID': prd.id,
        'Brief ID': brief?.id,
        'Project ID': brief?.projectId,
        'Screen Count': screenSet.screens.length
      });
      
      setScreenSet(null);
      setIsDeleteScreensModalOpen(false);
    } catch (error) {
      console.error('Error deleting screens:', error);
      setError('Failed to delete screens. Please try again.');
      setIsDeleteScreensModalOpen(false);
    }
  };

  // Handle editing a step in the user journey
  const handleEditStep = (step: FlowStep) => {
    setEditingStep(step);
    setStepDescription(step.description);
    setSelectedScreenId(step.screenId);
    setIsStepModalOpen(true);
  };

  // Handle adding a step to the user journey
  const handleAddStep = () => {
    setEditingStep(null);
    setStepDescription('');
    setSelectedScreenId(undefined);
    setIsStepModalOpen(true);
  };

  // Handle saving a step in the user journey
  const handleSaveStep = async () => {
    if (!screenSet) return;

    // Create a copy of the current screen set
    const updatedScreenSet = { ...screenSet };
    const updatedFlow = { ...updatedScreenSet.appFlow };
    let updatedSteps = [...updatedFlow.steps];

    if (editingStep) {
      // Edit existing step
      updatedSteps = updatedSteps.map(step => 
        step.id === editingStep.id 
          ? { ...step, description: stepDescription, screenId: selectedScreenId } 
          : step
      );
    } else {
      // Add new step
      const newStep: FlowStep = {
        id: uuidv4(),
        description: stepDescription,
        screenId: selectedScreenId
      };
      
      // Append to the end of steps array
      updatedSteps.push(newStep);
    }

    // Update the steps
    updatedFlow.steps = updatedSteps;
    updatedScreenSet.appFlow = updatedFlow;

    // Update state
    setScreenSet(updatedScreenSet);
    setIsStepModalOpen(false);

    // Save to database if not mock data
    if (!usingMockData && id) {
      try {
        await screenService.updateScreenSet(id as string, updatedScreenSet);
      } catch (error) {
        console.error('Failed to save step:', error);
      }
    }
  };

  // Handle deleting a step from the user journey
  const handleDeleteStep = async (stepId: string) => {
    if (!screenSet) return;

    // Create a copy of the current screen set
    const updatedScreenSet = { ...screenSet };
    const updatedFlow = { ...updatedScreenSet.appFlow };
    
    // Remove the step
    updatedFlow.steps = updatedFlow.steps.filter(step => step.id !== stepId);
    updatedScreenSet.appFlow = updatedFlow;

    // Update state
    setScreenSet(updatedScreenSet);

    // Save to database if not mock data
    if (!usingMockData && id) {
      try {
        await screenService.updateScreenSet(id as string, updatedScreenSet);
      } catch (error) {
        console.error('Failed to delete step:', error);
      }
    }
  };

  const renderScreen = (screen: ScreenType) => {
    // Group elements by type, with defensive checks
    const elements = {
      images: (screen.elements || []).filter(e => e && e.type === 'image'),
      inputs: (screen.elements || []).filter(e => e && e.type === 'input'),
      text: (screen.elements || []).filter(e => e && e.type === 'text'),
      buttons: (screen.elements || []).filter(e => e && e.type === 'button')
    };

    return (
      <div key={screen.id} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-[#0F533A]/10 to-transparent px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="text-lg font-medium text-[#111827]">{screen.name}</h3>
          <p className="text-[#6b7280] mt-1 line-clamp-2">{screen.description}</p>
          {screen.featureId && screen.featureId.trim() !== '' && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Feature: {screen.featureId}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
          {/* Images Section */}
          {elements.images.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151] flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.67 18.95L7.6 15.64C8.39 15.11 9.53 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Images
              </h4>
              {elements.images.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4 border border-[#e5e7eb] hover:border-[#0F533A]/30 transition-colors">
                  <p className="text-[#4b5563] text-sm">{element.properties.description || 'No description provided'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Inputs Section */}
          {elements.inputs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151] flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 8.34961H16.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.5 15.6504H13.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Input Fields
              </h4>
              {elements.inputs.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4 border border-[#e5e7eb] hover:border-[#0F533A]/30 transition-colors">
                  <p className="text-[#4b5563] text-sm">{element.properties.description || 'No description provided'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Information Section */}
          {elements.text.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151] flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.5 9.08984H20.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.9955 13.7002H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.29431 13.7002H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.29431 16.7002H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Information
              </h4>
              {elements.text.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4 border border-[#e5e7eb] hover:border-[#0F533A]/30 transition-colors">
                  <p className="text-[#4b5563] text-sm">{element.properties.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Section */}
          {elements.buttons.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151] flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.28 10.45L21 6.72998L17.28 3.01001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 6.72998H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.72 13.55L3 17.27L6.72 20.99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 17.27H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Navigation
              </h4>
              {elements.buttons.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4 border border-[#e5e7eb] hover:border-[#0F533A]/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4b5563] text-sm font-medium">{element.properties.content}</span>
                    {element.properties.action && (
                      <span className="text-[#0F533A] text-sm flex items-center">
                        <span className="mr-1">to</span>
                        <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                          <path d="M14.4301 5.92993L20.5001 11.9999L14.4301 18.0699" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {element.properties.action}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A] mx-auto mb-4"></div>
          <p className="text-[#4b5563]">Loading screens...</p>
        </div>
      </div>
    );
  }

  if (error || !prd) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-6 py-10 max-w-5xl">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8 text-center">
            <svg className="w-16 h-16 text-[#f87171] mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="text-2xl font-bold text-[#111827] mb-2">Error while generating the screens</h2>
            <p className="text-[#4b5563] mb-6">
              {error || "We couldn't find the PRD you're looking for. It may have been deleted or the ID is incorrect."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center bg-white border border-[#d1d5db] text-[#111827] px-5 py-2.5 rounded-lg font-medium hover:bg-[#f3f4f6] transition-colors"
              >
                Go to projects
              </Link>
              {brief && (
                <Link
                  href={`/prd/${brief.id}`}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                >
                  Go to PRD generation
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="mb-10">
          <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
            <Link href="/projects" className="hover:text-[#111827] transition-colors flex items-center">
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Projects
            </Link>
            <span>/</span>
            {project && (
              <>
                <Link href={`/project/${project.id}`} className="hover:text-[#111827] transition-colors">
                  {project.name}
                </Link>
                <span>/</span>
              </>
            )}
            {brief && (
              <>
                <Link href={`/brief/${brief.id}`} className="hover:text-[#111827] transition-colors">
                  Brief
                </Link>
                <span>/</span>
              </>
            )}
            <Link href={`/prd/${prd.id}`} className="hover:text-[#111827] transition-colors">
              PRD
            </Link>
            <span>/</span>
            <span className="text-[#111827]">Screens</span>
          </div>
          
          {usingMockData && <MockNotification stage="screens" />}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">App Screens</h1>
              <p className="text-[#6b7280] mt-2">Screen wireframes and app flow for {brief ? brief.productName : 'your product'}</p>
              <div className="inline-flex flex-wrap items-center mt-3 mb-2 px-3 py-1.5 bg-[#0F533A]/5 border border-[#0F533A]/10 rounded-full text-sm">
                <svg className="w-4 h-4 mr-1.5 text-[#0F533A] flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.5 9.08984H20.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[#4b5563]">Up to 4 journey steps and App screens</span>
                <Link 
                  href="/upgrade" 
                  className="ml-2 sm:ml-2 mt-0.5 sm:mt-0 font-medium text-[#0F533A] hover:text-[#0F533A]/90 flex items-center"
                >
                  <span className="bg-[#0F533A]/10 px-2 py-0.5 rounded-full">Upgrade</span>
                  <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.91003 19.9201L15.43 13.4001C16.2 12.6301 16.2 11.3701 15.43 10.6001L8.91003 4.08008" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-3 self-start mt-1 md:mt-0">
              {screenSet && screenSet.screens && screenSet.screens.length > 0 ? (
                <>
                  <Link
                    href={`/docs/${prd.id}`}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                  >
                    Continue
                  </Link>
                  <button
                    onClick={handleDeleteScreens}
                    className="inline-flex items-center justify-center bg-white text-[#6b7280] hover:text-[#111827] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGenerateScreens}
                  disabled={isGenerating}
                  className={`inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Screens...
                    </>
                  ) : (
                    'Generate App Screens'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Generation Status Message */}
        {generationStatus && (
          <div className="mt-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>{generationStatus}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 mt-2">
          {!screenSet || (screenSet.screens && screenSet.screens.length === 0) ? (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 11H16" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 16H12" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    What are App Screens?
                  </h3>
                  <p className="text-[#4b5563] mb-4 leading-relaxed">
                    App screens are visual representations of your application's interface. They help:
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#4b5563]">
                    <li className="flex items-start">
                      <CheckIcon className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-[#0F533A]">Visualize user interface and navigation flow</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-[#0F533A]">Guide developers with clear implementation details</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-[#0F533A]">Ensure consistent user experience across features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-[#0F533A]">Validate design decisions before development</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#0F533A]/5 to-transparent rounded-xl p-6">
                  <h4 className="text-sm font-medium text-[#0F533A] mb-3">What Will Be Generated?</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                      <span className="text-[#4b5563]">Complete user flow with step-by-step navigation</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                      <span className="text-[#4b5563]">Essential screens based on your PRD features</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                      <span className="text-[#4b5563]">Core functionality screens (auth, dashboard, etc.)</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Add Flow Diagram */}
              {screenSet && (
                <UserJourneyFlowDiagram 
                  appFlow={screenSet.appFlow} 
                  screens={screenSet.screens} 
                  onAddStep={handleAddStep}
                  onDeleteStep={handleDeleteStep}
                />
              )}
              
              {/* Screens Section */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                    <h2 className="text-xl font-semibold text-[#111827]">App Screens</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-[#6b7280]">
                      {currentScreenIndex + 1} of {screenSet.screens.length}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setCurrentScreenIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentScreenIndex === 0}
                        className={`p-1.5 rounded-full ${currentScreenIndex === 0 ? 'text-[#d1d5db] cursor-not-allowed' : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]'} transition-colors`}
                        aria-label="Previous screen"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => setCurrentScreenIndex(prev => Math.min(screenSet.screens.length - 1, prev + 1))}
                        disabled={currentScreenIndex === screenSet.screens.length - 1}
                        className={`p-1.5 rounded-full ${currentScreenIndex === screenSet.screens.length - 1 ? 'text-[#d1d5db] cursor-not-allowed' : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6]'} transition-colors`}
                        aria-label="Next screen"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 19.92L15.52 13.4C16.29 12.63 16.29 11.37 15.52 10.6L9 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Screen Carousel */}
                  <div className="overflow-hidden">
                    <div 
                      className="transition-transform duration-300 ease-in-out flex"
                      style={{ transform: `translateX(-${currentScreenIndex * 100}%)` }}
                    >
                      {screenSet.screens.map((screen, index) => (
                        <div 
                          key={screen.id} 
                          className="w-full flex-shrink-0 flex-grow-0"
                          style={{ 
                            minWidth: '100%',
                            opacity: Math.abs(currentScreenIndex - index) > 1 ? 0.4 : 1,
                          }}
                        >
                          <div className="h-[500px] max-h-[70vh] px-1">
                            {renderScreen(screen)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation Buttons (for larger screens) */}
                  <button 
                    onClick={() => setCurrentScreenIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentScreenIndex === 0}
                    className={`absolute top-1/2 left-0 transform -translate-y-1/2 -ml-4 p-2 rounded-full bg-white shadow-md border border-[#e5e7eb] ${currentScreenIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-100 hover:border-[#0F533A]/30'} transition-all hidden md:block z-10`}
                    aria-label="Previous screen"
                  >
                    <svg className="w-5 h-5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => setCurrentScreenIndex(prev => Math.min(screenSet.screens.length - 1, prev + 1))}
                    disabled={currentScreenIndex === screenSet.screens.length - 1}
                    className={`absolute top-1/2 right-0 transform -translate-y-1/2 -mr-4 p-2 rounded-full bg-white shadow-md border border-[#e5e7eb] ${currentScreenIndex === screenSet.screens.length - 1 ? 'opacity-0 cursor-default' : 'opacity-100 hover:border-[#0F533A]/30'} transition-all hidden md:block z-10`}
                    aria-label="Next screen"
                  >
                    <svg className="w-5 h-5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 19.92L15.52 13.4C16.29 12.63 16.29 11.37 15.52 10.6L9 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                {/* Screen Indicators */}
                <div className="flex justify-center mt-6 space-x-1.5">
                  {screenSet.screens.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentScreenIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${currentScreenIndex === index ? 'bg-[#0F533A] w-6' : 'bg-[#d1d5db] hover:bg-[#9ca3af]'}`}
                      aria-label={`Go to screen ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Step Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStep ? "Edit Journey Step" : "Add Journey Step"}
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                rows={3}
                value={stepDescription}
                onChange={(e) => setStepDescription(e.target.value)}
                placeholder="Describe what happens in this step..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Screen
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                value={selectedScreenId || ''}
                onChange={(e) => setSelectedScreenId(e.target.value || undefined)}
              >
                <option value="">Select a screen</option>
                {screenSet?.screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name}
                  </option>
                ))}
              </select>
            </div>
            {!editingStep && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add After Step
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                  value={afterStepId}
                  onChange={(e) => setAfterStepId(e.target.value)}
                >
                  <option value="start">At the beginning</option>
                  {screenSet?.appFlow.steps.map((step, index) => (
                    <option key={step.id} value={step.id}>
                      After Step {index + 1}: {step.description.substring(0, 30)}{step.description.length > 30 ? '...' : ''}
                    </option>
                  ))}
                  <option value="end">At the end</option>
                </select>
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveStep()}
                className="px-4 py-2 text-sm bg-[#0F533A] text-white rounded-md hover:bg-[#0a3f2c]"
              >
                Save Step
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setStepToDelete(null);
          }}
          title="Delete Step"
        >
          <div className="p-6">
            <p className="mb-6 text-gray-700">Are you sure you want to delete this step?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setStepToDelete(null);
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (stepToDelete) {
                    handleDeleteStep(stepToDelete);
                  }
                  setIsDeleteModalOpen(false);
                  setStepToDelete(null);
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Screens Confirmation Modal */}
        <Modal
          isOpen={isDeleteScreensModalOpen}
          onClose={() => setIsDeleteScreensModalOpen(false)}
          title="Delete Screens"
        >
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete these screens? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteScreensModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteScreens}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
} 