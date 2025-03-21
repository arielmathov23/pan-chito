import React, { useState, useEffect } from 'react';
import { TechDoc } from '../services/techDocService';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { prdStore } from '../utils/prdStore';
import { briefStore } from '../utils/briefStore';
import { techDocService } from '../services/techDocService';

interface TechDocViewerProps {
  techDoc: TechDoc;
  onUpdate: (updatedTechDoc: TechDoc) => void;
}

interface ParsedTechStack {
  overview?: string;
  frontend?: string;
  backend?: string;
  database?: string;
  deployment?: string;
  thirdPartyServices?: string;
  [key: string]: string | undefined;
}

interface ParsedFrontendGuidelines {
  overview?: string;
  colorPalette?: string;
  typography?: string;
  componentStructure?: string;
  responsiveDesign?: string;
  accessibilityConsiderations?: string;
  uiReferences?: string;
  [key: string]: string | undefined;
}

interface ParsedBackendStructure {
  overview?: string;
  apiRoutes?: string;
  databaseSchema?: string;
  authentication?: string;
  integrations?: string;
  dataProcessing?: string;
  [key: string]: string | undefined;
}

interface ParsedTechDoc {
  techStack?: ParsedTechStack;
  frontendGuidelines?: ParsedFrontendGuidelines;
  backendStructure?: ParsedBackendStructure;
}

interface EditableContent {
  [key: string]: any;
}

