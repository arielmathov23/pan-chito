import React from 'react';

const LoadingPRD = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-4">
        <div className="animate-bounce bg-indigo-600 p-2 w-16 h-16 ring-1 ring-slate-900/5 rounded-lg shadow-lg mx-auto">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Generando tu PRD...</h2>
        <p className="text-gray-500">Nuestro Product Manager AI está trabajando en ello 🚀</p>
        <div className="flex space-x-3 justify-center mt-4">
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse delay-150"></div>
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPRD; 