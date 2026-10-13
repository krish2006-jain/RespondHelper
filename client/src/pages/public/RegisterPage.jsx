import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { VOLUNTEER_SKILLS, SHELTER_FACILITIES } from '../../utils/constants';
import { getRoleDashboardPath } from '../../routes/RoleRoute';

import {
  User,
  HeartHandshake,
  Users,
  Home,
  Package,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  MapPin,
} from 'lucide-react';

const ROLE_OPTIONS = [
  {
    id: 'survivor',
    title: 'Citizen / Survivor',
    desc: 'Raise emergency requests, request rescue, find nearby shelters and relief.',
    icon: User,
    color: 'bg-primary-subtle text-primary border-primary/30',
  },
  {
    id: 'volunteer',
    title: 'First Responder / Volunteer',
    desc: 'Respond to nearby emergency calls, provide first aid, rescue, and logistics.',
    icon: Users,
    color: 'bg-success-light text-success-dark border-success/30',
  },
  {
    id: 'ngo',
    title: 'NGO / Relief Organization',
    desc: 'Manage resource inventory, distribute aid, and coordinate relief efforts.',
    icon: HeartHandshake,
    color: 'bg-info-light text-info border-info/30',
  },
  {
    id: 'shelter',
    title: 'Shelter Manager',
    desc: 'Manage shelter capacity, provide food & beds, and broadcast live vacancy.',
    icon: Home,
    color: 'bg-shelter-light text-shelter border-shelter/30',
  },
  {
    id: 'resource_provider',
    title: 'Resource Provider',
    desc: 'Supply medical kits, drinking water, meals, and specialized equipment.',
    icon: Package,
    color: 'bg-amber-50 text-amber-800 border-amber-300',
  },
];

export const RegisterPage = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate]);


  const [step, setStep] = useState(1);
  const [role, setRole] = useState('survivor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('Mumbai, Maharashtra');

  // Role-specific fields
  const [skills, setSkills] = useState(['First Aid']);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(25);
  const [organizationName, setOrganizationName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [shelterName, setShelterName] = useState('');
  const [totalCapacity, setTotalCapacity] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleCompleteRegistration = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const profileData = {};
      if (role === 'volunteer') {
        profileData.skills = skills;
        profileData.serviceRadiusKm = Number(serviceRadiusKm);
      } else if (role === 'ngo') {
        profileData.organizationName = organizationName || name;
        profileData.registrationNumber = registrationNumber || 'MAH-REG-' + Date.now();
      } else if (role === 'shelter') {
        profileData.shelterName = shelterName || `${name}'s Shelter`;
        profileData.totalCapacity = Number(totalCapacity);
      }

      const user = await register({
        name,
        email,
        phone,
        password,
        role,
        address,
        profileData,
      });

      const rolePath = getRoleDashboardPath(user.role);
      navigate(rolePath, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-modal space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider">
            <span>Step {step} of 3: {step === 1 ? 'Choose Role' : step === 2 ? 'Personal Details' : 'Role Details'}</span>
            <span>{Math.round((step / 3) * 100)}% Completed</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger-light border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Select Role */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-text tracking-tight">How will you participate?</h2>
              <p className="text-xs sm:text-sm text-text-muted">
                Select your role in the disaster management and emergency network.
              </p>
            </div>

            <div className="space-y-2.5">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = role === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setRole(opt.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? 'border-primary bg-primary-subtle/40 shadow-xs'
                        : 'border-border hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border ${opt.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-text">{opt.title}</h4>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold"
              onClick={() => setStep(2)}
            >
              Continue to Details <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Basic Contact Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-text tracking-tight">Personal & Contact Info</h2>
              <p className="text-xs sm:text-sm text-text-muted">
                We use your phone number to coordinate fast dispatch during live crises.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                  Full Name / Contact Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kulkarni"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                  Locality / City
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dadar West, Mumbai"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!name || !email || !phone || !password) {
                    setError('Please fill in all contact fields.');
                    return;
                  }
                  setError(null);
                  if (role === 'survivor') {
                    handleCompleteRegistration();
                  } else {
                    setStep(3);
                  }
                }}
                className="flex-1 font-bold"
                isLoading={loading}
              >
                {role === 'survivor' ? 'Complete Registration' : 'Next Step →'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Role-Specific Details (for responders) */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-text tracking-tight">Responder Specifications</h2>
              <p className="text-xs sm:text-sm text-text-muted">
                To protect survivors, our administrative team reviews responder profiles before task dispatch.
              </p>
            </div>

            {role === 'volunteer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Emergency Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VOLUNTEER_SKILLS.map((skill) => {
                      const active = skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-slate-50 text-text-muted border-border hover:bg-slate-100'
                          }`}
                        >
                          {skill} {active ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                    Service Radius: {serviceRadiusKm} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(e.target.value)}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            )}

            {role === 'ngo' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Sewa Disaster Relief Society"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                    Registration / NGO DARPAN ID
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="MAH-2022-NGO-9122"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
                  />
                </div>
              </div>
            )}

            {role === 'shelter' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                    Shelter / Facility Name
                  </label>
                  <input
                    type="text"
                    value={shelterName}
                    onChange={(e) => setShelterName(e.target.value)}
                    placeholder="e.g. Andheri Sports Complex Relief Shelter"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                    Total Evacuee Capacity (Beds / Spaces)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                variant="primary"
                onClick={handleCompleteRegistration}
                className="flex-1 font-bold"
                isLoading={loading}
              >
                Submit & Join Network
              </Button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border text-center text-xs text-text-muted">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
