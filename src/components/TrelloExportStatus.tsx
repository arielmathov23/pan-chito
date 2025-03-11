import React from 'react';

interface TrelloExportStatusProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'loading' | 'success' | 'error';
  message: string;
  boardName?: string;
  boardUrl?: string;
  cardsCreated?: number;
}

const TrelloExportStatus: React.FC<TrelloExportStatusProps> = ({
  isOpen,
  onClose,
  status,
  message,
  boardName,
  boardUrl,
  cardsCreated
}) => {
  const handleGoToBoard = () => {
    if (boardUrl) {
      window.open(boardUrl, '_blank');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {status === 'loading' && (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0079BF]"></div>
                </div>
              )}
              
              {status === 'success' && (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {status === 'error' && (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              <h2 className="text-xl font-semibold text-gray-900">
                {status === 'loading' && 'Exporting to Trello...'}
                {status === 'success' && 'Export Successful'}
                {status === 'error' && 'Export Failed'}
              </h2>
            </div>
            
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">{message}</p>
            
            {status === 'success' && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-[#0079BF] mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.2 3H4.8C3.81 3 3 3.81 3 4.8V19.2C3 20.19 3.81 21 4.8 21H19.2C20.19 21 21 20.19 21 19.2V4.8C21 3.81 20.19 3 19.2 3ZM10.5 16.5C10.5 16.91 10.16 17.25 9.75 17.25H6.75C6.34 17.25 6 16.91 6 16.5V6.75C6 6.34 6.34 6 6.75 6H9.75C10.16 6 10.5 6.34 10.5 6.75V16.5ZM18 12.75C18 13.16 17.66 13.5 17.25 13.5H14.25C13.84 13.5 13.5 13.16 13.5 12.75V6.75C13.5 6.34 13.84 6 14.25 6H17.25C17.66 6 18 6.34 18 6.75V12.75Z" />
                  </svg>
                  <span className="font-medium text-gray-900">{boardName}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Cards created: {cardsCreated}</span>
                  
                  {boardUrl && (
                    <a 
                      href={boardUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#0079BF] hover:text-[#0079BF]/80 font-medium"
                    >
                      View Board →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            {status === 'success' && boardUrl && (
              <button
                onClick={handleGoToBoard}
                className="px-4 py-2 bg-[#0079BF] text-white rounded-lg text-sm font-medium hover:bg-[#0079BF]/90 flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Go to Board
              </button>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2 ${status === 'success' && boardUrl ? 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50' : 'bg-[#0079BF] text-white hover:bg-[#0079BF]/90'} rounded-lg text-sm font-medium`}
            >
              {status === 'loading' ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrelloExportStatus; 