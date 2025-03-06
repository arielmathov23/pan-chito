import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Navbar from '../../../components/Navbar';
import { Project, projectService } from '../../../services/projectService';
import { Brief, briefService } from '../../../services/briefService';
import { Feature, FeatureSet } from '../../../utils/featureStore';
import { featureService } from '../../../services/featureService';
import { prdService } from '../../../services/prdService';
import { generateFeatures } from '../../../utils/featureGenerator';
import Modal from '../../../components/Modal';
import { Brief as BriefStore } from '../../../utils/briefStore';

interface EditingFeature {
  id: string;
  briefId: string;
  title: string;
  name: string;
  description: string;
  userStories?: string[];
  priority: 'must' | 'should' | 'could' | 'wont';
  complexity: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

// Helper function to convert Supabase Brief to the format expected by generateFeatures
const convertBriefForGenerator = (brief: Brief): BriefStore => {
  return {
    id: brief.id,
    projectId: brief.project_id,
    productName: brief.product_name,
    problemStatement: brief.form_data.problemStatement,
    targetUsers: brief.form_data.targetUsers,
    proposedSolution: brief.form_data.proposedSolution,
    productObjectives: brief.form_data.productObjectives,
    createdAt: brief.created_at,
    content: JSON.stringify(brief.brief_data),
    briefData: brief.brief_data,
    formData: brief.form_data,
    isEditing: brief.is_editing || false,
    showEditButtons: brief.show_edit_buttons || false
  };
};

export default function IdeateFeatures() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [featureSet, setFeatureSet] = useState<FeatureSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMvpInfo, setShowMvpInfo] = useState(true);
  const [showDragHint, setShowDragHint] = useState(true);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (typeof id !== 'string') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch brief
        const briefData = await briefService.getBriefById(id);
        if (!briefData) {
          setError('Brief not found');
          setIsLoading(false);
          return;
        }
        setBrief(briefData);
        
        // Fetch project
        const projectData = await projectService.getProjectById(briefData.project_id);
        setProject(projectData);
        
        // Fetch feature set
        const featureSetData = await featureService.getFeatureSetByBriefId(id);
        setFeatureSet(featureSetData);
        
        // Check local storage for UI preferences
        const mvpInfoCollapsed = localStorage.getItem('mvpInfoCollapsed');
        if (mvpInfoCollapsed !== null) {
          setShowMvpInfo(mvpInfoCollapsed === 'true');
        }
        
        const dragHintDismissed = localStorage.getItem('dragHintDismissed');
        if (dragHintDismissed !== null) {
          setShowDragHint(dragHintDismissed !== 'true');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const handleGenerateFeatures = async () => {
    if (!brief) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // Convert brief to the format expected by generateFeatures
      const briefForGenerator = convertBriefForGenerator(brief);
      
      // Generate features using OpenAI
      const generatedFeatures = await generateFeatures(briefForGenerator);
      
      // Save features to Supabase
      const newFeatureSet = await featureService.saveFeatureSet(
        brief.id,
        brief.project_id,
        generatedFeatures,
        [] // Empty key questions for now
      );
      
      setFeatureSet(newFeatureSet);
      
      // Show drag hint
      setShowDragHint(true);
      localStorage.removeItem('dragHintDismissed');
    } catch (err) {
      console.error('Error generating features:', err);
      setError('Failed to generate features. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!featureSet) return;
    
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Find the feature
    const feature = featureSet.features.find(f => f.id === draggableId);
    if (!feature) return;
    
    // Update feature priority
    const updatedFeature = {
      ...feature,
      priority: destination.droppableId as 'must' | 'should' | 'could' | 'wont'
    };
    
    // Update local state immediately for a smooth UI experience
    const updatedFeatures = featureSet.features.map(f => 
      f.id === feature.id ? updatedFeature : f
    );
    
    setFeatureSet({
      ...featureSet,
      features: updatedFeatures
    });
    
    // Dismiss drag hint after first drag
    if (showDragHint) {
      setShowDragHint(false);
      localStorage.setItem('dragHintDismissed', 'true');
    }
    
    // Then update in Supabase (in the background)
    try {
      await featureService.updateFeature(feature.id, updatedFeature);
    } catch (err) {
      console.error('Error updating feature priority:', err);
      setError('Failed to update feature priority. Please try again.');
      
      // Revert to original state if the API call fails
      setFeatureSet({
        ...featureSet,
        features: featureSet.features
      });
    }
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFeature || !featureSet || !brief) return;
    
    try {
      // Check if it's a new feature (no ID) or an edit
      if (!editingFeature.id) {
        await handleSaveNewFeature();
      } else {
        // Update in Supabase
        await featureService.updateFeature(editingFeature.id, editingFeature);
        
        // Update local state
        const updatedFeatures = featureSet.features.map(f => 
          f.id === editingFeature.id ? editingFeature : f
        );
        
        setFeatureSet({
          ...featureSet,
          features: updatedFeatures
        });
      }
      
      setIsEditModalOpen(false);
      setEditingFeature(null);
    } catch (err) {
      console.error('Error updating feature:', err);
      setError('Failed to update feature. Please try again.');
    }
  };

  const handleDeleteFeature = async () => {
    if (!featureToDelete || !featureSet) return;
    
    try {
      // Delete from Supabase
      await featureService.deleteFeature(featureToDelete.id);
      
      // Update local state
      const updatedFeatures = featureSet.features.filter(f => f.id !== featureToDelete.id);
      
      setFeatureSet({
        ...featureSet,
        features: updatedFeatures
      });
      
      setIsDeleteModalOpen(false);
      setFeatureToDelete(null);
      
      // If editing, close edit modal
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
        setEditingFeature(null);
      }
    } catch (err) {
      console.error('Error deleting feature:', err);
      setError('Failed to delete feature. Please try again.');
    }
  };

  const handleAddFeature = (priority: 'must' | 'should' | 'could' | 'wont') => {
    if (!brief) return;
    
    const newFeature: Omit<Feature, 'id' | 'createdAt'> = {
      briefId: brief.id,
      name: '',
      title: '',
      description: '',
      priority,
      difficulty: 'medium'
    };
    
    setEditingFeature(newFeature as Feature);
    setIsEditModalOpen(true);
  };

  const handleSaveNewFeature = async () => {
    if (!editingFeature || !featureSet || !brief) return;
    
    try {
      // Add to Supabase
      const newFeature = await featureService.addFeature(
        brief.id,
        brief.project_id,
        editingFeature
      );
      
      // Update local state
      setFeatureSet({
        ...featureSet,
        features: [...featureSet.features, newFeature]
      });
      
      setIsEditModalOpen(false);
      setEditingFeature(null);
    } catch (err) {
      console.error('Error adding feature:', err);
      setError('Failed to add feature. Please try again.');
    }
  };

  // Check if PRD exists for this brief and redirect to it
  const handleContinue = async () => {
    if (!brief) return;
    
    try {
      // Check if PRDs exist for this brief
      const existingPRDs = await prdService.getPRDsByBriefId(brief.id);
      
      if (existingPRDs && existingPRDs.length > 0) {
        // If PRDs exist, redirect to the first PRD
        router.push(`/prd/${existingPRDs[0].id}`);
      } else {
        // If no PRDs exist, redirect to the new PRD page with the project ID
        router.push(`/prd/new?projectId=${brief.project_id}`);
      }
    } catch (error) {
      console.error('Error checking for existing PRDs:', error);
      // Default to the new PRD page if there's an error
      router.push(`/prd/new?projectId=${brief.project_id}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const renderFeatureCard = (feature: Feature, index: number) => (
    <Draggable key={feature.id} draggableId={feature.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-4 mb-3 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h3 className="text-[#111827] font-medium mb-1">{feature.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(feature.difficulty)}`}>
                    {feature.difficulty}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleEditFeature(feature)}
                className="text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="text-[#6b7280] text-sm">{feature.description}</p>
          </div>
        </div>
      )}
    </Draggable>
  );

  const renderFeatureSection = (priority: 'must' | 'should' | 'could' | 'wont') => {
    const features = featureSet?.features.filter(f => f.priority === priority) || [];
    const titles = {
      must: 'Must Have',
      should: 'Should Have',
      could: 'Could Have',
      wont: 'Won\'t Have'
    };
    const colors = {
      must: 'bg-red-50 border-red-100',
      should: 'bg-yellow-50 border-yellow-100',
      could: 'bg-green-50 border-green-100',
      wont: 'bg-gray-50 border-gray-100'
    };

    return (
      <div className="flex-1 min-w-[250px]">
        <div className={`rounded-lg ${colors[priority]} border p-4 h-[calc(100vh-300px)]`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">{titles[priority]}</h2>
            <button
              onClick={() => handleAddFeature(priority)}
              className="text-[#6b7280] hover:text-[#111827] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <Droppable droppableId={priority}>
            {(provided) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3 overflow-y-auto h-full pr-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {features.map((feature, index) => renderFeatureCard(feature, index))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    );
  };

  const toggleMvpInfo = () => {
    const newState = !showMvpInfo;
    setShowMvpInfo(newState);
    localStorage.setItem('mvpInfoCollapsed', String(newState));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <div className="mb-10">
          <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
            <Link href="/projects" className="hover:text-[#111827] transition-colors">
              Projects
            </Link>
            <span>/</span>
            <Link href={`/project/${project?.id}`} className="hover:text-[#111827] transition-colors">
              {project?.name}
            </Link>
            <span>/</span>
            <Link href={`/brief/${brief?.id}`} className="hover:text-[#111827] transition-colors">
              Brief
            </Link>
            <span>/</span>
            <Link href={`/brief/${brief?.id}/features`} className="hover:text-[#111827] transition-colors">
              Features
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Feature Ideation</h1>
              <p className="text-[#6b7280] mt-2">Define and prioritize features for {brief?.product_name}</p>
            </div>
            {featureSet && (
              <button
                onClick={handleContinue}
                className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
              >
                Continue
              </button>
            )}
          </div>

          <div className="mb-6 bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0F533A]/5 to-transparent cursor-pointer" onClick={toggleMvpInfo}>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="text-lg font-semibold text-[#111827]">Feature Prioritization Guide</h3>
              </div>
              <svg 
                className={`w-5 h-5 text-[#0F533A] transform transition-transform duration-200 ${showMvpInfo ? 'rotate-180' : ''}`} 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div 
              className={`transition-all duration-300 ease-in-out ${showMvpInfo ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="p-4 space-y-4 border-t border-[#e5e7eb]">
                <p className="text-[#4b5563]">
                  Use the MoSCoW method to prioritize features to get a Minimum Viable Product (MVP). Drag and drop features between categories:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-[#111827]">Must Have (MVP)</h4>
                    <p className="text-sm text-[#6b7280]">Core features essential for the product to work. Without these, the solution would fail.</p>
                    
                    <h4 className="font-medium text-[#111827] mt-4">Should Have</h4>
                    <p className="text-sm text-[#6b7280]">Important features that are not vital but add significant value.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-[#111827]">Could Have</h4>
                    <p className="text-sm text-[#6b7280]">Nice-to-have features that would have a small impact if left out.</p>
                    
                    <h4 className="font-medium text-[#111827] mt-4">Won't Have</h4>
                    <p className="text-sm text-[#6b7280]">Features that are not priority for this release but may be reconsidered later.</p>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3">Pro Tips</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex items-start">
                        <div className="bg-blue-500 text-white rounded-full p-1 mr-3 flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-blue-900 mb-1">First Version Development</p>
                          <p className="text-blue-700">
                            <span className="font-medium">Must Have</span> and <span className="font-medium">Should Have</span> features will be included in the first version. Ensure "Must Have" features are truly essential to your core product.
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start p-2">
                      <div className="bg-blue-400 rounded-full p-1 mr-3 flex-shrink-0">
                        <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="4" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="text-blue-700">Focus on features that directly solve your core problem</span>
                    </li>
                    <li className="flex items-start p-2">
                      <div className="bg-blue-400 rounded-full p-1 mr-3 flex-shrink-0">
                        <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="4" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="text-blue-700">Consider technical complexity and development time</span>
                    </li>
                    <li className="flex items-start p-2">
                      <div className="bg-blue-400 rounded-full p-1 mr-3 flex-shrink-0">
                        <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="4" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="text-blue-700">Prioritize features that provide immediate user value</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

                
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
                
        {!featureSet ? (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#111827]">Generate Features</h2>
                <p className="text-[#6b7280] mt-1">
                  Generate a comprehensive list of features based on your brief.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleGenerateFeatures}
              disabled={isGenerating}
              className={`inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Features...
                </>
              ) : (
                'Generate Features'
              )}
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderFeatureSection('must')}
              {renderFeatureSection('should')}
              {renderFeatureSection('could')}
              {renderFeatureSection('wont')}
            </div>
          </DragDropContext>
        )}

        {isEditModalOpen && editingFeature && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingFeature(null);
            }}
            title={editingFeature?.name ? "Edit Feature" : "Add Feature"}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Edit Feature</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingFeature.name}
                    onChange={(e) => setEditingFeature({ ...editingFeature, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingFeature.description}
                    onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Priority
                  </label>
                  <select
                    value={editingFeature.priority}
                    onChange={(e) => setEditingFeature({ ...editingFeature, priority: e.target.value as 'must' | 'should' | 'could' | 'wont' })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                  >
                    <option value="must">Must Have</option>
                    <option value="should">Should Have</option>
                    <option value="could">Could Have</option>
                    <option value="wont">Won't Have</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Difficulty
                  </label>
                  <select
                    value={editingFeature.difficulty}
                    onChange={(e) => setEditingFeature({ ...editingFeature, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => {
                    setFeatureToDelete(editingFeature);
                    setIsDeleteModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingFeature(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0F533A] rounded-lg hover:bg-[#0a3f2c] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {isDeleteModalOpen && featureToDelete && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setFeatureToDelete(null);
            }}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Delete Feature</h2>
              <p className="text-[#6b7280] mb-6">
                Are you sure you want to delete this feature? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setFeatureToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFeature}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
} 