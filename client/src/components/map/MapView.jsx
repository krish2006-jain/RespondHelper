import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import {
  criticalIcon,
  highIcon,
  normalRequestIcon,
  volunteerIcon,
  ngoIcon,
  shelterIcon,
  resourceIcon,
  userLocationIcon,
} from '../../utils/leafletIcons';
import { MAP_DEFAULTS } from '../../utils/constants';
import { formatDistance } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';

// Helper component to smoothly re-center map
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

// Helper component for clickable map pin placement
const MapPinSelector = ({ onSelectLocation }) => {
  useMapEvents({
    click(e) {
      if (onSelectLocation) {
        onSelectLocation(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export const MapView = ({
  center = [MAP_DEFAULTS.lat, MAP_DEFAULTS.lng],
  zoom = MAP_DEFAULTS.zoom,
  entities = {},
  userLocation = null,
  selectedLocation = null,
  onSelectLocation = null,
  height = '500px',
  className = '',
}) => {
  const requests = entities.requests || [];
  const volunteers = entities.volunteers || [];
  const ngos = entities.ngos || [];
  const shelters = entities.shelters || [];
  const resources = entities.resources || [];

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-card ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={MAP_DEFAULTS.tileUrl}
        />

        <RecenterMap center={center} zoom={zoom} />
        {onSelectLocation && <MapPinSelector onSelectLocation={onSelectLocation} />}

        {/* User Current Location Pin */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="text-xs p-1">
                <span className="font-bold text-primary block">Your Current Location</span>
                <span className="text-text-muted">GPS Live Signal</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User Clicked Selected Pin (for request creation) */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="text-xs p-1 font-bold text-primary">Selected Emergency Location</div>
            </Popup>
          </Marker>
        )}

        {/* 1. Requests Pins */}
        {requests.map((r) => {
          if (!r.location || r.location.length !== 2) return null;
          // Note: GeoJSON stores [lng, lat]
          const pos = [r.location[1], r.location[0]];
          const icon = r.priority === 'Critical' ? criticalIcon : r.priority === 'High' ? highIcon : normalRequestIcon;

          return (
            <Marker key={`req-${r.id || r._id}`} position={pos} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge type="priority">{r.priority}</Badge>
                    <Badge type="status">{r.status}</Badge>
                  </div>
                  <h4 className="font-bold text-sm text-text">{r.category}</h4>
                  <p className="text-xs text-text-muted">{r.address || 'Address provided'}</p>
                  <p className="text-xs text-text-muted">
                    People in need: <strong className="text-text">{r.peopleAffected}</strong>
                  </p>
                  {r.distanceKm != null && (
                    <p className="text-[11px] font-semibold text-primary">{formatDistance(r.distanceKm)}</p>
                  )}
                  <Link
                    to={`/survivor/requests/${r.id || r._id}`}
                    className="inline-block mt-2 w-full text-center bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-3 rounded-lg"
                  >
                    View Emergency Details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 2. Volunteers Pins */}
        {volunteers.map((v) => {
          if (!v.location || v.location.length !== 2) return null;
          const pos = [v.location[1], v.location[0]];
          return (
            <Marker key={`vol-${v.id || v._id}`} position={pos} icon={volunteerIcon}>
              <Popup>
                <div className="p-2 min-w-[180px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-success bg-success-light px-2 py-0.5 rounded">
                      Volunteer
                    </span>
                    {v.distanceKm != null && (
                      <span className="text-[11px] text-text-muted">{formatDistance(v.distanceKm)}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-text">{v.name}</h4>
                  <p className="text-xs text-text-muted">
                    Skills: <span className="font-medium text-text">{v.skills?.join(', ') || 'First Aid'}</span>
                  </p>
                  <p className="text-xs text-text-muted">Service Radius: {v.serviceRadiusKm} km</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. NGOs Pins */}
        {ngos.map((n) => {
          if (!n.location || n.location.length !== 2) return null;
          const pos = [n.location[1], n.location[0]];
          return (
            <Marker key={`ngo-${n.id || n._id}`} position={pos} icon={ngoIcon}>
              <Popup>
                <div className="p-2 min-w-[180px] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-info bg-info-light px-2 py-0.5 rounded">
                    NGO Relief Hub
                  </span>
                  <h4 className="font-bold text-sm text-text">{n.name}</h4>
                  <p className="text-xs text-text-muted">Phone: {n.phone}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Shelters Pins */}
        {shelters.map((s) => {
          if (!s.location || s.location.length !== 2) return null;
          const pos = [s.location[1], s.location[0]];
          return (
            <Marker key={`shelter-${s.id || s._id}`} position={pos} icon={shelterIcon}>
              <Popup>
                <div className="p-2 min-w-[200px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-shelter bg-shelter-light px-2 py-0.5 rounded">
                      Shelter
                    </span>
                    <Badge variant={s.status === 'Full' ? 'danger' : s.status === 'Almost Full' ? 'warning' : 'success'}>
                      {s.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-text">{s.name}</h4>
                  <p className="text-xs text-text">
                    Capacity: <span className="font-bold">{s.currentOccupancy}</span> / {s.totalCapacity} (
                    <strong className="text-success">{s.availableSpaces} vacant</strong>)
                  </p>
                  <p className="text-xs text-text-muted">{s.address}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(s.facilities || []).slice(0, 4).map((f) => (
                      <span key={f} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 5. Resources Pins */}
        {resources.map((resItem) => {
          if (!resItem.location || resItem.location.length !== 2) return null;
          const pos = [resItem.location[1], resItem.location[0]];
          return (
            <Marker key={`res-${resItem.id || resItem._id}`} position={pos} icon={resourceIcon}>
              <Popup>
                <div className="p-2 min-w-[190px] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Resource Supply
                  </span>
                  <h4 className="font-bold text-sm text-text">{resItem.name}</h4>
                  <p className="text-xs text-text">
                    Available Stock:{' '}
                    <strong className="text-primary font-bold">
                      {resItem.quantity} {resItem.unit}
                    </strong>
                  </p>
                  <p className="text-xs text-text-muted">{resItem.address}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
