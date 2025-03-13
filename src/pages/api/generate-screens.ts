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

    // Truncate brief content to reduce prompt size
    const briefContent = typeof brief.content === 'string' 
      ? brief.content.substring(0, 250) + (brief.content.length > 250 ? '...' : '')
      : JSON.stringify(brief.content).substring(0, 250) + '...';

    // Create a more concise prompt for OpenAI
    const prompt = `
Generate screen specifications in JSON format for a product called "${brief.productName}".
Focus on creating ONLY 4 MAIN screens based on this brief summary: ${briefContent}

User Journey:
${appFlowSteps}

Required Output Format:
{
  "screens": [
    {
      "name": "Screen name",
      "description": "Brief description",
      "featureId": "feature_id",
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
- Create ONLY 4 main screens for the most important screen references
- Keep elements focused on essential UI components
- Ensure consistent naming across screens`;

    // Set a shorter timeout for the OpenAI request to stay within Vercel limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      // Make the OpenAI API call with a faster model
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // Using a faster model
          messages: [
            {
              role: "system",
              content: "You are a UX design expert who creates concise screen specifications. Always limit your response to 4 main screens."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
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
        
        // Special handling for 504 and 502 errors - add fallback flag
        if (response.status === 504 || response.status === 502) {
          console.log(`Received ${response.status} error, suggesting fallback screens`);
          return res.status(response.status).json({ 
            error: 'Request failed',
            fallback: true
          });
        }
        
        return res.status(response.status).json({ 
          error: errorMessage,
          fallback: true
        });
      }

      // Parse the OpenAI response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return res.status(500).json({ 
          error: 'Invalid response format from OpenAI',
          fallback: true
        });
      }

      // Extract the content from the response
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.log('Empty response from OpenAI, suggesting fallback screens');
        return res.status(500).json({ 
          error: 'Empty response from OpenAI',
          fallback: true
        });
      }

      // Return the screens data
      return res.status(200).json({ screens: content });
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        console.log('Request timed out, suggesting fallback screens');
        return res.status(504).json({ 
          error: 'Request timed out',
          fallback: true
        });
      }
      
      console.error('Error calling OpenAI API:', error);
      return res.status(500).json({ 
        error: `Error processing request: ${error.message || 'Unknown error'}`,
        fallback: true,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } catch (error: any) {
    console.error('Unhandled error in generate-screens API:', error);
    return res.status(500).json({ 
      error: `Server error: ${error.message || 'Unknown error'}`,
      fallback: true,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 