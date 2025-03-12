import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Log API key status (without revealing the key)
console.log("OpenAI API key status:", apiKey ? "Present" : "Missing");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent initialization error
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("OpenAI API endpoint called");
  
  if (req.method !== 'POST') {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    console.error("OpenAI API key is missing");
    return res.status(500).json({ 
      error: 'OpenAI API key is missing. Please add OPENAI_API_KEY to your .env.local file.',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasApiKey: !!apiKey,
        hasNextPublicApiKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY
      }
    });
  }

  try {
    const { prompt, max_tokens = 3000, temperature = 0.7 } = req.body;
    console.log("Request parameters:", { 
      promptLength: prompt?.length, 
      max_tokens, 
      temperature 
    });

    if (!prompt) {
      console.log("Prompt is missing");
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set response timeout to 4 minutes
    res.setTimeout(240000, () => {
      console.error("Request timeout reached");
      res.status(504).json({ error: 'Request timeout' });
    });

    console.log("Calling OpenAI API");
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional UI/UX designer and product strategist who creates clear, detailed screen designs and user flows. You have extensive experience in digital product design and know industry best practices. Your goal is to provide documentation that effectively guides development and design teams. You always respond with valid JSON where all values are strings, not nested objects or arrays."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini",
      temperature,
      max_tokens,
      response_format: { type: "json_object" }
    }, {
      timeout: 240000 // 3 minutes timeout for OpenAI API call
    });

    console.log("OpenAI API response received");
    
    // Validate the response format
    try {
      const content = completion.choices[0].message.content;
      if (!content) {
        console.error("Empty response from OpenAI");
        throw new Error('Empty response from OpenAI');
      }
      
      // Ensure the content is valid JSON
      console.log("Validating JSON response");
      JSON.parse(content);
      
      console.log("Returning successful response");
      return res.status(200).json(completion);
    } catch (error) {
      console.error('Error validating OpenAI response:', error);
      return res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
} 