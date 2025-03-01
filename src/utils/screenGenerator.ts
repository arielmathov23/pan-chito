import { v4 as uuidv4 } from 'uuid';
import { Brief } from './briefStore';
import { PRD } from './prdStore';
import { AppFlow, Screen, ScreenElement, FlowStep } from './screenStore';

// Function to generate screens using OpenAI
export async function generateScreens(brief: Brief, prd: PRD): Promise<{ screens: Screen[], appFlow: AppFlow }> {
  try {
    const prompt = `
You are a senior UX designer creating detailed screen specifications for a mobile/web application. Based on the following product brief and PRD, generate a user interface design specification in JSON format.

Context:
Product: ${brief.productName}
Problem: ${brief.briefData.problemStatement}
Users: ${brief.briefData.targetUsers}
Key Features: ${brief.briefData.keyFeatures}

PRD Summary:
${JSON.stringify(prd.content).slice(0, 800)}...

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

    // Improved timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-minute timeout

    try {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Full error response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
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
        throw new Error('Request timed out. The operation took too long to complete. Please try again.');
      }
      
      throw error;
    }
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