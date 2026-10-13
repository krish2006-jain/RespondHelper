import React, { useState, useEffect } from 'react';
import { volunteerAPI } from '../../api/volunteers';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { VOLUNTEER_SKILLS } from '../../utils/constants';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  MapPin,
  Award,
} from 'lucide-react';

export const VolunteerProfilePage = () => {
  const { user, profile, isVerified } = useAuth();

  const [skills, setSkills] = useState(profile?.skills || ['First Aid']);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(profile?.serviceRadiusKm || 25);
  const [experienceYears, setExperienceYears] = useState(profile?.experienceYears || 2);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (profile) {
      if (profile.skills) setSkills(profile.skills);
      if (profile.serviceRadiusKm) setServiceRadiusKm(profile.serviceRadiusKm);
      if (profile.experienceYears) setExperienceYears(profile.experienceYears);
    }
  }, [profile]);

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      await volunteerAPI.updateProfile({
        skills,
        serviceRadiusKm: Number(serviceRadiusKm),
        experienceYears: Number(experienceYears),
      });
      setSuccessMsg('Volunteer profile updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-text tracking-tight">Volunteer Responder Profile</h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Manage your emergency skill competencies and operational dispatch range.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-success-light border border-success/30 text-success-dark text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Verification Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase text-text-muted block">Identity & Credential Status</span>
          <div className="flex items-center gap-2">
            {isVerified() ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success-light text-success border border-success/30">
                <ShieldCheck className="w-4 h-4" /> Verified Responder
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertCircle className="w-4 h-4" /> Pending Admin Review
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-text-muted">
          <span className="block font-bold text-text text-sm">
            {profile?.totalTasksCompleted || 0} Missions Done
          </span>
          <span>{profile?.peopleHelpedCount || 0} Citizens Helped</span>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card space-y-6">
        {/* Skills Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
            Emergency Skills & Capabilities
          </label>
          <div className="flex flex-wrap gap-2.5">
            {VOLUNTEER_SKILLS.map((skill) => {
              const isSelected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-slate-50 text-text-muted border-border hover:bg-slate-100 hover:text-text'
                  }`}
                >
                  {skill} {isSelected ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Service Radius Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Service / Dispatch Radius
            </label>
            <span className="text-sm font-extrabold text-primary">{serviceRadiusKm} km</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={serviceRadiusKm}
            onChange={(e) => setServiceRadiusKm(e.target.value)}
            className="w-full accent-primary"
          />
          <p className="text-[11px] text-text-muted">
            You will only receive emergency mission notifications within this distance from your base.
          </p>
        </div>

        {/* Experience */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
            Years of First Aid / Disaster Experience
          </label>
          <input
            type="number"
            min="0"
            max="40"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold"
          isLoading={loading}
        >
          <Save className="w-5 h-5 mr-2" /> Save Profile Preferences
        </Button>
      </form>
    </div>
  );
};
