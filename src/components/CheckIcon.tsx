import React from 'react';

interface CheckIconProps {
  className?: string;
}

const CheckIcon: React.FC<CheckIconProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path 
        d="M8 12L11 15L16 9" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CheckIcon; 