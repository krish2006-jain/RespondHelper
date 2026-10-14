import React, { useState, useEffect } from 'react';
import { shelterAPI } from '../../api/shelters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { SHELTER_FACILITIES } from '../../utils/constants';
import {
  Home,
  Users,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  PhoneCall,
  Save,
  Check,
  X,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Bed,
  LogIn,
} from 'lucide-react';

export const ShelterDashboard = () => {
  const [shelter, setShelter] = useState(null);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionId, setActionId] = useState(null);

  // Decline Modal state
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('Shelter is currently at maximum capacity');

  // Bed allocation overrides per request
  const [bedOverrides, setBedOverrides] = useState({});

  const loadData = async () => {
    setLoadingRequests(true);
    try {
      const [shelterRes, reqRes] = await Promise.allSettled([
        shelterAPI.getMyShelter(),
        shelterAPI.getAssignedRequests(),
      ]);

      if (shelterRes.status === 'fulfilled') {
        setShelter(shelterRes.value.data);
      }
      if (reqRes.status === 'fulfilled') {
        setAssignedRequests(reqRes.value.data?.assignedRequests || []);
        setOpenRequests(reqRes.value.data?.openShelterRequests || []);
      }
    } catch (err) {
      console.error('Failed to load shelter dashboard:', err);
    } finally {
      setLoading(false);
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOccupancyDelta = async (delta) => {
    if (!shelter) return;
    setUpdating(true);
    try {
      const res = await shelterAPI.updateOccupancy(shelter._id, { delta });
      setShelter(res.data);
    } catch (err) {
      alert(err.message || 'Failed to update occupancy');
    } finally {
      setUpdating(false);
    }
  };

  const toggleFacility = async (facility) => {
    if (!shelter) return;
    const currentFacilities = shelter.facilities || [];
    const newFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter((f) => f !== facility)
      : [...currentFacilities, facility];

    try {
      const res = await shelterAPI.update(shelter._id, { facilities: newFacilities });
      setShelter(res.data);
    } catch (err) {
      alert(err.message || 'Failed to update facility');
    }
  };

  const handleAccept = async (reqItem) => {
    setActionId(reqItem._id);
    try {
      await shelterAPI.acceptRequest(reqItem._id);
      alert(`Emergency shelter request accepted for ${reqItem.survivorId?.name || 'evacuee'}!`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to accept shelter request');
    } finally {
      setActionId(null);
    }
  };

  const handleAllocate = async (reqItem) => {
    const beds = bedOverrides[reqItem._id] || reqItem.peopleAffected || 1;
    setActionId(reqItem._id);
    try {
      const res = await shelterAPI.allocateBeds(reqItem._id, { bedsAllocated: beds });
      alert(res.message || `Successfully admitted evacuee(s) and allocated ${beds} bed(s)!`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to allocate shelter beds');
    } finally {
      setActionId(null);
    }
  };

  const openDeclineModal = (reqItem) => {
    setDeclineTarget(reqItem);
    setDeclineReason('Shelter is currently at maximum capacity');
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!declineTarget) return;
    setActionId(declineTarget._id);
    try {
      await shelterAPI.declineRequest(declineTarget._id, { reason: declineReason });
      alert('Request declined and returned to dispatch queue for reassignment.');
      setDeclineModalOpen(false);
      setDeclineTarget(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to decline request');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-muted text-sm">
        Loading shelter control panel...
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-3">
        <Home className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-text">No shelter registered</h3>
      </div>
    );
  }

  const occupancyRate = Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100);
  const availableBeds = Math.max(0, shelter.totalCapacity - shelter.currentOccupancy);

  // Partition assigned requests into:
  // 1. Pending Admission / Check-in
  // 2. Admitted / In-House Evacuees
  const pendingRequests = assignedRequests.filter(
    (r) => r.status === 'Assigned' || r.status === 'In Progress'
  );
  const admittedRequests = assignedRequests.filter(
    (r) => r.status === 'Resolved' || r.status === 'Delivered'
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Shelter Command Desk
            </span>
            <Badge
              variant={
                shelter.status === 'Full'
                  ? 'danger'
                  : shelter.status === 'Almost Full'
                  ? 'warning'
                  : 'success'
              }
            >
              {shelter.status}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {shelter.shelterName}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted flex items-center gap-2">
            <MapPin className="w-4 h-4 text-shelter" />
            <span>{shelter.address}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right bg-slate-50 p-3.5 rounded-xl border border-border">
            <span className="text-xs text-text-muted block">Direct Contact</span>
            <span className="text-sm font-bold text-text">{shelter.contactPhone}</span>
          </div>
          <button
            onClick={loadData}
            title="Refresh dashboard data"
            className="p-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-text-muted hover:text-text transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRequests ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Bed Capacity"
          value={shelter.totalCapacity}
          color="shelter"
          icon={Home}
          subtext="Certified evacuee limit"
        />
        <StatCard
          title="Current Occupancy"
          value={shelter.currentOccupancy}
          color={occupancyRate >= 90 ? 'danger' : 'warning'}
          icon={Users}
          subtext={`${occupancyRate}% occupied`}
        />
        <StatCard
          title="Vacant Spaces Available"
          value={availableBeds}
          color="success"
          icon={CheckCircle2}
          subtext="Ready for arrivals"
        />
      </div>

      {/* Evacuee Capacity Management Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card space-y-6">
        <h2 className="text-lg font-extrabold text-text tracking-tight">
          Live Evacuee Capacity Management
        </h2>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-text-muted">
            <span>{shelter.currentOccupancy} Occupied</span>
            <span className="text-success font-extrabold">{availableBeds} Beds Vacant</span>
            <span>{shelter.totalCapacity} Total Max</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-border">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                occupancyRate >= 90
                  ? 'bg-danger'
                  : occupancyRate >= 75
                  ? 'bg-warning'
                  : 'bg-success'
              }`}
              style={{ width: `${Math.min(100, occupancyRate)}%` }}
            />
          </div>
        </div>

        {/* Fast Adjust Action Bar */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-text">Manual Bed Adjuster</h4>
            <p className="text-xs text-text-muted">
              Quickly fine-tune capacity during group arrivals or departures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOccupancyDelta(-10)}
              disabled={updating || shelter.currentOccupancy <= 0}
              className="px-3.5 py-2 rounded-xl bg-white border border-border hover:bg-slate-100 font-bold text-xs shadow-xs"
            >
              -10
            </button>
            <button
              onClick={() => handleOccupancyDelta(-1)}
              disabled={updating || shelter.currentOccupancy <= 0}
              className="p-2.5 rounded-xl bg-white border border-border hover:bg-slate-100 font-bold text-xs shadow-xs"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-extrabold text-text px-3 tabular-nums">
              {shelter.currentOccupancy}
            </span>
            <button
              onClick={() => handleOccupancyDelta(1)}
              disabled={updating || shelter.currentOccupancy >= shelter.totalCapacity}
              className="p-2.5 rounded-xl bg-white border border-border hover:bg-slate-100 font-bold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOccupancyDelta(10)}
              disabled={updating || shelter.currentOccupancy >= shelter.totalCapacity}
              className="px-3.5 py-2 rounded-xl bg-white border border-border hover:bg-slate-100 font-bold text-xs shadow-xs"
            >
              +10
            </button>
          </div>
        </div>
      </div>

      {/* CORE FEATURE: Assigned Evacuee Shelter Requests & Admissions */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-text tracking-tight flex items-center gap-2">
              <Bed className="w-5 h-5 text-shelter" />
              Assigned Shelter & Evacuation Admissions
            </h2>
            <p className="text-xs text-text-muted">
              Review and allocate beds for evacuee requests assigned to your relief camp by the Command Center.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-shelter-light text-shelter">
            {pendingRequests.length} Pending Admission
          </span>
        </div>

        {/* Section A: Pending Requests Assigned by Admin */}
        {pendingRequests.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border bg-slate-50/50 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-text-muted">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <h4 className="text-sm font-bold text-text">All Assigned Evacuees Processed</h4>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              There are no pending evacuee assignments awaiting your review right now.
              When an Admin or Survivor assigns an emergency request to this shelter, it will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((reqItem) => {
              const survivor = reqItem.survivorId || {};
              const isActioning = actionId === reqItem._id;
              const bedsToAllocate = bedOverrides[reqItem._id] || reqItem.peopleAffected || 1;
              const isAccepted = reqItem.assignedTo?.taskStatus === 'Accepted' || reqItem.status === 'In Progress';

              return (
                <div
                  key={reqItem._id}
                  className="p-5 rounded-2xl border border-shelter/30 bg-purple-50/30 hover:border-shelter transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge type="priority">{reqItem.priority}</Badge>
                        <Badge type="status">{reqItem.status}</Badge>
                        {reqItem.isSOS && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-danger text-white">
                            SOS ALERT
                          </span>
                        )}
                        <span className="text-xs font-bold text-shelter bg-shelter-light px-2.5 py-0.5 rounded-md">
                          Needs {reqItem.peopleAffected || 1} Bed(s)
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-text pt-1">
                        {reqItem.title || `${reqItem.category} Emergency Accommodation`}
                      </h3>
                      <p className="text-xs text-text-muted flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-danger" />
                          {reqItem.address}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-text">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          {survivor.name || 'Survivor'} ({survivor.phone || 'No phone'})
                        </span>
                      </p>
                      {reqItem.description && (
                        <p className="text-xs text-text bg-white p-2.5 rounded-xl border border-border/80 mt-2">
                          "{reqItem.description}"
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <span className="text-[11px] text-text-muted">
                        Task Status:{' '}
                        <strong className="text-text">
                          {reqItem.assignedTo?.taskStatus || 'Assigned'}
                        </strong>
                      </span>
                      {survivor.phone && (
                        <a
                          href={`tel:${survivor.phone}`}
                          className="px-2.5 py-1 rounded-lg bg-white border border-border hover:bg-slate-50 text-[11px] font-bold text-text flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3 text-success" /> Call Survivor
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Allocation & Actions Bar */}
                  <div className="pt-3 border-t border-shelter/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text">Allocate Beds:</span>
                      <input
                        type="number"
                        min="1"
                        max={availableBeds || 100}
                        value={bedsToAllocate}
                        onChange={(e) =>
                          setBedOverrides({
                            ...bedOverrides,
                            [reqItem._id]: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-16 px-2 py-1 text-xs font-bold text-center rounded-lg border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-shelter"
                      />
                      <span className="text-xs text-text-muted">
                        (Remaining vacant: {availableBeds} beds)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Decline button */}
                      <button
                        type="button"
                        disabled={isActioning}
                        onClick={() => openDeclineModal(reqItem)}
                        className="px-3 py-1.5 rounded-xl border border-danger/30 hover:bg-danger/10 text-danger text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>

                      {/* Accept button (if not already accepted) */}
                      {!isAccepted && (
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() => handleAccept(reqItem)}
                          className="px-3.5 py-1.5 rounded-xl border border-primary/30 hover:bg-primary/10 text-primary text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Request
                        </button>
                      )}

                      {/* Allocate Beds & Check-In button */}
                      <Button
                        size="sm"
                        disabled={isActioning || availableBeds < bedsToAllocate}
                        onClick={() => handleAllocate(reqItem)}
                        className="text-xs font-bold bg-shelter hover:bg-shelter/90 border-transparent text-white flex items-center gap-1.5 shadow-sm"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        {isActioning
                          ? 'Admitting...'
                          : `Allocate & Check-in (${bedsToAllocate} Bed${bedsToAllocate > 1 ? 's' : ''}) →`}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section B: Currently Admitted In-House Evacuees */}
        {admittedRequests.length > 0 && (
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Admitted Guests (Accommodated at {shelter.shelterName})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {admittedRequests.map((admitted) => (
                <div
                  key={admitted._id}
                  className="p-3.5 rounded-xl border border-border bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-text">
                      {admitted.survivorId?.name || 'Evacuee'} ({admitted.survivorId?.phone || 'No phone'})
                    </h5>
                    <p className="text-[11px] text-text-muted">
                      {admitted.peopleAffected || 1} Bed(s) Allocated • {admitted.address}
                    </p>
                  </div>
                  <Badge variant="success">Admitted</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shelter Facilities Checklist */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card space-y-4">
        <h2 className="text-lg font-extrabold text-text tracking-tight">Available Facilities & Amenities</h2>
        <p className="text-xs text-text-muted">
          Toggle verified provisions available to incoming displaced families. Broadcasts live across maps and the network.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SHELTER_FACILITIES.map((facility) => {
            const hasFacility = (shelter.facilities || []).includes(facility);
            return (
              <button
                key={facility}
                type="button"
                onClick={() => toggleFacility(facility)}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  hasFacility
                    ? 'border-shelter bg-shelter-light text-shelter font-bold'
                    : 'border-border bg-white text-text-muted hover:bg-slate-50'
                }`}
              >
                <span className="text-xs sm:text-sm">{facility}</span>
                {hasFacility && <CheckCircle2 className="w-4 h-4 text-shelter" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Decline Reason Modal */}
      <Modal
        isOpen={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline Shelter Assignment"
        maxWidth="max-w-md"
      >
        {declineTarget && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              State the reason for declining this request. The emergency will be returned to the Command Center dispatch pool immediately for reassignment.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-border text-xs space-y-1">
              <span className="font-bold text-text block">
                {declineTarget.title || declineTarget.category}
              </span>
              <span className="text-text-muted block">
                Survivor: {declineTarget.survivorId?.name} ({declineTarget.peopleAffected || 1} people)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text">Decline Reason</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger"
              >
                <option value="Shelter is currently at maximum capacity">
                  Shelter is currently at maximum capacity
                </option>
                <option value="Specialized medical quarantine required">
                  Specialized medical quarantine required
                </option>
                <option value="Facility temporarily undergoing maintenance/sanitization">
                  Facility temporarily undergoing maintenance/sanitization
                </option>
                <option value="Distance exceeds emergency transport capability">
                  Distance exceeds emergency transport capability
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeclineModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={actionId === declineTarget._id}
                onClick={handleConfirmDecline}
              >
                {actionId === declineTarget._id ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
