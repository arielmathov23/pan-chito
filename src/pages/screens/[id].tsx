import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { PRD, prdStore } from '../../utils/prdStore';
import { 
  ScreenSet, 
  screenStore, 
  Screen as ScreenType,
  normalizeScreenSet,
  normalizeScreen 
} from '../../utils/screenStore';
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
import ScreenWireframe from '../../components/ScreenWireframe';
import { SvgWireframe } from '../../components/SvgWireframe';
import { wireframeService } from '../../services/wireframeService';
import { projectLimitService } from '../../services/projectLimitService';

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
  const [generatingSvg, setGeneratingSvg] = useState(false);
  const [svgProgress, setSvgProgress] = useState(0);
  const [svgGenerationError, setSvgGenerationError] = useState<string | null>(null);
  const [currentWireframeTab, setCurrentWireframeTab] = useState<'basic' | 'svg'>('basic');
  const [svgWireframes, setSvgWireframes] = useState<Map<string, any>>(new Map());
  const [hasSvgWireframesAccess, setHasSvgWireframesAccess] = useState<boolean | null>(null);

  // Check if user has access to SVG wireframes
  useEffect(() => {
    async function checkSvgWireframesAccess() {
      try {
        const hasAccess = await projectLimitService.canGenerateSvgWireframes();
        setHasSvgWireframesAccess(hasAccess);
        console.log('SVG wireframes access:', hasAccess ? 'Enabled' : 'Disabled');
      } catch (error) {
        console.error('Error checking SVG wireframes access:', error);
        setHasSvgWireframesAccess(false);
      }
    }

    checkSvgWireframesAccess();
  }, []);

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

  // Update useEffect to avoid infinite loop
  useEffect(() => {
    async function loadData() {
      try {
        if (id) {
          // Fetch screenset if ID is available
          const fetchedScreenSet = await screenService.getScreenSetByPrdId(id as string);
          
          // Only normalize and update if there's actually a change
          if (fetchedScreenSet) {
            const normalizedScreenSet = normalizeScreenSet(fetchedScreenSet);
            setScreenSet(normalizedScreenSet);
            setScreens(normalizedScreenSet?.screens || []);
          }
        }
      } catch (error) {
        console.error('Error loading screen set:', error);
        setError('Failed to load screens. Please refresh the page.');
      }
    }
    
    // Only load data if we don't have screenSet yet or if id changes
    if (!screenSet || (id && screenSet?.appFlow?.prdId !== id)) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    // Load SVG wireframes for all screens
    async function loadSvgWireframes() {
      if (screenSet && screenSet.screens && screenSet.screens.length > 0) {
        const wireframesMap = new Map();
        
        for (const screen of screenSet.screens) {
          try {
            const svg = await wireframeService.getSvgWireframe(screen.id);
            if (svg) {
              wireframesMap.set(screen.id, svg);
            }
          } catch (error) {
            console.error(`Error loading SVG wireframe for screen ${screen.id}:`, error);
          }
        }
        
        setSvgWireframes(wireframesMap);
      }
    }
    
    loadSvgWireframes();
  }, [screenSet]);

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
        
        // Update local state with normalized screens
        const normalizedScreenSet = normalizeScreenSet({
          screens,
          appFlow
        });
        setScreenSet(normalizedScreenSet);
        setScreens(normalizedScreenSet?.screens || []);
        
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
          
          // Update local state with normalized screens
          const normalizedScreenSet = normalizeScreenSet({
            screens,
            appFlow
          });
          setScreenSet(normalizedScreenSet);
          setScreens(normalizedScreenSet?.screens || []);
          
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
      
      // Update state - clear screens and screenSet
      setScreenSet(null);
      setScreens([]);
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

  // Function to generate SVG wireframes
  const handleGenerateSvgWireframes = async () => {
    // Check if user has access to SVG wireframes
    if (hasSvgWireframesAccess === false) {
      // Track the upgrade event
      trackEvent('Upgrade Required', {
        feature: 'SVG Wireframes',
        source: 'Screens Page',
        prdId: id
      });
      
      // Redirect to upgrade page
      router.push('/upgrade');
      return;
    }
    
    if (!screenSet || !screenSet.screens) {
      setSvgGenerationError("No screens available to generate wireframes");
      return;
    }

    setGeneratingSvg(true);
    setSvgGenerationError(null);
    setSvgProgress(1);

    const progressTimer = setInterval(() => {
      setSvgProgress(prev => {
        const increment = Math.random() * 3 + 2;
        const newProgress = prev + increment;
        return newProgress > 70 ? 70 : newProgress;
      });
    }, 1500);

    try {
      // Track event
      trackEvent('Generate SVG Wireframes', {
        prdId: id as string,
        screenCount: screenSet.screens.length,
      });

      // IMPORTANT: First, make sure we're working with the latest screen data from the database
      let latestScreens: ScreenType[] = [];
      
      if (!id) {
        throw new Error("Invalid PRD ID. Please reload the page and try again.");
      }

      try {
        setSvgProgress(5);
        // Fetch the latest screen data from the database to ensure we have correct IDs
        const freshScreenSet = await screenService.getScreenSetByPrdId(id.toString());
        
        if (!freshScreenSet || !freshScreenSet.screens || freshScreenSet.screens.length === 0) {
          console.error("No screens found in database for PRD ID:", id);
          throw new Error("No screens found in database. Please regenerate screens first.");
        }

        // Map the fresh screen data to maintain the same order as our current screenSet
        latestScreens = screenSet.screens.map(currentScreen => {
          // First try to find a direct ID match
          let matchingScreen = freshScreenSet.screens.find(s => s.id === currentScreen.id);
          
          // If no direct match, try matching by name and description
          if (!matchingScreen) {
            console.log(`No exact ID match found for screen ID ${currentScreen.id}, trying name/description match`);
            matchingScreen = freshScreenSet.screens.find(s => 
              s.name === currentScreen.name && 
              s.description === currentScreen.description
            );
          }
          
          // If still no match, try matching just by name
          if (!matchingScreen) {
            console.log(`No name/description match found for screen "${currentScreen.name}", trying name-only match`);
            matchingScreen = freshScreenSet.screens.find(s => s.name === currentScreen.name);
          }
          
          if (!matchingScreen) {
            console.error(`No database match found for screen "${currentScreen.name}" (ID: ${currentScreen.id})`);
            console.log(`Available screens in database:`, 
              freshScreenSet.screens.map(s => ({ id: s.id, name: s.name }))
            );
            throw new Error(`Screen "${currentScreen.name}" not found in database. Please regenerate screens.`);
          }
          
          // Log the mapping for debugging
          if (matchingScreen.id !== currentScreen.id) {
            console.log(`Mapped screen "${currentScreen.name}" from ID ${currentScreen.id} to database ID ${matchingScreen.id}`);
          }
          
          return matchingScreen;
        });

        // Update the local screen set to match what's in the database
        setScreenSet(freshScreenSet);
      } catch (error) {
        console.error("Error fetching latest screen data:", error);
        throw new Error("Failed to verify screen data in database. Please try again.");
      }
      
      // Generate wireframes using the Claude API
      const prdContent = typeof prd?.content === 'string' ? prd.content : JSON.stringify(prd?.content || '');
      const result = await wireframeService.generateSvgWireframes(latestScreens, prdContent);
      
      clearInterval(progressTimer);
      
      if (result.totalSuccessful === 0) {
        throw new Error("Failed to generate any wireframes. Please try again.");
      }

      setSvgProgress(75);
      
      let savedCount = 0;
      const screenErrors: Map<string, string> = new Map();
      const batchSize = 3;
      
      for (let i = 0; i < result.successful.length; i += batchSize) {
        const batch = result.successful.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item) => {
          try {
            if (!item.svg || !item.svg.trim().startsWith('<svg') || !item.svg.trim().endsWith('</svg>')) {
              throw new Error(`Invalid SVG content received for screen ${item.screenId}`);
            }
            
            // Find the matching screen from our latest data
            const matchingScreen = latestScreens.find(screen => screen.id === item.screenId);
            if (!matchingScreen) {
              throw new Error(`Screen with ID ${item.screenId} doesn't exist in database`);
            }
            
            // Save to the new SVG wireframes table instead of updating the screen
            await wireframeService.saveSvgWireframe(
              item.screenId,
              matchingScreen.name,
              item.svg
            );
            
            savedCount++;
            
            const saveProgressIncrement = 20 * (savedCount / result.totalSuccessful);
            setSvgProgress(75 + saveProgressIncrement);
            
            return { success: true, screenId: item.screenId };
          } catch (error: any) {
            console.error(`Error saving SVG for screen ${item.screenId}:`, error);
            screenErrors.set(item.screenId, error.message || 'Unknown error');
            return { success: false, screenId: item.screenId, error };
          }
        });
        
        await Promise.all(batchPromises);
      }
      
      // Refresh the screen set to get the updated SVG wireframes
      if (id) {
        try {
          const updatedScreenSet = await screenService.getScreenSetByPrdId(id.toString());
          setScreenSet(updatedScreenSet);
        } catch (refreshError) {
          console.error("Error refreshing screen set after SVG generation:", refreshError);
        }
      }
      
      setSvgProgress(100);
      
      const failedCount = screenErrors.size;
      if (failedCount > 0) {
        const errorMessage = `Generated ${savedCount} wireframes successfully, but ${failedCount} failed to save. Please try regenerating the failed screens.`;
        setSvgGenerationError(errorMessage);
      }
      
      // Reload SVG wireframes after generation
      if (savedCount > 0) {
        // Load the new SVG wireframes
        const wireframesMap = new Map();
        for (const screenId of result.successful.map(s => s.screenId)) {
          try {
            // Small delay to ensure database writes have completed
            await new Promise(resolve => setTimeout(resolve, 500));
            const svg = await wireframeService.getSvgWireframe(screenId);
            if (svg) {
              wireframesMap.set(screenId, svg);
            }
          } catch (error) {
            console.error(`Error loading generated SVG wireframe for screen ${screenId}:`, error);
          }
        }
        
        // Update the SVG wireframes state
        setSvgWireframes(prev => {
          const newMap = new Map(prev);
          wireframesMap.forEach((value, key) => {
            newMap.set(key, value);
          });
          return newMap;
        });
        
        setCurrentWireframeTab('svg');
      }
    } catch (error: any) {
      clearInterval(progressTimer);
      console.error('Error generating SVG wireframes:', error);
      setSvgGenerationError(error.message || 'Failed to generate wireframes');
      setSvgProgress(0);
    } finally {
      setGeneratingSvg(false);
    }
  };

  const renderScreen = (screen: ScreenType) => {
    // Check if SVG wireframe exists in the new table
    const svgWireframe = svgWireframes.get(screen.id);
    const hasSvgWireframe = !!svgWireframe || !!screen.svgWireframe;

    return (
      <div key={screen.id} className="mb-8 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{screen.name}</h3>
        </div>

        {/* Screen description */}
        <div className="mb-4">
          <p className="text-gray-600 text-sm">{screen.description}</p>
        </div>
        
        {/* Wireframe tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setCurrentWireframeTab('basic')}
              className={`${
                currentWireframeTab === 'basic'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Basic Wireframe
            </button>
            <button
              onClick={() => hasSvgWireframe ? setCurrentWireframeTab('svg') : null}
              disabled={!hasSvgWireframe}
              className={`${
                currentWireframeTab === 'svg'
                  ? 'border-indigo-500 text-indigo-600'
                  : hasSvgWireframe 
                    ? 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300' 
                    : 'border-transparent text-gray-500 cursor-not-allowed'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              PRO Wireframes
            </button>
          </nav>
        </div>
        
        {/* Wireframe content */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          {currentWireframeTab === 'basic' ? (
            // Display simplified, easy-to-read wireframe information
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              {/* Organized Content Display */}
              <div className="p-3 sm:p-4 space-y-4">
                {/* Show screen purpose/description */}
                <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3">
                  <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                    Screen Purpose
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-600">{screen.description}</p>
                </div>

                {/* Content Blocks - only show if there are actual text elements */}
                {screen.elements?.filter(el => el.type === 'text').length > 0 && (
                  <div>
                    <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Content Blocks
                    </h5>
                    <div className="pl-2 border-l-2 border-gray-200 space-y-1">
                      {/* Show headings first */}
                      {screen.elements
                        .filter(el => el.type === 'text' && el.properties?.isHeading)
                        .map((text, idx) => (
                          <div key={text.id || `heading-${idx}`} className="text-xs sm:text-sm">
                            <p className="font-medium">{text.properties?.content || 'Heading'}</p>
                </div>
              ))}
                      
                      {/* Show some non-heading text content if it exists */}
                      {screen.elements?.filter(el => el.type === 'text' && !el.properties?.isHeading).length > 0 && (
                        <div className="mt-1 space-y-0.5 sm:space-y-1">
                          {screen.elements
                            .filter(el => el.type === 'text' && !el.properties?.isHeading)
                            .slice(0, 2)
                            .map((text, idx) => (
                              <div key={text.id || `text-${idx}`} className="text-2xs sm:text-xs text-gray-600 pl-1">
                                {text.properties?.content || 'Text content'}
                              </div>
                            ))}
                          {screen.elements.filter(el => el.type === 'text' && !el.properties?.isHeading).length > 2 && (
                            <p className="text-2xs sm:text-xs text-gray-500 italic">+ {screen.elements.filter(el => el.type === 'text' && !el.properties?.isHeading).length - 2} more text blocks</p>
                          )}
                        </div>
                      )}
                    </div>
            </div>
          )}

                {/* Core Components - only show if there are relevant elements */}
                {(screen.elements?.filter(el => el.type === 'input' || el.type === 'button' || el.type === 'image').length > 0) && (
                  <div>
                    <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                      Core Components
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {/* Input Fields */}
                      {screen.elements?.filter(el => el.type === 'input').length > 0 ? (
                        <div className="bg-gray-50 rounded p-1.5 sm:p-2">
                          <p className="text-2xs sm:text-xs font-medium mb-0.5 sm:mb-1 text-gray-600 flex items-center">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Input Fields ({screen.elements.filter(el => el.type === 'input').length})
                          </p>
                          <ul className="text-2xs sm:text-xs text-gray-700 pl-2 sm:pl-3 list-disc">
                            {screen.elements
                              .filter(el => el.type === 'input')
                              .slice(0, 3)
                              .map((input, idx) => (
                                <li key={input.id || `input-${idx}`}>
                                  {input.properties?.label || input.properties?.placeholder || `Field ${idx + 1}`}
                                  {input.properties?.isRequired && <span className="text-red-500 ml-0.5">*</span>}
                                </li>
                              ))}
                            {screen.elements.filter(el => el.type === 'input').length > 3 && (
                              <li className="text-gray-500">+ {screen.elements.filter(el => el.type === 'input').length - 3} more</li>
                            )}
                          </ul>
                </div>
                      ) : null}
                      
                      {/* Action Buttons - only show if there are buttons with meaningful content */}
                      {screen.elements?.filter(el => el.type === 'button').length > 0 && (
                        <div className="bg-gray-50 rounded p-1.5 sm:p-2">
                          <p className="text-2xs sm:text-xs font-medium mb-0.5 sm:mb-1 text-gray-600 flex items-center">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Action Buttons ({screen.elements.filter(el => el.type === 'button').length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {screen.elements
                              .filter(el => el.type === 'button')
                              .map((button, idx) => (
                                <span 
                                  key={button.id || `button-${idx}`} 
                                  className={`inline-block text-2xs sm:text-xs px-1.5 sm:px-2 py-0.5 rounded ${
                                    button.properties?.isPrimary 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {button.properties?.content || button.properties?.text || 'Button'}
                                </span>
                              ))}
                          </div>
            </div>
          )}

                      {/* Media Elements */}
                      {screen.elements?.filter(el => el.type === 'image').length > 0 ? (
                        <div className="bg-gray-50 rounded p-1.5 sm:p-2">
                          <p className="text-2xs sm:text-xs font-medium mb-0.5 sm:mb-1 text-gray-600 flex items-center">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                            Media Elements ({screen.elements.filter(el => el.type === 'image').length})
                          </p>
                          <ul className="text-2xs sm:text-xs text-gray-700 pl-2 sm:pl-3 list-disc">
                            {screen.elements
                              .filter(el => el.type === 'image')
                              .map((image, idx) => (
                                <li key={image.id || `image-${idx}`}>
                                  {image.properties?.purpose || image.properties?.description || 'Image'}
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
            </div>
          )}

                {/* Interactions - only show if buttons have actions or there are meaningful paths */}
                {screen.elements?.filter(el => el.type === 'button' && 
                  el.properties?.action && 
                  el.properties.action !== 'Navigate to previous screen').length > 0 ? (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                      Interactions
                    </h5>
                    <div className="bg-yellow-50 rounded p-3 text-sm text-gray-700">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">Primary User Paths:</p>
                        <ul className="text-xs pl-3 list-disc space-y-1">
                          {screen.elements
                            .filter(el => el.type === 'button' && 
                              el.properties?.action && 
                              el.properties.action !== 'Navigate to previous screen')
                            .map((button, idx) => (
                              <li key={button.id || `action-${idx}`}>
                                <span className="font-medium">{button.properties?.content || button.properties?.text || 'Action'}</span>
                                <span className="text-gray-500"> → {button.properties?.action}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  // If there are only basic navigation buttons (like Back), show a simplified interaction section
                  screen.elements?.filter(el => el.type === 'button' && el.properties?.action).length > 0 ? (
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <p className="text-xs text-gray-500">
                        This screen primarily contains navigation controls 
                        {screen.elements?.filter(el => el.type === 'text').length > 0 ? ' and displays content to the user.' : '.'}
                      </p>
                    </div>
                  ) : screen.elements?.length > 0 ? (
                    <div className="bg-gray-50 rounded p-3 text-sm">
                      <p className="text-xs text-gray-500">
                        This screen primarily displays information with no explicit interactive paths.
                      </p>
                    </div>
                  ) : null
                )}

                {/* If screen has minimal information, show a message */}
                {(!screen.elements || screen.elements.length === 0) && (
                  <div className="bg-yellow-50 rounded p-4 text-amber-700">
                    <p className="text-sm">This screen appears to have minimal elements defined. Generate detailed wireframes to see a more complete visualization.</p>
                  </div>
                )}
                </div>
            </div>
          ) : (
            <div className="relative flex justify-center">
              <SvgWireframe 
                screenId={screen.id}
                screenName={screen.name}
                svgContent={screen.svgWireframe}
                svgContentFromDb={svgWireframe}
                height={400}
                className="border border-gray-200 rounded w-full max-w-md"
              />
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
                  
                  {/* Generate Wireframes button with conditional rendering */}
                  <button 
                    onClick={handleGenerateSvgWireframes}
                    disabled={generatingSvg}
                    className={`inline-flex items-center justify-center ${
                      hasSvgWireframesAccess === false 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-700'
                    } text-white px-4 py-2 rounded-full text-sm font-medium hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm`}
                  >
                    {generatingSvg ? (
                      <>
                        <span className="animate-spin mr-2">◌</span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {hasSvgWireframesAccess === false ? (
                          <>PRO Wireframes <span className="ml-1 text-xs bg-indigo-900 px-1.5 py-0.5 rounded-md">Upgrade</span></>
                        ) : (
                          <>Generate PRO Wireframes</>
                        )}
                      </>
                    )}
                  </button>
                </div>
                
                {/* Wireframe info message */}
                <div className="mb-4 flex items-start">
                  <svg className="w-5 h-5 mt-0.5 mr-2 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M11.995 16H12.005" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                  <p className="text-sm text-blue-700">
                    These wireframes are low-fidelity representations of your app screens. They show the basic layout and element positioning.
                  </p>
                </div>
                
                {/* Global SVG wireframe generation progress bar */}
                {generatingSvg && (
                  <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                      <div 
                        className="bg-blue-600 h-4 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(Math.round(svgProgress), 100)}%` }}
                      ></div>
                          </div>
                    <p className="text-xs text-gray-500 text-right">
                      {Math.min(Math.round(svgProgress), 100)}% complete - {svgProgress < 75 ? 'Generating wireframes' : 'Saving results'}
                    </p>
                        </div>
                )}
                
                {/* Error message */}
                {svgGenerationError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {svgGenerationError}
                </div>
                )}
                
                {/* Render screens */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  {screenSet.screens.map(screen => renderScreen(screen))}
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