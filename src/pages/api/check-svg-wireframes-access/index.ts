import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { projectLimitService } from '../../../services/projectLimitService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        hasAccess: false 
      });
    }
    
    // First try to call the RPC function directly
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('check_svg_wireframes_access');
      
      if (!rpcError && rpcResult !== null) {
        return res.status(200).json({ 
          hasAccess: !!rpcResult
        });
      }
    } catch (rpcError) {
      console.warn('RPC function check_svg_wireframes_access failed, falling back to service check');
    }
    
    // Fallback to service if RPC fails
    const hasAccess = await projectLimitService.canGenerateSvgWireframes();
    
    return res.status(200).json({ 
      hasAccess: hasAccess
    });
    
  } catch (error: any) {
    console.error('Error in check-svg-wireframes-access API:', error);
    return res.status(500).json({
      error: 'Server error',
      hasAccess: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 