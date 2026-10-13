import { useState, useEffect } from 'react';
import { MAP_DEFAULTS } from '../utils/constants';

export const useGeolocation = () => {
  const [location, setLocation] = useState({
    lat: MAP_DEFAULTS.lat,
    lng: MAP_DEFAULTS.lng,
    accuracy: null,
    isLoaded: false,
    error: null,
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        isLoaded: true,
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isLoaded: true,
          error: null,
        });
      },
      (error) => {
        let msg = 'Unable to retrieve location.';
        if (error.code === 1) msg = 'Location permission denied. Using standard map center.';
        setLocation((prev) => ({
          ...prev,
          isLoaded: true,
          error: msg,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return { ...location, refresh: getLocation };
};
