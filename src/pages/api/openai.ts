import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent initialization error
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is missing. Please add OPENAI_API_KEY to your .env.local file.' });
  }

  try {
    const { prompt, max_tokens = 2000, temperature = 0.7 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set response timeout to 2 minutes
    res.setTimeout(120000, () => {
      res.status(504).json({ error: 'Request timeout' });
    });

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
      model: "gpt-4",
      temperature,
      max_tokens,
      response_format: { type: "json_object" }
    }, {
      timeout: 90000 // 90 seconds timeout for OpenAI API call
    });

    return res.status(200).json(completion);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
} 