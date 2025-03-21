import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid screen ID' });
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if the screen exists
    const { count, error } = await supabase
      .from('screens')
      .select('*', { count: 'exact', head: true })
      .eq('id', id);
    
    if (error) {
      console.error('Error checking screen existence:', error);
      return res.status(500).json({ 
        error: 'Failed to check screen existence', 
        message: error.message,
        details: error
      });
    }
    
    // Return appropriate response based on count
    if (count === null || count === 0) {
      return res.status(404).json({ 
        exists: false, 
        message: `No screen with ID ${id} exists in the database`
      });
    }
    
    if (count && count > 1) {
      return res.status(500).json({ 
        error: 'Database integrity error', 
        message: `Multiple screens with ID ${id} found` 
      });
    }
    
    // Screen exists
    return res.status(200).json({ 
      exists: true, 
      id 
    });
    
  } catch (error: any) {
    console.error('Error in screen check API:', error);
    return res.status(500).json({
      error: 'Failed to check screen',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 