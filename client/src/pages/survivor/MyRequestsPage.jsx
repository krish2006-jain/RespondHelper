import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestAPI } from '../../api/requests';
import { Badge } from '../../components/common/Badge';
import { formatTimeAgo } from '../../utils/formatters';
import {
  ListOrdered,
  PlusCircle,
  MapPin,
  Clock,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, resolved, cancelled
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await requestAPI.getAll();
        setRequests(res.data?.requests || []);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'active') {
      return !['Resolved', 'Cancelled', 'Rejected'].includes(r.status);
    }
    if (filter === 'resolved') {
      return r.status === 'Resolved';
    }
    if (filter === 'cancelled') {
      return r.status === 'Cancelled' || r.status === 'Rejected';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">My Emergency Requests</h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Track live dispatch status and view historical emergency reports.
          </p>
        </div>
        <Link
          to="/survivor/request/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Help Request</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'active', label: 'Active / Dispatched' },
          { id: 'resolved', label: 'Resolved' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              filter === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-text-muted hover:bg-slate-100 hover:text-text border border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-muted text-sm">
          Loading your emergency requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-text">No requests found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            You do not have any requests in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRequests.map((req) => (
            <Link
              key={req._id}
              to={`/survivor/requests/${req._id}`}
              className="block p-5 rounded-2xl bg-white border border-border hover:border-primary hover:shadow-card transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge type="priority">{req.priority}</Badge>
                    <Badge type="status">{req.status}</Badge>
                    {req.isSOS && (
                      <span className="text-[10px] font-bold bg-danger text-white px-2 py-0.5 rounded-full uppercase">
                        SOS
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-text">{req.title || req.category}</h3>
                  <p className="text-xs text-text-muted flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {req.address}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatTimeAgo(req.createdAt)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                  {req.assignedTo?.responderName ? (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-text-muted block">
                        Assigned Responder
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {req.assignedTo.responderName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium border border-amber-200">
                      Pending Dispatch
                    </span>
                  )}
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
