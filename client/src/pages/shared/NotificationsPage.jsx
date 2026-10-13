import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { formatTimeAgo } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">
            Notifications & Broadcasts
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Live alerts regarding your emergency requests, assignments, and crisis status updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllAsRead} className="font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-success" /> Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center space-y-3 shadow-card">
          <ShieldCheck className="w-12 h-12 text-success mx-auto" />
          <h3 className="text-base font-bold text-text">You're all caught up!</h3>
          <p className="text-xs text-text-muted">
            No new notifications or critical announcements at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isCritical = n.priority === 'critical' || n.type === 'emergency';
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markAsRead(n._id)}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  !n.isRead
                    ? 'bg-white border-primary shadow-sm ring-1 ring-primary/20'
                    : 'bg-white/80 border-border opacity-85'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-1">
                    {isCritical ? (
                      <AlertCircle className="w-5 h-5 text-danger" />
                    ) : (
                      <Bell className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-text-muted flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3" /> {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>

                {n.link && (
                  <Link
                    to={n.link}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-center whitespace-nowrap"
                  >
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
