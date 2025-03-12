import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { brief, prd, appFlow } = req.body;

    if (!brief || !prd) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Format the app flow steps for the prompt
    const appFlowSteps = appFlow?.steps?.map(step => 
      `  - ${step.description} (Screen: ${step.screenReference})`
    ).join('\n') || '';

    // Create the prompt for OpenAI
    const prompt = `
You are a senior UX designer responsible for creating detailed screen specifications for a new product. 
Based on the following product brief, PRD, and user journey, generate up to 4 MAIN screen specifications in JSON format.

Your output should include ONLY the screens array with detailed specifications for each screen required for design and development, aligned with the user journey provided.

The context:
Product: ${brief.productName}

PRD Summary:
${typeof brief.content === 'string' ? brief.content : JSON.stringify(brief.content)}

User Journey:
${appFlowSteps}

Required Output Format:
{
  "screens": [
    {
      "name": "Screen name",
      "description": "Detailed description of screen purpose and functionality",
      "featureId": "EXACT id of the feature from the PRD that this screen implements",
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
 Focus on essential UI elements: images (descriptions only), inputs, text content, and navigation buttons
 Provide clear descriptions for all elements
Ensure button actions specify the target screen or functionality
Keep the interface clean and focused on core functionality
Use consistent naming across screens that matches the screen references in the user journey
Organize content logically within each screen
Include all necessary navigation paths between screens
IMPORTANT: Create screens for ALL screen references mentioned in the user journey`;

    // Set a longer timeout for the OpenAI request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
      // Make the OpenAI API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Adding the required model parameter
          messages: [
            {
              role: "system",
              content: "You are a UX design expert who creates detailed screen specifications for applications."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Get detailed error information from OpenAI
        let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('OpenAI API error details:', errorData);
          errorMessage = `OpenAI API error: ${errorData.error?.message || errorData.error || errorMessage}`;
        } catch (parseError) {
          console.error('Failed to parse OpenAI error response:', parseError);
        }
        
        return res.status(response.status).json({ error: errorMessage });
      }

      // Parse the OpenAI response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return res.status(500).json({ error: 'Invalid response format from OpenAI' });
      }

      // Extract the content from the response
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        return res.status(500).json({ error: 'Empty response from OpenAI' });
      }

      // Return the screens data
      return res.status(200).json({ screens: content });
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        return res.status(504).json({ error: 'Request timed out' });
      }
      
      console.error('Error calling OpenAI API:', error);
      return res.status(500).json({ 
        error: `Error processing request: ${error.message || 'Unknown error'}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } catch (error: any) {
    console.error('Unhandled error in generate-screens API:', error);
    return res.status(500).json({ 
      error: `Server error: ${error.message || 'Unknown error'}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 