import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  MapPin,
  Bell,
  Package,
  Layers,
  Home,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  User,
  Users,
  AlertTriangle,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isVerified } = useAuth();
  if (!user) return null;

  const role = user.role;
  const verified = isVerified();

  // Navigation Links configuration per role
  const navItems = {
    survivor: [
      { name: 'Dashboard', path: '/survivor', icon: LayoutDashboard },
      { name: 'Raise Help Request', path: '/survivor/request/new', icon: PlusCircle },
      { name: 'My Requests', path: '/survivor/requests', icon: ListOrdered },
      { name: 'Emergency Map', path: '/map', icon: MapPin },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
    volunteer: [
      { name: 'Volunteer Dashboard', path: '/volunteer', icon: LayoutDashboard },
      { name: 'Nearby Requests', path: '/volunteer/nearby', icon: AlertTriangle },
      { name: 'Volunteer Profile', path: '/volunteer/profile', icon: User },
      { name: 'Emergency Map', path: '/map', icon: MapPin },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
    ngo: [
      { name: 'NGO Dashboard', path: '/ngo', icon: LayoutDashboard },
      { name: 'Resource Inventory', path: '/ngo/resources', icon: Package },
      { name: 'Resource Assignment', path: '/ngo/assignments', icon: Layers },
      { name: 'Emergency Map', path: '/map', icon: MapPin },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
    resource_provider: [
      { name: 'Provider Dashboard', path: '/ngo', icon: LayoutDashboard },
      { name: 'Manage Supplies', path: '/ngo/resources', icon: Package },
      { name: 'Live Emergency Map', path: '/map', icon: MapPin },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
    shelter: [
      { name: 'Shelter Dashboard', path: '/shelter', icon: Home },
      { name: 'Shelter Map & Vicinity', path: '/shelter/map', icon: MapPin },
      { name: 'Live Emergency Map', path: '/map', icon: MapPin },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
    admin: [
      { name: 'Command Center', path: '/admin', icon: LayoutDashboard },
      { name: 'Verification Queue', path: '/admin?tab=verifications', icon: ShieldCheck },
      { name: 'Manage Users', path: '/admin?tab=users', icon: Users },
      { name: 'Requests & Reassign', path: '/admin?tab=requests', icon: ListOrdered },
      { name: 'Emergency Map', path: '/map', icon: MapPin },
      { name: 'Disaster Analytics', path: '/admin?tab=analytics', icon: BarChart3 },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
  };

  const currentNav = navItems[role] || navItems.survivor;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between py-5 px-4 overflow-y-auto`}
      >
        <div className="space-y-6">
          {/* User Role Card */}
          <div className="p-3.5 rounded-xl bg-cream-DEFAULT/40 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text truncate max-w-[140px]">{user.name}</span>
              {verified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full border border-success/30">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted capitalize mt-0.5">Role: {user.role}</p>
          </div>

          {/* Navigation items */}
          <nav className="space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white font-semibold shadow-sm'
                        : 'text-text-muted hover:text-text hover:bg-cream-ivory/60'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Verification Alert Banner for Responders */}
        {!verified && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <p className="font-semibold">Verification Pending</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              An administrator is reviewing your details before you can accept tasks.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
