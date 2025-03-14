import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { projectLimitService } from '../services/projectLimitService';
import ContactForm from '../components/ContactForm';

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
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleUpgradeClick = (planName) => {
    setSelectedPlan(planName);
    setShowContactForm(true);
    setShowModal(false); // Close the feedback modal if it's open
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
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your product ideas into precise technical specifications
            </p>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-md max-w-2xl mx-auto">
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

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Try it free</h2>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                Create one project with basic AI tools: see it work, free forever.
                </p>
                <button
                  className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors mt-auto h-[50px] flex items-center justify-center"
                  disabled
                >
                  Current Plan
                </button>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <p className="text-sm font-medium text-gray-900 mb-3">What's included:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">1 project</span>
                  </li>
                  <li className="flex items-start">
                  <svg className="w-5 h-5 text-[#f59e0b] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-gray-600">Limited AI features</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#f59e0b] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-gray-600">Manual edits on outputs</span>
                  </li>
                  <li className="flex items-start">
                  <svg className="w-5 h-5 text-[#f59e0b] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-gray-600">Project locked after 7 days</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* One Project Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Single Project</h2>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$79</span>
                  <span className="text-gray-500 ml-1">one-time</span>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  Define and build a single product<span className="bg-[#F0FDF4] px-1.5 py-0.5 rounded text-[#0F533A] font-medium">without a subscription.</span>
                </p>
                <div className="mt-auto">
                  <button
                    onClick={() => window.location.href = 'https://buy.polar.sh/polar_cl_HzI3ixU9xa3LqcK1lhTijAU4HdjJaKvjev9jX3QUIKa'}
                    className="w-full py-3.5 px-4 bg-[#0F533A] hover:bg-[#0F533A]/90 text-white font-medium rounded-lg transition-colors h-[50px] flex items-center justify-center"
                  >
                    Choose Plan
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <p className="text-sm font-medium text-gray-900 mb-3">What's included:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">1 complete project</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Unlimited AI features</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">AI iterations on outputs</span>
                  </li>
                  <li className="flex items-start">
                  <svg className="w-5 h-5 text-[#f59e0b] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-gray-600">Project locked after 60 days</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl border-2 border-[#0F533A] shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative transform scale-105 z-10 flex flex-col">
              <div className="absolute top-0 right-0 bg-[#0F533A] text-white py-1 px-3 text-xs font-medium rounded-bl-lg">
                Recommended
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Pro Plan</h2>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  Unlimited projects and full AI capabilities for builders, and agencies.
                </p>
                <button
                  onClick={() => window.location.href = 'https://buy.polar.sh/polar_cl_p6cJvlbKPEDQPeJKSAbsXo7CtBZRDU9Ho4zVd1uVZFx'}
                  className="w-full py-3.5 px-4 bg-[#0F533A] hover:bg-[#0F533A]/90 text-white font-medium rounded-lg transition-colors relative overflow-hidden group mt-auto h-[50px] flex items-center justify-center"
                >
                  <span className="relative z-10">Choose Plan</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#16a34a] to-[#0F533A] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </button>
              </div>
              <div className="bg-[#0F533A]/5 px-6 py-4">
                <p className="text-sm font-medium text-gray-900 mb-3">What's included:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600"><strong>Unlimited</strong> projects</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600"><strong>Unlimited</strong> AI generations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Unlimited iterations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Priority support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Enterprise</h2>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-500 ml-1">/month</span>
                  <div className="text-xs text-gray-500 mt-1">starting at</div>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  Pro plan plus collaboration tools, expert guidance and consultancy services.
                </p>
                <button
                  onClick={() => handleUpgradeClick('Enterprise')}
                  className="w-full py-3.5 px-4 bg-white border border-[#0F533A] text-[#0F533A] hover:bg-[#0F533A]/5 font-medium rounded-lg transition-colors mt-auto h-[50px] flex items-center justify-center"
                >
                  Contact Us
                </button>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <p className="text-sm font-medium text-gray-900 mb-3">What's included:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Everything in Pro Plan</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Collaboration features</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Product strategy sessions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-[#16a34a] mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">Dedicated consultant</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-16">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Compare Plans</h2>
              <p className="text-gray-600 mt-1">See which plan is right for your needs</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-500">Features</th>
                    <th className="py-4 px-6 text-center text-sm font-medium text-gray-500">Free</th>
                    <th className="py-4 px-6 text-center text-sm font-medium text-gray-500">One Project</th>
                    <th className="py-4 px-6 text-center text-sm font-medium text-gray-500 bg-[#0F533A]/5">Pro Plan</th>
                    <th className="py-4 px-6 text-center text-sm font-medium text-gray-500">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">Number of Projects</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">1</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">1</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-[#0F533A] bg-[#0F533A]/5">Unlimited</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">AI Spec Generation</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Limited</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Unlimited</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-[#0F533A] bg-[#0F533A]/5">Unlimited</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">Result Iterations</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Limited</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">60 days</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-[#0F533A] bg-[#0F533A]/5">Unlimited</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">Export Formats</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Watermark</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">No watermark</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-[#0F533A] bg-[#0F533A]/5">Custom</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Custom</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">Integrations</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Limited</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Basic</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-[#0F533A] bg-[#0F533A]/5">Advanced</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Custom</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">Support</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Community</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Email</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-[#0F533A] bg-[#0F533A]/5">Priority</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Dedicated</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">Consultancy</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">—</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">—</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-[#0F533A] bg-[#0F533A]/5">—</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Can I upgrade from the One Project plan later?</h3>
                <p className="text-gray-600">Yes, you can upgrade to the Pro Plan at any time. Your existing project will be transferred to your new plan.</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What happens after the 30-day AI generation period?</h3>
                <p className="text-gray-600">With the One Project plan, you'll still have full access to view and export your project, but new AI generations will require an upgrade to the Pro Plan.</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What's included in the consultancy services?</h3>
                <p className="text-gray-600">Our Enterprise plan includes personalized workshops, product strategy sessions, and dedicated support from our product experts to help you maximize your success.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#0F533A] to-[#16a34a] rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to transform your product development?</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">Join forward-thinking teams who are revolutionizing how products are built. Start your journey from zero to one today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  // Scroll to the top of the page smoothly
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }}
                className="px-8 py-3.5 bg-white text-[#0F533A] font-medium rounded-lg hover:bg-white/90 transition-colors order-first h-[50px] flex items-center justify-center min-w-[160px]"
              >
                Choose a Plan
              </button>
              <Link
                href="/projects"
                className="px-8 py-3.5 bg-transparent border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors order-last h-[50px] flex items-center justify-center min-w-[160px]"
              >
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPlan}</h2>
                <button 
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ContactForm 
                selectedPlan={selectedPlan}
                onSuccess={() => {
                  // Redirect to projects page on successful submission
                  router.push('/projects');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showModal && !showContactForm && (
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