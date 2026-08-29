import React from 'react';

const baseInput =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400';

const Label = ({ children, required }) =>
  children ? (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  ) : null;

export const Input = React.forwardRef(function Input(
  { label, required, className = '', wrapperClassName = '', ...props },
  ref
) {
  return (
    <div className={wrapperClassName}>
      <Label required={required}>{label}</Label>
      <input ref={ref} className={`${baseInput} ${className}`} required={required} {...props} />
    </div>
  );
});

export const Select = ({ label, required, className = '', wrapperClassName = '', children, ...props }) => (
  <div className={wrapperClassName}>
    <Label required={required}>{label}</Label>
    <select className={`${baseInput} ${className}`} required={required} {...props}>
      {children}
    </select>
  </div>
);

export const Textarea = ({ label, required, className = '', wrapperClassName = '', ...props }) => (
  <div className={wrapperClassName}>
    <Label required={required}>{label}</Label>
    <textarea className={`${baseInput} ${className}`} required={required} {...props} />
  </div>
);

export default Input;
