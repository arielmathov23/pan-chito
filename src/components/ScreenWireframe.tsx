import React from 'react';
import { Screen } from '../utils/screenStore';

interface ScreenWireframeProps {
  screen: Screen;
  width?: number;
  height?: number;
}

// Define the ScreenPurpose interface
interface ScreenPurpose {
  isLogin: boolean;
  isSignup: boolean;
  isForm: boolean;
  isSettings: boolean;
  isProfile: boolean;
  isHome: boolean;
  isDashboard: boolean;
  isDetails: boolean;
  isList: boolean;
}

// Analyze screen purpose based on name and description
const analyzeScreenPurpose = (screen: Screen): ScreenPurpose => {
  const name = screen.name.toLowerCase();
  const description = screen.description?.toLowerCase() || '';
  
  return {
    isLogin: name.includes('login') || name.includes('sign in') || description.includes('login') || description.includes('sign in'),
    isSignup: name.includes('signup') || name.includes('register') || description.includes('signup') || description.includes('register'),
    isForm: name.includes('form') || description.includes('form') || description.includes('enter') || description.includes('input') || description.includes('fill'),
    isSettings: name.includes('settings') || name.includes('preferences') || description.includes('settings') || description.includes('preferences'),
    isProfile: name.includes('profile') || name.includes('account') || description.includes('profile') || description.includes('account'),
    isHome: name.includes('home') || name.includes('main') || description.includes('home') || description.includes('main'),
    isDashboard: name.includes('dashboard') || description.includes('dashboard') || description.includes('overview'),
    isDetails: name.includes('details') || name.includes('view') || description.includes('details') || description.includes('view'),
    isList: name.includes('list') || name.includes('browse') || description.includes('list') || description.includes('browse')
  };
};

