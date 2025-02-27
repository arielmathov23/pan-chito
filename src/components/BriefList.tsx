import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Brief } from '../utils/briefStore';

interface BriefListProps {
  briefs: Brief[];
  onDelete?: (id: string) => void;
  projectId?: string;
}

export default function BriefList({ briefs, onDelete, projectId }: BriefListProps) {
  const handleDelete = (id: string, title: string) => {
    if (onDelete && window.confirm(`Are you sure you want to delete the Brief "${title}"?\n\nThis action cannot be undone.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="w-full">
      {briefs.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-[#f0f2f5] rounded-lg p-8 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-7 h-7 text-[#6b7280]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#111827] mb-2">
              No Briefs yet
            </h3>
            <p className="text-[#6b7280] mb-6 max-w-md mx-auto">
              Start creating your Product Briefs to document and share your product ideas.
            </p>
            <Link 
              href={projectId ? `/brief/new?projectId=${projectId}` : "/brief/new"}
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create Brief
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-[#e5e7eb]">
          {briefs.map((brief) => (
            <li key={brief.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/brief/${brief.id}`}
                    className="block hover:bg-[#f0f2f5] transition-colors duration-150 p-4 rounded-lg -m-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-medium text-[#111827] mb-1">
                          {brief.productName}
                        </h2>
                        <div className="flex items-center text-xs text-[#6b7280]">
                          <svg className="w-3.5 h-3.5 mr-1.5 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Created on {format(new Date(brief.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </Link>
                </div>
                {onDelete && (
                  <div className="ml-4">
                    <button
                      onClick={() => handleDelete(brief.id, brief.productName)}
                      className="p-2 text-[#6b7280] hover:text-red-500 transition-colors duration-150 rounded-full hover:bg-[#f0f2f5]"
                      aria-label="Delete brief"
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