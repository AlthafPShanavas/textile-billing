import React from 'react';

export const Card = ({ className = '', children, ...props }) => (
  <div className={`rounded-xl border border-slate-200 bg-white shadow-card ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 ${className}`}>
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const CardBody = ({ className = '', children }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
);

export default Card;
