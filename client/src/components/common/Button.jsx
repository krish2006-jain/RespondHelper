import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[44px] sm:min-h-[48px] px-4';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
    secondary: 'bg-white text-text border border-border hover:bg-cream-ivory/50 hover:border-cream-dark shadow-card',
    danger: 'bg-danger text-white hover:bg-danger-dark shadow-sm',
    accent: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
    ghost: 'bg-transparent text-text-muted hover:bg-cream-ivory/60 hover:text-text',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary-subtle',
  };

  const sizes = {
    sm: 'text-sm py-1.5 px-3 min-h-[38px]',
    md: 'text-base py-2.5 px-4',
    lg: 'text-lg py-3.5 px-6 font-semibold min-h-[52px]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5 mr-2" />
      ) : null}
      {children}
    </button>
  );
};
