import React, { useState, useEffect } from 'react';

interface Board {
  id: string;
  name: string;
  url: string;
}

interface List {
  id: string;
  name: string;
}

interface TrelloBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardSelect: (boardId: string, boardName: string, isNew: boolean, listId?: string) => void;
  token: string;
}

const TrelloBoardModal: React.FC<TrelloBoardModalProps> = ({ 
  isOpen, 
  onClose, 
  onBoardSelect,
  token 
}) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [view, setView] = useState<'select-board' | 'create-board' | 'select-list'>('select-board');
  
  const TRELLO_API_KEY = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
  
  useEffect(() => {
    if (isOpen && token) {
      fetchBoards();
    }
  }, [isOpen, token]);
  
  const fetchBoards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.trello.com/1/members/me/boards?fields=name,url&key=${TRELLO_API_KEY}&token=${token}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }
      
      const data = await response.json();
      setBoards(data);
    } catch (err) {
      console.error('Error fetching Trello boards:', err);
      setError('Failed to load your Trello boards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchLists = async (boardId: string) => {
    setIsLoadingLists(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists?key=${TRELLO_API_KEY}&token=${token}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch lists');
      }
      
      const data = await response.json();
      setLists(data);
      
      // Auto-select the first list that looks like a "To Do" list
      const toDoList = data.find((list: List) => 
        list.name.toLowerCase() === 'to do' || 
        list.name.toLowerCase() === 'todo' ||
        list.name.toLowerCase() === 'to-do' ||
        list.name.toLowerCase() === 'backlog'
      );
      
      if (toDoList) {
        setSelectedListId(toDoList.id);
      } else if (data.length > 0) {
        // Otherwise select the first list
        setSelectedListId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching Trello lists:', err);
      setError('Failed to load lists for this board. Please try again.');
    } finally {
      setIsLoadingLists(false);
    }
  };
  
  const createNewBoard = async () => {
    if (!newBoardName.trim()) {
      setError('Please enter a board name');
      return Promise.reject(new Error('Board name is required'));
    }
    
    setIsLoading(true);
    setError(null);
    setIsCreatingBoard(true);
    
    try {
      const response = await fetch(
        `https://api.trello.com/1/boards?name=${encodeURIComponent(newBoardName)}&key=${TRELLO_API_KEY}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        // Get more detailed error information
        const errorText = await response.text();
        console.error('Trello API error:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 401 || response.status === 403) {
          throw new Error('You do not have permission to create boards. Please select an existing board instead.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later or select an existing board.');
        } else {
          throw new Error('Unable to create a new board. Please select an existing board instead.');
        }
      }
      
      const newBoard = await response.json();
      onBoardSelect(newBoard.id, newBoard.name, true);
      return newBoard;
    } catch (err) {
      console.error('Error creating Trello board:', err);
      // Set a more helpful error message
      setError(err instanceof Error ? err.message : 'Failed to create a new board. Please select an existing board instead.');
      // Go back to board selection view
      setView('select-board');
      return Promise.reject(err);
    } finally {
      setIsLoading(false);
      setIsCreatingBoard(false);
    }
  };
  
  const handleBoardSelect = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSelectedListId(null);
    fetchLists(boardId);
    setView('select-list');
  };
  
  const handleContinue = () => {
    if (view === 'select-board') {
      if (!selectedBoardId) {
        setError('Please select a board');
        return;
      }
      
      const selectedBoard = boards.find(board => board.id === selectedBoardId);
      if (selectedBoard) {
        handleBoardSelect(selectedBoard.id);
      }
    } else if (view === 'create-board') {
      // Check if we have existing boards as a fallback
      if (boards.length === 0) {
        // No existing boards, try to create a new one
        createNewBoard().catch(() => {
          // If creation fails, we'll already be back at the select-board view
          // due to the logic in createNewBoard
        });
      } else {
        // We have existing boards, proceed with creation but with fallback
        createNewBoard().catch(() => {
          // If creation fails, we'll already be back at the select-board view
          // due to the logic in createNewBoard
        });
      }
    } else if (view === 'select-list') {
      if (!selectedBoardId) {
        setError('Board selection is missing');
        return;
      }
      
      if (!selectedListId) {
        setError('Please select a list');
        return;
      }
      
      const selectedBoard = boards.find(board => board.id === selectedBoardId);
      if (selectedBoard) {
        onBoardSelect(selectedBoard.id, selectedBoard.name, false, selectedListId);
      }
    }
  };
  
  const handleBack = () => {
    if (view === 'select-list') {
      setView('select-board');
      setSelectedListId(null);
    } else if (view === 'create-board') {
      setView('select-board');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {view === 'select-board' && 'Select Trello Board'}
              {view === 'create-board' && 'Create New Board'}
              {view === 'select-list' && 'Select List'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">
                    {error}
                    {error.includes('permission') && (
                      <p className="mt-1 text-xs">
                        This may be due to your Trello account permissions. Please select an existing board instead.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {view === 'select-board' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Select an existing board or create a new one to export your project features.
              </p>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0079BF]"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {boards.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      You don't have any boards yet. Create a new one!
                    </p>
                  ) : (
                    boards.map(board => (
                      <div 
                        key={board.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedBoardId === board.id 
                            ? 'border-[#0079BF] bg-[#0079BF]/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedBoardId(board.id)}
                      >
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-3 flex-shrink-0">
                            {selectedBoardId === board.id && (
                              <svg viewBox="0 0 20 20" fill="#0079BF">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{board.name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {/* Only show create board button if there was no previous error creating boards */}
              {!isCreatingBoard && (
                <button
                  onClick={() => setView('create-board')}
                  className="mt-4 w-full text-[#0079BF] hover:text-[#0079BF]/80 text-sm font-medium flex items-center justify-center py-2"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create New Board
                </button>
              )}
              
              {/* Show a message if there was an error creating a board */}
              {isCreatingBoard && error && (
                <div className="mt-4 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900 mb-1">Board Creation Restricted</p>
                  <p>You may not have permission to create new boards. Please select an existing board from the list above.</p>
                </div>
              )}
            </>
          )}
          
          {view === 'create-board' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Enter a name for your new Trello board.
              </p>
              
              <div className="mb-4">
                <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-1">
                  Board Name
                </label>
                <input
                  type="text"
                  id="boardName"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="My Project Board"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0079BF] focus:border-[#0079BF]"
                />
              </div>
              
              <button
                onClick={handleBack}
                className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center justify-center py-2"
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Board Selection
              </button>
            </>
          )}
          
          {view === 'select-list' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Select a list where you want to export your features as cards.
              </p>
              
              {isLoadingLists ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0079BF]"></div>
                </div>
              ) : (
                <>
                  {lists.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      This board doesn't have any lists yet. A "To Do" list will be created automatically.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {lists.map(list => (
                        <div 
                          key={list.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedListId === list.id 
                              ? 'border-[#0079BF] bg-[#0079BF]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedListId(list.id)}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-3 flex-shrink-0">
                              {selectedListId === list.id && (
                                <svg viewBox="0 0 20 20" fill="#0079BF">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-gray-900">{list.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    onClick={handleBack}
                    className="mt-4 w-full text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center justify-center py-2"
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Board Selection
                  </button>
                </>
              )}
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={
                isLoading || 
                isLoadingLists || 
                (view === 'select-board' && !selectedBoardId && boards.length > 0) ||
                (view === 'select-list' && !selectedListId && lists.length > 0)
              }
              className="px-4 py-2 bg-[#0079BF] text-white rounded-lg text-sm font-medium hover:bg-[#0079BF]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {(isLoading || isLoadingLists) && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {view === 'select-board' && 'Continue'}
              {view === 'create-board' && 'Create Board'}
              {view === 'select-list' && 'Export Features'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrelloBoardModal; 