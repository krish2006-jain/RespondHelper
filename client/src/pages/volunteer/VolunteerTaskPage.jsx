import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestAPI } from '../../api/requests';
import { volunteerAPI } from '../../api/volunteers';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { MapView } from '../../components/map/MapView';
import {
  MapPin,
  PhoneCall,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';

const TASK_STATUS_ORDER = [
  'Accepted',
  'On the Way',
  'Arrived',
  'Assistance Provided',
  'Completed',
];

export const VolunteerTaskPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [currentTaskStatus, setCurrentTaskStatus] = useState('Accepted');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const fetchTaskDetails = async () => {
    try {
      const res = await requestAPI.getById(id);
      setRequest(res.data);
      // Derive current step
      if (res.data.status === 'In Progress') setCurrentTaskStatus('On the Way');
      else if (res.data.status === 'Delivered') setCurrentTaskStatus('Assistance Provided');
      else if (res.data.status === 'Resolved') setCurrentTaskStatus('Completed');
    } catch (err) {
      setError(err.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const currentIndex = TASK_STATUS_ORDER.indexOf(currentTaskStatus);
  const nextStatus = currentIndex < TASK_STATUS_ORDER.length - 1 ? TASK_STATUS_ORDER[currentIndex + 1] : null;

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await volunteerAPI.updateTaskStatus(id, { status: nextStatus });
      setCurrentTaskStatus(nextStatus);
      if (nextStatus === 'Completed') {
        alert('🎉 Mission Completed! Thank you for assisting a citizen in distress.');
        navigate('/volunteer');
      } else {
        fetchTaskDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to update mission status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeclineTask = async () => {
    const reason = window.prompt('Please enter a short reason for releasing this mission:');
    if (!reason) return;
    try {
      await volunteerAPI.declineTask(id, reason);
      navigate('/volunteer');
    } catch (err) {
      alert(err.message || 'Failed to decline task');
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-muted text-sm">
        Loading active emergency mission...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
        <h3 className="text-base font-bold text-text">Mission not found</h3>
        <Button variant="secondary" onClick={() => navigate('/volunteer')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const coords = request.location?.coordinates || [72.8777, 19.0760];
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/volunteer')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-text-muted hover:text-text"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Volunteer Dashboard
        </button>

        <button
          onClick={handleDeclineTask}
          className="text-xs font-bold text-danger hover:underline flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Release Mission
        </button>
      </div>

      {/* Main Mission Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-primary/30 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge type="priority">{request.priority}</Badge>
              <Badge variant="primary">{currentTaskStatus}</Badge>
              {request.isSOS && (
                <span className="text-[10px] font-bold bg-danger text-white px-2 py-0.5 rounded-full uppercase">
                  SOS Mission
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight pt-1">
              {request.title || request.category}
            </h1>
            <p className="text-xs sm:text-sm text-text-muted flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{request.address}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {request.survivorId?.phone && (
              <a
                href={`tel:${request.survivorId.phone}`}
                className="flex items-center justify-center gap-2 bg-success hover:bg-success-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call ({request.survivorId.name})</span>
              </a>
            )}

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-info hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Open Navigation GPS</span>
            </a>
          </div>
        </div>

        {/* Live Map Preview */}
        <MapView
          center={[coords[1], coords[0]]}
          entities={{ requests: [request] }}
          height="240px"
          zoom={14}
        />

        {/* Big Stepper Button */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-border space-y-4 text-center">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
              Mission Progress Stepper
            </span>
            <p className="text-sm font-semibold text-text">
              Current Stage: <span className="text-primary font-bold">{currentTaskStatus}</span>
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
            {TASK_STATUS_ORDER.map((step, idx) => {
              const isDone = idx <= currentIndex;
              return (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    isDone ? 'bg-primary' : 'bg-slate-200'
                  }`}
                  title={step}
                />
              );
            })}
          </div>

          {nextStatus ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full max-w-md mx-auto font-extrabold text-base shadow-md py-4"
              onClick={handleAdvanceStatus}
              isLoading={updating}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Advance Mission to "{nextStatus}"
            </Button>
          ) : (
            <div className="p-3 bg-success-light text-success font-bold text-sm rounded-xl">
              ✓ Mission has been successfully completed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
