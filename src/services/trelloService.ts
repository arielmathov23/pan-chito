interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
}

interface TrelloList {
  id: string;
  name: string;
}

interface ExportFeature {
  title: string;
  description: string;
  priority: 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
}

class TrelloService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || '';
  }
  
  // Helper function to add delay between API calls
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async createToDoList(boardId: string, token: string): Promise<string> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/lists?name=To%20Do&idBoard=${boardId}&pos=top&key=${this.apiKey}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create To Do list: ${errorData}`);
      }
      
      const list = await response.json();
      return list.id;
    } catch (error) {
      console.error('Error creating To Do list:', error);
      throw error;
    }
  }
  
  async getExistingLists(boardId: string, token: string): Promise<TrelloList[]> {
    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists?key=${this.apiKey}&token=${token}`
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch lists: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Trello lists:', error);
      throw error;
    }
  }
  
  async createCard(feature: ExportFeature, listId: string, token: string, retryCount = 0): Promise<TrelloCard> {
    try {
      // Add priority label to the card title
      const cardTitle = `[${feature.priority}] ${feature.title}`;
      
      // Sanitize the description to avoid potential issues
      const sanitizedDescription = feature.description
        ? feature.description.substring(0, 16000) // Trello has a character limit
        : 'No description provided';
      
      const response = await fetch(
        `https://api.trello.com/1/cards?idList=${listId}&key=${this.apiKey}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: cardTitle,
            desc: sanitizedDescription,
            pos: 'bottom'
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Card creation error response:', errorData, 'Status:', response.status);
        
        // If we get a 429 (rate limit) or 409 (conflict), retry after a delay
        if ((response.status === 429 || response.status === 409) && retryCount < 3) {
          console.log(`Retrying card creation for "${feature.title}" after delay (attempt ${retryCount + 1})...`);
          // Exponential backoff: wait longer with each retry
          await this.delay(1000 * Math.pow(2, retryCount));
          return this.createCard(feature, listId, token, retryCount + 1);
        }
        
        throw new Error(`Failed to create card "${feature.title}": ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Trello card:', error);
      throw error;
    }
  }
  
  async exportFeaturesToBoard(
    boardId: string, 
    features: ExportFeature[], 
    token: string,
    selectedListId?: string
  ): Promise<{ success: boolean; message: string; cardsCreated: number; boardUrl: string }> {
    try {
      // Find or create To Do list
      let targetListId: string;
      
      if (selectedListId) {
        // Use the selected list if provided
        targetListId = selectedListId;
      } else {
        // Check if To Do list already exists
        const existingLists = await this.getExistingLists(boardId, token);
        
        // Look for a list named "To Do" or similar
        const toDoList = existingLists.find(list => 
          list.name.toLowerCase() === 'to do' || 
          list.name.toLowerCase() === 'todo' ||
          list.name.toLowerCase() === 'to-do' ||
          list.name.toLowerCase() === 'backlog'
        );
        
        if (toDoList) {
          targetListId = toDoList.id;
        } else {
          // Create new To Do list
          targetListId = await this.createToDoList(boardId, token);
        }
      }
      
      // Create cards for each feature
      let cardsCreated = 0;
      type ExportError = { feature: string; error: string };
      const errors: ExportError[] = [];
      
      // Only process MUST and SHOULD features
      const featuresToExport = features.filter(
        feature => feature.priority === 'MUST' || feature.priority === 'SHOULD'
      );
      
      // Process features sequentially with a delay between each to avoid rate limiting
      for (const feature of featuresToExport) {
        try {
          await this.createCard(feature, targetListId, token);
          cardsCreated++;
          
          // Add a small delay between card creations to avoid rate limiting
          if (featuresToExport.length > 1) {
            await this.delay(300);
          }
        } catch (error) {
          console.error(`Failed to create card for feature "${feature.title}":`, error);
          errors.push({
            feature: feature.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Get board URL
      const boardUrl = `https://trello.com/b/${boardId}`;
      
      // If we have errors but some cards were created, return partial success
      if (errors.length > 0 && cardsCreated > 0) {
        return {
          success: true,
          message: `Exported ${cardsCreated} features to Trello board. ${errors.length} features failed to export.`,
          cardsCreated,
          boardUrl
        };
      } else if (errors.length > 0) {
        // If all cards failed, return error
        return {
          success: false,
          message: `Failed to export features: ${errors[0].error}`,
          cardsCreated: 0,
          boardUrl
        };
      }
      
      return {
        success: true,
        message: `Successfully exported ${cardsCreated} features to Trello board`,
        cardsCreated,
        boardUrl
      };
    } catch (error) {
      console.error('Error exporting features to Trello:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export features to Trello',
        cardsCreated: 0,
        boardUrl: `https://trello.com/b/${boardId}`
      };
    }
  }
}

export const trelloService = new TrelloService(); 