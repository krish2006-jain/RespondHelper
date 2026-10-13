import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'primary', subtext, onClick }) => {
  const colorStyles = {
    primary: 'bg-primary-subtle text-primary border-primary/20',
    danger: 'bg-danger-light text-danger border-danger/20',
    warning: 'bg-warning-light text-warning border-warning/20',
    success: 'bg-success-light text-success-dark border-success/20',
    info: 'bg-info-light text-info border-info/20',
    shelter: 'bg-shelter-light text-shelter border-shelter/20',
    accent: 'bg-accent-light text-accent-hover border-accent/20',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-border p-5 shadow-card transition-all flex flex-col justify-between ${
        onClick ? 'hover:shadow-md cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text-muted">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorStyles[color] || colorStyles.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold tracking-tight text-text tabular-nums">{value}</div>
        {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
      </div>
    </div>
  );
};
