import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestAPI } from '../../api/requests';
import { QuickSOSButton } from '../../components/emergency/QuickSOSButton';
import { SOSModal } from '../../components/emergency/SOSModal';
import { Badge } from '../../components/common/Badge';
import { formatTimeAgo } from '../../utils/formatters';
import {
  PlusCircle,
  Home,
  HeartPulse,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const SurvivorDashboard = () => {
  const { user } = useAuth();
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveRequests = async () => {
      try {
        const res = await requestAPI.getAll({ limit: 5 });
        setActiveRequests(res.data?.requests || []);
      } catch (err) {
        console.error('Failed to load survivor requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRequests();
  }, []);

  return (
    <div className="space-y-8">
      {/* 1. Giant SOS Action */}
      <QuickSOSButton onClick={() => setIsSOSOpen(true)} />

      {/* 2. Quick Action Tiles (3-tap shortcuts) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
          Quick Disaster Services
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          <Link
            to="/survivor/request/new"
            className="p-4 rounded-2xl bg-white border border-border hover:border-primary hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="p-3 rounded-xl bg-primary-subtle text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-2">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text">Raise Help Request</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Medicine, Food, Rescue</p>
          </Link>

          <Link
            to="/map?type=shelters"
            className="p-4 rounded-2xl bg-white border border-border hover:border-shelter hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="p-3 rounded-xl bg-shelter-light text-shelter group-hover:bg-shelter group-hover:text-white transition-colors mb-2">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text">Find Safe Shelter</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Check Live Vacancies</p>
          </Link>

          <Link
            to="/survivor/request/new?category=Medical+Assistance"
            className="p-4 rounded-2xl bg-white border border-border hover:border-danger hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="p-3 rounded-xl bg-danger-light text-danger group-hover:bg-danger group-hover:text-white transition-colors mb-2">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text">Medical Aid</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Doctor & First Aid</p>
          </Link>

          <Link
            to="/map"
            className="p-4 rounded-2xl bg-white border border-border hover:border-accent hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="p-3 rounded-xl bg-accent-light text-accent-hover group-hover:bg-accent group-hover:text-white transition-colors mb-2">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text">Emergency Map</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Relief Points Near You</p>
          </Link>
        </div>
      </div>

      {/* 3. Your Active Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-text tracking-tight">
            Your Active Emergency Requests
          </h2>
          <Link to="/survivor/requests" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All Requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-border text-center text-text-muted text-sm">
            Loading your requests...
          </div>
        ) : activeRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-success mx-auto" />
            <h4 className="font-bold text-base text-text">No active emergencies reported</h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              If you or someone nearby is in danger, use the big red SOS button or submit a help request.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests.map((req) => (
              <Link
                key={req._id}
                to={`/survivor/requests/${req._id}`}
                className="block p-4 sm:p-5 rounded-2xl bg-white border border-border hover:border-primary hover:shadow-card transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge type="priority">{req.priority}</Badge>
                      <Badge type="status">{req.status}</Badge>
                      {req.isSOS && (
                        <span className="text-[10px] font-bold bg-danger text-white px-2 py-0.5 rounded-full uppercase">
                          SOS
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-text pt-0.5">{req.title || req.category}</h4>
                    <p className="text-xs text-text-muted flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{req.address}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimeAgo(req.createdAt)}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
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
                        Awaiting Dispatch
                      </span>
                    )}
                    <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      Track Live →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </div>
  );
};
