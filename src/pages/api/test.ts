import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Test API endpoint called");
  
  // Return a simple response
  res.status(200).json({ 
    message: 'API endpoint is working correctly',
    method: req.method,
    timestamp: new Date().toISOString()
  });
} 