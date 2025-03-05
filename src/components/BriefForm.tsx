import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService } from '../services/projectService';

interface BriefFormProps {
  projectId: string;
  onSubmit: (data: BriefFormData) => void;
  isGenerating?: boolean;
  error?: string | null;
}

export interface BriefFormData {
  productName: string;
  problemStatement: string;
  targetUsers: string;
  proposedSolution: string;
  productObjectives: string;
  keyFeatures: string;
  marketAnalysis: string;
  technicalRisks: string;
  businessRisks: string;
  existingSolutions: string;
}

export default function BriefForm({ projectId, onSubmit, isGenerating = false, error = null }: BriefFormProps) {
  const [formData, setFormData] = useState<BriefFormData>({
    productName: '',
    problemStatement: '',
    targetUsers: '',
    proposedSolution: '',
    productObjectives: '',
    keyFeatures: '',
    marketAnalysis: '',
    technicalRisks: '',
    businessRisks: '',
    existingSolutions: ''
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BriefFormData, string>>>({});
  const [progress, setProgress] = useState(0);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    // Get project name when component mounts
    const fetchProject = async () => {
      try {
        const project = await projectService.getProjectById(projectId);
        if (project) {
          setProjectName(project.name);
          // Pre-fill the product name with project name
          setFormData(prev => ({ ...prev, productName: project.name }));
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };
    
    fetchProject();
  }, [projectId]);

  const questions = [
    {
      id: 'productName',
      question: 'What is your product name?',
      placeholder: 'Enter your product name',
      type: 'input'
    },
    {
      id: 'problemStatement',
      question: 'What problem does your product solve?',
      placeholder: 'Describe the problem or need your product aims to solve. What impact does it have?',
      type: 'textarea'
    },
    {
      id: 'targetUsers',
      question: 'Who are your target users?',
      placeholder: 'Describe your target users, their specific needs and demographic characteristics',
      type: 'textarea'
    },
    {
      id: 'proposedSolution',
      question: 'What solution does your product propose?',
      placeholder: 'Describe how your product solves the problem in a unique and effective way',
      type: 'textarea'
    },
    {
      id: 'existingSolutions',
      question: 'What existing solutions address this problem?',
      placeholder: 'Name/URL, and description of current alternatives, their limitations, and how your solution is different or better',
      type: 'textarea'
    },
    {
      id: 'productObjectives',
      question: 'What are the short-term objectives and where will you launch?',
      placeholder: 'List your immediate product objectives and specify where you plan to launch first (city/country).',
      type: 'textarea'
    },
    {
      id: 'keyFeatures',
      question: 'What ideas or functionality would you like to explore for this product?',
      placeholder: 'Share your thoughts on potential features or capabilities you\'d like to explore, even if you\'re not sure about them yet',
      type: 'textarea'
    },
    {
      id: 'marketAnalysis',
      question: 'What interesting trends or analogous products inspire you?',
      placeholder: 'Share any emerging trends, similar products in other industries, or interesting solutions that could inspire your product. Example: "Uber-like experience but for X" or "Growing trend of Y in industry Z"',
      type: 'textarea'
    }
  ];

  useEffect(() => {
    // Update progress bar
    setProgress(((currentStep + 1) / questions.length) * 100);
  }, [currentStep, questions.length]);

  const validateCurrentField = (): boolean => {
    const currentField = questions[currentStep].id as keyof BriefFormData;
    const value = formData[currentField];
    
    if (!value.trim()) {
      setFormErrors({ ...formErrors, [currentField]: 'This field is required' });
      return false;
    }
    
    setFormErrors({ ...formErrors, [currentField]: undefined });
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentField()) return;
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentField()) return;
    
    // Set empty strings for the fields we removed from the form
    const completeFormData = {
      ...formData,
      technicalRisks: '',
      businessRisks: ''
    };
    
    try {
      await onSubmit(completeFormData);
    } catch (error) {
      console.error('Failed to submit Brief:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (formErrors[name as keyof BriefFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow Shift+Enter to create a new line in textareas
        return;
      } else {
        // Use Enter to move to the next question
        e.preventDefault();
        handleNext();
      }
    }
  };

  const currentQuestion = questions[currentStep];
  const currentFieldId = currentQuestion.id as keyof BriefFormData;
  const isLastStep = currentStep === questions.length - 1;

  return (
    <div className="flex flex-col">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start mb-3">
          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p className="font-medium text-sm">Error generating Brief</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center mb-3">
        <div className="text-xs font-medium mr-2 text-[#6b7280]">
          {currentStep + 1}/{questions.length}
        </div>
        <div className="flex-1 bg-[#f0f2f5] h-1.5 rounded-full">
          <div 
            className="h-1.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%`, backgroundColor: '#0F533A' }}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#111827]">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="mb-4">
              {currentQuestion.type === 'input' ? (
                <input
                  type="text"
                  id={currentFieldId}
                  name={currentFieldId}
                  value={formData[currentFieldId]}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 rounded-lg border ${formErrors[currentFieldId] ? 'border-red-500' : 'border-[#e5e7eb]'} bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors`}
                  placeholder={currentQuestion.placeholder}
                  disabled={isGenerating}
                  autoFocus
                />
              ) : (
                <textarea
                  id={currentFieldId}
                  name={currentFieldId}
                  value={formData[currentFieldId]}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-3 py-2 rounded-lg border ${formErrors[currentFieldId] ? 'border-red-500' : 'border-[#e5e7eb]'} bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors`}
                  placeholder={currentQuestion.placeholder}
                  disabled={isGenerating}
                  rows={5}
                  autoFocus
                />
              )}
              {formErrors[currentFieldId] && (
                <p className="mt-1 text-xs text-red-500">{formErrors[currentFieldId]}</p>
              )}
              <p className="text-xs text-[#6b7280] mt-1">
                Press Enter to continue{currentQuestion.type === 'textarea' ? ', Shift+Enter to add a new line' : ''}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isGenerating}
            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0 
                ? 'text-[#d1d5db] cursor-not-allowed' 
                : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f0f2f5]'
            }`}
          >
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={isGenerating}
            className="inline-flex items-center justify-center text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: '#0F533A' }}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : isLastStep ? (
              'Generate Brief'
            ) : (
              <>
                Continue
                <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.91003 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91003 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 