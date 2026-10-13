import React from 'react';
import { getPriorityClass, getStatusClass } from '../../utils/formatters';

export const Badge = ({ children, variant, type, className = '' }) => {
  let styleClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'priority') {
    styleClass = getPriorityClass(children);
  } else if (type === 'status') {
    styleClass = getStatusClass(children);
  } else if (variant === 'success') {
    styleClass = 'bg-success-light text-success-dark border-success/30';
  } else if (variant === 'danger') {
    styleClass = 'bg-danger-light text-danger border-danger/30';
  } else if (variant === 'warning') {
    styleClass = 'bg-warning-light text-warning border-warning/30';
  } else if (variant === 'info') {
    styleClass = 'bg-info-light text-info border-info/30';
  } else if (variant === 'primary') {
    styleClass = 'bg-primary-subtle text-primary border-primary/30';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase ${styleClass} ${className}`}
    >
      {children}
    </span>
  );
};
