import React, { useState, useEffect } from 'react';
import { shelterAPI } from '../../api/shelters';
import { mapAPI } from '../../api/map';
import { MapView } from '../../components/map/MapView';
import { Home, MapPin, Layers } from 'lucide-react';

export const ShelterMapPage = () => {
  const [shelter, setShelter] = useState(null);
  const [entities, setEntities] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShelterMap = async () => {
      try {
        const shelterRes = await shelterAPI.getMyShelter();
        setShelter(shelterRes.data);

        const mapRes = await mapAPI.getEntities({
          types: 'requests,shelters,resources',
          radiusKm: 30,
        });
        setEntities(mapRes.data || {});
      } catch (err) {
        console.error('Failed to load shelter map:', err);
      } finally {
        setLoading(false);
      }
    };

    loadShelterMap();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-muted text-sm">
        Loading shelter geographical vicinity...
      </div>
    );
  }

  const coords = shelter?.location?.coordinates || [72.8777, 19.0760];

  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-text tracking-tight">Shelter Operations & Vicinity Map</h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Showing {shelter?.shelterName} location, surrounding distress calls, and neighboring aid centers.
        </p>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-border shadow-card space-y-3">
        <MapView
          center={[coords[1], coords[0]]}
          entities={entities}
          height="600px"
          zoom={13}
        />
      </div>
    </div>
  );
};
