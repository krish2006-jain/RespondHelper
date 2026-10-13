import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { volunteerAPI } from '../../api/volunteers';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { MapView } from '../../components/map/MapView';
import { formatDistance, formatTimeAgo } from '../../utils/formatters';
import {
  MapPin,
  Clock,
  Check,
  X,
  List,
  Map as MapIcon,
  ShieldAlert,
  AlertCircle,
  Users,
} from 'lucide-react';

export const NearbyRequestsPage = () => {
  const { isVerified } = useAuth();
  const navigate = useNavigate();
  const queryParamId = new URLSearchParams(useLocation().search).get('requestId');

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [error, setError] = useState(null);

  const fetchNearby = async () => {
    try {
      const res = await volunteerAPI.getNearbyRequests();
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load nearby requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, []);

  const handleAcceptTask = async (requestId) => {
    if (!isVerified()) {
      alert('Your volunteer account is pending admin verification. You cannot accept tasks yet.');
      return;
    }

    setActionLoadingId(requestId);
    try {
      await volunteerAPI.acceptTask(requestId);
      navigate(`/volunteer/tasks/${requestId}`);
    } catch (err) {
      alert(err.message || 'Failed to accept task');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineTask = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await volunteerAPI.declineTask(requestId, 'Volunteer declined');
      setRequests(requests.filter((item) => item.request._id !== requestId));
    } catch (err) {
      alert(err.message || 'Failed to decline task');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">
            Nearby Emergency Calls ({requests.length})
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Emergency requests within your service radius, ranked by distance and skill match.
          </p>
        </div>

        {/* View Toggle Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-border shadow-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <List className="w-4 h-4" /> List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Map View
          </button>
        </div>
      </div>

      {!isVerified() && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-700" />
          <span>
            <strong>Account Verification Pending:</strong> You can view emergencies in your area, but you must be verified by an administrator before you can accept missions.
          </span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-muted text-sm">
          Searching for nearby emergency signals...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-success mx-auto" />
          <h3 className="text-base font-bold text-text">No pending emergencies nearby</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            You will be alerted instantly when someone in your service radius asks for help.
          </p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="bg-white p-3 rounded-2xl border border-border shadow-card space-y-3">
          <MapView
            entities={{ requests: requests.map((item) => item.request) }}
            height="550px"
            zoom={12}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((item) => {
            const req = item.request;
            const isHighlighted = queryParamId === req._id;

            return (
              <div
                key={req._id}
                className={`p-5 sm:p-6 rounded-2xl bg-white border-2 transition-all space-y-4 shadow-card ${
                  isHighlighted ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge type="priority">{req.priority}</Badge>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          item.matchLabel === 'Great'
                            ? 'bg-success-light text-success-dark border-success/30'
                            : item.matchLabel === 'Good'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {item.matchLabel} Match
                      </span>
                      {req.isSOS && (
                        <span className="text-[10px] font-bold bg-danger text-white px-2 py-0.5 rounded-full">
                          SOS
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-text pt-0.5">{req.title || req.category}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <MapPin className="w-3.5 h-3.5" /> {formatDistance(item.distanceKm)}
                      </span>
                      <span>•</span>
                      <span>{req.address}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatTimeAgo(req.createdAt)}
                      </span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-border text-center sm:text-right min-w-[120px]">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">People Affected</span>
                    <span className="text-lg font-extrabold text-text">{req.peopleAffected}</span>
                  </div>
                </div>

                {req.description && (
                  <p className="text-xs text-text-muted bg-slate-50/80 p-3 rounded-xl border border-border">
                    {req.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeclineTask(req._id)}
                    disabled={actionLoadingId === req._id}
                    className="text-text-muted hover:text-danger text-xs"
                  >
                    <X className="w-4 h-4 mr-1" /> Decline
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleAcceptTask(req._id)}
                    isLoading={actionLoadingId === req._id}
                    className="font-bold text-xs sm:text-sm px-6"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Accept Mission
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
