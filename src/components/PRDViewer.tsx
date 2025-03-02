import React, { useState, useEffect } from 'react';
import { PRD } from '../services/prdService';
import { PRDSection } from '../utils/prdGenerator';

interface PRDViewerProps {
  prd: PRD;
  onUpdate: (updatedPRD: PRD) => void;
}

export default function PRDViewer({ prd, onUpdate }: PRDViewerProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<PRDSection | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Helper function to safely render content that might be an object
  // This ensures objects are properly stringified before rendering
  const safeRender = (content: any): string => {
    if (content === null || content === undefined) {
      return '';
    }
    if (typeof content === 'string') {
      return content;
    }
    return JSON.stringify(content, null, 2);
  };

  // Initialize the selected feature when the PRD changes or on first load
  useEffect(() => {
    if (prd && prd.content && prd.content.sections && prd.content.sections.length > 0) {
      // Set the first feature as selected by default if none is selected
      if (!selectedFeature) {
        setSelectedFeature(prd.content.sections[0].featureName);
      } else {
        // Check if the currently selected feature exists in the new PRD
        const featureExists = prd.content.sections.some(
          section => section.featureName === selectedFeature
        );
        
        // If not, select the first feature
        if (!featureExists && prd.content.sections.length > 0) {
          setSelectedFeature(prd.content.sections[0].featureName);
        }
      }
    }
  }, [prd, selectedFeature]);

  // Get all sections from the PRD
  const getSections = (): PRDSection[] => {
    if (!prd || !prd.content || !prd.content.sections) {
      return [];
    }
    return prd.content.sections;
  };

  const handleEdit = (featureName: string, section: PRDSection) => {
    setEditingFeature(featureName);
    setEditingSection(null);
    setEditedContent({ ...section });
  };

  const handleSave = () => {
    if (!editedContent || !editingFeature) return;

    try {
    const updatedPRD: PRD = {
      ...prd,
      content: {
        ...prd.content,
          sections: getSections().map(section =>
          section.featureName === editingFeature ? editedContent : section
        )
      }
    };

    onUpdate(updatedPRD);
    setEditingFeature(null);
    setEditedContent(null);
      setError(null);
    } catch (err) {
      console.error('Error saving PRD updates:', err);
      setError('Failed to save changes. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingFeature(null);
    setEditedContent(null);
  };

  const handleDeleteFeature = (featureName: string) => {
    if (window.confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      const sections = getSections();
      const updatedPRD: PRD = {
        ...prd,
        content: {
          ...prd.content,
          sections: sections.filter(section => section.featureName !== featureName)
        }
      };
      onUpdate(updatedPRD);
      
      // Select another feature if available
      const remainingSections = updatedPRD.content.sections;
      if (remainingSections.length > 0) {
        setSelectedFeature(remainingSections[0].featureName);
      } else {
        setSelectedFeature('');
      }
    }
  };

  const renderEditableField = (
    value: string,
    onChange: (value: string) => void,
    multiline = false
  ) => {
    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
          rows={3}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
      />
    );
  };

  const renderPrioritySelector = (
    value: string,
    onChange: (value: 'must' | 'should' | 'could' | 'wont') => void
  ) => {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'must' | 'should' | 'could' | 'wont')}
        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
      >
        <option value="must">MUST</option>
        <option value="should">SHOULD</option>
        <option value="could">COULD</option>
        <option value="wont">WON'T</option>
      </select>
    );
  };

  const renderEditableList = (
    items: string[],
    onChange: (items: string[]) => void
  ) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index] = e.target.value;
              onChange(newItems);
            }}
            className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
          />
          <button
            onClick={() => {
              const newItems = items.filter((_, i) => i !== index);
              onChange(newItems);
            }}
            className="p-2 text-[#6b7280] hover:text-red-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="text-sm text-[#0F533A] hover:text-[#0a3f2c] font-medium"
      >
        + Add Item
      </button>
    </div>
  );

  const renderNavigation = () => {
    const sections = getSections();
    if (sections.length === 0) {
      return (
        <div className="w-64 bg-white border-r border-[#e5e7eb] h-[calc(100vh-16rem)] overflow-y-auto p-4">
          <p className="text-[#6b7280]">No features available</p>
        </div>
      );
    }

    const priorityOrder = { must: 0, should: 1, could: 2, wont: 3 };
    const sortedSections = [...sections].sort((a, b) => 
      priorityOrder[a.featurePriority] - priorityOrder[b.featurePriority]
    );

    return (
      <div className="w-64 bg-white border-r border-[#e5e7eb] h-[calc(100vh-16rem)] overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-medium text-[#6b7280] uppercase tracking-wider mb-4">Features</h2>
          <div className="space-y-1">
            {sortedSections.map((section) => {
              const priorityColors = {
                must: 'bg-red-100 text-red-800',
                should: 'bg-blue-100 text-blue-800',
                could: 'bg-yellow-100 text-yellow-800',
                wont: 'bg-gray-100 text-gray-800'
              };
              
              return (
                <button
                  key={section.featureName}
                  onClick={() => setSelectedFeature(section.featureName)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFeature === section.featureName
                      ? 'bg-[#0F533A]/5 text-[#0F533A]'
                      : 'text-[#4b5563] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{safeRender(section.featureName)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      {
                        must: 'bg-red-100 text-red-800',
                        should: 'bg-blue-100 text-blue-800',
                        could: 'bg-green-100 text-green-800',
                        wont: 'bg-gray-100 text-gray-800'
                      }[section.featurePriority]
                    }`}>
                      {safeRender(section.featurePriority?.toUpperCase() || '')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const sections = getSections();
    if (sections.length === 0) {
      return (
        <div className="flex-1 overflow-y-auto h-[calc(100vh-16rem)] p-8">
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
            <p className="font-medium">No content available</p>
            <p>The PRD doesn't contain any feature sections. This may be due to an error in PRD generation or parsing.</p>
            <div className="mt-4">
              <p className="font-medium">Raw PRD Content:</p>
              <pre className="mt-2 p-4 bg-white rounded border border-yellow-200 text-xs overflow-auto max-h-96">
                {safeRender(prd)}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    const section = sections.find(s => s.featureName === selectedFeature);
    if (!section) {
      return (
        <div className="flex-1 overflow-y-auto h-[calc(100vh-16rem)] p-8">
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
            <p className="font-medium">Feature not found</p>
            <p>The selected feature "{selectedFeature}" could not be found in the PRD.</p>
            <button 
              onClick={() => sections.length > 0 && setSelectedFeature(sections[0].featureName)}
              className="mt-4 px-4 py-2 bg-[#0F533A] text-white rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors"
            >
              View First Feature
            </button>
          </div>
        </div>
      );
    }

    // Check if we're in edit mode
    if (editingFeature === section.featureName && editedContent) {
      // Render edit form
      return (
        <div className="flex-1 overflow-y-auto h-[calc(100vh-16rem)] p-8">
          <div className="space-y-8">
            {/* Edit form fields */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Feature Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Feature Name</label>
                  {renderEditableField(
                    editedContent.featureName,
                    (value) => setEditedContent({
                      ...editedContent,
                      featureName: value
                    })
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Priority</label>
                  {renderPrioritySelector(
                    editedContent.featurePriority,
                    (value) => setEditedContent({
                      ...editedContent,
                      featurePriority: value
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* Overview section */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Overview</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Purpose</label>
                  {renderEditableField(
                    editedContent.overview?.purpose || '',
                    (value) => setEditedContent({
                      ...editedContent,
                      overview: {
                        ...editedContent.overview,
                        purpose: value
                      }
                    }),
                    true
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Success Metrics</label>
                  {renderEditableList(
                    editedContent.overview?.successMetrics || [],
                    (items) => setEditedContent({
                      ...editedContent,
                      overview: {
                        ...editedContent.overview,
                        successMetrics: items
                      }
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* User Stories section */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">User Stories</h3>
              {renderEditableList(
                editedContent.userStories || [],
                (items) => setEditedContent({
                  ...editedContent,
                  userStories: items
                })
              )}
            </div>
            
            {/* Other edit fields can be added here */}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-[#6b7280] hover:text-[#111827] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#0F533A] text-white rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Render view mode
    return (
      <div className="flex-1 overflow-y-auto h-[calc(100vh-16rem)]">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-[#111827]">{safeRender(section.featureName)}</h1>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                {
                  must: 'bg-red-100 text-red-800',
                  should: 'bg-blue-100 text-blue-800',
                  could: 'bg-green-100 text-green-800',
                  wont: 'bg-gray-100 text-gray-800'
                }[section.featurePriority]
              }`}>
                {safeRender(section.featurePriority?.toUpperCase() || '')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleDeleteFeature(section.featureName)}
                className="text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={() => handleEdit(section.featureName, section)}
                className="text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.04 3.02L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96C22.34 6.6 22.98 5.02 20.98 3.02C18.98 1.02 17.4 1.66 16.04 3.02Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Render section content */}
          <div className="space-y-8">
            {/* Overview */}
            <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Overview</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Purpose</h4>
                  <p className="text-[#111827]">{safeRender(section.overview?.purpose) || "No purpose specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Success Metrics</h4>
                  {section.overview?.successMetrics && section.overview.successMetrics.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.overview.successMetrics.map((metric, index) => (
                        <li key={index}>{safeRender(metric)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No success metrics specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* User Stories */}
            <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">User Stories</h3>
              {section.userStories && section.userStories.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-[#111827]">
                  {section.userStories.map((story, index) => (
                    <li key={index} className="pl-1">{safeRender(story)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#6b7280] italic">No user stories specified</p>
              )}
            </div>

            {/* Acceptance Criteria */}
            <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Acceptance Criteria</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Guidelines</h4>
                  <p className="text-[#111827]">{safeRender(section.acceptanceCriteria?.guidelines) || "No guidelines specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Criteria</h4>
                  {section.acceptanceCriteria?.criteria && section.acceptanceCriteria.criteria.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.acceptanceCriteria.criteria.map((criterion, index) => (
                        <li key={index}>{safeRender(criterion)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No criteria specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Use Cases */}
            {section.useCases && section.useCases.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Use Cases</h3>
                <div className="space-y-6">
              {section.useCases.map((useCase, index) => (
                    <div key={index} className="border-b border-[#e5e7eb] pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-xs font-medium bg-[#f0f2f5] text-[#6b7280] px-2 py-1 rounded mr-2">
                            {useCase.id}
                          </span>
                          <h4 className="text-md font-medium text-[#111827] inline">{safeRender(useCase.title)}</h4>
                        </div>
                  </div>
                      <p className="text-[#4b5563] mb-4">{safeRender(useCase.description)}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                          <h5 className="text-sm font-medium text-[#4b5563] mb-2">Actors</h5>
                          <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                            {useCase.actors.map((actor, idx) => (
                              <li key={idx}>{safeRender(actor)}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                          <h5 className="text-sm font-medium text-[#4b5563] mb-2">Preconditions</h5>
                          <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                            {useCase.preconditions.map((precondition, idx) => (
                              <li key={idx}>{safeRender(precondition)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-[#4b5563] mb-2">Main Scenario</h5>
                        <ol className="list-decimal pl-5 space-y-1 text-[#111827]">
                          {useCase.mainScenario.map((step, idx) => (
                            <li key={idx}>{safeRender(step)}</li>
                        ))}
                      </ol>
                    </div>
                      
                      {useCase.alternateFlows && useCase.alternateFlows.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-[#4b5563] mb-2">Alternate Flows</h5>
                          {useCase.alternateFlows.map((flow, idx) => (
                            <div key={idx} className="mb-3 last:mb-0">
                              <h6 className="text-sm font-medium text-[#111827] mb-1">{safeRender(flow.name)}</h6>
                              <ol className="list-decimal pl-5 space-y-1 text-[#111827]">
                                {flow.steps.map((step, stepIdx) => (
                                  <li key={stepIdx}>{safeRender(step)}</li>
                                ))}
                              </ol>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {useCase.exceptions && useCase.exceptions.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-[#4b5563] mb-2">Exceptions</h5>
                          {useCase.exceptions.map((exception, idx) => (
                            <div key={idx} className="mb-3 last:mb-0">
                              <h6 className="text-sm font-medium text-[#111827] mb-1">{safeRender(exception.name)}</h6>
                              <ol className="list-decimal pl-5 space-y-1 text-[#111827]">
                                {exception.steps.map((step, stepIdx) => (
                                  <li key={stepIdx}>{safeRender(step)}</li>
                                ))}
                              </ol>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Functional Requirements */}
            <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Non-Functional Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Performance</h4>
                  {section.nonFunctionalRequirements?.performance && section.nonFunctionalRequirements.performance.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.nonFunctionalRequirements.performance.map((item, index) => (
                        <li key={index}>{item}</li>
                        ))}
                      </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No performance requirements specified</p>
                    )}
                  </div>
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Security</h4>
                  {section.nonFunctionalRequirements?.security && section.nonFunctionalRequirements.security.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.nonFunctionalRequirements.security.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No security requirements specified</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Scalability</h4>
                  {section.nonFunctionalRequirements?.scalability && section.nonFunctionalRequirements.scalability.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.nonFunctionalRequirements.scalability.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No scalability requirements specified</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Usability</h4>
                  {section.nonFunctionalRequirements?.usability && section.nonFunctionalRequirements.usability.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.nonFunctionalRequirements.usability.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No usability requirements specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dependencies */}
            <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Dependencies & Assumptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Dependencies</h4>
                  {section.dependencies?.dependencies && section.dependencies.dependencies.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.dependencies.dependencies.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No dependencies specified</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Assumptions</h4>
                  {section.dependencies?.assumptions && section.dependencies.assumptions.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.dependencies.assumptions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No assumptions specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Open Questions */}
            <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Open Questions & Risks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Open Questions</h4>
                  {section.openQuestions?.questions && section.openQuestions.questions.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.openQuestions.questions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No open questions specified</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#4b5563] mb-2">Risks</h4>
                  {section.openQuestions?.risks && section.openQuestions.risks.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {section.openQuestions.risks.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No risks specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Wireframe Guidelines */}
            <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Wireframe Guidelines</h3>
              {section.wireframeGuidelines && section.wireframeGuidelines.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                  {section.wireframeGuidelines.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#6b7280] italic">No wireframe guidelines specified</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p className="font-medium">Error displaying PRD</p>
        <p>{error}</p>
        <div className="mt-4">
          <p className="font-medium">PRD Content:</p>
          <pre className="mt-2 p-4 bg-white rounded border border-red-200 text-xs overflow-auto max-h-96">
            {safeRender(prd)}
          </pre>
        </div>
        <button 
          onClick={() => setError(null)}
          className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
        >
          Try to Display PRD Anyway
        </button>
      </div>
    );
  }

  return (
    <div className="flex">
      {renderNavigation()}
      {renderContent()}
    </div>
  );
} 