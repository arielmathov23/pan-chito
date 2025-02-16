import React from 'react';
import Navbar from '../components/Navbar';
import PRDForm from '../components/PRDForm';
import PRDViewer from '../components/PRDViewer';
import LoadingPRD from '../components/LoadingPRD';
import { useState } from 'react';

export default function Home() {
  const [showPRD, setShowPRD] = useState(false);
  const [prdContent, setPrdContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePRDComplete = (content: string) => {
    console.log('PRD Content received:', content); // Debug log
    setIsLoading(false);
    if (content) {
      console.log('Setting PRD content and showing viewer');
      setPrdContent(content);
      setShowPRD(true);
    } else {
      console.log('No content received');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {isLoading ? (
        <LoadingPRD />
      ) : showPRD ? (
        <PRDViewer prdContent={prdContent} />
      ) : (
        <main className="py-12">
          <PRDForm 
            onComplete={handlePRDComplete} 
            onSubmit={() => {
              console.log('Form submission started');
              setIsLoading(true);
            }}
          />
        </main>
      )}
    </div>
  );
} 