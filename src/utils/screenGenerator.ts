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
    // Step 1: Generate the app flow first
    console.log("Step 1: Generating app flow");
    const appFlow = await generateAppFlow(brief, prd);
    console.log("App flow generated successfully with", appFlow.steps.length, "steps");
    
    // Step 2: Generate screens using the app flow
    console.log("Step 2: Generating screens based on app flow");
    const screens = await generateScreensFromAppFlow(brief, prd, appFlow);
    console.log("Screens generated successfully:", screens.length, "screens");
    
    return { screens, appFlow };
  } catch (error) {
    console.error('Error in screen generation:', {
      error: error.message,
      stack: error.stack,
      totalTime: Date.now() - startTime
    });
    throw error;
  }
}

// Step 1: Generate just the app flow
async function generateAppFlow(brief: Brief, prd: PRD): Promise<AppFlow> {
  console.log("Preparing app flow prompt for OpenAI");
  const prompt = `
You are a senior UX designer responsible for creating a user journey for a new product. Based on the following product brief and PRD, generate a user journey in JSON format.

Your output should include ONLY the user journey outlining up to 4 main steps in the happy path. Do not generate screen details yet.

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
        "screenReference": "Name of the screen that the user will see"
      }
    ]
  }
}

Guidelines:
1. Focus on the core user journey from start to finish, maximum 4 steps
2. Describe the steps a user would take to complete the main user flow tasks
3. Ensure screen references are clear and descriptive
4. Use consistent naming for screen references
5. Cover the complete user flow from initial interaction to goal completion`;

    // Maximum number of retry attempts
  const MAX_RETRIES = 1; // Reduced from 2 to 1
    let retryCount = 0;
    let lastError: Error | null = null;

    // Retry loop
    while (retryCount <= MAX_RETRIES) {
    try {
      console.log(`App flow API request attempt ${retryCount + 1} of ${MAX_RETRIES + 1}`);
        
        // Improved timeout handling with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
        console.log("App flow request timeout triggered after 8s");
          controller.abort();
      }, 8000); // 8-second timeout (reduced from 120s to align with Vercel's limits)
      
      try {
        console.log("Making API request to OpenAI for app flow");
          
          // Call OpenAI API with optimized parameters
          const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
            max_tokens: 800, // Reduced tokens since we're only generating 4 steps
              temperature: 0.7
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
          
          // Check if the API suggests using fallback
          if (errorData.fallback) {
            console.log("API suggests using fallback app flow");
            throw new Error("API suggests fallback app flow");
          }
          
          throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
      
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid API response format');
        }

        const content = data.choices[0].message.content;
        
        // Parse the app flow from the response
        try {
          const parsedData = JSON.parse(content);
          
          if (!parsedData.appFlow || !Array.isArray(parsedData.appFlow.steps)) {
            throw new Error('Invalid app flow format in response');
          }
          
          // Create app flow
          const appFlow: AppFlow = {
            id: uuidv4(),
            prdId: prd.id,
            steps: parsedData.appFlow.steps.map((step: any) => {
              return {
                id: uuidv4(),
                description: step.description || '',
                screenReference: step.screenReference || ''
              };
            }),
            createdAt: Date.now()
          };
          
          return appFlow;
        } catch (error) {
          console.error('Error parsing app flow response:', error);
          throw new Error('Failed to parse the app flow response');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('App flow request timed out');
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
      
      // Check if the error suggests using fallback screens
      const isFallbackSuggested = error.message && (
        error.message.includes('fallback screens') ||
        error.message.includes('Gateway Timeout')
      );
      
      // If fallback is suggested, don't retry, go straight to fallback
      if (isFallbackSuggested) {
        console.log("API suggested using fallback screens, skipping retries");
        break;
      }
      
      if ((isTimeoutError || isNetworkError) && retryCount < MAX_RETRIES) {
      console.log(`App flow request failed with error: ${error.message}. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
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
    console.log("All app flow API attempts failed, using fallback approach");
    return generateFallbackAppFlow(brief, prd);
  }
  
  throw new Error("Unexpected error in app flow generation");
}

// Step 2: Generate screens based on app flow
async function generateScreensFromAppFlow(brief: Brief, prd: PRD, appFlow: AppFlow): Promise<Screen[]> {
  console.log("Preparing screen generation prompt for OpenAI");
  
  // Create improved, more detailed prompt for screen generation with enhanced form field detection
  const prompt = `
You are an expert UX designer responsible for creating detailed screen specifications for a mobile application. 
Based on the following product brief, PRD, and app flow, generate screen specifications in JSON format.

PRODUCT: "${brief.productName}"

PRD SUMMARY:
${extractPRDSummary(prd.content)}

APP FLOW:
${appFlow.steps.map((step, index) => `${index + 1}. ${step.description} (Screen: ${step.screenReference})`).join('\n')}

REQUIRED OUTPUT FORMAT:
{
  "screens": [
    {
      "name": "Screen Name",
      "description": "Detailed description of screen purpose and functionality",
      "featureId": "feature_id_from_prd",
      "elements": [
        {
          "type": "text",
          "properties": {
            "content": "Actual text content to display",
          }
        },
        {
          "type": "input",
          "properties": {
            "label": "all field Label",
            "placeholder": "Placeholder text",
            "inputType": "text/password/email/number/textarea/select/checkbox/radio/date",
            "isRequired": true/false,
            "description": "Description of what this input collects"
          }
        },
        {
          "type": "button",
          "properties": {
            "content": "Button Label",
            "action": "Description of what happens when clicked"
          }
        },
        {
          "type": "image",
          "properties": {
            "description": "Description of the image content",
            "purpose": "icon/illustration/photo/avatar",
          }
        }
      ]
    }
  ]
}

GUIDELINES FOR CREATING SCREENS:
1. Each screen must correspond to one of the steps in the app flow.
2. IMPORTANT: Analyze the screen's purpose carefully and include appropriate elements:
   - For login screens: Include email/username and password fields with proper validation
   - For forms: Include ALL fields mentioned in the description (not just one generic field)
   - For list views: Include list items with appropriate details
   - For detail views: Show complete information about the viewed item

3. For input forms:
   - CRITICALLY IMPORTANT: Include ALL required input fields based on the screen's description
   - If the screen mentions multiple pieces of data to collect (weights, reps, duration, etc.), include a SEPARATE input field for EACH item
   - Choose appropriate input types for each field (select for options, number for numeric values, etc.)
   - Include proper validation requirements (mark important fields as required)
   - Add descriptive labels and placeholder text
   - Include a primary submit button with a specific action

4. For selection interfaces:
   - Use appropriate UI elements (dropdown/select for single selection, checkboxes for multiple)
   - Include realistic options that match the application domain
   - Make common selections easy to find
   
5. For list and browsing interfaces:
   - Include search/filter fields if appropriate
   - Show example list items with realistic content
   - Include pagination or "load more" if dealing with large datasets

6. For text content:
   - Use headings and subheadings to create clear visual hierarchy
   - Provide descriptive, helpful content text (not generic placeholders)
   - Break up long content into readable sections

7. For buttons:
   - Use clear, action-oriented labels ("Save Workout" instead of "Submit")
   - Make primary actions visually distinct (isPrimary: true)
   - Use full-width buttons for main actions
   - Place buttons in logical positions based on their importance

8. Each screen should include at minimum:
   - A clear heading/title
   - Descriptive content that explains the screen's purpose
   - All UI elements needed to complete the described actions
   - At least 3-7 elements (more for complex screens)

9. IMPORTANT: Each screen must be linked to one of the features from the PRD using the featureId field.

CREATE DETAILED, REALISTIC SCREENS THAT COMPLETELY ADDRESS THE REQUIREMENTS AND INCLUDE ALL NECESSARY FIELDS AND ELEMENTS.`;

  // Maximum number of retry attempts
  const MAX_RETRIES = 1;
  let retryCount = 0;
  let lastError: Error | null = null;

  // Retry loop
  while (retryCount <= MAX_RETRIES) {
    try {
      console.log(`Screens API request attempt ${retryCount + 1} of ${MAX_RETRIES + 1}`);
        
      // Improved timeout handling with AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("Screens request timeout triggered after 10s");
        controller.abort();
      }, 10000); // 10-second timeout for screens generation
      
      try {
        console.log("Making API request to OpenAI for screens");
          
        // Call OpenAI API
        const response = await fetch('/api/generate-screens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brief: {
              id: brief.id,
              productName: brief.productName,
              problemStatement: brief.problemStatement,
              content: brief.content || null  // Add content or null if not available
            },
            prd: { id: prd.id, content: prd.content },
            appFlow,
            prompt
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle API errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Check if the API suggests using fallback
            if (errorData.fallback) {
              console.log("API suggests using fallback screens");
              throw new Error("API suggests fallback screens");
            }
            
          // Special handling for 504 Gateway Timeout
          if (response.status === 504) {
            throw new Error("Screens request timed out (504 Gateway Timeout)");
          }
          
          // Handle other API errors
          const errorMessage = `API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`;
          console.error('Screen generation API error:', errorMessage);
          throw new Error(errorMessage);
        }

        // Parse the successful response
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
          throw new Error('Invalid response format from OpenAI API. Please try again.');
        }
        
        // Parse the screens from the response
        try {
          // The response should contain a 'screens' field with a JSON string
          const screensContent = data.screens;
          
          // Try to extract the JSON object from the response
          let parsedData;
          try {
            // First, try to parse it directly if it's already a JSON string
            parsedData = JSON.parse(screensContent);
          } catch (jsonError) {
            // If that fails, try to extract JSON from the text (in case it contains markdown or other formatting)
            const jsonMatch = screensContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                             screensContent.match(/```\s*([\s\S]*?)\s*```/) ||
                             screensContent.match(/{[\s\S]*}/);
                             
            if (jsonMatch && jsonMatch[1]) {
              parsedData = JSON.parse(jsonMatch[1]);
            } else if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Could not extract JSON from response');
            }
          }
          
          if (!parsedData.screens || !Array.isArray(parsedData.screens)) {
            throw new Error('Invalid screens format in response');
          }
          
          // Create screens
          const screens: Screen[] = parsedData.screens.map((screenData: any) => {
            // Ensure featureId is a string, defaulting to empty string if not provided
            const featureId = screenData.featureId || '';
            
            return {
              id: uuidv4(),
              prdId: prd.id,
              name: screenData.name || 'Unnamed Screen',
              description: screenData.description || '',
              featureId: featureId,
              // Normalize each element to ensure compatibility
              elements: (screenData.elements || []).map((element: any) => {
                const baseElement = {
                  id: uuidv4(),
                  type: element.type || 'unknown',
                  properties: element.properties || {}
                } as ScreenElement;
                
                // Apply normalization to ensure compatibility
                return normalizeScreenElement(baseElement);
              }),
              createdAt: Date.now()
            } as Screen;
          });
          
          // Link screens to app flow steps by name
          appFlow.steps.forEach(step => {
            if (step.screenReference) {
              const matchingScreen = screens.find(screen => screen.name === step.screenReference);
              if (matchingScreen) {
                step.screenId = matchingScreen.id;
              }
            }
          });
          
          return screens;
        } catch (error) {
          console.error('Error parsing screens response:', error);
          throw new Error('Failed to parse the screens response: ' + error.message);
        }
      } catch (error) {
        clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
          throw new Error('Screens request timed out');
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
        
        // Check if the error suggests using fallback screens
        const isFallbackSuggested = error.message && (
          error.message.includes('fallback screens') ||
          error.message.includes('Gateway Timeout')
        );
        
        // If fallback is suggested, don't retry, go straight to fallback
        if (isFallbackSuggested) {
          console.log("API suggested using fallback screens, skipping retries");
          break;
        }
        
        if ((isTimeoutError || isNetworkError) && retryCount < MAX_RETRIES) {
        console.log(`Screens request failed with error: ${error.message}. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          retryCount++;
          
          // Add exponential backoff delay between retries
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s, etc.
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
      // If we've exhausted retries or it's not a retryable error, exit the loop
      break;
      }
    }
    
  // If we've exhausted all retries or encountered a non-retryable error, use the fallback approach
    if (lastError) {
      console.log("All screens API attempts failed, using fallback approach");
      
      // Check if the error suggests using fallback screens
      const isFallbackSuggested = lastError.message && (
        lastError.message.includes('fallback screens') ||
        lastError.message.includes('Gateway Timeout') ||
        lastError.message.includes('502') ||
        lastError.message.includes('504')
      );
      
      if (isFallbackSuggested) {
        console.log("Using fallback screens as suggested by API");
      } else {
        console.log("Using fallback screens due to API failure");
      }
      
      const screens = generateFallbackScreens(brief, prd, appFlow);
      return screens;
    }
  
    throw new Error("Unexpected error in screens generation");
  }

// Generate a fallback app flow when the API fails
export function generateFallbackAppFlow(brief: Brief, prd: PRD): AppFlow {
  console.log("Generating fallback app flow");
  
  try {
    // Extract features with IDs from PRD content
    const features = extractFeaturesFromPRD(prd.content);
    console.log("Extracted features for fallback app flow:", features);
    
    // Create basic app flow steps
    const steps: FlowStep[] = [
      {
        id: uuidv4(),
        description: "User logs in to the application",
        screenReference: "Login Screen"
      },
      {
        id: uuidv4(),
        description: "User views the home dashboard",
        screenReference: "Home Screen"
      }
    ];
    
    // Add feature-specific steps (limit to 2 more steps for a total of 4)
    features.slice(0, 2).forEach(feature => {
      if (feature && feature.name) {
        steps.push({
          id: uuidv4(),
          description: `User navigates to the ${feature.name} feature`,
          screenReference: `${feature.name} Screen`
        });
      }
    });
    
    // Create app flow
    const appFlow: AppFlow = {
      id: uuidv4(),
      prdId: prd.id,
      steps,
      createdAt: Date.now()
    };
    
    return appFlow;
  } catch (error) {
    console.error("Error generating fallback app flow:", error);
    
    // Return a minimal app flow
    return {
      id: uuidv4(),
      prdId: prd.id,
      steps: [
        {
          id: uuidv4(),
          description: "User logs in to the application",
          screenReference: "Login Screen"
        },
        {
          id: uuidv4(),
          description: "User views the home dashboard",
          screenReference: "Home Screen"
        }
      ],
      createdAt: Date.now()
    };
  }
}

// Generate fallback screens based on the app flow
export function generateFallbackScreens(brief: Brief, prd: PRD, appFlow: AppFlow): Screen[] {
  console.log("Generating fallback screens");
  
  try {
    // Extract features with IDs from PRD content
    const features = extractFeaturesFromPRD(prd.content);
    console.log("Extracted features for fallback screens:", features);
    
    // Create basic screens based on app flow screen references
    const screens: Screen[] = [];
    
    // Get unique screen references from the app flow, limited to first 4
    const screenReferences = new Set(
      appFlow.steps
        .slice(0, 4) // Limit to first 4 steps
        .map(step => step.screenReference)
        .filter(Boolean)
    );
    
    // If we have fewer than 2 screen references, add some defaults
    if (screenReferences.size < 2) {
      screenReferences.add("Login Screen");
      screenReferences.add("Home Screen");
    }
    
    // Add login screen if referenced
    if (screenReferences.has("Login Screen")) {
      screens.push(createBasicScreen("Login Screen", "User authentication screen", prd.id, [
        createElement("text", { content: `Welcome to ${brief.productName}` }),
        createElement("input", { description: "Email input field" }),
        createElement("input", { description: "Password input field" }),
        createElement("button", { content: "Login", action: "Navigate to Home Screen" })
      ], "authentication"));
    }
    
    // Add home screen if referenced
    if (screenReferences.has("Home Screen")) {
      screens.push(createBasicScreen("Home Screen", "Main dashboard for the application", prd.id, [
        createElement("text", { content: `${brief.productName} Dashboard` }),
        createElement("text", { content: "Welcome back, User" }),
        ...(features.slice(0, 2).map(feature => 
          createElement("button", { content: feature.name, action: `Navigate to ${feature.name} Screen` })
        ))
      ], "dashboard"));
    }
    
    // Add feature-specific screens based on references, limited to 2 main features
    features.slice(0, 2).forEach((feature) => {
      if (feature && feature.id && feature.name) {
        const screenName = `${feature.name} Screen`;
        if (screenReferences.has(screenName)) {
          screens.push(createBasicScreen(screenName, `Screen for the ${feature.name} feature`, prd.id, [
            createElement("text", { content: feature.name }),
            createElement("text", { content: `This screen handles the ${feature.name} functionality` }),
            createElement("button", { content: "Back to Home", action: "Navigate to Home Screen" })
          ], feature.id));
        }
      }
    });
    
    // Add generic screens for any remaining references from the first 4 steps
    screenReferences.forEach(screenRef => {
      if (screenRef && !screens.some(s => s.name === screenRef)) {
        screens.push(createBasicScreen(screenRef, `Screen for ${screenRef}`, prd.id, [
          createElement("text", { content: screenRef }),
          createElement("text", { content: `This is the ${screenRef} screen` }),
          createElement("button", { content: "Back", action: "Navigate to previous screen" })
        ], ""));
      }
    });
    
    // Ensure we don't have more than 4 screens
    const finalScreens = screens.slice(0, 4);
    
    // Link screens to app flow steps by name
    appFlow.steps.forEach(step => {
      if (step.screenReference) {
        const matchingScreen = finalScreens.find(screen => screen.name === step.screenReference);
        if (matchingScreen) {
          step.screenId = matchingScreen.id;
        }
      }
    });
    
    console.log(`Generated ${finalScreens.length} fallback screens`);
    return finalScreens;
  } catch (error) {
    console.error("Error generating fallback screens:", error);
    
    // Return minimal screens (2 screens only)
    const loginScreen = createBasicScreen("Login Screen", "User authentication screen", prd.id, [
      createElement("text", { content: `Welcome to ${brief.productName}` }),
      createElement("button", { content: "Login", action: "Navigate to Home Screen" })
    ], "authentication");
    
    const homeScreen = createBasicScreen("Home Screen", "Main dashboard", prd.id, [
      createElement("text", { content: "Home Dashboard" }),
      createElement("text", { content: "No features available" })
    ], "dashboard");
    
    const screens = [loginScreen, homeScreen];
    
    // Link screens to app flow steps by name
    appFlow.steps.forEach(step => {
      if (step.screenReference === "Login Screen") {
        step.screenId = loginScreen.id;
      } else if (step.screenReference === "Home Screen") {
        step.screenId = homeScreen.id;
      }
    });
    
    console.log("Generated 2 minimal fallback screens");
    return screens;
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
        let screenReference = step.screenReference || '';
        
        if (screenReference) {
          const referencedScreen = screens.find(s => s.name === screenReference);
          if (referencedScreen) {
            screenId = referencedScreen.id;
          }
        }
        
        return {
          id: uuidv4(),
          description: step.description || '',
          screenId,
          screenReference
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

// Helper function to create a basic screen with defensive feature ID handling
export function createBasicScreen(name: string, description: string, prdId: string, elements: ScreenElement[], featureId: string = ''): Screen {
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
export function createElement(type: string, properties: any): ScreenElement {
  // Use a type assertion to bypass type checking for this line
  return {
    id: uuidv4(),
    // @ts-ignore - Bypass type checking for this line
    type,
    properties
  } as ScreenElement;
}

// Helper function to extract features from PRD content
export function extractFeaturesFromPRD(prdContent: any): Array<{id: string, name: string}> {
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

// Helper function to extract feature IDs from PRD content
function extractFeatureIdsFromPRD(prdContent: any): string[] {
  try {
    const features = extractFeaturesFromPRD(prdContent);
    return features.map(feature => feature.id);
  } catch (error) {
    console.error("Error extracting feature IDs from PRD:", error);
    return [];
  }
}

// Later in the code, after the screen generation, add a normalization function
// to ensure backward compatibility
function normalizeScreenElement(element: ScreenElement): ScreenElement {
  // Create a copy to avoid modifying the original
  const normalized = { ...element };
  
  // Ensure properties object exists
  normalized.properties = normalized.properties || {};
  
  // Apply type-specific default properties based on element type
  switch (normalized.type) {
    case 'text':
      // For text elements, infer isHeading from content length if not specified
      if (normalized.properties.isHeading === undefined) {
        normalized.properties.isHeading = normalized.properties.content && 
                                         normalized.properties.content.length < 20;
      }
      // Optional new properties with defaults
      normalized.properties.alignment = normalized.properties.alignment || 'left';
      break;
      
    case 'button':
      // Optional new properties with defaults
      normalized.properties.isFullWidth = normalized.properties.isFullWidth || false;
      normalized.properties.isPrimary = normalized.properties.isPrimary || false;
      break;
      
    case 'input':
      // Optional new properties with defaults
      normalized.properties.inputType = normalized.properties.inputType || 'text';
      normalized.properties.isRequired = normalized.properties.isRequired || false;
      break;
      
    case 'image':
      // For image elements, ensure height has a reasonable default
      normalized.properties.height = normalized.properties.height || 140;
      // Optional new properties with defaults
      normalized.properties.purpose = normalized.properties.purpose || 'illustration';
      break;
  }
  
  return normalized;
} 