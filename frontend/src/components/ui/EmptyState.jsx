import React from 'react';

const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    {Icon && <Icon className="mb-3 text-3xl text-slate-300" />}
    <p className="text-sm font-medium text-slate-600">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
