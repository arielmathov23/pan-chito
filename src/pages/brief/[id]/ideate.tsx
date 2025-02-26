import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { Project, projectStore } from '../../../utils/projectStore';
import { Brief, briefStore } from '../../../utils/briefStore';
import { Feature, FeatureSet, featureStore } from '../../../utils/featureStore';
import { generateFeatures, parseGeneratedFeatures } from '../../../utils/featureGenerator';

export default function IdeateFeatures() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [featureSet, setFeatureSet] = useState<FeatureSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [newFeature, setNewFeature] = useState<Partial<Feature>>({
    name: '',
    description: '',
    priority: 'must'
  });

  useEffect(() => {
    if (id) {
      const foundBrief = briefStore.getBrief(id as string);
      setBrief(foundBrief);
      
      if (foundBrief) {
        const foundProject = projectStore.getProject(foundBrief.projectId);
        setProject(foundProject);
        
        // Check if features already exist for this brief
        const existingFeatureSet = featureStore.getFeatureSetByBriefId(foundBrief.id);
        if (existingFeatureSet) {
          setFeatureSet(existingFeatureSet);
        }
      }
      
      setIsLoading(false);
    }
  }, [id]);

  const handleGenerateFeatures = async () => {
    if (!brief) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await generateFeatures(brief);
      const parsedFeatures = parseGeneratedFeatures(response, brief.id);
      
      // Save the generated features
      const savedFeatureSet = featureStore.saveFeatureSet(
        brief.id,
        [
          ...parsedFeatures.features.must,
          ...parsedFeatures.features.should,
          ...parsedFeatures.features.could,
          ...parsedFeatures.features.wont
        ],
        parsedFeatures.keyQuestions
      );
      
      setFeatureSet(savedFeatureSet);
    } catch (err) {
      console.error('Error generating features:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
  };

  const handleSaveEdit = () => {
    if (!editingFeature || !featureSet) return;

    const success = featureStore.updateFeature(featureSet.id, editingFeature.id, editingFeature);
    if (success) {
      const updatedFeatureSet = featureStore.getFeatureSetByBriefId(brief!.id);
      setFeatureSet(updatedFeatureSet);
      setEditingFeature(null);
    }
  };

  const handleDeleteFeature = (featureId: string) => {
    if (!featureSet) return;

    const success = featureStore.deleteFeature(featureSet.id, featureId);
    if (success) {
      const updatedFeatureSet = featureStore.getFeatureSetByBriefId(brief!.id);
      setFeatureSet(updatedFeatureSet);
    }
  };

  const handleAddFeature = () => {
    if (!featureSet || !brief || !newFeature.name || !newFeature.description || !newFeature.priority) return;

    const feature = featureStore.addFeature(featureSet.id, {
      briefId: brief.id,
      name: newFeature.name,
      description: newFeature.description,
      priority: newFeature.priority as 'must' | 'should' | 'could' | 'wont'
    });

    if (feature) {
      const updatedFeatureSet = featureStore.getFeatureSetByBriefId(brief.id);
      setFeatureSet(updatedFeatureSet);
      setIsAddingFeature(false);
      setNewFeature({ name: '', description: '', priority: 'must' });
    }
  };

  const renderFeatureCard = (feature: Feature) => {
    const isEditing = editingFeature?.id === feature.id;

    return (
      <div key={feature.id} className="bg-[#f8f9fa] p-4 rounded-lg group relative">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editingFeature.name}
              onChange={(e) => setEditingFeature({ ...editingFeature, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
            />
            <textarea
              value={editingFeature.description}
              onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
              rows={2}
            />
            <select
              value={editingFeature.priority}
              onChange={(e) => setEditingFeature({ ...editingFeature, priority: e.target.value as 'must' | 'should' | 'could' | 'wont' })}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
            >
              <option value="must">Must Have</option>
              <option value="should">Should Have</option>
              <option value="could">Could Have</option>
              <option value="wont">Won't Have</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingFeature(null)}
                className="px-3 py-1 text-sm text-[#4b5563] hover:text-[#111827]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-sm bg-[#0F533A] text-white rounded-md hover:bg-[#0a3f2c]"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="font-medium text-[#111827] mb-1">{feature.name}</h4>
            <p className="text-[#4b5563] text-sm">{feature.description}</p>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <button
                onClick={() => handleEditFeature(feature)}
                className="p-1 text-[#6b7280] hover:text-[#111827]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.04 3.02L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96C22.34 6.6 22.98 5.02 20.98 3.02C18.98 1.02 17.4 1.66 16.04 3.02Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={() => handleDeleteFeature(feature.id)}
                className="p-1 text-[#6b7280] hover:text-red-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 5.98C17.67 5.65 14.32 5.48 10.98 5.48C9 5.48 7.02 5.58 5.04 5.78L3 5.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.85 9.14L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderFeatureSection = (priority: 'must' | 'should' | 'could' | 'wont') => {
    if (!featureSet) return null;

    const features = featureSet.features.filter(f => f.priority === priority);
    const titles = {
      must: 'Must Have',
      should: 'Should Have',
      could: 'Could Have',
      wont: "Won't Have"
    };
    const colors = {
      must: 'bg-red-500',
      should: 'bg-orange-500',
      could: 'bg-blue-500',
      wont: 'bg-gray-500'
    };

    return (
      <div className="border-b border-[#e5e7eb] pb-6 last:border-b-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${colors[priority]} mr-2`}></div>
            <h3 className="text-lg font-semibold text-[#111827]">{titles[priority]}</h3>
          </div>
          <button
            onClick={() => {
              setIsAddingFeature(true);
              setNewFeature(prev => ({ ...prev, priority }));
            }}
            className="text-sm text-[#0F533A] hover:text-[#0a3f2c] font-medium"
          >
            + Add Feature
          </button>
        </div>
        <div className="space-y-4">
          {features.map(renderFeatureCard)}
          {features.length === 0 && (
            <p className="text-[#6b7280] italic">No {titles[priority].toLowerCase()} features identified</p>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3 text-[#6b7280]">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading brief...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!brief || !project) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#6b7280]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-3">Brief not found</h2>
            <p className="text-[#4b5563] mb-8 max-w-md mx-auto">The brief you're looking for doesn't exist</p>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
            >
              Go to projects
            </Link>
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
            <Link href={`/project/${project.id}`} className="hover:text-[#111827] transition-colors">
              {project.name}
            </Link>
            <span>/</span>
            <Link href={`/brief/${brief.id}`} className="hover:text-[#111827] transition-colors">
              Brief
            </Link>
            <span>/</span>
            <span className="text-[#111827]">Ideate Features</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Ideate Features</h1>
              <p className="text-[#6b7280] mt-2">Generate and prioritize features for {brief.productName}</p>
            </div>
            <div className="flex items-center space-x-3 self-start">
              <Link
                href={`/brief/${brief.id}`}
                className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to brief
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
          {!featureSet ? (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">Generate Features</h2>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-[#4b5563]">
                  Generate a prioritized list of features for your product using the MoSCoW framework based on your brief.
                  This will help you identify what features are essential for your MVP and which ones can be developed later.
                </p>
                
                <div className="bg-[#f0f2f5] p-4 rounded-lg">
                  <h3 className="font-medium text-[#111827] mb-2">MoSCoW Framework</h3>
                  <ul className="space-y-2 text-[#4b5563]">
                    <li><span className="font-medium">Must Have:</span> Critical features that are required for the MVP to be viable.</li>
                    <li><span className="font-medium">Should Have:</span> Important features that are not critical but add significant value.</li>
                    <li><span className="font-medium">Could Have:</span> Desirable features that would be nice to have if resources permit.</li>
                    <li><span className="font-medium">Won't Have:</span> Features that are not planned for the current release but may be considered for future versions.</li>
                  </ul>
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex justify-center">
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
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Generate Features
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                    <h2 className="text-xl font-semibold text-[#111827]">Feature Prioritization</h2>
                  </div>
                </div>

                {isAddingFeature && (
                  <div className="mb-8 bg-[#f8f9fa] p-4 rounded-lg">
                    <h3 className="font-medium text-[#111827] mb-4">Add New Feature</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Feature name"
                        value={newFeature.name}
                        onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
                      />
                      <textarea
                        placeholder="Feature description"
                        value={newFeature.description}
                        onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
                        rows={2}
                      />
                      <select
                        value={newFeature.priority}
                        onChange={(e) => setNewFeature({ ...newFeature, priority: e.target.value as 'must' | 'should' | 'could' | 'wont' })}
                        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
                      >
                        <option value="must">Must Have</option>
                        <option value="should">Should Have</option>
                        <option value="could">Could Have</option>
                        <option value="wont">Won't Have</option>
                      </select>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setIsAddingFeature(false)}
                          className="px-3 py-1 text-sm text-[#4b5563] hover:text-[#111827]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddFeature}
                          disabled={!newFeature.name || !newFeature.description}
                          className="px-3 py-1 text-sm bg-[#0F533A] text-white rounded-md hover:bg-[#0a3f2c] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Feature
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-8 mt-6">
                  {renderFeatureSection('must')}
                  {renderFeatureSection('should')}
                  {renderFeatureSection('could')}
                  {renderFeatureSection('wont')}
                </div>
              </div>
              
              {/* Key Questions */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">Key Questions</h2>
                </div>
                
                <div className="space-y-4">
                  {featureSet.keyQuestions.map((question, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0 w-6 h-6 bg-[#0F533A] text-white rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <p className="text-[#4b5563]">{question}</p>
                    </div>
                  ))}
                  {featureSet.keyQuestions.length === 0 && (
                    <p className="text-[#6b7280] italic">No key questions identified</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Link
                  href={`/brief/${brief.id}`}
                  className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-5 py-2.5 rounded-lg font-medium hover:bg-[#f0f2f5] transition-colors"
                >
                  Back to brief
                </Link>
                <Link
                  href={`/project/${project.id}`}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                >
                  Go to project
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 