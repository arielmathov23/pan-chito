import { v4 as uuidv4 } from 'uuid';
import { Brief } from './briefStore';
import { PRD } from './prdStore';
import { AppFlow, Screen, ScreenElement, FlowStep } from './screenStore';

// Function to generate screens using OpenAI
export async function generateScreens(brief: Brief, prd: PRD): Promise<{ screens: Screen[], appFlow: AppFlow }> {
  try {
    // Prepare the prompt for OpenAI
    const prompt = `
Based on the following product brief and PRD, please generate:
1. A comprehensive app flow explanation in steps
2. All main screens needed for the application
3. All necessary features for login/signup and other core functionality

PRODUCT BRIEF:
${brief.productName}
${brief.briefData.problemStatement}
${brief.briefData.targetUsers}
${brief.briefData.productObjectives}
${brief.briefData.keyFeatures}

PRD:
${JSON.stringify(prd.content, null, 2)}

Please format your response as a JSON object with the following structure:
{
  "appFlow": {
    "steps": [
      {
        "description": "Step description",
        "screenReference": "Screen name (if applicable)"
      }
    ]
  },
  "screens": [
    {
      "name": "Screen name",
      "description": "Detailed description of the screen",
      "elements": [
        {
          "type": "button/input/text/etc",
          "properties": {
            "label": "Label text",
            "action": "Action description",
            "other properties as needed": "value"
          }
        }
      ]
    }
  ]
}
`;

    // Call OpenAI API
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // The OpenAI API returns the content in choices[0].message.content
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return parseScreenResponse(data.choices[0].message.content, prd.id);
    } else {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid API response format');
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