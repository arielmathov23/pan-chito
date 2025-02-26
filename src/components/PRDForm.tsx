import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface PRDFormProps {
  projectId: string;
  onSubmit: (data: PRDFormData) => void;
  isGenerating?: boolean;
  error?: string | null;
}

export interface PRDFormData {
  title: string;
  description: string;
  targetAudience: string;
  problemStatement: string;
  proposedSolution: string;
  keyFeatures: string;
  successMetrics: string;
}

export default function PRDForm({ projectId, onSubmit, isGenerating = false, error = null }: PRDFormProps) {
  const [formData, setFormData] = useState<PRDFormData>({
    title: '',
    description: '',
    targetAudience: '',
    problemStatement: '',
    proposedSolution: '',
    keyFeatures: '',
    successMetrics: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PRDFormData, string>>>({});

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PRDFormData, string>> = {};
    let isValid = true;

    // Check for required fields
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        errors[key as keyof PRDFormData] = 'This field is required';
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit PRD:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (formErrors[name as keyof PRDFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error generating PRD</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            PRD Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${formErrors.title ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
            placeholder="Enter PRD title"
            disabled={isGenerating}
          />
          {formErrors.title && <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Brief Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${formErrors.description ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]`}
            placeholder="Provide a brief overview of the product"
            disabled={isGenerating}
          />
          {formErrors.description && <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>}
        </div>

        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-foreground mb-2">
            Target Audience
          </label>
          <textarea
            id="targetAudience"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${formErrors.targetAudience ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
            placeholder="Who is this product for?"
            disabled={isGenerating}
          />
          {formErrors.targetAudience && <p className="mt-1 text-sm text-red-500">{formErrors.targetAudience}</p>}
        </div>

        <div>
          <label htmlFor="problemStatement" className="block text-sm font-medium text-foreground mb-2">
            Problem Statement
          </label>
          <textarea
            id="problemStatement"
            name="problemStatement"
            value={formData.problemStatement}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${formErrors.problemStatement ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]`}
            placeholder="What problem does this product solve?"
            disabled={isGenerating}
          />
          {formErrors.problemStatement && <p className="mt-1 text-sm text-red-500">{formErrors.problemStatement}</p>}
        </div>

        <div>
          <label htmlFor="proposedSolution" className="block text-sm font-medium text-foreground mb-2">
            Proposed Solution
          </label>
          <textarea
            id="proposedSolution"
            name="proposedSolution"
            value={formData.proposedSolution}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${formErrors.proposedSolution ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]`}
            placeholder="How does your product solve this problem?"
            disabled={isGenerating}
          />
          {formErrors.proposedSolution && <p className="mt-1 text-sm text-red-500">{formErrors.proposedSolution}</p>}
        </div>

        <div>
          <label htmlFor="keyFeatures" className="block text-sm font-medium text-foreground mb-2">
            Key Features
          </label>
          <textarea
            id="keyFeatures"
            name="keyFeatures"
            value={formData.keyFeatures}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${formErrors.keyFeatures ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]`}
            placeholder="List the main features of your product"
            disabled={isGenerating}
          />
          {formErrors.keyFeatures && <p className="mt-1 text-sm text-red-500">{formErrors.keyFeatures}</p>}
        </div>

        <div>
          <label htmlFor="successMetrics" className="block text-sm font-medium text-foreground mb-2">
            Success Metrics
          </label>
          <textarea
            id="successMetrics"
            name="successMetrics"
            value={formData.successMetrics}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${formErrors.successMetrics ? 'border-red-500' : 'border-border'} bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
            placeholder="How will you measure success?"
            disabled={isGenerating}
          />
          {formErrors.successMetrics && <p className="mt-1 text-sm text-red-500">{formErrors.successMetrics}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4">
        <button
          type="submit"
          disabled={isGenerating}
          className="inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating PRD...' : 'Generate PRD'}
        </button>
      </div>
    </form>
  );
} 