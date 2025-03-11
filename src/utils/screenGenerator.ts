import { v4 as uuidv4 } from 'uuid';
import { Brief } from './briefStore';
import { PRD } from './prdStore';
import { AppFlow, Screen, ScreenElement, FlowStep } from './screenStore';

// Define a type alias for element types that matches ScreenElement.type
type ElementType = ScreenElement['type'];

// Function to generate screens using OpenAI
export async function generateScreens(brief: Brief, prd: PRD): Promise<{ screens: Screen[], appFlow: AppFlow }> {
  const startTime = Date.now();
  console.log("=== Screen Generation Started ===");
  console.log("Input data:", { 
    briefId: brief?.id, 
    prdId: prd?.id,
    productName: brief?.productName,
    prdContentSize: typeof prd.content === 'string' ? (prd.content as string).length : JSON.stringify(prd.content as object).length
  });
  
  try {
    console.log("Preparing prompt for OpenAI");
    const prompt = `
You are a senior UX designer responsible for creating detailed experience and screen specifications for a new product. Based on the following product brief and PRD, generate a user interface design specification in JSON format.

Your output should include:
1. A user journey outlining all the steps in the happy path.
2. Detailed specifications for each screen required for design and development, aligned with the user journey above.
3. IMPORTANT: Each screen MUST be explicitly linked to a specific feature from the PRD. Include a "featureId" field for each screen that contains the EXACT id of the feature from the PRD that this screen implements. Do not make up feature IDs - use only the IDs provided in the features list.

The context:
Product: ${brief.productName}

PRD Summary:
${extractPRDSummary(prd.content)}

Required Output Format:
{
  "appFlow": {
    "steps": [
      {
        "description": "Detailed description of the user journey step",
        "screenReference": "Name of the target screen"
      }
    ]
  },
  "screens": [
    {
      "name": "Screen name",
      "description": "Detailed description of screen purpose and functionality",
      "featureId": "EXACT id of the feature from the PRD that this screen implements (e.g., 'user_profile', 'payment_processing')",
      "elements": [
        {
          "type": "image",
          "properties": {
            "description": "Detailed description of what the image represents or shows"
          }
        },
        {
          "type": "input",
          "properties": {
            "description": "Description of input purpose and validation requirements"
          }
        },
        {
          "type": "text",
          "properties": {
            "content": "Actual text content to be displayed"
          }
        },
        {
          "type": "button",
          "properties": {
            "content": "Button label",
            "action": "Description of what happens when clicked (e.g., 'Navigate to Home Screen')"
          }
        }
      ]
    }
  ]
}

Guidelines:
1. Focus on essential UI elements: images (descriptions only), inputs, text content, and navigation buttons
2. Provide clear descriptions for all elements
3. Ensure button actions specify the target screen or functionality
4. Keep the interface clean and focused on core functionality
5. Use consistent naming across screens and flow steps
6. Organize content logically within each screen
7. Include all necessary navigation paths between screens
8. IMPORTANT: Use the EXACT feature IDs from the PRD summary - do not create new ones`;

    // Maximum number of retry attempts
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError: Error | null = null;

    // Retry loop
    while (retryCount <= MAX_RETRIES) {
      const attemptStartTime = Date.now();
      try {
        console.log(`API request attempt ${retryCount + 1} of ${MAX_RETRIES + 1}`, {
          retryCount,
          timeSinceStart: Date.now() - startTime,
          promptSize: prompt.length
        });
        
        // Improved timeout handling with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Request timeout triggered after 180s");
          controller.abort();
        }, 180000); // 3-minute timeout
        
        try {
          console.log("Making API request to OpenAI", {
            timestamp: new Date().toISOString(),
            endpoint: '/api/openai'
          });
          
          // Check if we're in development mode and warn about API key
          if (process.env.NODE_ENV === 'development') {
            console.log("Development mode detected. Make sure OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY is set in .env.local");
          }
          
          // Call OpenAI API with optimized parameters
          const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              max_tokens: 2000,
              temperature: 0.7
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          console.log("API response received", {
            status: response.status,
            statusText: response.statusText,
            responseTime: Date.now() - attemptStartTime
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API error details:', {
              status: response.status,
              errorData,
              headers: Object.fromEntries(response.headers.entries())
            });
            
            // Handle specific error codes with more user-friendly messages
            if (response.status === 504) {
              throw new Error('The request timed out. Screen generation can take a while for complex products. Please try again or try with a simpler PRD.');
            } else if (response.status === 429) {
              throw new Error('Too many requests. Please wait a moment before trying again.');
            } else {
              throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
            }
          }

          const data = await response.json();
          console.log("API response parsed successfully", {
            hasChoices: !!data.choices,
            messageLength: data.choices?.[0]?.message?.content?.length || 0
          });
          
          if (!data.choices?.[0]?.message?.content) {
            console.error('Invalid API response structure:', {
              hasChoices: !!data.choices,
              hasMessage: !!data.choices?.[0]?.message,
              hasContent: !!data.choices?.[0]?.message?.content
            });
            throw new Error('Invalid API response format');
          }

          const content = data.choices[0].message.content;
          console.log("Processing API response content", {
            contentLength: content.length,
            processingTime: Date.now() - attemptStartTime
          });
          
          // Ensure the content is valid JSON before parsing
          try {
            JSON.parse(content);
          } catch (error) {
            console.error('Invalid JSON in API response:', content);
            throw new Error('Invalid JSON response from API');
          }

          return parseScreenResponse(content, prd.id);
        } catch (error) {
          clearTimeout(timeoutId); // Ensure timeout is cleared on error
          
          if (error.name === 'AbortError') {
            throw new Error('Request timed out. Screen generation can take a while for complex products. Please try again or try with a simpler PRD.');
          }
          
          throw error;
        }
      } catch (error) {
        lastError = error;
        
        // If it's a timeout or network error, retry
        const isTimeoutError = error.message && (
          error.message.includes('timed out') || 
          error.message.includes('504') ||
          error.name === 'AbortError'
        );
        
        const isNetworkError = error.message && (
          error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed')
        );
        
        if ((isTimeoutError || isNetworkError) && retryCount < MAX_RETRIES) {
          console.log(`Request failed with error: ${error.message}. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          retryCount++;
          
          // Add exponential backoff delay between retries
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s, etc.
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If we've exhausted retries or it's not a retryable error, throw
        throw error;
      }
    }
    
    // If we've exhausted all retries, use the fallback approach
    if (lastError) {
      console.log("All API attempts failed, using fallback approach", {
        totalAttempts: retryCount + 1,
        totalTime: Date.now() - startTime,
        lastError: lastError.message
      });
      return generateFallbackScreens(brief, prd);
    }
    
    // This should never be reached due to the throw in the catch block
    throw new Error("Unexpected error in screen generation");
  } catch (error) {
    console.error('Error in screen generation:', {
      error: error.message,
      stack: error.stack,
      totalTime: Date.now() - startTime
    });
    throw error;
  }
}

// Function to parse the OpenAI response
function parseScreenResponse(responseText: string, prdId: string): { screens: Screen[], appFlow: AppFlow } {
  try {
    // Parse the JSON response
    const parsedData = JSON.parse(responseText);
    
    // Create screens
    const screens: Screen[] = (parsedData.screens || []).map((screenData: any) => {
      // Ensure featureId is a string, defaulting to empty string if not provided
      const featureId = screenData.featureId || '';
      
      return {
        id: uuidv4(),
        prdId,
        name: screenData.name || 'Unnamed Screen',
        description: screenData.description || '',
        featureId: featureId,
        elements: (screenData.elements || []).map((element: any) => {
          return {
            id: uuidv4(),
            type: element.type || 'unknown',
            properties: element.properties || {}
          } as ScreenElement;
        }),
        createdAt: Date.now()
      } as Screen;
    });
    
    // Create app flow
    const appFlow: AppFlow = {
      id: uuidv4(),
      prdId,
      steps: (parsedData.appFlow?.steps || []).map((step: any) => {
        // Find the screen ID if there's a reference
        let screenId: string | undefined = undefined;
        if (step.screenReference) {
          const referencedScreen = screens.find(s => s.name === step.screenReference);
          if (referencedScreen) {
            screenId = referencedScreen.id;
          }
        }
        
        return {
          id: uuidv4(),
          description: step.description || '',
          screenId
        } as FlowStep;
      }),
      createdAt: Date.now()
    };
    
    return { screens, appFlow };
  } catch (error) {
    console.error('Error parsing screen response:', error);
    throw new Error('Failed to parse the AI response. Please try again.');
  }
}

// Function to parse screens from a raw text response
export function parseScreens(responseText: string, prdId: string): { screens: Screen[], appFlow: AppFlow } {
  return parseScreenResponse(responseText, prdId);
}

function extractPRDSummary(prdContent: any): string {
  try {
    // Convert to string if it's not already
    const prdString = typeof prdContent === 'string' ? prdContent : JSON.stringify(prdContent);
    
    // If PRD is relatively small, send it all
    if (prdString.length < 3000) {
      return prdString;
    }
    
    // For larger PRDs, extract key sections
    const prdObj = typeof prdContent === 'object' ? prdContent : JSON.parse(prdString);
    
    // Extract features with their IDs
    const features = extractFeaturesFromPRD(prdObj);
    
    // Create a focused summary with the most important parts
    const summary = {
      title: prdObj.title || prdObj.name,
      overview: prdObj.overview || prdObj.summary || prdObj.description,
      requirements: prdObj.requirements || prdObj.functionalRequirements || [],
      userFlows: prdObj.userFlows || prdObj.flows || prdObj.userJourneys || [],
      features: features
    };
    
    // Limit arrays to reasonable sizes if they exist
    if (Array.isArray(summary.requirements) && summary.requirements.length > 8) {
      summary.requirements = summary.requirements.slice(0, 8);
    }
    
    if (Array.isArray(summary.userFlows) && summary.userFlows.length > 5) {
      summary.userFlows = summary.userFlows.slice(0, 5);
    }
    
    // Add a note to emphasize the importance of linking screens to features
    const summaryWithNote = {
      ...summary,
      note: "IMPORTANT: Each screen must be linked to one of the features listed above using the feature's id. Use the exact feature id as provided."
    };
    
    console.log("Extracted features for prompt:", features);
    
    return JSON.stringify(summaryWithNote, null, 2);
  } catch (error) {
    console.error("Error extracting PRD summary:", error);
    // Fallback to original truncation method
    return typeof prdContent === 'string' 
      ? prdContent.slice(0, 1500) 
      : JSON.stringify(prdContent).slice(0, 1500) + "...";
  }
}

// Fallback function to generate basic screens when OpenAI API fails
function generateFallbackScreens(brief: Brief, prd: PRD): { screens: Screen[], appFlow: AppFlow } {
  console.log("Generating fallback screens");
  
  try {
    // Extract features with IDs from PRD content
    const features = extractFeaturesFromPRD(prd.content);
    console.log("Extracted features for fallback:", features);
    
    // Create basic screens based on common patterns and extracted features
    const screens: Screen[] = [];
    
    // Add common screens with defensive feature ID handling
    screens.push(createBasicScreen("Login Screen", "User authentication screen", prd.id, [
      createElement("text" as const, { content: `Welcome to ${brief.productName}` }),
      createElement("input" as const, { description: "Email input field" }),
      createElement("input" as const, { description: "Password input field" }),
      createElement("button" as const, { content: "Login", action: "Navigate to Home Screen" })
    ], "authentication"));
    
    screens.push(createBasicScreen("Home Screen", "Main dashboard for the application", prd.id, [
      createElement("text" as const, { content: `${brief.productName} Dashboard` }),
      createElement("text" as const, { content: "Welcome back, User" }),
      ...(features.slice(0, 3).map(feature => 
        createElement("button" as const, { content: feature.name, action: `Navigate to ${feature.name} Screen` })
      ))
    ], "dashboard"));
    
    // Add feature-specific screens
    features.forEach((feature) => {
      if (feature && feature.id && feature.name) {
        screens.push(createBasicScreen(`${feature.name} Screen`, `Screen for the ${feature.name} feature`, prd.id, [
          createElement("text" as const, { content: feature.name }),
          createElement("text" as const, { content: `This screen handles the ${feature.name} functionality` }),
          createElement("button" as const, { content: "Back to Home", action: "Navigate to Home Screen" })
        ], feature.id));
      }
    });
    
    // Create app flow with defensive checks
    const appFlow: AppFlow = {
      id: uuidv4(),
      prdId: prd.id,
      steps: [
        {
          id: uuidv4(),
          description: "User logs in to the application",
          screenId: screens[0]?.id
        },
        {
          id: uuidv4(),
          description: "User views the home dashboard",
          screenId: screens[1]?.id
        },
        ...(features.slice(0, 3)
          .filter(feature => feature && feature.name)
          .map((feature, index) => {
            const screenIndex = index + 2;
            return {
              id: uuidv4(),
              description: `User navigates to the ${feature.name} feature`,
              screenId: screens[screenIndex]?.id
            };
          })
          .filter(step => step.screenId)) // Only include steps with valid screenIds
      ],
      createdAt: Date.now()
    };
    
    return { screens, appFlow };
  } catch (error) {
    console.error("Error generating fallback screens:", error);
    
    // If even the fallback fails, return a minimal set of screens
    const loginScreen = createBasicScreen("Login Screen", "User authentication screen", prd.id, [
      createElement("text" as const, { content: `Welcome to ${brief.productName}` }),
      createElement("button" as const, { content: "Login", action: "Navigate to Home Screen" })
    ], "authentication");
    
    const homeScreen = createBasicScreen("Home Screen", "Main dashboard", prd.id, [
      createElement("text" as const, { content: "Home Dashboard" }),
      createElement("text" as const, { content: "No features available" })
    ], "dashboard");
    
    const appFlow: AppFlow = {
      id: uuidv4(),
      prdId: prd.id,
      steps: [
        {
          id: uuidv4(),
          description: "User logs in to the application",
          screenId: loginScreen.id
        },
        {
          id: uuidv4(),
          description: "User views the home dashboard",
          screenId: homeScreen.id
        }
      ],
      createdAt: Date.now()
    };
    
    return { 
      screens: [loginScreen, homeScreen],
      appFlow 
    };
  }
}

// Helper function to create a basic screen with defensive feature ID handling
function createBasicScreen(name: string, description: string, prdId: string, elements: ScreenElement[], featureId: string = ''): Screen {
  return {
    id: uuidv4(),
    prdId,
    name,
    description,
    featureId: featureId ? String(featureId).trim() : '',
    elements,
    createdAt: Date.now()
  };
}

// Helper function to create a screen element
function createElement(type: string, properties: any): ScreenElement {
  // Use a type assertion to bypass type checking
  return {
    id: uuidv4(),
    // @ts-ignore - Bypass type checking for this line
    type,
    properties
  } as ScreenElement;
}

// Helper function to extract features from PRD content
function extractFeaturesFromPRD(prdContent: any): Array<{id: string, name: string}> {
  try {
    // If prdContent is a string, try to parse it
    const content = typeof prdContent === 'string' ? JSON.parse(prdContent) : prdContent;
    
    // Try to extract features from different possible structures
    let features: Array<{id: string, name: string}> = [];
    
    // First, check for explicit features array which should have proper IDs
    if (content.features && Array.isArray(content.features)) {
      features = content.features
        .map((feature: any) => {
          if (typeof feature === 'string') {
            return { id: feature.replace(/\s+/g, '_').toLowerCase(), name: feature };
          }
          return { 
            id: feature.id || feature.featureId || feature.name?.replace(/\s+/g, '_').toLowerCase() || '', 
            name: feature.name || feature.title || feature.id || ''
          };
        })
        .filter(f => f.id && f.name);
    }
    
    // Check for keyFeatures array
    if (features.length === 0 && content.keyFeatures && Array.isArray(content.keyFeatures)) {
      features = content.keyFeatures
        .map((feature: any) => {
          if (typeof feature === 'string') {
            return { id: feature.replace(/\s+/g, '_').toLowerCase(), name: feature };
          }
          return { 
            id: feature.id || feature.featureId || feature.name?.replace(/\s+/g, '_').toLowerCase() || '', 
            name: feature.name || feature.title || feature.id || ''
          };
        })
        .filter(f => f.id && f.name);
    }
    
    // Check for functional requirements which often contain feature information
    if (features.length === 0 && content.functionalRequirements && Array.isArray(content.functionalRequirements)) {
      const featureMap = new Map<string, {id: string, name: string}>();
      
      content.functionalRequirements.forEach((req: any) => {
        let featureName = '';
        let featureId = '';
        
        if (typeof req === 'string') {
          featureName = req;
          featureId = req.replace(/\s+/g, '_').toLowerCase();
        } else {
          featureName = req.feature || req.featureName || req.title || req.name || '';
          featureId = req.featureId || req.id || (featureName ? featureName.replace(/\s+/g, '_').toLowerCase() : '');
        }
        
        if (featureName && featureId && !featureMap.has(featureId)) {
          featureMap.set(featureId, { id: featureId, name: featureName });
        }
      });
      
      features = Array.from(featureMap.values());
    }
    
    // Then check for explicit sections
    if (features.length === 0 && content.sections && Array.isArray(content.sections)) {
      features = content.sections
        .map((section: any) => {
          const name = section.featureName || section.title || section.name || '';
          const id = section.featureId || section.id || (name ? name.replace(/\s+/g, '_').toLowerCase() : '');
          return { id, name };
        })
        .filter(f => f.id && f.name);
    }
    
    // Check for userStories which often contain feature information
    if (features.length === 0 && content.userStories && Array.isArray(content.userStories)) {
      const featureMap = new Map<string, {id: string, name: string}>();
      
      content.userStories.forEach((story: any) => {
        let featureName = story.feature || story.featureName || story.category || '';
        let featureId = story.featureId || (featureName ? featureName.replace(/\s+/g, '_').toLowerCase() : '');
        
        if (featureName && featureId && !featureMap.has(featureId)) {
          featureMap.set(featureId, { id: featureId, name: featureName });
        }
      });
      
      features = Array.from(featureMap.values());
    }
    
    // If we couldn't extract any features, use some generic ones
    if (features.length === 0) {
      features = [
        { id: 'profile', name: 'Profile' },
        { id: 'settings', name: 'Settings' },
        { id: 'notifications', name: 'Notifications' },
        { id: 'dashboard', name: 'Dashboard' }
      ];
    }
    
    return features;
  } catch (error) {
    console.error("Error extracting features from PRD:", error);
    return [
      { id: 'profile', name: 'Profile' },
      { id: 'settings', name: 'Settings' },
      { id: 'notifications', name: 'Notifications' },
      { id: 'dashboard', name: 'Dashboard' }
    ];
  }
} 