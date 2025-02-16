import React from 'react';

interface PRDViewerProps {
  prdContent: string;
}

interface Feature {
  title: string;
  description: string[];
  userStories: string[];
  acceptanceCriteria: string[];
  useCases: string[];
  technical: string[];
}

interface ProcessedPRD {
  overview: string[];
  features: Feature[];
}

const formatText = (text: string) => {
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Headers
    .replace(/#{3}\s*(.*)/g, '<h3 class="text-xl font-bold mb-3">$1</h3>')
    .replace(/#{2}\s*(.*)/g, '<h2 class="text-2xl font-bold mb-4">$1</h2>')
    .replace(/#{1}\s*(.*)/g, '<h1 class="text-3xl font-bold mb-5">$1</h1>')
    // Lists
    .replace(/^\-\s*(.*)/gm, '<li class="ml-4">$1</li>')
    // Numbers
    .replace(/^\d+\.\s*(.*)/gm, '<div class="font-semibold">$1</div>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:text-indigo-800 underline">$1</a>');
};

const PRDViewer = ({ prdContent }: PRDViewerProps) => {
  const processedContent = React.useMemo(() => {
    try {
      console.log('Raw PRD content:', prdContent);
      
      const lines = prdContent.split('\n').map(line => line.trim()).filter(Boolean);
      const processed: ProcessedPRD = {
        overview: [],
        features: []
      };

      let currentFeature: Feature | null = null;
      let currentSection: keyof Feature | 'overview' = 'overview';

      for (const line of lines) {
        // Start of a new feature
        if (line.startsWith('Funcionalidad')) {
          if (currentFeature) {
            processed.features.push(currentFeature);
          }
          currentFeature = {
            title: line,
            description: [],
            userStories: [],
            acceptanceCriteria: [],
            useCases: [],
            technical: []
          };
          currentSection = 'description';
          continue;
        }

        // Identify sections within a feature
        if (line.includes('Descripción:')) {
          currentSection = 'description';
          continue;
        } else if (line.includes('User Stories:')) {
          currentSection = 'userStories';
          continue;
        } else if (line.includes('Criterios de Aceptación:')) {
          currentSection = 'acceptanceCriteria';
          continue;
        } else if (line.includes('Casos de Uso:')) {
          currentSection = 'useCases';
          continue;
        } else if (line.includes('Consideraciones Técnicas:')) {
          currentSection = 'technical';
          continue;
        }

        // Add content to current section with formatting
        if (currentFeature && currentSection !== 'overview') {
          currentFeature[currentSection].push(formatText(line));
        } else if (!currentFeature) {
          processed.overview.push(formatText(line));
        }
      }

      // Don't forget to add the last feature
      if (currentFeature) {
        processed.features.push(currentFeature);
      }

      console.log('Processed content:', processed);
      return processed;
    } catch (error) {
      console.error('Error processing PRD content:', error);
      return {
        overview: [typeof prdContent === 'string' ? prdContent : 'Error processing content'],
        features: []
      };
    }
  }, [prdContent]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Product Requirements Document
              </h1>
              <p className="mt-2 text-indigo-100 font-medium">
                Generated {new Date().toLocaleDateString()}
              </p>
            </div>
            <button 
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg 
                text-sm transition-all duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 min-h-screen">
          {/* Modern Sidebar */}
          <div className="col-span-3 border-r border-gray-100 bg-white">
            <nav className="sticky top-0 p-6 space-y-1 max-h-screen overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Contenido
                </h2>
              </div>
              <a href="#overview" 
                className="block px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 
                  rounded-lg transition-colors duration-200"
              >
                Resumen del Producto
              </a>
              {processedContent.features.map((feature, index) => (
                <a
                  key={index}
                  href={`#feature-${index}`}
                  className="block px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 
                    rounded-lg transition-colors duration-200"
                >
                  {feature.title.replace('Funcionalidad ', '📍 Funcionalidad ')}
                </a>
              ))}
            </nav>
          </div>

          {/* Main Content with Modern Styling */}
          <div className="col-span-9 bg-white">
            <div className="p-8 space-y-8">
              {/* Overview Section */}
              <section id="overview" className="mb-12">
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Resumen del Producto
                  </h2>
                  <div className="prose max-w-none">
                    {processedContent.overview.map((line, index) => (
                      <div 
                        key={index} 
                        className="text-gray-600 leading-relaxed mb-4"
                        dangerouslySetInnerHTML={{ __html: line }}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Features with Modern Cards */}
              {processedContent.features.map((feature, featureIndex) => (
                <section 
                  key={featureIndex} 
                  id={`feature-${featureIndex}`} 
                  className="mb-16 bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >
                  {/* Feature Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {feature.title.replace('Funcionalidad ', '📍 Funcionalidad ')}
                    </h2>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Description */}
                    <div className="prose max-w-none">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Descripción
                      </h3>
                      {feature.description.map((line, index) => (
                        <div 
                          key={index} 
                          className="text-gray-600 leading-relaxed mb-3"
                          dangerouslySetInnerHTML={{ __html: line }}
                        />
                      ))}
                    </div>

                    {/* User Stories */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        User Stories
                      </h3>
                      <div className="grid gap-4">
                        {feature.userStories.map((story, index) => (
                          <div key={index} 
                            className="bg-blue-50 p-6 rounded-xl border border-blue-100"
                          >
                            <p className="text-blue-900 font-medium">
                              {story.replace(/^[-*]\s*/, '')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Acceptance Criteria */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Criterios de Aceptación
                      </h3>
                      <ul className="space-y-3">
                        {feature.acceptanceCriteria.map((criteria, index) => (
                          <li key={index} 
                            className="flex items-start gap-3 text-gray-600"
                          >
                            <span className="text-indigo-500 mt-1">•</span>
                            <span>{criteria.replace(/^[-*]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Casos de Uso
                      </h3>
                      <div className="space-y-4">
                        {feature.useCases.map((useCase, index) => (
                          <div key={index} 
                            className="bg-gray-50 p-6 rounded-xl border border-gray-100"
                          >
                            <p className="text-gray-900">
                              {useCase.replace(/^[-*]\s*/, '')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Considerations */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Consideraciones Técnicas
                      </h3>
                      <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                        {feature.technical.map((tech, index) => (
                          <p key={index} className="text-yellow-900 mb-3 last:mb-0">
                            {tech.replace(/^[-*]\s*/, '')}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRDViewer; 