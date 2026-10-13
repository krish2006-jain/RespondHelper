import React from 'react';

export const Card = ({ children, className = '', onClick, hover = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-border p-5 shadow-card transition-all ${
        hover ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};
