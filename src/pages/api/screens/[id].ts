import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import screenService from '../../../services/screenService';
import { Screen } from '../../../utils/screenStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid screen ID' });
  }

  console.log(`API call to /api/screens/${id} - Method: ${req.method}`);

  // Handle PATCH request to update a screen
  if (req.method === 'PATCH') {
    try {
      // Check if we're updating the SVG wireframe
      if (req.body.svgWireframe !== undefined) {
        console.log(`Updating SVG wireframe for screen ${id} (${req.body.svgWireframe.length} characters)`);
        
        // First verify that the screen exists
        const { count, error: countError } = await supabase
          .from('screens')
          .select('*', { count: 'exact', head: true })
          .eq('id', id);
          
        if (countError) {
          console.error('Error checking screen existence:', countError);
          return res.status(500).json({ 
            error: 'Failed to verify screen existence', 
            message: countError.message || 'Database query failed',
            details: countError
          });
        }
        
        console.log(`Screen existence check result: ${count} matching rows found for ID ${id}`);
        
        if (count === null || count === 0) {
          console.error(`No screen found with ID ${id}`);
          
          // Try to find if there's a screen with a similar ID (in case of UUID format issues)
          console.log(`Attempting to find screen with similar ID for ${id}`);
          const { data: similarScreens, error: similarError } = await supabase
            .from('screens')
            .select('id')
            .limit(5);
            
          if (!similarError && similarScreens && similarScreens.length > 0) {
            console.log(`Available screen IDs: ${similarScreens.map(s => s.id).join(', ')}`);
          }
          
          return res.status(404).json({ 
            error: 'Screen not found', 
            message: `No screen with ID ${id} exists in the database`,
            details: 'No rows returned from database query',
            availableIds: similarScreens ? similarScreens.map(s => s.id) : []
          });
        }
        
        if (count && count > 1) {
          console.error(`Multiple screens found with ID ${id} - database integrity issue`);
          return res.status(500).json({ 
            error: 'Database integrity error', 
            message: `Multiple screens with ID ${id} found`,
            details: 'Multiple rows returned for a primary key query' 
          });
        }
        
        // Now that we've verified the screen exists, update it
        try {
          console.log(`Updating screen ${id} with SVG wireframe`);
          
          const { error: updateError } = await supabase
            .from('screens')
            .update({
              svg_wireframe: req.body.svgWireframe,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (updateError) {
            console.error('Error updating screen wireframe:', updateError);
            return res.status(500).json({ 
              error: 'Failed to update screen wireframe', 
              message: updateError.message || 'Database error occurred',
              details: updateError 
            });
          }
  
          console.log(`Successfully updated SVG wireframe for screen ${id}`);
          return res.status(200).json({ 
            success: true, 
            message: 'Screen wireframe updated successfully',
            id
          });
        } catch (error: any) {
          console.error('Database operation error:', error);
          return res.status(500).json({
            error: 'Database operation failed',
            message: error.message || 'Unknown error occurred',
            details: error
          });
        }
      }
      
      // If not just updating the SVG wireframe, update other fields
      // This would need to be expanded for other field updates
      return res.status(400).json({ error: 'Unsupported update operation. Only SVG wireframe updates are supported.' });
    } catch (error: any) {
      console.error('Error in screen update API:', error);
      return res.status(500).json({
        error: 'Failed to update screen',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 