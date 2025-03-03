import { useState, useEffect } from 'react';

const STORAGE_KEY = 'feedbackModalDisplayCount';
const INACTIVITY_TIMEOUT = 3000; // 3 seconds
const MAX_DISPLAYS = 3;

export const useFeedbackModal = (hasImplementationGuide: boolean) => {
  const [showModal, setShowModal] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    if (!hasImplementationGuide) return;

    const displayCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    if (displayCount >= MAX_DISPLAYS) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const checkInactivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        if (currentCount < MAX_DISPLAYS) {
          setShowModal(true);
          localStorage.setItem(STORAGE_KEY, (currentCount + 1).toString());
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(checkInactivity);
    };
  }, [hasImplementationGuide, lastActivity]);

  return {
    showModal,
    closeModal: () => setShowModal(false)
  };
}; 