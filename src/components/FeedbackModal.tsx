import React, { useState } from 'react';
import { feedbackService } from '../services/feedbackService';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bestFeature || !worstFeature) {
      setError('Please fill out both the best and worst feature fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await feedbackService.submitFeedback(
        projectId,
        bestFeature,
        worstFeature,
        satisfactionRating,
        additionalThoughts
      );
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setBestFeature('');
        setWorstFeature('');
        setSatisfactionRating(5);
        setAdditionalThoughts('');
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600">Your feedback helps us improve Pan Chito.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                <h2 className="text-xl font-semibold text-gray-900">Alpha Testing Feedback</h2>
              </div>
              <p className="text-gray-600 mt-2">
                We're currently in alpha testing. Your feedback is extremely valuable to us as we develop our product. Please share your thoughts with us to help shape the future of our platform.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's the best thing about our product?
                </label>
                <textarea
                  value={bestFeature}
                  onChange={(e) => setBestFeature(e.target.value)}
                  placeholder="Tell us what you like most..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F533A] focus:border-transparent"
                  rows={3}
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's the worst thing about our product?
                </label>
                <textarea
                  value={worstFeature}
                  onChange={(e) => setWorstFeature(e.target.value)}
                  placeholder="Tell us what could be improved..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F533A] focus:border-transparent"
                  rows={3}
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How satisfied are you with the product so far? (0-10)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">0</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={satisfactionRating}
                    onChange={(e) => setSatisfactionRating(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">10</span>
                  <span className="ml-2 text-sm font-medium text-gray-700">{satisfactionRating}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any additional thoughts or suggestions?
                </label>
                <textarea
                  value={additionalThoughts}
                  onChange={(e) => setAdditionalThoughts(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F533A] focus:border-transparent"
                  rows={3}
                ></textarea>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
  );
} 