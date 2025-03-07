import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { projectLimitService } from '../services/projectLimitService';

export default function Upgrade() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [bestFeature, setBestFeature] = useState('');
  const [worstFeature, setWorstFeature] = useState('');
  const [satisfaction, setSatisfaction] = useState(5); // Default to middle value
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false); // Changed to false to not show immediately

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleUpgradeClick = () => {
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const success = await projectLimitService.submitUpgradeRequest(
        bestFeature,
        worstFeature,
        satisfaction,
        additionalFeedback
      );
      
      if (success) {
        setIsSubmitted(true);
        setShowModal(false);
      } else {
        setError('Failed to submit your request. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to submit upgrade request:', error);
      setError('An error occurred while submitting your request. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A]"></div>
              <p className="mt-4 text-[#6b7280]">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Router will redirect to login
  }

  // Thank you page after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
                <Link href="/projects" className="hover:text-[#111827] transition-colors">Projects</Link>
                <span>/</span>
                <span className="text-[#111827]">Upgrade</span>
              </div>
              <h1 className="text-3xl font-bold text-[#111827]">Thank You!</h1>
              <p className="text-[#6b7280] mt-2">We appreciate your interest in our product</p>
            </div>

            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-8 mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F0FDF4] mb-4">
                  <svg className="w-8 h-8 text-[#16a34a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#111827]">Alpha Testing in Progress</h2>
                <p className="text-[#6b7280] mt-2 max-w-md mx-auto">
                  We've recorded your interest in upgrading and will contact you when this feature becomes available.
                </p>
              </div>

              <div className="border-t border-[#e5e7eb] pt-6 mt-6">
                <p className="text-[#4b5563] text-center">
                  In the meantime, you can continue to use your current project to explore our features.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0F533A]/90 transition-colors"
              >
                Return to Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
              <Link href="/projects" className="hover:text-[#111827] transition-colors">Projects</Link>
              <span>/</span>
              <span className="text-[#111827]">Upgrade</span>
            </div>
            <h1 className="text-3xl font-bold text-[#111827]">Upgrade Your Account</h1>
            <p className="text-[#6b7280] mt-2">Get access to more features and unlimited projects</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-[#111827]">Free Plan</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-[#111827]">$0</span>
                  <span className="text-[#6b7280]">/month</span>
                </div>
                <p className="text-[#6b7280] mt-2">Perfect for getting started</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">1 project</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Basic AI features</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Community support</p>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-[#e5e7eb]">
                <p className="text-[#6b7280] text-sm">Current plan</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-[#0F533A] shadow-md p-6 relative">
              <div className="absolute top-0 right-0 bg-[#0F533A] text-white py-1 px-3 text-xs font-medium rounded-bl-lg rounded-tr-lg">
                Recommended
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-[#111827]">Pro Plan</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-[#111827]">$9</span>
                  <span className="text-[#6b7280]">/month</span>
                </div>
                <p className="text-[#6b7280] mt-2">For professionals and teams</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]"><strong>Unlimited</strong> projects</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Advanced AI capabilities</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Priority support</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Export to multiple formats</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[#4b5563]">Team collaboration features</p>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleUpgradeClick}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0F533A]/90 transition-colors w-full"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-[#6b7280] hover:text-[#111827] hover:bg-[#f0f2f5] transition-colors"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 pt-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-[#111827]">021 Alpha Testing Phase</h1>
              <button 
                onClick={handleCloseModal}
                className="text-[#6b7280] hover:text-[#111827]"
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-[#6b7280] text-base max-w-2xl mx-auto">
                We're currently in alpha testing. Your feedback is extremely valuable to us as we develop our product. 
                Please share your thoughts with us to help shape the future of our platform.
              </p>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
              <div>
                <label htmlFor="bestFeature" className="block text-sm font-medium text-[#111827] mb-1">
                  What's the best thing about our product?
                </label>
                <textarea
                  id="bestFeature"
                  value={bestFeature}
                  onChange={(e) => setBestFeature(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                  placeholder="Tell us what you like most..."
                  rows={2}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="worstFeature" className="block text-sm font-medium text-[#111827] mb-1">
                  What's the worst thing about our product?
                </label>
                <textarea
                  id="worstFeature"
                  value={worstFeature}
                  onChange={(e) => setWorstFeature(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                  placeholder="Tell us what could be improved..."
                  rows={2}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="satisfaction" className="block text-sm font-medium text-[#111827] mb-1">
                  How satisfied are you with the product so far? (0-10)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#6b7280]">0</span>
                  <input
                    type="range"
                    id="satisfaction"
                    min="0"
                    max="10"
                    value={satisfaction}
                    onChange={(e) => setSatisfaction(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#e5e7eb] rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-[#6b7280]">10</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-[#111827]">{satisfaction}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="additionalFeedback" className="block text-sm font-medium text-[#111827] mb-1">
                  Any additional thoughts or suggestions?
                </label>
                <textarea
                  id="additionalFeedback"
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                  placeholder="Share any other feedback you have..."
                  rows={2}
                />
              </div>
              
              <div className="pt-3 flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium text-lg hover:bg-[#0F533A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : 'Submit Feedback'}
                </button>
                
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-[#6b7280] hover:text-[#111827] font-medium"
                >
                  I'll provide feedback later
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 