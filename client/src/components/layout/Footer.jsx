import React from 'react';
import { ShieldAlert, Heart, PhoneCall } from 'lucide-react';
import { APP_NAME, EMERGENCY_HELPLINE } from '../../utils/constants';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-primary-deep text-cream-warm border-t border-burgundy-oxblood py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-wine flex items-center justify-center text-cream font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-cream tracking-tight">{APP_NAME}</span>
          </div>
          <p className="text-sm text-cream-warm/80 max-w-md leading-relaxed">
            Real-time emergency response and disaster relief platform connecting citizens in distress
            with verified first-responders, NGOs, shelter networks, and resource providers.
          </p>
          <div className="flex items-center gap-2 text-cream bg-burgundy/40 border border-cream-warm/30 rounded-xl px-4 py-2 w-fit">
            <PhoneCall className="w-4 h-4 text-cream-ivory" />
            <span className="text-sm font-semibold">National Crisis Helpline: {EMERGENCY_HELPLINE}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-cream uppercase tracking-wider mb-3">Quick Access</h4>
          <ul className="space-y-2 text-sm text-cream-warm/80">
            <li><Link to="/survivor/request/new" className="hover:text-cream transition-colors">Raise Emergency Request</Link></li>
            <li><Link to="/map" className="hover:text-cream transition-colors">Emergency Live Map</Link></li>
            <li><Link to="/register" className="hover:text-cream transition-colors">Volunteer / NGO Registration</Link></li>
            <li><Link to="/login" className="hover:text-cream transition-colors">Responder Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-cream uppercase tracking-wider mb-3">Trust & Verification</h4>
          <p className="text-xs text-cream-warm/70 leading-relaxed">
            All responding volunteers, organizations, and shelters undergo identity and credential validation before dispatch.
          </p>
          <div className="mt-4 pt-4 border-t border-burgundy-oxblood text-xs text-cream-soft/60">
            © {new Date().getFullYear()} {APP_NAME}. Built for crisis resilience.
          </div>
        </div>
      </div>
    </footer>
  );
};
