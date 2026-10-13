import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { volunteerAPI } from '../../api/volunteers';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatDistance, formatTimeAgo } from '../../utils/formatters';
import {
  CheckCircle2,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  PhoneCall,
} from 'lucide-react';

export const VolunteerDashboard = () => {
  const { user, profile, isVerified } = useAuth();
  const [isAvailable, setIsAvailable] = useState(profile?.isAvailable ?? true);
  const [activeTasks, setActiveTasks] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [nearbyRes, tasksRes] = await Promise.all([
        volunteerAPI.getNearbyRequests(),
        volunteerAPI.getActiveTasks(),
      ]);
      setNearbyRequests(nearbyRes.data?.requests || []);
      setActiveTasks(tasksRes.data || []);
      if (nearbyRes.data?.profile?.isAvailable !== undefined) {
        setIsAvailable(nearbyRes.data.profile.isAvailable);
      }
    } catch (err) {
      console.error('Failed to load volunteer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleAvailability = async () => {
    setToggleLoading(true);
    try {
      const res = await volunteerAPI.toggleAvailability(!isAvailable);
      setIsAvailable(res.data.isAvailable);
    } catch (err) {
      alert(err.message || 'Failed to toggle availability');
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with Big Availability Toggle */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Volunteer Control Panel
            </span>
            {isVerified() && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full border border-success/30">
                <CheckCircle2 className="w-3 h-3" /> Verified Responder
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Skills: {profile?.skills?.join(', ') || 'First Aid'} • Service Radius: {profile?.serviceRadiusKm || 25} km
          </p>
        </div>

        {/* Big Availability Switch */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-border">
          <div className="text-right">
            <span className="block text-xs font-bold text-text">
              {isAvailable ? 'Ready for Dispatch' : 'Unavailable'}
            </span>
            <span className="text-[10px] text-text-muted">
              {isAvailable ? 'Receiving emergency alerts' : 'Paused missions'}
            </span>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={toggleLoading}
            className={`p-1.5 rounded-xl transition-all ${
              isAvailable ? 'text-success bg-success-light' : 'text-slate-400 bg-slate-200'
            }`}
          >
            {isAvailable ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Missions"
          value={activeTasks.length}
          color="danger"
          icon={AlertTriangle}
          subtext="Simultaneous capacity: max 2"
        />
        <StatCard
          title="Missions Completed"
          value={profile?.totalTasksCompleted || 14}
          color="success"
          icon={CheckCircle2}
          subtext="Verified crisis resolutions"
        />
        <StatCard
          title="Citizens Assisted"
          value={profile?.peopleHelpedCount || 38}
          color="primary"
          icon={Users}
          subtext="Lives impacted in distress"
        />
      </div>

      {/* 3. Active Mission In-Progress */}
      {activeTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-extrabold text-text tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
            <span>Active Mission in Progress</span>
          </h2>

          <div className="space-y-3">
            {activeTasks.map((assignment) => {
              const req = assignment.requestId;
              if (!req) return null;
              return (
                <div
                  key={assignment._id}
                  className="bg-danger-light/20 p-5 sm:p-6 rounded-2xl border-2 border-danger/30 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge type="priority">{req.priority}</Badge>
                      <Badge variant="danger">{assignment.status}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-text">{req.title || req.category}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-danger" />
                      <span>{req.address}</span>
                      <span>•</span>
                      <span>Survivor: <strong>{req.survivorId?.name}</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/volunteer/tasks/${req._id}`}
                      className="bg-danger hover:bg-danger-dark text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
                    >
                      Continue Mission →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Nearby Emergency Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-text tracking-tight">
            Nearby Emergency Calls ({nearbyRequests.length})
          </h2>
          <Link to="/volunteer/nearby" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View List & Map <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {nearbyRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-success mx-auto" />
            <h4 className="font-bold text-sm text-text">No urgent nearby requests</h4>
            <p className="text-xs text-text-muted">
              All active emergencies in your {profile?.serviceRadiusKm || 25} km zone are currently handled.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyRequests.slice(0, 4).map((item) => {
              const req = item.request;
              return (
                <div
                  key={req._id}
                  className="p-5 rounded-2xl bg-white border border-border hover:border-primary shadow-card space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge type="priority">{req.priority}</Badge>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.matchLabel === 'Great'
                              ? 'bg-success-light text-success border-success/30'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {item.matchLabel} Match
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-primary">
                        {formatDistance(item.distanceKm)}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-text">{req.category}</h4>
                    <p className="text-xs text-text-muted line-clamp-2">{req.description || req.address}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-text-muted">
                      Affects: <strong className="text-text">{req.peopleAffected}</strong>
                    </span>
                    <Link
                      to={`/volunteer/nearby?requestId=${req._id}`}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      Respond to Call →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
