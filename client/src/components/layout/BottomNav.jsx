import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  PlusCircle,
  ListOrdered,
  MapPin,
  Bell,
  AlertTriangle,
  User,
  Package,
} from 'lucide-react';

export const BottomNav = ({ onOpenSOS }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  let items = [
    { name: 'Home', path: '/survivor', icon: Home },
    { name: 'Request', path: '/survivor/request/new', icon: PlusCircle },
    { name: 'Map', path: '/map', icon: MapPin },
    { name: 'My Activity', path: '/survivor/requests', icon: ListOrdered },
  ];

  if (role === 'volunteer') {
    items = [
      { name: 'Home', path: '/volunteer', icon: Home },
      { name: 'Nearby', path: '/volunteer/nearby', icon: AlertTriangle },
      { name: 'Map', path: '/map', icon: MapPin },
      { name: 'Profile', path: '/volunteer/profile', icon: User },
    ];
  } else if (role === 'ngo') {
    items = [
      { name: 'Home', path: '/ngo', icon: Home },
      { name: 'Supplies', path: '/ngo/resources', icon: Package },
      { name: 'Map', path: '/map', icon: MapPin },
      { name: 'Alerts', path: '/notifications', icon: Bell },
    ];
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-border shadow-lg px-2 py-1 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