export default function TechDocViewer({ techDoc, onUpdate }: TechDocViewerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tech-stack' | 'frontend' | 'backend'>('tech-stack');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [content, setContent] = useState<EditableContent>(techDoc.content || {
    platform: { targets: [], requirements: [] },
    frontend: {},
    backend: {},
    api: {},
    database: {},
    deployment: {}
  });
  const [parsedContent, setParsedContent] = useState<ParsedTechDoc>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Parse the tech doc content
    parseDocContent();
    
    // Set content from techDoc
    setContent(techDoc.content || {
      platform: { targets: [], requirements: [] },
      frontend: {},
      backend: {},
      api: {},
      database: {},
      deployment: {}
    });
    
    // Get project ID from the tech doc's PRD
    const prd = prdStore.getPRD(techDoc.prdId);
    if (prd) {
      const brief = briefStore.getBrief(prd.briefId);
      if (brief) {
        setProjectId(brief.projectId);
      }
    }
  }, [techDoc]);

  const parseDocContent = () => {
    const parsed: ParsedTechDoc = {};
    
    try {
      console.log('Parsing tech doc content:', {
        techStack: techDoc.techStack ? techDoc.techStack.substring(0, 100) + '...' : null,
        frontend: techDoc.frontend ? techDoc.frontend.substring(0, 100) + '...' : null,
        backend: techDoc.backend ? techDoc.backend.substring(0, 100) + '...' : null,
        content: techDoc.content ? JSON.stringify(techDoc.content).substring(0, 100) + '...' : null
      });
      
      // First try to parse as a complete TechDocumentation object
      if (techDoc.techStack) {
        try {
          const fullDoc = JSON.parse(techDoc.techStack);
          console.log('Parsed techStack as JSON:', Object.keys(fullDoc));
          
          if (fullDoc.techStack) {
            // This is the full documentation object
            parsed.techStack = fullDoc.techStack;
            parsed.frontendGuidelines = fullDoc.frontendGuidelines;
            parsed.backendStructure = fullDoc.backendStructure;
            console.log('Found complete doc in techStack field');
          } else {
            // This is just the techStack section
            parsed.techStack = fullDoc;
            console.log('Found only techStack section');
          }
        } catch (e) {
          // If it's not valid JSON, treat it as plain text
          console.log('techStack is not valid JSON, treating as plain text');
          parsed.techStack = {
            overview: techDoc.techStack
          };
        }
      }
      
      // Try to parse frontend if we don't already have it
      if (techDoc.frontend && !parsed.frontendGuidelines) {
        try {
          const frontendData = JSON.parse(techDoc.frontend);
          console.log('Parsed frontend as JSON:', Object.keys(frontendData));
          
          if (frontendData.frontendGuidelines) {
            // This contains the frontendGuidelines section
            parsed.frontendGuidelines = frontendData.frontendGuidelines;
            console.log('Found frontendGuidelines section');
          } else {
            // This is just the frontendGuidelines section
            parsed.frontendGuidelines = frontendData;
            console.log('Found only frontend data');
          }
        } catch (e) {
          // If it's not valid JSON, treat it as plain text
          console.log('frontend is not valid JSON, treating as plain text');
          parsed.frontendGuidelines = {
            overview: techDoc.frontend
          };
        }
      }
      
      // Try to parse backend if we don't already have it
      if (techDoc.backend && !parsed.backendStructure) {
        try {
          const backendData = JSON.parse(techDoc.backend);
          console.log('Parsed backend as JSON:', Object.keys(backendData));
          
          if (backendData.backendStructure) {
            // This contains the backendStructure section
            parsed.backendStructure = backendData.backendStructure;
            console.log('Found backendStructure section');
          } else {
            // This is just the backendStructure section
            parsed.backendStructure = backendData;
            console.log('Found only backend data');
          }
        } catch (e) {
          // If it's not valid JSON, treat it as plain text
          console.log('backend is not valid JSON, treating as plain text');
          parsed.backendStructure = {
            overview: techDoc.backend
          };
        }
      }
      
      console.log('Final parsed content:', {
        techStack: parsed.techStack ? Object.keys(parsed.techStack) : null,
        frontendGuidelines: parsed.frontendGuidelines ? Object.keys(parsed.frontendGuidelines) : null,
        backendStructure: parsed.backendStructure ? Object.keys(parsed.backendStructure) : null
      });
    } catch (error) {
      console.error('Error parsing tech doc content:', error);
    }
    
    setParsedContent(parsed);
    return parsed;
  };

  const handleEdit = (section: string, sectionContent: any) => {
    setEditingSection(section);
    
    // For platform section, provide a more structured editing experience
    if (section === 'platform') {
      const formattedContent = {
        targets: sectionContent.targets || [],
        requirements: sectionContent.requirements || []
      };
      setEditedContent(JSON.stringify(formattedContent, null, 2));
    } else if (section === 'tech-stack') {
      // Get the raw content from techDoc
      let content = techDoc.techStack || '';
      let parsedContent: Record<string, any> = {};
      
      try {
        // Try to parse the existing content
        parsedContent = JSON.parse(content);
        console.log("Successfully parsed tech stack content:", Object.keys(parsedContent));
      } catch (e) {
        console.log("Could not parse tech stack as JSON, using empty template");
        // If it's not valid JSON or empty, create a template
        parsedContent = {
          overview: "",
          frontend: "",
          backend: "",
          database: "",
          deployment: "",
          thirdPartyServices: ""
        };
      }
      
      // If we have parsed content from the techDoc, use it
      if (parsedContent && typeof parsedContent === 'object' && 'techStack' in parsedContent) {
        // This is the full documentation object
        parsedContent = parsedContent.techStack;
      }
      
      setEditedContent(JSON.stringify(parsedContent, null, 2));
    } else if (section === 'frontend') {
      let content = techDoc.frontend || '';
      let parsedContent: Record<string, any> = {};
      
      try {
        // Try to parse the existing content
        parsedContent = JSON.parse(content);
        console.log("Successfully parsed frontend content:", Object.keys(parsedContent));
      } catch (e) {
        console.log("Could not parse frontend as JSON, using empty template");
        // If it's not valid JSON or empty, create a template
        parsedContent = {
          overview: "",
          colorPalette: "",
          typography: "",
          componentStructure: "",
          responsiveDesign: "",
          accessibilityConsiderations: "",
          uiReferences: ""
        };
      }
      
      // If we have parsed content from the techDoc, use it
      if (parsedContent && typeof parsedContent === 'object' && 'frontendGuidelines' in parsedContent) {
        // This is the full documentation object
        parsedContent = parsedContent.frontendGuidelines;
      }
      
      setEditedContent(JSON.stringify(parsedContent, null, 2));
    } else if (section === 'backend') {
      let content = techDoc.backend || '';
      let parsedContent: Record<string, any> = {};
      
      try {
        // Try to parse the existing content
        parsedContent = JSON.parse(content);
        console.log("Successfully parsed backend content:", Object.keys(parsedContent));
      } catch (e) {
        console.log("Could not parse backend as JSON, using empty template");
        // If it's not valid JSON or empty, create a template
        parsedContent = {
          overview: "",
          apiRoutes: "",
          databaseSchema: "",
          authentication: "",
          integrations: "",
          dataProcessing: ""
        };
      }
      
      // If we have parsed content from the techDoc, use it
      if (parsedContent && typeof parsedContent === 'object' && 'backendStructure' in parsedContent) {
        // This is the full documentation object
        parsedContent = parsedContent.backendStructure;
      }
      
      setEditedContent(JSON.stringify(parsedContent, null, 2));
    } else {
      // For subsections, ensure we're working with a proper JSON string
      try {
        // If sectionContent is already an object, stringify it
        if (typeof sectionContent === 'object' && sectionContent !== null) {
          setEditedContent(JSON.stringify(sectionContent, null, 2));
        } else if (typeof sectionContent === 'string') {
          // Try to parse it as JSON to validate, then re-stringify with formatting
          try {
            const parsed = JSON.parse(sectionContent);
            setEditedContent(JSON.stringify(parsed, null, 2));
          } catch (e) {
            // If it's not valid JSON, use as is
            setEditedContent(sectionContent);
          }
        } else {
          // Fallback for other types
          setEditedContent(JSON.stringify(sectionContent || {}, null, 2));
        }
      } catch (e) {
        // If any error occurs, use a safe fallback
        console.error('Error preparing content for editing:', e);
        setEditedContent(typeof sectionContent === 'string' ? sectionContent : JSON.stringify(sectionContent || {}, null, 2));
      }
    }
    
    setIsEditing(true);
  };

  const handleSave = async () => {
    console.log(`Saving ${editingSection} content:`, editedContent.substring(0, 100) + "...");
    
    try {
      // Validate JSON if needed
      if (editingSection === 'tech-stack' || editingSection === 'frontend' || editingSection === 'backend') {
        try {
          // Try to parse the content as JSON to validate it
          JSON.parse(editedContent);
        } catch (e) {
          console.error(`Invalid JSON format for ${editingSection}:`, e);
          alert(`The content for ${editingSection} is not valid JSON. Please check your formatting.`);
          return;
        }
      }
      
      // Create a copy of the tech doc to update
      const updatedTechDoc = { ...techDoc };
      
      // Update the appropriate section
      if (editingSection === 'tech-stack') {
        updatedTechDoc.techStack = editedContent;
        console.log("Updated tech stack content");
      } else if (editingSection === 'frontend') {
        updatedTechDoc.frontend = editedContent;
        console.log("Updated frontend content");
      } else if (editingSection === 'backend') {
        updatedTechDoc.backend = editedContent;
        console.log("Updated backend content");
      }
      
      // Save the updated tech doc using the techDocService
      const savedTechDoc = await techDocService.saveTechDoc(updatedTechDoc);
      
      // Update the local state with the new tech doc
      onUpdate(savedTechDoc);
      console.log("Successfully saved tech doc to Supabase");
      
      // Reset editing state
      setIsEditing(false);
      setEditingSection(null);
      setEditedContent('');
      
      // Refresh the parsed content
      const refreshedContent = parseDocContent();
      setParsedContent(refreshedContent);
    } catch (error) {
      console.error("Error saving tech doc:", error);
      alert(`Error saving tech doc: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSection(null);
    setEditedContent('');
  };

  const handleCreateDocumentation = () => {
    console.log("Creating documentation for tab:", activeTab);
    
    // Call handleEdit with the appropriate section
    handleEdit(activeTab, activeTab === 'tech-stack' ? techDoc.techStack : 
                          activeTab === 'frontend' ? techDoc.frontend : 
                          activeTab === 'backend' ? techDoc.backend : null);
  };

  const renderEditableSection = (title: string, section: string, content: any) => (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F533A]/5 to-transparent px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
        <h3 className="font-medium text-[#111827]">{title}</h3>
        <button
          onClick={() => handleEdit(section, content)}
          className="text-[#0F533A] hover:text-[#0a3f2c] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21.5 2.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 2H22V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="p-4">
        {editingSection === section ? (
          <div className="space-y-4">
            {section === 'platform' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Platforms</label>
                  <textarea
                    value={JSON.parse(editedContent).targets.join('\n')}
                    onChange={(e) => {
                      const targets = e.target.value.split('\n').filter(t => t.trim());
                      setEditedContent(JSON.stringify({
                        ...JSON.parse(editedContent),
                        targets
                      }, null, 2));
                    }}
                    className="w-full h-24 font-mono text-sm p-3 rounded-lg border border-[#e5e7eb] focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] outline-none transition-colors"
                    placeholder="Enter one target platform per line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  <textarea
                    value={JSON.parse(editedContent).requirements.join('\n')}
                    onChange={(e) => {
                      const requirements = e.target.value.split('\n').filter(r => r.trim());
                      setEditedContent(JSON.stringify({
                        ...JSON.parse(editedContent),
                        requirements
                      }, null, 2));
                    }}
                    className="w-full h-32 font-mono text-sm p-3 rounded-lg border border-[#e5e7eb] focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] outline-none transition-colors"
                    placeholder="Enter one requirement per line"
                  />
                </div>
              </div>
            ) : (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-64 font-mono text-sm p-3 rounded-lg border border-[#e5e7eb] focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] outline-none transition-colors"
                placeholder="Enter JSON content..."
              />
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingSection(null)}
                className="px-3 py-1.5 text-sm text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-[#0F533A] text-white rounded hover:bg-[#0a3f2c] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {section === 'platform' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[#111827]">Target Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.targets.map((target: string) => (
                      <span key={target} className="px-2 py-1 text-xs rounded-full bg-[#0F533A]/10 text-[#0F533A]">
                        {target}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[#111827]">Requirements</h4>
                  <ul className="text-sm text-[#4b5563] space-y-1">
                    {content.requirements.map((req: string) => (
                      <li key={req} className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {section !== 'platform' && (
              <div className="text-sm text-[#4b5563]">
                {typeof content === 'object' && content !== null ? 
                  Object.entries(content).map(([key, value]) => (
                    <div key={key} className="mb-4">
                      <h4 className="text-base font-medium text-[#374151] mb-2">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <div className="text-[#4b5563] text-sm leading-relaxed whitespace-pre-line">
                        {typeof value === 'string' 
                          ? value 
                          : typeof value === 'object' && value !== null
                            ? JSON.stringify(value, null, 2)
                            : String(value)
                        }
                      </div>
                    </div>
                  ))
                : typeof content === 'string' 
                  ? (
                    <div className="whitespace-pre-wrap">
                      {(() => {
                        try {
                          // Try to parse and format as JSON
                          const parsed = JSON.parse(content);
                          return Object.entries(parsed).map(([key, value]) => (
                            <div key={key} className="mb-4">
                              <h4 className="text-base font-medium text-[#374151] mb-2">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </h4>
                              <div className="text-[#4b5563] text-sm leading-relaxed whitespace-pre-line">
                                {typeof value === 'string' 
                                  ? value 
                                  : typeof value === 'object' && value !== null
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)
                                }
                              </div>
                            </div>
                          ));
                        } catch (e) {
                          // If not valid JSON, display as plain text
                          return content;
                        }
                      })()}
                    </div>
                  )
                  : String(content)
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSectionTitle = (title: string) => (
    <h3 className="text-lg font-semibold text-[#111827] mt-6 mb-3">{title}</h3>
  );

  const renderSubsection = (title: string, content?: string) => {
    if (!content) return null;
    
    return (
      <div className="mb-6">
        <h4 className="text-base font-medium text-[#374151] mb-2">{title}</h4>
        <div className="text-[#4b5563] text-sm leading-relaxed whitespace-pre-line">
          {content}
        </div>
      </div>
    );
  };

  const renderPlainTextContent = (content: string) => {
    if (!content) return null;
    
    // Basic Markdown formatting
    const formattedContent = content
      // Format headers
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-base font-medium mt-4 mb-2">$1</h3>')
      // Format lists
      .replace(/^\- (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1">$1. $2</li>')
      // Format code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded my-2 font-mono text-sm overflow-x-auto">$1</pre>')
      // Format inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded font-mono text-sm">$1</code>')
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Format paragraphs (add spacing between paragraphs)
      .replace(/\n\n/g, '</p><p class="mb-3">');
    
    return (
      <div className="mt-6">
        <div 
          className="text-[#4b5563] text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${formattedContent}</p>` }}
        />
      </div>
    );
  };

  const renderColorPalette = (colors?: string) => {
    if (!colors) return null;
    
    // Extract hex colors from the string
    const colorMatches = colors.match(/#[0-9A-Fa-f]{6}/g) || [];
    
    return (
      <div className="mb-6">
        <h4 className="text-base font-medium text-[#374151] mb-2">Color Palette</h4>
        <div className="text-[#4b5563] text-sm leading-relaxed mb-3">
          {colors}
        </div>
        {colorMatches.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {colorMatches.map((color, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-12 h-12 rounded-md shadow-sm border border-gray-200" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-xs mt-1 font-mono">{color}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTechStackContent = () => {
    const techStack = parsedContent.techStack;
    
    if (!techStack) {
      // If no parsed content is available, try to show the raw content
      if (techDoc.techStack) {
        try {
          // Try to parse and display as JSON
          const rawContent = JSON.parse(techDoc.techStack);
          return (
            <div className="mt-6">
              {Object.entries(rawContent).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h4 className="text-base font-medium text-[#374151] mb-2">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  <div className="text-[#4b5563] text-sm leading-relaxed whitespace-pre-line">
                    {typeof value === 'string' 
                      ? value 
                      : typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                    }
                  </div>
                </div>
              ))}
            </div>
          );
        } catch (e) {
          // If not valid JSON, display as plain text
          return (
            <div className="mt-6 whitespace-pre-wrap text-[#4b5563] text-sm">
              {techDoc.techStack}
            </div>
          );
        }
      }
      return <p className="text-gray-500 mt-6">No tech stack information available</p>;
    }
    
    // Check if this is just plain text content
    if (Object.keys(techStack).length === 1 && techStack.overview && techStack.overview.includes('#')) {
      return renderPlainTextContent(techStack.overview);
    }
    
    return (
      <div className="mt-6">
        {renderSubsection('Overview', techStack.overview)}
        {renderSubsection('Frontend', techStack.frontend)}
        {renderSubsection('Backend', techStack.backend)}
        {renderSubsection('Database', techStack.database)}
        {renderSubsection('Deployment', techStack.deployment)}
        {renderSubsection('Third-Party Services', techStack.thirdPartyServices)}
      </div>
    );
  };

  const renderFrontendContent = () => {
    const frontend = parsedContent.frontendGuidelines;
    
    if (!frontend) {
      // If no parsed content is available, try to show the raw content
      if (techDoc.frontend) {
        try {
          // Try to parse and display as JSON
          const rawContent = JSON.parse(techDoc.frontend);
          return (
            <div className="mt-6">
              {Object.entries(rawContent).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h4 className="text-base font-medium text-[#374151] mb-2">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  <div className="text-[#4b5563] text-sm leading-relaxed whitespace-pre-line">
                    {typeof value === 'string' 
                      ? value 
                      : typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                    }
                  </div>
                </div>
              ))}
            </div>
          );
        } catch (e) {
          // If not valid JSON, display as plain text
          return (
            <div className="mt-6 whitespace-pre-wrap text-[#4b5563] text-sm">
              {techDoc.frontend}
            </div>
          );
        }
      }
      return <p className="text-gray-500 mt-6">No frontend guidelines available</p>;
    }
    
    // Check if this is just plain text content
    if (Object.keys(frontend).length === 1 && frontend.overview && frontend.overview.includes('#')) {
      return renderPlainTextContent(frontend.overview);
    }
    
    return (
      <div className="mt-6">
        {renderSubsection('Overview', frontend.overview)}
        {renderColorPalette(frontend.colorPalette)}
        {renderSubsection('Typography', frontend.typography)}
        {renderSubsection('Component Structure', frontend.componentStructure)}
        {renderSubsection('Responsive Design', frontend.responsiveDesign)}
        {renderSubsection('Accessibility Considerations', frontend.accessibilityConsiderations)}
        {renderSubsection('UI References', frontend.uiReferences)}
      </div>
    );
  };

  const renderBackendContent = () => {
    const backend = parsedContent.backendStructure;
    
    if (!backend) {
      // If no parsed content is available, try to show the raw content
      if (techDoc.backend) {
        try {
          // Try to parse and display as JSON
          const rawContent = JSON.parse(techDoc.backend);
          return (
            <div className="mt-6">
              {Object.entries(rawContent).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h4 className="text-base font-medium text-[#374151] mb-2">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  <div className="text-[#4b5563] text-sm leading-relaxed whitespace-pre-line">
                    {typeof value === 'string' 
                      ? value 
                      : typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                    }
                  </div>
                </div>
              ))}
            </div>
          );
        } catch (e) {
          // If not valid JSON, display as plain text
          return (
            <div className="mt-6 whitespace-pre-wrap text-[#4b5563] text-sm">
              {techDoc.backend}
            </div>
          );
        }
      }
      return <p className="text-gray-500 mt-6">No backend structure information available</p>;
    }
    
    // Check if this is just plain text content
    if (Object.keys(backend).length === 1 && backend.overview && backend.overview.includes('#')) {
      return renderPlainTextContent(backend.overview);
    }
    
    return (
      <div className="mt-6">
        {renderSubsection('Overview', backend.overview)}
        {renderSubsection('API Routes', backend.apiRoutes)}
        {renderSubsection('Database Schema', backend.databaseSchema)}
        {renderSubsection('Authentication', backend.authentication)}
        {renderSubsection('Integrations', backend.integrations)}
        {renderSubsection('Data Processing', backend.dataProcessing)}
      </div>
    );
  };

  const renderContent = () => {
    if (isEditing && editingSection) {
      try {
        const parsedContent = JSON.parse(editedContent);
        
        return (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">
                Edit {editingSection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-1.5 bg-[#0F533A] rounded-md text-sm font-medium text-white hover:bg-[#0a3f2c]"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
              </div>
            </div>
            
            {editingSection === 'tech-stack' && (
              <>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Overview</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.overview || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, overview: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Provide an overview of the tech stack"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Frontend</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.frontend || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, frontend: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the frontend technologies"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Backend</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.backend || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, backend: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the backend technologies"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Database</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.database || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, database: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the database technologies"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Deployment</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.deployment || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, deployment: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the deployment strategy"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Third-Party Services</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.thirdPartyServices || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, thirdPartyServices: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="List any third-party services or APIs"
                  />
                </div>
              </>
            )}
            
            {editingSection === 'frontend' && (
              <>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Overview</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.overview || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, overview: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Provide an overview of the frontend guidelines"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Color Palette</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.colorPalette || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, colorPalette: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the color palette (e.g. #FFFFFF for white)"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Typography</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.typography || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, typography: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe typography choices"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Component Structure</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.componentStructure || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, componentStructure: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the component structure"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Responsive Design</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.responsiveDesign || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, responsiveDesign: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe responsive design approach"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Accessibility Considerations</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.accessibilityConsiderations || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, accessibilityConsiderations: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe accessibility considerations"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">UI References</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.uiReferences || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, uiReferences: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Provide UI references or inspiration"
                  />
                </div>
              </>
            )}
            
            {editingSection === 'backend' && (
              <>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Overview</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.overview || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, overview: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Provide an overview of the backend structure"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">API Routes</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.apiRoutes || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, apiRoutes: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the API routes"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Database Schema</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.databaseSchema || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, databaseSchema: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the database schema"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Authentication</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.authentication || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, authentication: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe the authentication approach"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Integrations</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.integrations || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, integrations: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe any third-party integrations"
                  />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">Data Processing</label>
                  <textarea
                    className="w-full p-3 border border-[#e5e7eb] rounded-lg text-sm min-h-[100px] focus:ring-[#0F533A] focus:border-[#0F533A]"
                    value={parsedContent.dataProcessing || ""}
                    onChange={(e) => {
                      const updatedContent = { ...parsedContent, dataProcessing: e.target.value };
                      setEditedContent(JSON.stringify(updatedContent, null, 2));
                    }}
                    placeholder="Describe data processing workflows"
                  />
                </div>
              </>
            )}
          </div>
        );
      } catch (e) {
        console.error(`Error parsing ${editingSection} content:`, e);
        
        // Fallback to the original textarea if parsing fails
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">
                Edit {editingSection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-1.5 bg-[#0F533A] rounded-md text-sm font-medium text-white hover:bg-[#0a3f2c]"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
              </div>
            </div>
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              <p>Error parsing content for {editingSection}. Showing raw editor instead.</p>
            </div>
            <textarea
              className="w-full h-[500px] p-4 border border-[#e5e7eb] rounded-lg font-mono text-sm"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          </div>
        );
      }
    }
    
    // Check if all content is empty
    const isEmpty = 
      (!techDoc.techStack || techDoc.techStack.trim() === '') &&
      (!techDoc.frontend || techDoc.frontend.trim() === '') &&
      (!techDoc.backend || techDoc.backend.trim() === '');
    
    if (isEmpty) {
      return (
        <div className="mt-6 text-center p-8">
          <p className="text-gray-500 mb-4">No technical documentation available yet.</p>
          <button
            onClick={handleCreateDocumentation}
            className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.91 4.15002C15.58 6.54002 17.45 8.41002 19.85 9.09002" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Documentation
          </button>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'tech-stack':
        return renderTechStackContent();
      case 'frontend':
        return renderFrontendContent();
      case 'backend':
        return renderBackendContent();
      default:
        return <p className="text-gray-500 mt-6">Select a tab to view content</p>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#8b5cf6] mr-2"></div>
          <h2 className="text-xl font-semibold text-[#111827]">Technical Documentation</h2>
        </div>
        
        <div className="flex items-center">
          {!isEditing && (
            <button
              onClick={handleCreateDocumentation}
              className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Edit Documentation</span>
              <span className="inline sm:hidden">Edit</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="border-b border-[#e5e7eb]">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('tech-stack')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'tech-stack'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Tech Stack
          </button>
          <button
            onClick={() => setActiveTab('frontend')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'frontend'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Frontend Guidelines
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'backend'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Backend Structure
          </button>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
}
