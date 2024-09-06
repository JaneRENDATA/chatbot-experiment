import React from 'react';

const loadingComponent: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-100 bg-opacity-50">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-lg font-semibold text-primary">Loading...</p>
      </div>
    </div>
  );
};

export default loadingComponent;