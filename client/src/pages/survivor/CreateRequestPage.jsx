import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { requestAPI } from '../../api/requests';
import { useAuth } from '../../context/AuthContext';
import { useEmergencyDraft } from '../../context/EmergencyDraftContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Button } from '../../components/common/Button';
import { MapView } from '../../components/map/MapView';
import { CATEGORIES, PRIORITIES } from '../../utils/constants';
import {
  ShieldAlert,
  MapPin,
  Camera,
  X,
  AlertCircle,
  Check,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';

export const CreateRequestPage = () => {
  const { user } = useAuth();
  const { draft, saveDraft, clearDraft } = useEmergencyDraft();
  const geo = useGeolocation();
  const navigate = useNavigate();
  const queryParam = new URLSearchParams(useLocation().search).get('category');

  const [category, setCategory] = useState(queryParam || draft?.category || 'Food');
  const [priority, setPriority] = useState(draft?.priority || 'High');
  const [peopleAffected, setPeopleAffected] = useState(draft?.peopleAffected || 1);
  const [address, setAddress] = useState(draft?.address || user?.address || 'Plaza Cinema, Dadar West, Mumbai');
  const [selectedCoords, setSelectedCoords] = useState({
    lat: geo.lat || 19.0760,
    lng: geo.lng || 72.8777,
  });
  const [description, setDescription] = useState(draft?.description || '');
  const [specialRequirements, setSpecialRequirements] = useState(draft?.specialRequirements || '');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update coords once geolocation resolves
  useEffect(() => {
    if (geo.isLoaded && !draft?.lat) {
      setSelectedCoords({ lat: geo.lat, lng: geo.lng });
    }
  }, [geo.isLoaded]);

  // Auto-save form draft
  useEffect(() => {
    saveDraft({
      category,
      priority,
      peopleAffected,
      address,
      description,
      specialRequirements,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
    });
  }, [category, priority, peopleAffected, address, description, specialRequirements, selectedCoords]);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (mediaFiles.length + files.length > 5) {
      setError('Maximum 5 media files allowed.');
      return;
    }

    setMediaFiles([...mediaFiles, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSelectMapPin = (lat, lng) => {
    setSelectedCoords({ lat, lng });
    setAddress(`Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', `${category} Emergency Help Request`);
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('peopleAffected', peopleAffected);
      formData.append('address', address);
      formData.append('description', description);
      formData.append('specialRequirements', specialRequirements);
      formData.append('location[type]', 'Point');
      formData.append('location[coordinates][0]', selectedCoords.lng);
      formData.append('location[coordinates][1]', selectedCoords.lat);

      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      const res = await requestAPI.create(formData);
      clearDraft();
      navigate(`/survivor/requests/${res.data._id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          Raise an Emergency Request
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Tell us what you need. We'll automatically notify the nearest verified volunteers and aid centres.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-light border border-danger/30 text-danger text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Category Selection */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-card space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
            1. What kind of help do you need?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-center transition-all min-h-[48px] flex items-center justify-center ${
                    active
                      ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/30'
                      : 'bg-slate-50 text-text border-border hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Priority & People Affected */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Priority */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-card space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              2. Urgency Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map((p) => {
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      active
                        ? p === 'Critical'
                          ? 'bg-danger text-white border-danger shadow-sm'
                          : 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-text-muted border-border hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-text-muted">
              {priority === 'Critical'
                ? '🔴 Life-threatening emergency. High-priority dispatch.'
                : '🟡 Urgent assistance required within reasonable response time.'}
            </p>
          </div>

          {/* People Count Stepper */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-card space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              3. Number of People Affected
            </label>
            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                onClick={() => setPeopleAffected(Math.max(1, peopleAffected - 1))}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-border flex items-center justify-center text-text font-bold"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="text-2xl font-extrabold text-text tabular-nums flex-1 text-center">
                {peopleAffected} {peopleAffected === 1 ? 'Person' : 'People'}
              </div>
              <button
                type="button"
                onClick={() => setPeopleAffected(peopleAffected + 1)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-border flex items-center justify-center text-text font-bold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Location & Interactive Map Pin */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              4. Emergency Location (Tap map to pinpoint)
            </label>
            <span className="text-[11px] font-semibold text-primary">
              GPS: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
            </span>
          </div>

          <MapView
            center={[selectedCoords.lat, selectedCoords.lng]}
            selectedLocation={selectedCoords}
            onSelectLocation={handleSelectMapPin}
            height="260px"
          />

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Landmark / Street Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Dadar Railway Station East, Mumbai"
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
        </div>

        {/* 4. Description & Photo Attachment */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-card space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
            5. Situation Details & Photos (Optional)
          </label>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe any urgent details (e.g. trapped on 2nd floor, water rising, elderly patient with diabetes)..."
            className="w-full p-4 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />

          {/* Photo & Video Uploader */}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-2">
              Attach Photos / Video Proof (Max 5 files)
            </label>

            <div className="flex flex-wrap gap-3">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                  <img src={url} alt="Proof preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {mediaFiles.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary-subtle/20 flex flex-col items-center justify-center cursor-pointer transition-colors text-text-muted hover:text-primary">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="sticky bottom-16 lg:bottom-4 z-20">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-extrabold text-base shadow-lg"
            isLoading={loading}
          >
            <ShieldAlert className="w-5 h-5 mr-2" />
            Send Emergency Help Request
          </Button>
        </div>
      </form>
    </div>
  );
};
