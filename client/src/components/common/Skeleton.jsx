import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect' }) => {
  const variants = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variants[variant] || variants.rect} ${className}`}
    />
  );
};
