import React, { useState, useEffect } from 'react';
import { shelterAPI } from '../../api/shelters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
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
} from 'lucide-react';

export const ShelterDashboard = () => {
  const [shelter, setShelter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deltaInput, setDeltaInput] = useState(5);

  const fetchShelter = async () => {
    try {
      const res = await shelterAPI.getMyShelter();
      setShelter(res.data);
    } catch (err) {
      console.error('Failed to load shelter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelter();
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Shelter Command
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

        <div className="text-right bg-slate-50 p-3.5 rounded-xl border border-border">
          <span className="text-xs text-text-muted block">Direct Contact</span>
          <span className="text-sm font-bold text-text">{shelter.contactPhone}</span>
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
          subtext={`${occupancyRate}% full`}
        />
        <StatCard
          title="Vacant Spaces Available"
          value={availableBeds}
          color="success"
          icon={CheckCircle2}
          subtext="Ready for arrivals"
        />
      </div>

      {/* Big Occupancy Gauge & Quick Adjustment Buttons */}
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
            <h4 className="text-sm font-bold text-text">Quick Check-in / Check-out Counter</h4>
            <p className="text-xs text-text-muted">
              Tap to update evacuee counts. Broadcasts instantly to the emergency map.
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

      {/* Shelter Facilities Checklist */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card space-y-4">
        <h2 className="text-lg font-extrabold text-text tracking-tight">Available Facilities & Amenities</h2>
        <p className="text-xs text-text-muted">
          Toggle verified provisions available to incoming displaced families.
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
    </div>
  );
};
