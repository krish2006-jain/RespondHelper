import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { MapView } from '../../components/map/MapView';
import { mapAPI } from '../../api/map';
import { adminAPI } from '../../api/admin';
import { EMERGENCY_HELPLINE } from '../../utils/constants';
import { getRoleDashboardPath } from '../../routes/RoleRoute';

import {
  ShieldAlert,
  HeartHandshake,
  Users,
  Home,
  Package,
  Activity,
  PhoneCall,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mapEntities, setMapEntities] = useState({});
  const [stats, setStats] = useState({
    resolvedRequests: 0,
    activeVolunteers: 1,
    availableShelters: 1,
    peopleHelped: 0,
  });


  useEffect(() => {
    const loadPreviewData = async () => {
      try {
        const [mapRes, statsRes] = await Promise.allSettled([
          mapAPI.getEntities({ radiusKm: 30 }),
          adminAPI.getStats(),
        ]);

        if (mapRes.status === 'fulfilled' && mapRes.value.data) {
          setMapEntities(mapRes.value.data);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.data) {
          setStats((prev) => ({
            ...prev,
            ...statsRes.value.data,
          }));
        }
      } catch (err) {
        // Fallback to sample preview
      }
    };

    loadPreviewData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              {/* Emergency Helpline Pill */}
              <div className="inline-flex items-center gap-2 bg-danger-light border border-danger/30 rounded-full px-4 py-1.5 text-danger text-xs sm:text-sm font-bold shadow-xs">
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>National Crisis Helpline: {EMERGENCY_HELPLINE} • 24/7 Rapid Response</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.15]">
                Help, when it's <span className="text-primary underline decoration-accent/60 decoration-wavy">needed most.</span>
              </h1>

              <p className="text-base sm:text-lg text-text-muted max-w-2xl leading-relaxed">
                A centralized, real-time crisis coordination platform. When disaster strikes, survivors raise urgent help requests and are instantly matched with verified volunteers, NGOs, nearby relief shelters, and emergency supplies.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                {user ? (
                  <Link to={getRoleDashboardPath(user.role)} className="flex-1 sm:flex-initial">
                    <Button variant="primary" size="lg" className="w-full text-base font-extrabold shadow-md">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Go to My {user.role.toUpperCase()} Dashboard
                    </Button>
                  </Link>
                ) : null}

                <Link to="/survivor/request/new" className="flex-1 sm:flex-initial">
                  <Button variant="danger" size="lg" className="w-full text-base font-extrabold shadow-md animate-soft-pulse">
                    <ShieldAlert className="w-5 h-5 mr-2" />
                    I Need Emergency Help
                  </Button>
                </Link>

                {!user ? (
                  <Link to="/register" className="flex-1 sm:flex-initial">
                    <Button variant="secondary" size="lg" className="w-full text-base font-bold">
                      <HeartHandshake className="w-5 h-5 mr-2 text-primary" />
                      Volunteer / Provide Aid
                    </Button>
                  </Link>
                ) : null}
              </div>


              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Verified NGO & Volunteer Network</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>3-Tap Fast SOS Workflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Live GPS Tracking</span>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Crisis Map Card */}
            <div className="lg:col-span-5">
              <div className="bg-white p-3 rounded-2xl border border-border shadow-modal space-y-3">
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text">Live Mumbai Operations</span>
                  </div>
                  <Link to="/map" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Expand Map <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <MapView entities={mapEntities} height="320px" zoom={11} />
                <div className="flex justify-around text-center pt-2 border-t border-border/60 text-xs">
                  <div>
                    <span className="block font-bold text-danger text-sm">{stats.activeEmergencies || 3}</span>
                    <span className="text-text-muted">Active Alerts</span>
                  </div>
                  <div>
                    <span className="block font-bold text-success text-sm">{stats.activeVolunteers || 12}</span>
                    <span className="text-text-muted">Volunteers Ready</span>
                  </div>
                  <div>
                    <span className="block font-bold text-shelter text-sm">{stats.availableShelters || 4}</span>
                    <span className="text-text-muted">Open Shelters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (Told as a human narrative) */}
      <section className="bg-white border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-subtle px-3 py-1 rounded-full">
              Crisis Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-text tracking-tight">
              How Help Reaches You in Minutes
            </h2>
            <p className="text-sm sm:text-base text-text-muted">
              Built for high-pressure emergencies where every second counts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background rounded-2xl p-6 border border-border space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-white font-extrabold text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="text-lg font-bold text-text">Survivor Reports Need</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                With a single tap, the survivor shares their location and picks their urgent need (Medical, Food, Rescue, or Shelter). Works seamlessly on slow mobile networks.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 border border-border space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-accent text-white font-extrabold text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="text-lg font-bold text-text">Intelligent Local Dispatch</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Our matching engine instantly calculates the best match based on proximity, responder skills, available inventory stock, and current volunteer workloads.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 border border-border space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-success text-white font-extrabold text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="text-lg font-bold text-text">Real-Time Assistance & Tracking</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                The survivor watches live progress (Accepted → On the Way → Arrived) and can directly coordinate with their assigned volunteer or NGO.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Community Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary text-white rounded-3xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold tabular-nums">{stats.resolvedRequests || 35}+</div>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Emergencies Resolved</p>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold tabular-nums">{stats.activeVolunteers || 40}+</div>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Active First Responders</p>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold tabular-nums">{stats.availableShelters || 10}+</div>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Shelters Networked</p>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold tabular-nums">{stats.peopleHelped || 250}+</div>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Citizens Assisted</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Join the Ecosystem / Roles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            A Multi-Role Disaster Response Ecosystem
          </h2>
          <p className="text-sm text-text-muted">
            Join thousands of verified volunteers, aid organizations, and shelter coordinators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-3">
            <div className="p-3 bg-success-light text-success w-fit rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-text">First Responders</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Accept nearby emergency missions matching your medical, rescue, or driving skills.
            </p>
            <Link to="/register" className="inline-block text-xs font-bold text-primary hover:underline">
              Join as Volunteer →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-3">
            <div className="p-3 bg-info-light text-info w-fit rounded-xl">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-text">NGOs & Foundations</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Manage aid supplies, allocate bulk rations, and coordinate district-wide relief.
            </p>
            <Link to="/register" className="inline-block text-xs font-bold text-primary hover:underline">
              Register NGO →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-3">
            <div className="p-3 bg-shelter-light text-shelter w-fit rounded-xl">
              <Home className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-text">Relief Shelters</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Broadcast live vacancy, manage capacity, and provide food & bedding to evacuees.
            </p>
            <Link to="/register" className="inline-block text-xs font-bold text-primary hover:underline">
              Register Shelter →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-3">
            <div className="p-3 bg-amber-100 text-amber-800 w-fit rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-text">Resource Suppliers</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Supply medical kits, drinking water, and rescue gear directly to emergency hubs.
            </p>
            <Link to="/register" className="inline-block text-xs font-bold text-primary hover:underline">
              Supply Resources →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
