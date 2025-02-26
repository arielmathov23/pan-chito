import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { projectStore } from '../../utils/projectStore';

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const project = projectStore.saveProject({ name, description });
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
              <Link href="/projects" className="hover:text-[#111827] transition-colors">Projects</Link>
              <span>/</span>
              <span className="text-[#111827]">New Project</span>
            </div>
            <h1 className="text-3xl font-bold text-[#111827]">Create a new project</h1>
            <p className="text-[#6b7280] mt-2">Set up a new project to organize your product documentation</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-2">
                    Project name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#111827] mb-2">
                    Description <span className="text-[#6b7280]">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#e5e7eb] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F533A]/20 focus:border-[#0F533A] transition-colors min-h-[100px]"
                    placeholder="Brief description of your project"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-[#6b7280] hover:text-[#111827] hover:bg-[#f0f2f5] transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#0F533A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 