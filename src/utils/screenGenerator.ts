import { v4 as uuidv4 } from 'uuid';
import { Brief } from './briefStore';
import { PRD } from './prdStore';
import { AppFlow, Screen, ScreenElement, FlowStep } from './screenStore';

// Function to generate screens using OpenAI
export async function generateScreens(brief: Brief, prd: PRD): Promise<{ screens: Screen[], appFlow: AppFlow }> {
  console.log("generateScreens function called with:", { 
    briefId: brief?.id, 
    prdId: prd?.id,
    productName: brief?.productName
  });
  
  try {
    console.log("Preparing prompt for OpenAI");
    const prompt = `
You are a senior UX designer creating detailed screen specifications for a mobile/web application. Based on the following product brief and PRD, generate a user interface design specification in JSON format.

Context:
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
7. Include all necessary navigation paths between screens`;

    // Maximum number of retry attempts
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError = null;

    // Retry loop
    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`API request attempt ${retryCount + 1} of ${MAX_RETRIES + 1}`);
        
        // Improved timeout handling with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3-minute timeout
        
        try {
          console.log("Making API request to OpenAI");
          
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

          clearTimeout(timeoutId); // Clear the timeout if the request completes
          console.log("API response status:", response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Full error response:', errorData);
            
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
          
          if (!data.choices?.[0]?.message?.content) {
            console.error('Full API response:', data);
            throw new Error('Invalid API response format');
          }

          const content = data.choices[0].message.content;
          
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
      console.log("All API attempts failed, using fallback approach");
      return generateFallbackScreens(brief, prd);
    }
    
    // This should never be reached due to the throw in the catch block
    throw new Error("Unexpected error in screen generation");
  } catch (error) {
    console.error('Error generating screens:', error);
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
      return {
        id: uuidv4(),
        prdId,
        name: screenData.name || 'Unnamed Screen',
        description: screenData.description || '',
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
    
    // Create a focused summary with the most important parts
    const summary = {
      title: prdObj.title || prdObj.name,
      overview: prdObj.overview || prdObj.summary || prdObj.description,
      requirements: prdObj.requirements || prdObj.functionalRequirements || [],
      userFlows: prdObj.userFlows || prdObj.flows || prdObj.userJourneys || [],
      keyFeatures: prdObj.keyFeatures || prdObj.features || []
    };
    
    // Limit arrays to reasonable sizes if they exist
    if (Array.isArray(summary.requirements) && summary.requirements.length > 5) {
      summary.requirements = summary.requirements.slice(0, 5);
    }
    
    if (Array.isArray(summary.userFlows) && summary.userFlows.length > 3) {
      summary.userFlows = summary.userFlows.slice(0, 3);
    }
    
    if (Array.isArray(summary.keyFeatures) && summary.keyFeatures.length > 5) {
      summary.keyFeatures = summary.keyFeatures.slice(0, 5);
    }
    
    return JSON.stringify(summary);
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
    // Extract feature names from PRD content
    const features = extractFeaturesFromPRD(prd.content);
    
    // Create basic screens based on common patterns and extracted features
    const screens: Screen[] = [];
    
    // Add common screens
    screens.push(createBasicScreen("Login Screen", "User authentication screen", prd.id, [
      createElement("text", { content: `Welcome to ${brief.productName}` }),
      createElement("input", { description: "Email input field" }),
      createElement("input", { description: "Password input field" }),
      createElement("button", { content: "Login", action: "Navigate to Home Screen" })
    ]));
    
    screens.push(createBasicScreen("Home Screen", "Main dashboard for the application", prd.id, [
      createElement("text", { content: `${brief.productName} Dashboard` }),
      createElement("text", { content: "Welcome back, User" }),
      ...features.slice(0, 3).map(feature => 
        createElement("button", { content: feature, action: `Navigate to ${feature} Screen` })
      )
    ]));
    
    // Add feature-specific screens
    features.forEach(feature => {
      screens.push(createBasicScreen(`${feature} Screen`, `Screen for the ${feature} feature`, prd.id, [
        createElement("text", { content: feature }),
        createElement("text", { content: `This screen handles the ${feature} functionality` }),
        createElement("button", { content: "Back to Home", action: "Navigate to Home Screen" })
      ]));
    });
    
    // Create app flow
    const appFlow: AppFlow = {
      id: uuidv4(),
      prdId: prd.id,
      steps: [
        {
          id: uuidv4(),
          description: "User logs in to the application",
          screenId: screens[0].id
        },
        {
          id: uuidv4(),
          description: "User views the home dashboard",
          screenId: screens[1].id
        },
        ...features.slice(0, 3).map((feature, index) => ({
          id: uuidv4(),
          description: `User navigates to the ${feature} feature`,
          screenId: screens[index + 2].id
        }))
      ],
      createdAt: Date.now()
    };
    
    return { screens, appFlow };
  } catch (error) {
    console.error("Error generating fallback screens:", error);
    
    // If even the fallback fails, return a minimal set of screens
    const loginScreen = createBasicScreen("Login Screen", "User authentication screen", prd.id, [
      createElement("text", { content: `Welcome to ${brief.productName}` }),
      createElement("button", { content: "Login", action: "Navigate to Home Screen" })
    ]);
    
    const homeScreen = createBasicScreen("Home Screen", "Main dashboard", prd.id, [
      createElement("text", { content: "Home Dashboard" }),
      createElement("text", { content: "No features available" })
    ]);
    
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

// Helper function to create a basic screen
function createBasicScreen(name: string, description: string, prdId: string, elements: ScreenElement[]): Screen {
  return {
    id: uuidv4(),
    prdId,
    name,
    description,
    elements,
    createdAt: Date.now()
  };
}

// Helper function to create a screen element
function createElement(type: "button" | "input" | "text" | "image" | "container" | "list" | "card", properties: any): ScreenElement {
  return {
    id: uuidv4(),
    type,
    properties
  };
}

// Helper function to extract features from PRD content
function extractFeaturesFromPRD(prdContent: any): string[] {
  try {
    // If prdContent is a string, try to parse it
    const content = typeof prdContent === 'string' ? JSON.parse(prdContent) : prdContent;
    
    // Try to extract features from different possible structures
    let features: string[] = [];
    
    if (content.sections && Array.isArray(content.sections)) {
      // Extract feature names from sections
      features = content.sections.map((section: any) => section.featureName || section.title || section.name || "Feature")
        .filter((name: string) => name && name !== "Feature");
    } else if (content.features && Array.isArray(content.features)) {
      // Extract from features array
      features = content.features.map((feature: any) => {
        if (typeof feature === 'string') return feature;
        return feature.name || feature.title || "Feature";
      }).filter((name: string) => name && name !== "Feature");
    } else if (content.keyFeatures && Array.isArray(content.keyFeatures)) {
      // Extract from keyFeatures array
      features = content.keyFeatures.map((feature: any) => {
        if (typeof feature === 'string') return feature;
        return feature.name || feature.title || "Feature";
      }).filter((name: string) => name && name !== "Feature");
    }
    
    // If we couldn't extract any features, use some generic ones
    if (features.length === 0) {
      features = ["Profile", "Settings", "Notifications", "Dashboard"];
    }
    
    return features;
  } catch (error) {
    console.error("Error extracting features from PRD:", error);
    return ["Profile", "Settings", "Notifications", "Dashboard"];
  }
} 