const ScreenWireframe: React.FC<ScreenWireframeProps> = ({
  screen,
  width = 300,
  height = 500,
}) => {
  if (!screen) return null;

  // Get screen element statistics
  const stats = {
    textCount: 0,
    buttonCount: 0,
    inputCount: 0,
    imageCount: 0,
    hasHeadings: false,
    hasLongText: false,
  };

  // Calculate stats if elements exist
  if (screen.elements) {
    screen.elements.forEach(element => {
      if (element.type === 'text') {
        stats.textCount++;
        const content = element.properties?.content || '';
        if (content.length > 80) stats.hasLongText = true;
        if (element.properties?.isHeading) stats.hasHeadings = true;
      } else if (element.type === 'button') {
        stats.buttonCount++;
      } else if (element.type === 'input') {
        stats.inputCount++;
      } else if (element.type === 'image') {
        stats.imageCount++;
      }
    });
  }

  // Define styles for the wireframe container
  const containerStyle: React.CSSProperties = {
    width: width,
    height: height,
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    padding: '12px',
    background: 'white',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  };

  // Mobile header style
  const headerStyle: React.CSSProperties = {
    height: '28px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    position: 'relative',
  };

  // Style for the screen content container
  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '8px 4px',
  };

  // Caption style for the wireframe
  const captionStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '8px 0',
    fontSize: '14px',
    fontWeight: 500,
    color: '#4b5563'
  };

  // Helper to add an appropriate icon for different screen types
  const getScreenIcon = () => {
    const screenType = analyzeScreenPurpose(screen);
    
    if (screenType.isLogin) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    } else if (screenType.isHome || screenType.isDashboard) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    } else if (screenType.isSettings) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    } else if (screenType.isProfile) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    } else {
      return null;
    }
  };

  // Function to render a placeholder image
  const renderPlaceholderImage = (properties?: any) => {
    return (
      <div 
        style={{ 
          background: '#f1f5f9',
          width: '100%',
          height: properties?.height || 140,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  };

  // Function to render a placeholder screen when no elements exist
  const renderPlaceholderScreen = () => {
    const screenType = analyzeScreenPurpose(screen);
    const placeholders: React.ReactNode[] = [];
    
    // Add header
    placeholders.push(
      <div 
        key="header" 
        style={{ margin: '0 0 16px 0', width: '100%' }}
      >
        <div 
          style={{ 
            height: '24px',
            background: '#cbd5e1',
            width: '70%',
            borderRadius: '4px',
            marginBottom: '8px'
          }}
        ></div>
        <div 
          style={{ 
            height: '12px',
            background: '#e2e8f0',
            width: '90%',
            borderRadius: '4px'
          }}
        ></div>
      </div>
    );
    
    // Add specific placeholders based on screen type
    if (screenType.isLogin || screenType.isSignup) {
      // Username/email field
      placeholders.push(
        <div key="username" style={{ margin: '12px 0', width: '100%' }}>
          <div 
            style={{ 
              height: '12px',
              background: '#cbd5e1',
              width: '40%',
              borderRadius: '4px',
              marginBottom: '8px'
            }}
          ></div>
          <div 
            style={{ 
              height: '36px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              width: '100%'
            }}
          ></div>
        </div>
      );
      
      // Password field
      placeholders.push(
        <div key="password" style={{ margin: '12px 0', width: '100%' }}>
          <div 
            style={{ 
              height: '12px',
              background: '#cbd5e1',
              width: '40%',
              borderRadius: '4px',
              marginBottom: '8px'
            }}
          ></div>
          <div 
            style={{ 
              height: '36px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              width: '100%'
            }}
          ></div>
        </div>
      );
      
      // Login button
      placeholders.push(
        <div key="button" style={{ margin: '20px 0', width: '100%' }}>
          <div 
            style={{ 
              height: '40px',
              background: '#3b82f6',
              borderRadius: '6px',
              width: '100%'
            }}
          ></div>
        </div>
      );
    } else if (screenType.isForm) {
      // Generic form fields
      for (let i = 0; i < 3; i++) {
        placeholders.push(
          <div key={`field-${i}`} style={{ margin: '12px 0', width: '100%' }}>
            <div 
              style={{ 
                height: '12px',
                background: '#cbd5e1',
                width: `${40 + Math.random() * 20}%`,
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            ></div>
            <div 
              style={{ 
                height: '36px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                width: '100%'
              }}
            ></div>
          </div>
        );
      }
      
      // Submit button
      placeholders.push(
        <div key="submit" style={{ margin: '20px 0', width: '100%' }}>
          <div 
            style={{ 
              height: '40px',
              background: '#3b82f6',
              borderRadius: '6px',
              width: '40%'
            }}
          ></div>
        </div>
      );
    } else if (screenType.isList) {
      // List items
      for (let i = 0; i < 4; i++) {
        placeholders.push(
          <div 
            key={`list-${i}`} 
            style={{ 
              margin: '8px 0',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              width: '100%'
            }}
          >
            <div 
              style={{ 
                height: '16px',
                background: '#cbd5e1',
                width: `${50 + Math.random() * 30}%`,
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            ></div>
            <div 
              style={{ 
                height: '10px',
                background: '#e2e8f0',
                width: '90%',
                borderRadius: '4px'
              }}
            ></div>
          </div>
        );
      }
    } else {
      // Default content with image and text
      placeholders.push(
        <div key="image" style={{ margin: '12px 0', width: '100%' }}>
          {renderPlaceholderImage()}
        </div>
      );
      
      // Text paragraphs
      for (let i = 0; i < 3; i++) {
        placeholders.push(
          <div key={`para-${i}`} style={{ margin: '12px 0', width: '100%' }}>
            <div 
              style={{ 
                height: '12px',
                background: '#e2e8f0',
                width: '100%',
                borderRadius: '4px',
                marginBottom: '6px'
              }}
            ></div>
            <div 
              style={{ 
                height: '12px',
                background: '#e2e8f0',
                width: '90%',
                borderRadius: '4px',
                marginBottom: '6px'
              }}
            ></div>
            <div 
              style={{ 
                height: '12px',
                background: '#e2e8f0',
                width: '95%',
                borderRadius: '4px'
              }}
            ></div>
          </div>
        );
      }
    }
    
    return placeholders;
  };

  // Function to render an individual element
  const renderElement = (element: any, index: number) => {
    const props = element.properties || {};
    
    switch(element.type) {
      case 'text':
        if (props.isHeading) {
          return (
            <div 
              key={element.id || index} 
              style={{ 
                margin: '6px 0',
                width: '100%',
                textAlign: props.alignment || 'left'
              }}
              className="wireframe-element"
            >
              <div 
                style={{ 
                  height: '22px',
                  background: '#cbd5e1',
                  width: props.content?.length 
                    ? Math.min(100, Math.max(40, props.content.length * 0.8)) + '%' 
                    : '70%',
                  borderRadius: '4px'
                }}
              ></div>
            </div>
          );
        } else {
          // Regular text or paragraph
          return (
            <div 
              key={element.id || index}
              style={{ 
                margin: '6px 0',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: props.alignment === 'center' ? 'center' : 
                          props.alignment === 'right' ? 'flex-end' : 'flex-start'
              }}
              className="wireframe-element"
            >
              {/* Create multiple lines for longer text */}
              {Array.from({ length: Math.ceil((props.content?.length || 10) / 40) }).map((_, i) => (
                <div 
                  key={i}
                  style={{ 
                    height: '10px',
                    background: '#e2e8f0',
                    width: i === 0 ? '100%' : 
                          i === 1 ? '95%' : 
                          i === 2 ? '85%' : 
                          i === 3 ? '90%' : '70%',
                    borderRadius: '4px',
                    marginTop: i > 0 ? '4px' : 0
                  }}
                ></div>
              ))}
            </div>
          );
        }
      
      case 'button':
        return (
          <div 
            key={element.id || index}
            style={{ 
              margin: '8px 0',
              width: props.isFullWidth ? '100%' : 'auto',
              display: 'flex',
              justifyContent: props.alignment === 'center' ? 'center' : 
                            props.alignment === 'right' ? 'flex-end' : 'flex-start',
            }}
            className="wireframe-element"
          >
            <div 
              style={{ 
                padding: '8px 16px',
                background: props.isPrimary ? '#3b82f6' : '#e5e7eb',
                borderRadius: '6px',
                width: props.isFullWidth ? '100%' : props.text?.length 
                  ? Math.min(200, Math.max(80, props.text.length * 8)) + 'px'
                  : '120px',
                height: '34px'
              }}
            ></div>
          </div>
        );
      
      case 'input':
        return (
          <div 
            key={element.id || index}
            style={{ 
              margin: '10px 0',
              width: '100%'
            }}
            className="wireframe-element"
          >
            {/* Input label */}
            <div 
              style={{ 
                height: '12px',
                background: '#cbd5e1',
                width: props.placeholder?.length 
                  ? Math.min(60, Math.max(20, props.placeholder.length * 0.8)) + '%' 
                  : '40%',
                borderRadius: '4px',
                marginBottom: '6px'
              }}
            ></div>
            
            {/* Input field */}
            <div 
              style={{ 
                height: props.inputType === 'textarea' ? '80px' : '36px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                width: '100%'
              }}
            ></div>
          </div>
        );
      
      case 'image':
        return (
          <div 
            key={element.id || index}
            style={{ 
              margin: '10px 0',
              width: props.isFullWidth ? '100%' : '80%',
              display: 'flex',
              justifyContent: props.alignment === 'center' ? 'center' : 
                             props.alignment === 'right' ? 'flex-end' : 'flex-start'
            }}
            className="wireframe-element"
          >
            <div 
              style={{ 
                background: '#f1f5f9',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: props.isFullWidth ? '100%' : '200px',
                height: props.height || '150px'
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderScreenContent = () => {
    // If there are no elements, show a placeholder based on screen purpose
    if (!screen.elements || screen.elements.length === 0) {
      return renderPlaceholderScreen();
    }
    
    // Mobile-optimized layout 
    return (
      <div style={{ padding: '0 4px' }}>
        {screen.elements.map(renderElement)}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <h3 style={captionStyle}>{screen.name}</h3>
      <div style={containerStyle}>
        {/* Header with phone UI */}
        <div style={headerStyle}>
          <div style={{ 
            position: 'absolute', 
            left: '10px', 
            width: '20%', 
            height: '10px', 
            display: 'flex', 
            alignItems: 'center'
          }}>
            <div style={{ width: '16px', height: '10px', borderRadius: '2px', background: '#94a3b8' }}></div>
          </div>
          <div style={{ 
            width: '40%', 
            height: '16px', 
            borderRadius: '10px', 
            background: '#94a3b8' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            right: '10px', 
            display: 'flex', 
            alignItems: 'center'
          }}>
            {getScreenIcon()}
          </div>
        </div>

        {/* Screen content area */}
        <div style={contentStyle}>
          {renderScreenContent()}
        </div>

        {/* Mobile footer indicator for navigation */}
        <div style={{ 
          height: '4px', 
          width: '30%', 
          background: '#94a3b8', 
          borderRadius: '2px', 
          margin: '8px auto' 
        }}></div>
      </div>
    </div>
  );
};

export default ScreenWireframe; 