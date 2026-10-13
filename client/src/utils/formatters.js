import { formatDistanceToNow, format } from 'date-fns';

export const formatTimeAgo = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (e) {
    return '';
  }
};

export const formatDateTime = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'MMM d, yyyy • h:mm a');
  } catch (e) {
    return '';
  }
};

export const formatDistance = (km) => {
  if (km == null) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
};

export const getPriorityClass = (priority) => {
  switch (priority) {
    case 'Critical':
      return 'bg-danger-light text-danger border-danger/30';
    case 'High':
      return 'bg-warning-light text-warning border-warning/30';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const getStatusClass = (status) => {
  switch (status) {
    case 'Submitted':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'Verified':
      return 'bg-info-light text-info border-info/30';
    case 'Assigned':
      return 'bg-primary-subtle text-primary border-primary/30';
    case 'In Progress':
      return 'bg-accent-light text-accent-hover border-accent/40';
    case 'Delivered':
    case 'Resolved':
      return 'bg-success-light text-success-dark border-success/30';
    case 'Cancelled':
    case 'Rejected':
      return 'bg-danger-light text-danger border-danger/30';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};
