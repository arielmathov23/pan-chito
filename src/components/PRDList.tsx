import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PRD } from '../services/prdService';

interface PRDListProps {
  prds: PRD[];
  onDelete?: (id: string) => void;
  projectId?: string;
}

export default function PRDList({ prds, onDelete, projectId }: PRDListProps) {
  const handleDelete = (id: string, title: string) => {
    if (onDelete && window.confirm(`Are you sure you want to delete the PRD "${title}"?\n\nThis action cannot be undone.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="w-full">
      {prds.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-[#f0f2f5] rounded-xl p-8 max-w-2xl mx-auto">
            <div className="rounded-full bg-[#0F533A]/10 w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-3">
              No PRDs yet
            </h3>
            <p className="text-[#6b7280] mb-8 max-w-md mx-auto">
              Start creating your Product Requirements Documents to document and share your product ideas.
            </p>
            <Link 
              href={projectId ? `/prd/new?projectId=${projectId}` : "/prd/new"}
              className="inline-flex items-center px-6 py-3 rounded-lg text-white bg-[#0F533A] hover:bg-[#0F533A]/90 transition-colors"
            >
              Create my first PRD
              <svg className="ml-2 -mr-1 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-[#e5e7eb]">
          {prds.map((prd) => (
            <li key={prd.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/prd/${prd.id}`}
                    className="block hover:bg-[#f0f2f5] transition-colors duration-150 p-4 rounded-lg -m-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-[#111827] mb-1">
                          {prd.title}
                        </h2>
                        <p className="text-sm text-[#6b7280]">
                          Created on {format(new Date(prd.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="ml-4 hidden sm:block">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0F533A]/10 text-[#0F533A]">
                          PRD
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
                {onDelete && (
                  <div className="ml-4">
                    <button
                      onClick={() => handleDelete(prd.id, prd.title)}
                      className="p-2 text-[#6b7280] hover:text-[#ef4444] transition-colors duration-150 rounded-full hover:bg-[#f0f2f5]"
                      aria-label="Delete PRD"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.33 16.5H13.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 