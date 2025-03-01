import React, { useState } from 'react';
import { PRD } from '../utils/prdStore';
import { PRDSection } from '../utils/prdGenerator';

interface PRDViewerProps {
  prd: PRD;
  onUpdate: (updatedPRD: PRD) => void;
}

export default function PRDViewer({ prd, onUpdate }: PRDViewerProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<PRDSection | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>(prd.content.sections[0]?.featureName || '');

  const handleEdit = (featureName: string, section: PRDSection) => {
    setEditingFeature(featureName);
    setEditingSection(null);
    setEditedContent({ ...section });
  };

  const handleSave = () => {
    if (!editedContent || !editingFeature) return;

    const updatedPRD: PRD = {
      ...prd,
      content: {
        ...prd.content,
        sections: prd.content.sections.map(section =>
          section.featureName === editingFeature ? editedContent : section
        )
      }
    };

    onUpdate(updatedPRD);
    setEditingFeature(null);
    setEditedContent(null);
  };

  const handleCancel = () => {
    setEditingFeature(null);
    setEditedContent(null);
  };

  const handleDeleteFeature = (featureName: string) => {
    if (window.confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      const updatedPRD: PRD = {
        ...prd,
        content: {
          ...prd.content,
          sections: prd.content.sections.filter(section => section.featureName !== featureName)
        }
      };
      onUpdate(updatedPRD);
      setSelectedFeature(prd.content.sections[0]?.featureName || '');
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
    const priorityOrder = { must: 0, should: 1, could: 2, wont: 3 };
    const sortedSections = [...prd.content.sections].sort((a, b) => 
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
                    <span className="truncate">{section.featureName}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityColors[section.featurePriority]}`}>
                      {section.featurePriority.toUpperCase()}
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
    const section = prd.content.sections.find(s => s.featureName === selectedFeature);
    if (!section) return null;

    return (
      <div className="flex-1 overflow-y-auto h-[calc(100vh-16rem)]">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-[#111827]">{section.featureName}</h1>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                {
                  must: 'bg-red-100 text-red-800',
                  should: 'bg-blue-100 text-blue-800',
                  could: 'bg-yellow-100 text-yellow-800',
                  wont: 'bg-gray-100 text-gray-800'
                }[section.featurePriority]
              }`}>
                {section.featurePriority.toUpperCase()}
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
            {/* Feature Priority */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Feature Priority</h3>
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-2">Priority</label>
                {renderPrioritySelector(
                  section.featurePriority,
                  (value) => setEditedContent({
                    ...section,
                    featurePriority: value
                  })
                )}
              </div>
            </div>

            {/* Overview */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Overview</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Purpose</label>
                  {editingFeature === section.featureName ? (
                    renderEditableField(
                      section.overview.purpose,
                      (value) => setEditedContent({
                        ...section,
                        overview: { ...section.overview, purpose: value }
                      }),
                      true
                    )
                  ) : (
                    <p className="text-[#111827]">{section.overview.purpose}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Success Metrics</label>
                  {editingFeature === section.featureName ? (
                    renderEditableList(
                      section.overview.successMetrics,
                      (metrics) => setEditedContent({
                        ...section,
                        overview: { ...section.overview, successMetrics: metrics }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#111827]">
                      {section.overview.successMetrics.map((metric, index) => (
                        <li key={index}>{metric}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* User Stories */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">User Stories</h3>
              {editingFeature === section.featureName ? (
                renderEditableList(
                  section.userStories,
                  (stories) => setEditedContent({ ...section, userStories: stories })
                )
              ) : (
                <ul className="list-disc list-inside space-y-2 text-[#111827]">
                  {section.userStories.map((story, index) => (
                    <li key={index}>{story}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Acceptance Criteria */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Acceptance Criteria</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Guidelines</label>
                  {editingFeature === section.featureName ? (
                    renderEditableField(
                      section.acceptanceCriteria.guidelines,
                      (value) => setEditedContent({
                        ...section,
                        acceptanceCriteria: { ...section.acceptanceCriteria, guidelines: value }
                      }),
                      true
                    )
                  ) : (
                    <p className="text-[#111827]">{section.acceptanceCriteria.guidelines}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4b5563] mb-2">Criteria</label>
                  {editingFeature === section.featureName ? (
                    renderEditableList(
                      section.acceptanceCriteria.criteria,
                      (criteria) => setEditedContent({
                        ...section,
                        acceptanceCriteria: { ...section.acceptanceCriteria, criteria }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#111827]">
                      {section.acceptanceCriteria.criteria.map((criterion, index) => (
                        <li key={index}>{criterion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Use Cases</h3>
              {section.useCases.map((useCase, index) => (
                <div key={useCase.id} className="bg-[#f8f9fa] p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-[#111827]">{useCase.title}</h4>
                    <span className="text-sm text-[#6b7280]">#{useCase.id}</span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[#4b5563]">{useCase.description}</p>
                    <div>
                      <h5 className="font-medium text-[#111827] mb-2">Actors</h5>
                      <ul className="list-disc list-inside text-[#4b5563]">
                        {useCase.actors.map((actor, i) => (
                          <li key={i}>{actor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-[#111827] mb-2">Main Scenario</h5>
                      <ol className="list-decimal list-inside text-[#4b5563]">
                        {useCase.mainScenario.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Non-Functional Requirements */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Non-Functional Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(section.nonFunctionalRequirements).map(([category, requirements]) => (
                  <div key={category}>
                    <h4 className="font-medium text-[#111827] capitalize mb-2">{category}</h4>
                    {editingFeature === section.featureName ? (
                      renderEditableList(
                        requirements,
                        (newReqs) => setEditedContent({
                          ...section,
                          nonFunctionalRequirements: {
                            ...section.nonFunctionalRequirements,
                            [category]: newReqs
                          }
                        })
                      )
                    ) : (
                      <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                        {requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dependencies and Assumptions */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Dependencies and Assumptions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[#111827] mb-2">Dependencies</h4>
                  {editingFeature === section.featureName ? (
                    renderEditableList(
                      section.dependencies.dependencies,
                      (deps) => setEditedContent({
                        ...section,
                        dependencies: { ...section.dependencies, dependencies: deps }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                      {section.dependencies.dependencies.map((dep, index) => (
                        <li key={index}>{dep}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-[#111827] mb-2">Assumptions</h4>
                  {editingFeature === section.featureName ? (
                    renderEditableList(
                      section.dependencies.assumptions,
                      (assumptions) => setEditedContent({
                        ...section,
                        dependencies: { ...section.dependencies, assumptions }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                      {section.dependencies.assumptions.map((assumption, index) => (
                        <li key={index}>{assumption}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Open Questions and Risks */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Open Questions and Risks</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-[#111827] mb-2">Questions</h4>
                  {editingFeature === section.featureName ? (
                    renderEditableList(
                      section.openQuestions.questions,
                      (questions) => setEditedContent({
                        ...section,
                        openQuestions: { ...section.openQuestions, questions }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                      {section.openQuestions.questions.map((question, index) => (
                        <li key={index}>{question}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-[#111827] mb-2">Risks</h4>
                  {editingFeature === section.featureName ? (
                    renderEditableList(
                      section.openQuestions.risks,
                      (risks) => setEditedContent({
                        ...section,
                        openQuestions: { ...section.openQuestions, risks }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                      {section.openQuestions.risks.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-[#111827] mb-2">Mitigations</h4>
                  {editingFeature === section.featureName ? (
                    renderEditableList(
                      section.openQuestions.mitigations,
                      (mitigations) => setEditedContent({
                        ...section,
                        openQuestions: { ...section.openQuestions, mitigations }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                      {section.openQuestions.mitigations.map((mitigation, index) => (
                        <li key={index}>{mitigation}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Wireframe Guidelines */}
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Wireframe Guidelines</h3>
              {editingFeature === section.featureName ? (
                renderEditableList(
                  section.wireframeGuidelines,
                  (guidelines) => setEditedContent({ ...section, wireframeGuidelines: guidelines })
                )
              ) : (
                <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                  {section.wireframeGuidelines.map((guideline, index) => (
                    <li key={index}>{guideline}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      {renderNavigation()}
      {renderContent()}
    </div>
  );
} 