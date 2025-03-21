import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface SvgWireframeProps {
  svgContent?: string;
  svgContentFromDb?: {
    svg_content: string;
  };
  screenId?: string;
  screenName: string;
  height?: number;
  className?: string;
}

/**
 * Component to safely render SVG wireframes
 */
export const SvgWireframe: React.FC<SvgWireframeProps> = ({ 
  svgContent, 
  svgContentFromDb,
  screenId,
  screenName,
  height = 400,
  className = ''
}) => {
  const [error, setError] = useState<string | null>(null);
  
  // Determine which SVG content to use
  const actualSvgContent = svgContentFromDb?.svg_content || svgContent;

  useEffect(() => {
    if (!actualSvgContent) {
      setError("No SVG content available");
    } else if (!actualSvgContent.trim().startsWith('<svg') || !actualSvgContent.trim().endsWith('</svg>')) {
      setError("Invalid SVG content");
    } else {
      setError(null);
    }
  }, [actualSvgContent]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} 
           style={{ height: `${height}px` }}>
        <div className="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 font-medium">{error}</p>
          <p className="text-gray-500 text-sm mt-1">Wireframe for {screenName} not available</p>
        </div>
      </div>
    );
  }

  // Use DOMPurify to sanitize the SVG content before rendering
  const sanitizedSvg = actualSvgContent ? DOMPurify.sanitize(actualSvgContent) : '';

  return (
    <div className={`svg-wireframe flex items-center justify-center bg-white rounded-lg ${className}`}
         style={{ minHeight: `${height}px`, maxHeight: `${height}px` }}>
      <div className="svg-container w-full h-full" style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        <div
          className="svg-wrapper" 
          style={{ 
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            justifyContent: 'center'
          }} 
          dangerouslySetInnerHTML={{ 
            __html: sanitizedSvg.replace('<svg', '<svg style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain;"')
          }}
        />
      </div>
    </div>
  );
}; 