import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { requestAPI } from '../../api/requests';
import { useSocket } from '../../context/SocketContext';
import { RequestTimeline } from '../../components/emergency/RequestTimeline';
import { MapView } from '../../components/map/MapView';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDateTime } from '../../utils/formatters';
import {
  MapPin,
  PhoneCall,
  User,
  Users,
  Clock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Share2,
} from 'lucide-react';

export const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchRequestDetails = async () => {
    try {
      const res = await requestAPI.getById(id);
      setRequest(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Real-time socket listener for status change & live updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:request', id);

    const handleStatusChanged = (data) => {
      if (data.requestId === id) {
        fetchRequestDetails();
      }
    };

    const handleTaskUpdated = (data) => {
      if (data.requestId === id) {
        fetchRequestDetails();
      }
    };

    socket.on('request:status_changed', handleStatusChanged);
    socket.on('task:status_updated', handleTaskUpdated);

    return () => {
      socket.emit('leave:request', id);
      socket.off('request:status_changed', handleStatusChanged);
      socket.off('task:status_updated', handleTaskUpdated);
    };
  }, [socket, id]);

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this emergency help request?')) return;
    setCancelLoading(true);
    try {
      await requestAPI.cancel(id, 'Cancelled by user');
      fetchRequestDetails();
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-muted text-sm">
        Loading emergency status & live tracking...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h3 className="text-base font-bold text-text">Error loading request</h3>
        <p className="text-xs text-text-muted">{error || 'Request does not exist.'}</p>
        <Button variant="secondary" onClick={() => navigate('/survivor/requests')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Requests
        </Button>
      </div>
    );
  }

  const canCancel = request.status === 'Submitted' || request.status === 'Verified';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/survivor/requests')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-text-muted hover:text-text"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Requests
        </button>

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="text-danger border-danger/30 hover:bg-danger-light text-xs"
            onClick={handleCancelRequest}
            isLoading={cancelLoading}
          >
            <XCircle className="w-4 h-4 mr-1.5" /> Cancel Request
          </Button>
        )}
      </div>

      {/* Main Request Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge type="priority">{request.priority}</Badge>
              <Badge type="status">{request.status}</Badge>
              {request.isSOS && (
                <span className="text-[10px] font-bold bg-danger text-white px-2 py-0.5 rounded-full uppercase">
                  Critical SOS
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight pt-1">
              {request.title || request.category}
            </h1>
            <p className="text-xs sm:text-sm text-text-muted flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{request.address}</span>
            </p>
          </div>

          <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-border">
            <span className="text-xs text-text-muted block">People in Need</span>
            <span className="text-xl font-extrabold text-text">{request.peopleAffected}</span>
          </div>
        </div>

        {request.description && (
          <p className="text-sm text-text-muted bg-slate-50 p-4 rounded-xl border border-border">
            {request.description}
          </p>
        )}

        {/* Media proofs */}
        {request.media?.length > 0 && (
          <div>
            <span className="text-xs font-bold uppercase text-text-muted block mb-2">
              Attached Media Proof
            </span>
            <div className="flex flex-wrap gap-3">
              {request.media.map((m, idx) => (
                <a
                  key={idx}
                  href={`http://localhost:5000${m.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-24 h-24 rounded-xl overflow-hidden border border-border block hover:opacity-90"
                >
                  <img
                    src={`http://localhost:5000${m.url}`}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Vertical Timeline Stepper */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card">
          <RequestTimeline status={request.status} statusHistory={request.statusHistory} />
        </div>

        {/* Right Column: Assigned Responder Card & Map Route */}
        <div className="lg:col-span-5 space-y-6">
          {/* Assigned Responder Box */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
              Assigned First Responder
            </h3>

            {request.assignedTo?.responderId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
                    {request.assignedTo.responderName?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text">
                      {request.assignedTo.responderName}
                    </h4>
                    <span className="text-xs font-semibold uppercase text-primary bg-primary-subtle px-2 py-0.5 rounded-full">
                      {request.assignedTo.responderRole}
                    </span>
                  </div>
                </div>

                {request.assignedTo.responderPhone && (
                  <a
                    href={`tel:${request.assignedTo.responderPhone}`}
                    className="flex items-center justify-center gap-2 w-full bg-success hover:bg-success-dark text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Responder ({request.assignedTo.responderPhone})</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-600 mx-auto animate-pulse" />
                <h4 className="font-bold text-sm text-amber-900">Matching Nearby Responders</h4>
                <p className="text-xs text-amber-800">
                  Our dispatch engine is notifying verified volunteers and NGOs with suitable medicine/supplies.
                </p>
              </div>
            )}
          </div>

          {/* Mini Map Preview */}
          <div className="bg-white p-3 rounded-2xl border border-border shadow-card">
            <MapView
              center={[request.location.coordinates[1], request.location.coordinates[0]]}
              entities={{ requests: [request] }}
              height="220px"
              zoom={13}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
