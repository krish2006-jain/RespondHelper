import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useEmergencyDraft } from '../../context/EmergencyDraftContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { requestAPI } from '../../api/requests';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  HeartPulse,
  Utensils,
  LifeBuoy,
  Home,
  Check,
  MapPin,
  AlertCircle,
  PhoneCall,
  Loader2,
} from 'lucide-react';
import { EMERGENCY_HELPLINE } from '../../utils/constants';

const QUICK_CATEGORIES = [
  { id: 'Medical Assistance', label: 'Medical Aid', icon: HeartPulse, color: 'bg-red-50 text-danger border-danger/30' },
  { id: 'Rescue', label: 'Rescue / Evac', icon: LifeBuoy, color: 'bg-orange-50 text-warning border-warning/30' },
  { id: 'Food', label: 'Food & Water', icon: Utensils, color: 'bg-amber-50 text-amber-700 border-amber-300' },
  { id: 'Shelter', label: 'Need Shelter', icon: Home, color: 'bg-purple-50 text-shelter border-shelter/30' },
];

export const SOSModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { draft, saveDraft, clearDraft } = useEmergencyDraft();
  const geo = useGeolocation();
  const navigate = useNavigate();

  const [category, setCategory] = useState(draft?.category || 'Medical Assistance');
  const [peopleAffected, setPeopleAffected] = useState(draft?.peopleAffected || 1);
  const [description, setDescription] = useState(draft?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auto save draft on change
  useEffect(() => {
    if (isOpen) {
      saveDraft({ category, peopleAffected, description });
    }
  }, [category, peopleAffected, description, isOpen]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // If unauthenticated, redirect to login or rapid register with draft saved
      if (!user) {
        navigate('/login?redirect=sos');
        onClose();
        return;
      }

      const formData = new FormData();
      formData.append('title', `EMERGENCY SOS: ${category}`);
      formData.append('category', category);
      formData.append('priority', 'Critical');
      formData.append('peopleAffected', peopleAffected);
      formData.append('isSOS', 'true');
      formData.append('description', description || 'Urgent SOS assistance requested via quick 3-tap action.');
      formData.append('location[type]', 'Point');
      formData.append('location[coordinates][0]', geo.lng);
      formData.append('location[coordinates][1]', geo.lat);
      formData.append('address', user.address || 'GPS Coordinates Provided');

      const res = await requestAPI.create(formData);
      clearDraft();
      onClose();
      navigate(`/survivor/requests/${res.data._id}`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch SOS alert. Please try calling 112 directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🚨 Emergency SOS Broadcast" maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Helpline Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-danger-light/60 border border-danger/30 text-danger text-xs">
          <div className="flex items-center gap-2 font-bold">
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Emergency 24/7 Helpline: {EMERGENCY_HELPLINE}</span>
          </div>
          <a
            href={`tel:${EMERGENCY_HELPLINE}`}
            className="bg-danger text-white px-2.5 py-1 rounded-lg font-bold text-xs hover:bg-danger-dark"
          >
            Call Now
          </a>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger-light text-danger text-xs flex items-center gap-2 border border-danger/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Need */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            1. Select Primary Emergency (1 Tap)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all min-h-[52px] ${
                    isSelected
                      ? 'border-danger bg-danger text-white font-bold shadow-sm ring-2 ring-danger/30'
                      : `${cat.color} hover:border-slate-400 font-semibold`
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-white' : ''}`} />
                  <span className="text-xs sm:text-sm">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: People Affected */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            2. People Needing Help
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 4, 8, 15].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPeopleAffected(num)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all min-h-[44px] ${
                  peopleAffected === num
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-text-muted border-border hover:bg-slate-50'
                }`}
              >
                {num === 15 ? '15+' : num}
              </button>
            ))}
          </div>
        </div>

        {/* Location Status */}
        <div className="p-3 rounded-xl bg-slate-50 border border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="truncate max-w-[200px]">
              {geo.isLoaded ? `GPS: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : 'Detecting GPS...'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-success">Auto-attached</span>
        </div>

        {/* Step 3: Big Send SOS Button */}
        <Button
          variant="danger"
          size="lg"
          className="w-full text-base font-extrabold shadow-md animate-soft-pulse"
          onClick={handleSubmit}
          isLoading={isSubmitting}
        >
          <ShieldAlert className="w-5 h-5 mr-2" />
          SEND CRITICAL SOS NOW
        </Button>
      </div>
    </Modal>
  );
};
