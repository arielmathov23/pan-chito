import React from 'react';

interface MockNotificationProps {
  stage: string;
}

const MockNotification: React.FC<MockNotificationProps> = ({ stage }) => {
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-6">
      <div className="flex items-start">
        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <p className="font-medium">Using Mock Data</p>
          <p className="text-sm mt-1">
            This {stage} was generated using mock sample data. To use OpenAI integration, please add your API key to the environment variables.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MockNotification; 