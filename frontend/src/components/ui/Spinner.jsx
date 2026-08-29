import React from 'react';

const Spinner = ({ className = 'h-5 w-5' }) => (
  <span className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 ${className}`} />
);

export const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <Spinner className="h-8 w-8" />
  </div>
);

export default Spinner;
