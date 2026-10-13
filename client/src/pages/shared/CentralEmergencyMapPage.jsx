import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { mapAPI } from '../../api/map';
import { useGeolocation } from '../../hooks/useGeolocation';
import { MapView } from '../../components/map/MapView';
import { CATEGORIES, PRIORITIES } from '../../utils/constants';
import {
  MapPin,
  Filter,
  Layers,
  Crosshair,
  ShieldAlert,
  Home,
  Users,
  Package,
} from 'lucide-react';

export const CentralEmergencyMapPage = () => {
  const geo = useGeolocation();
  const queryType = new URLSearchParams(useLocation().search).get('type');

  const [entities, setEntities] = useState({});
  const [selectedTypes, setSelectedTypes] = useState(
    queryType ? [queryType] : ['requests', 'volunteers', 'ngos', 'shelters', 'resources']
  );
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [loading, setLoading] = useState(true);

  const fetchMapData = async () => {
    try {
      const res = await mapAPI.getEntities({
        lat: geo.lat,
        lng: geo.lng,
        radiusKm,
        types: selectedTypes.join(','),
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
      });
      setEntities(res.data || {});
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [selectedTypes, priorityFilter, categoryFilter, radiusKm, geo.isLoaded]);

  const toggleType = (t) => {
    if (selectedTypes.includes(t)) {
      setSelectedTypes(selectedTypes.filter((item) => item !== t));
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const TYPE_TOGGLES = [
    { id: 'requests', label: 'Emergencies', color: 'bg-danger text-white' },
    { id: 'volunteers', label: 'Volunteers', color: 'bg-success text-white' },
    { id: 'shelters', label: 'Shelters', color: 'bg-shelter text-white' },
    { id: 'resources', label: 'Supplies', color: 'bg-amber-600 text-white' },
    { id: 'ngos', label: 'NGOs', color: 'bg-info text-white' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text tracking-tight">
              Central Disaster & Relief Map
            </h1>
            <p className="text-xs sm:text-sm text-text-muted">
              Live operational grid tracking emergencies, volunteer responders, shelter capacities, and aid inventory.
            </p>
          </div>

          <button
            onClick={() => geo.refresh()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-text hover:bg-slate-50 self-start sm:self-auto"
          >
            <Crosshair className="w-4 h-4 text-primary" /> Locate Me (GPS)
          </button>
        </div>

        {/* Entity Filters & Radius */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs font-bold uppercase text-text-muted mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Map Layers:
          </span>

          {TYPE_TOGGLES.map((type) => {
            const active = selectedTypes.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  active
                    ? `${type.color} shadow-xs border-transparent`
                    : 'bg-slate-50 text-text-muted border-border hover:bg-slate-100'
                }`}
              >
                {type.label} {active ? '✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Map Canvas */}
      <div className="bg-white p-3 rounded-2xl border border-border shadow-card">
        <MapView
          center={[geo.lat || 19.0760, geo.lng || 72.8777]}
          userLocation={geo.isLoaded ? { lat: geo.lat, lng: geo.lng } : null}
          entities={entities}
          height="620px"
          zoom={12}
        />
      </div>
    </div>
  );
};
