import React from 'react';
import { formatDateTime } from '../../utils/formatters';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';

const LIFECYCLE_STEPS = ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Delivered', 'Resolved'];

export const RequestTimeline = ({ status, statusHistory = [] }) => {
  const isCancelled = status === 'Cancelled' || status === 'Rejected';
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(status);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
        Emergency Lifecycle & Audit Log
      </h3>

      {isCancelled ? (
        <div className="p-4 rounded-xl bg-danger-light border border-danger/30 text-danger flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Request {status}</h4>
            <p className="text-xs text-danger/80 mt-0.5">
              This emergency request has been marked as {status.toLowerCase()}.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const historyItem = statusHistory.find((h) => h.status === step);

            return (
              <div key={step} className="relative flex items-start gap-3.5">
                {/* Node marker */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-success text-white border-success'
                      : isCurrent
                      ? 'bg-accent text-white border-accent ring-4 ring-accent/20 animate-pulse'
                      : 'bg-white text-slate-300 border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </div>

                {/* Step details */}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-accent-hover font-extrabold'
                          : isCompleted
                          ? 'text-text font-semibold'
                          : 'text-text-muted'
                      }`}
                    >
                      {step}
                    </span>
                    {historyItem?.timestamp && (
                      <span className="text-[11px] text-text-muted font-medium">
                        {formatDateTime(historyItem.timestamp)}
                      </span>
                    )}
                  </div>

                  {historyItem && (
                    <div className="mt-1 text-xs text-text-muted bg-slate-50 p-2.5 rounded-lg border border-border">
                      <p className="font-medium text-text">{historyItem.note || 'Status updated'}</p>
                      {historyItem.updatedByName && (
                        <p className="text-[11px] text-text-muted mt-0.5">
                          By: <span className="font-semibold">{historyItem.updatedByName}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
