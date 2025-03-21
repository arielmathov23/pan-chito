import { Screen } from '../utils/screenStore';

interface WireframeGenerationResponse {
  successful: {
    screenId: string;
    svg: string;
  }[];
  failed: {
    screenId: string;
    error: string;
  }[];
  totalRequested: number;
  totalSuccessful: number;
  totalFailed: number;
}

interface SvgWireframe {
  id: string;
  screen_id: string;
  screen_name: string;
  svg_content: string;
  created_at: string;
  updated_at: string;
}

export const wireframeService = {
  /**
   * Generate SVG wireframes for multiple screens
   * @param screens Array of screens to generate wireframes for
   * @param prd Optional PRD content to provide context
   * @returns Response with successful and failed generations
   */
  generateSvgWireframes: async (
    screens: Screen[], 
    prd?: string
  ): Promise<WireframeGenerationResponse> => {
    try {
      const response = await fetch('/api/generate-svg-wireframes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screens,
          prd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate wireframes');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in wireframe service:', error);
      throw error;
    }
  },

  /**
   * Save SVG wireframes to the separate svg_wireframes table
   * @param screenId Screen ID to update
   * @param screenName Name of the screen
   * @param svgContent SVG content to save
   */
  saveSvgWireframe: async (
    screenId: string, 
    screenName: string,
    svgContent: string
  ): Promise<SvgWireframe> => {
    try {
      console.log(`Saving SVG wireframe for screen ${screenId} (${screenName})`);
      
      // Use the new API endpoint to save SVG content
      const response = await fetch('/api/svg-wireframes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenId,
          screenName,
          svgContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error saving SVG for screen ${screenId}:`, errorData);
        throw new Error(errorData.message || `Failed to save SVG wireframe (Status: ${response.status})`);
      }

      const result = await response.json();
      console.log(`Successfully saved SVG wireframe for screen ${screenId}`);
      
      return result.data;
    } catch (error: any) {
      console.error(`Error saving SVG wireframe for screen ${screenId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get an SVG wireframe for a screen
   * @param screenId Screen ID to get wireframe for
   * @returns The SVG wireframe or null if not found
   */
  getSvgWireframe: async (screenId: string): Promise<SvgWireframe | null> => {
    try {
      const response = await fetch(`/api/svg-wireframes?screenId=${screenId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // 404 is expected when no wireframe exists yet
        if (response.status === 404) {
          return null;
        }
        
        const errorData = await response.json();
        console.error(`Error fetching SVG for screen ${screenId}:`, errorData);
        throw new Error(errorData.message || `Failed to fetch SVG wireframe (Status: ${response.status})`);
      }

      const result = await response.json();
      return result.svg;
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        return null;
      }
      console.error(`Error fetching SVG wireframe for screen ${screenId}:`, error);
      throw error;
    }
  }
}; 