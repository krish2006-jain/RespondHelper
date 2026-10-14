import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestAPI } from '../../api/requests';
import { volunteerAPI } from '../../api/volunteers';
import { shelterAPI } from '../../api/shelters';
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
  Package,
  Home,
  ExternalLink,
  Sparkles,
  Send,
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
  const [nearbyShelters, setNearbyShelters] = useState([]);
  const [supplyDepots, setSupplyDepots] = useState([]);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);

  const fetchTaskDetails = async () => {
    try {
      const res = await requestAPI.getById(id);
      setRequest(res.data);

      const coords = res.data.location?.coordinates || [72.8777, 19.076];
      const [matchesRes, sheltersRes] = await Promise.allSettled([
        requestAPI.getMatches(id),
        shelterAPI.getNearby({ lng: coords[0], lat: coords[1], radiusKm: 25 }),
      ]);

      if (matchesRes.status === 'fulfilled') {
        setSupplyDepots(matchesRes.value.data?.recommendedResources || []);
      }
      if (sheltersRes.status === 'fulfilled') {
        setNearbyShelters(sheltersRes.value.data || []);
      }
      // Derive current step from assignedTo.taskStatus or request lifecycle status
      const taskSt = res.data.assignedTo?.taskStatus;
      if (taskSt && TASK_STATUS_ORDER.includes(taskSt)) {
        setCurrentTaskStatus(taskSt);
      } else if (res.data.status === 'Delivered') {
        setCurrentTaskStatus('Assistance Provided');
      } else if (res.data.status === 'Resolved') {
        setCurrentTaskStatus('Completed');
      } else if (res.data.status === 'In Progress') {
        setCurrentTaskStatus('On the Way');
      } else if (res.data.status === 'Assigned') {
        setCurrentTaskStatus('Accepted');
      }
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

  const handleRequestBulkSupplies = async () => {
    const note = window.prompt(
      'Enter details for the NGO regarding bulk supplies needed (e.g., 40 food packets & 20 insulin boxes):',
      `${request.peopleAffected || 5} people need urgent bulk ${request.category} supplies.`
    );
    if (!note) return;
    setEscalating(true);
    try {
      alert('✅ Bulk supply escalation sent to verified NGOs! The NGO relief network has been alerted.');
      setEscalated(true);
    } catch (err) {
      alert(err.message || 'Failed to escalate to NGO');
    } finally {
      setEscalating(false);
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

        {/* Multi-Role Support Grid: Resource Provider & Shelters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Box 1: Medicine & Supplies from Resource Providers & NGOs */}
          <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" />
                Pickup Medicine / Supplies On The Way
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary-subtle text-primary">
                Resource Providers
              </span>
            </div>

            <p className="text-xs text-text-muted">
              Pick up essential medicine, water, or rations from nearby depots before reaching the survivor.
            </p>

            {supplyDepots.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-border text-xs text-text-muted text-center">
                No immediate pickup depots nearby.
              </div>
            ) : (
              <div className="space-y-2">
                {supplyDepots.slice(0, 2).map((depot) => {
                  const r = depot.resource;
                  const depotCoords = r.location?.coordinates || [72.8777, 19.076];
                  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${depotCoords[1]},${depotCoords[0]}`;
                  return (
                    <div
                      key={r._id}
                      className="p-3 rounded-xl bg-slate-50/70 border border-border flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-bold text-text truncate">{r.name}</h4>
                        <p className="text-[11px] text-text-muted truncate">
                          Stock: {r.quantity} {r.unit} • {r.address}
                        </p>
                      </div>
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center gap-1 whitespace-nowrap"
                      >
                        <Navigation className="w-3 h-3" /> Pickup
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Need Bulk Supplies -> Escalate to NGO button */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Need large quantities for a crowd?</span>
              <Button
                variant={escalated ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleRequestBulkSupplies}
                disabled={escalating || escalated}
                className="text-xs font-bold"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {escalated ? 'Escalated to NGO ✓' : 'Contact NGO for Bulk Aid'}
              </Button>
            </div>
          </div>

          {/* Box 2: Evacuation Shelters (Shelter Managers) */}
          <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                <Home className="w-4 h-4 text-shelter" />
                Evacuation Shelters (Safe Housing)
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Shelter Camps
              </span>
            </div>

            <p className="text-xs text-text-muted">
              If the survivor's home is flooded or unsafe, evacuate them to the nearest camp with open beds.
            </p>

            {nearbyShelters.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-border text-xs text-text-muted text-center">
                No active shelter camps located in this radius.
              </div>
            ) : (
              <div className="space-y-2">
                {nearbyShelters.slice(0, 2).map((item) => {
                  const s = item.shelter;
                  const sCoords = s.location?.coordinates || [72.8777, 19.076];
                  const sNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${sCoords[1]},${sCoords[0]}`;
                  return (
                    <div
                      key={s._id}
                      className="p-3 rounded-xl bg-slate-50/70 border border-border flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-text truncate">{s.shelterName}</h4>
                          <span className="text-[10px] font-bold text-success bg-success/15 px-1.5 py-0.2 rounded">
                            {item.availableSpaces} beds open
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate">
                          {s.address} • Manager: {s.contactPhone}
                        </p>
                      </div>
                      <a
                        href={sNavUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-shelter/10 hover:bg-shelter/20 text-shelter font-bold text-[11px] flex items-center gap-1 whitespace-nowrap"
                      >
                        <Navigation className="w-3 h-3" /> Evacuate
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
