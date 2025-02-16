import React from 'react';
import { useState } from 'react';
import { ProductIdea } from '../types/types';

interface PRDFormProps {
  onComplete: (content: string) => void;
  onSubmit: () => void;
}

const questions = [
  {
    id: 'productName',
    question: "¿Cuál es el nombre de tu producto?",
    placeholder: "Escribe el nombre de tu producto...",
    helper: "Un nombre claro y memorable que refleje la esencia de tu producto"
  },
  {
    id: 'problemStatement',
    question: "¿Qué problema resuelve tu producto?",
    placeholder: "Describe el problema o necesidad que tu producto busca resolver...",
    helper: "¿A quién afecta este problema y cuál es el impacto que tiene?"
  },
  {
    id: 'targetUser',
    question: "¿Quién es tu usuario?",
    placeholder: "Describe a tu usuario ideal...",
    helper: "Considera demografía, comportamientos y necesidades específicas"
  },
  {
    id: 'proposedSolution',
    question: "¿Cuál es la solución propuesta por tu producto?",
    placeholder: "Describe cómo tu producto resuelve el problema...",
    helper: "Explica la solución de manera clara y concisa"
  },
  {
    id: 'productObjectives',
    question: "¿Cuáles son los objetivos del producto?",
    placeholder: "Define los objetivos principales...",
    helper: "¿Qué quieres lograr con este producto?"
  },
  {
    id: 'detailedFunctionality',
    question: "¿Qué funcionalidades querés detallar?",
    placeholder: "Describe las funcionalidades específicas...",
    helper: "Explica cada funcionalidad que necesita ser analizada en profundidad"
  }
];

const PRDForm = ({ onComplete, onSubmit }: PRDFormProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<ProductIdea>({
    productName: '',
    problemStatement: '',
    targetUser: '',
    proposedSolution: '',
    productObjectives: '',
    detailedFunctionality: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const currentQuestion = questions[currentQuestionIndex];

  const validateCurrentField = () => {
    const currentField = currentQuestion.id;
    const value = formData[currentField as keyof ProductIdea] || '';

    if (!value.trim()) {
      setFieldErrors(prev => ({
        ...prev,
        [currentField]: 'Este campo es requerido'
      }));
      return false;
    }
    
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[currentField];
      return newErrors;
    });
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentField()) return;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentField()) return;
    
    onSubmit(); // Trigger loading state
    setIsSubmitting(true);

    try {
      // Use absolute URL to ensure we're hitting the right endpoint
      const response = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Log everything for debugging
      console.log('API Response:', response);
      const data = await response.json();
      console.log('API Data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate PRD');
      }

      if (data.prd) {
        onComplete(data.prd);
      } else {
        throw new Error('No PRD content received');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setFieldErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'An error occurred'
      }));
      onComplete('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentQuestionIndex === questions.length - 1) {
        handleSubmit(e as unknown as React.FormEvent);
      } else {
        handleNext();
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="min-h-[300px] flex flex-col">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 transition-opacity duration-300">
            {currentQuestion.question}
          </h2>
          
          <p className="text-sm text-gray-500 mb-4">
            {currentQuestion.helper}
          </p>

          <div className="flex-1 flex flex-col">
            <textarea
              id={currentQuestion.id}
              name={currentQuestion.id}
              value={formData[currentQuestion.id as keyof ProductIdea]}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className={`flex-1 p-4 rounded-lg border-2 ${
                fieldErrors[currentQuestion.id] 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
              } transition-all duration-200 resize-none`}
              placeholder={currentQuestion.placeholder}
              rows={6}
            />
            {fieldErrors[currentQuestion.id] && (
              <p className="mt-2 text-sm text-red-600">
                {fieldErrors[currentQuestion.id]}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Presiona Enter para continuar, Shift + Enter para nueva línea
            </p>
          </div>
        </div>

        {fieldErrors.submit && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {fieldErrors.submit}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Generating...' : 'Generate PRD'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PRDForm; 