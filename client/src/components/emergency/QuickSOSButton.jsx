import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const QuickSOSButton = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-danger hover:bg-danger-dark active:scale-[0.99] text-white p-5 rounded-2xl shadow-lg border-2 border-white/20 flex items-center justify-between transition-all group animate-soft-pulse ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">I NEED EMERGENCY HELP (SOS)</h2>
          <p className="text-xs sm:text-sm text-red-100 font-medium">
            3-Tap Fast Submission • Auto-alerts nearby volunteers & authorities
          </p>
        </div>
      </div>
      <span className="hidden sm:inline-block bg-white text-danger font-bold text-xs px-4 py-2 rounded-xl shadow-sm">
        Tap to Alert →
      </span>
    </button>
  );
};
