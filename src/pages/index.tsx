import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import PRDForm from '../components/PRDForm';
import PRDViewer from '../components/PRDViewer';
import LoadingPRD from '../components/LoadingPRD';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [showPRD, setShowPRD] = useState(false);
  const [prdContent, setPrdContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    router.replace('/projects');
  }, [router]);

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

  return null;
} 