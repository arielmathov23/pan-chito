import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get SVG wireframes by screen ID
  if (req.method === 'GET') {
    const { screenId } = req.query;
    
    if (!screenId || typeof screenId !== 'string') {
      return res.status(400).json({ error: 'Screen ID is required' });
    }
    
    try {
      // Query the svg_wireframes table
      const { data, error } = await supabase
        .from('svg_wireframes')
        .select('*')
        .eq('screen_id', screenId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error fetching SVG wireframe:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch SVG wireframe', 
          message: error.message,
          details: error
        });
      }
      
      if (!data || data.length === 0) {
        return res.status(404).json({ 
          error: 'SVG wireframe not found',
          message: `No SVG wireframe found for screen ID: ${screenId}`
        });
      }
      
      return res.status(200).json({ 
        success: true,
        svg: data[0]
      });
    } catch (error: any) {
      console.error('Error in SVG wireframe GET API:', error);
      return res.status(500).json({
        error: 'Server error',
        message: error.message || 'Unknown error',
        details: error
      });
    }
  }
  
  // Create or update SVG wireframe
  if (req.method === 'POST') {
    const { screenId, screenName, svgContent } = req.body;
    
    if (!screenId || !svgContent || !screenName) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Screen ID, screen name, and SVG content are required' 
      });
    }
    
    try {
      console.log(`Creating/updating SVG wireframe for screen: ${screenId} (${screenName})`);
      
      // First check if a record exists for this screen
      const { data: existingData, error: checkError } = await supabase
        .from('svg_wireframes')
        .select('id')
        .eq('screen_id', screenId)
        .limit(1);
        
      if (checkError) {
        console.error('Error checking existing SVG wireframe:', checkError);
        return res.status(500).json({ 
          error: 'Database query failed', 
          message: checkError.message,
          details: checkError
        });
      }
      
      let result;
      
      // If record exists, update it
      if (existingData && existingData.length > 0) {
        const { data, error: updateError } = await supabase
          .from('svg_wireframes')
          .update({
            svg_content: svgContent,
            screen_name: screenName,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData[0].id)
          .select();
          
        if (updateError) {
          console.error('Error updating SVG wireframe:', updateError);
          return res.status(500).json({ 
            error: 'Failed to update SVG wireframe', 
            message: updateError.message,
            details: updateError
          });
        }
        
        result = data && data[0];
        console.log(`Successfully updated SVG wireframe for screen: ${screenId}`);
      } 
      // Otherwise, create a new record
      else {
        const { data, error: insertError } = await supabase
          .from('svg_wireframes')
          .insert({
            screen_id: screenId,
            screen_name: screenName,
            svg_content: svgContent
          })
          .select();
          
        if (insertError) {
          console.error('Error creating SVG wireframe:', insertError);
          return res.status(500).json({ 
            error: 'Failed to create SVG wireframe', 
            message: insertError.message,
            details: insertError
          });
        }
        
        result = data && data[0];
        console.log(`Successfully created SVG wireframe for screen: ${screenId}`);
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'SVG wireframe saved successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error in SVG wireframe POST API:', error);
      return res.status(500).json({
        error: 'Server error',
        message: error.message || 'Unknown error',
        details: error
      });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 