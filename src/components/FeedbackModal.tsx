import React, { useState, useEffect, useRef } from 'react';
import { feedbackService } from '../services/feedbackService';
import { createPortal } from 'react-dom';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function FeedbackModal({ isOpen, onClose, projectId }: FeedbackModalProps) {
  const [bestFeature, setBestFeature] = useState('');
  const [worstFeature, setWorstFeature] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState<number>(5);
  const [additionalThoughts, setAdditionalThoughts] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Ref for the modal container to manage focus
  const modalRef = useRef<HTMLDivElement>(null);
  // Ref to store the element that had focus before the modal opened
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle mounting/unmounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Small delay to ensure animations complete before resetting
      const timer = setTimeout(() => {
        setError('');
        if (!submitted) {
          setBestFeature('');
          setWorstFeature('');
          setSatisfactionRating(5);
          setAdditionalThoughts('');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, submitted]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Save the current scroll position and lock the body
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal container for accessibility
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Unlock the body and restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
      
      // Restore focus to the previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bestFeature || !worstFeature) {
      setError('Please fill out both the best and worst feature fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Use a fallback "general" projectId if none is provided
      const safeProjectId = projectId || 'general';
      
      await feedbackService.submitFeedback(
        safeProjectId,
        bestFeature,
        worstFeature,
        satisfactionRating,
        additionalThoughts
      );
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset form after a delay to ensure the modal is closed
        setTimeout(() => {
          setSubmitted(false);
          setBestFeature('');
          setWorstFeature('');
          setSatisfactionRating(5);
          setAdditionalThoughts('');
        }, 300);
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      ref={modalRef}
      tabIndex={-1}
    >
      <div className="flex items-end sm:items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div 
          className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the modal
        >
          <div className="px-4 pt-5 pb-4 sm:p-5">
            <div className="absolute top-3 right-3">
              <button
                onClick={onClose}
                className="bg-white rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0F533A]"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600 text-sm">Your feedback helps us improve 021.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                    <h2 className="text-lg font-semibold text-gray-900" id="modal-title">BETA Testing Feedback</h2>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Your feedback is valuable as we develop our product. Please share your thoughts to help shape the future of our platform.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="best-feature" className="block text-sm font-medium text-gray-700 mb-1">
                      What's the best thing about our product?
                    </label>
                    <textarea
                      id="best-feature"
                      value={bestFeature}
                      onChange={(e) => setBestFeature(e.target.value)}
                      placeholder="Tell us what you like most..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F533A] focus:border-transparent text-sm"
                      rows={2}
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="worst-feature" className="block text-sm font-medium text-gray-700 mb-1">
                      What's the worst thing about our product?
                    </label>
                    <textarea
                      id="worst-feature"
                      value={worstFeature}
                      onChange={(e) => setWorstFeature(e.target.value)}
                      placeholder="Tell us what could be improved..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F533A] focus:border-transparent text-sm"
                      rows={2}
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="satisfaction-rating" className="block text-sm font-medium text-gray-700 mb-1">
                      How satisfied are you with the product so far? (0-10)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">0</span>
                      <input
                        type="range"
                        id="satisfaction-rating"
                        min="0"
                        max="10"
                        value={satisfactionRating}
                        onChange={(e) => setSatisfactionRating(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">10</span>
                      <span className="ml-1 text-sm font-medium text-gray-700">{satisfactionRating}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="additional-thoughts" className="block text-sm font-medium text-gray-700 mb-1">
                      Any additional thoughts or suggestions?
                    </label>
                    <textarea
                      id="additional-thoughts"
                      value={additionalThoughts}
                      onChange={(e) => setAdditionalThoughts(e.target.value)}
                      placeholder="Share any other feedback or ideas you have..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F533A] focus:border-transparent text-sm"
                      rows={2}
                    ></textarea>
                  </div>

                  {error && (
                    <div className="text-red-600 text-xs">{error}</div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Use a portal to render the modal outside the normal DOM hierarchy
  return createPortal(
    modalContent,
    document.body
  );
} 