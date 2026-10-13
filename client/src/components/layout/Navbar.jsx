import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { APP_NAME, EMERGENCY_HELPLINE } from '../../utils/constants';
import {
  ShieldAlert,
  Bell,
  PhoneCall,
  LogOut,
  User,
  MapPin,
  Menu,
  X,
  PlusCircle,
  Layers,
} from 'lucide-react';

export const Navbar = ({ onOpenSOS, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {user && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm font-bold text-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-primary">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-text-muted font-medium hidden sm:inline -mt-1">
                Emergency Coordination
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Helpline Badge */}
        <div className="hidden md:flex items-center gap-2 bg-danger-light/50 border border-danger/20 rounded-full px-3.5 py-1 text-danger">
          <PhoneCall className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-semibold">
            Emergency Helpline: <a href={`tel:${EMERGENCY_HELPLINE}`} className="font-bold underline">{EMERGENCY_HELPLINE}</a> (24/7)
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Quick SOS button */}
          <button
            onClick={onOpenSOS}
            className="flex items-center gap-1.5 bg-danger hover:bg-danger-dark text-white px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold shadow-sm animate-soft-pulse transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>SOS</span>
          </button>

          {/* Central Map Link */}
          <Link
            to="/map"
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-cream-ivory/60 transition-colors hidden sm:flex items-center gap-1 text-sm font-medium"
            title="Emergency Live Map"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span>Live Map</span>
          </Link>

          {user ? (
            <>
              {/* Notifications Bell */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-text-muted hover:text-text hover:bg-cream-ivory/60 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-cream-ivory/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary font-bold flex items-center justify-center border border-primary/20 text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-text leading-tight">{user.name}</span>
                    <span className="text-[10px] text-text-muted uppercase font-medium">{user.role}</span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-border shadow-modal py-2 z-50 animate-fadeIn"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-text truncate">{user.name}</p>
                      <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cream-ivory text-primary-dark border border-cream-warm">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to={`/${user.role === 'resource_provider' ? 'ngo' : user.role}`}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-text hover:bg-cream-ivory/50"
                    >
                      <Layers className="w-4 h-4 text-text-muted" />
                      Dashboard
                    </Link>

                    {user.role === 'volunteer' && (
                      <Link
                        to="/volunteer/profile"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-text hover:bg-cream-ivory/50"
                      >
                        <User className="w-4 h-4 text-text-muted" />
                        Volunteer Profile
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-danger hover:bg-danger-light/40 text-left border-t border-border mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-text-muted hover:text-text px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all"
              >
                Join Network
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
