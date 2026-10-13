import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isCritical = toast.priority === 'critical' || toast.type === 'emergency';
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white transition-all transform animate-slideIn ${
              isCritical ? 'border-danger/40 bg-danger-light/30' : 'border-border'
            }`}
          >
            <div className="mt-0.5">
              {isCritical ? (
                <AlertCircle className="w-5 h-5 text-danger" />
              ) : toast.type === 'status_update' ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <Info className="w-5 h-5 text-info" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-text">{toast.title}</h4>
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{toast.message}</p>
              {toast.link && (
                <Link
                  to={toast.link}
                  onClick={() => removeToast(toast.id)}
                  className="inline-block mt-1 text-xs font-semibold text-primary hover:underline"
                >
                  View Details →
                </Link>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
