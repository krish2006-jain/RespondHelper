/**
 * Geo-spatial distance and formatting utility
 */

// Calculate Haversine distance in kilometers between two coordinates [lat, lng] or [lng, lat]
export const calculateDistanceKm = (coord1, coord2) => {
  // Input format: array of [lng, lat] (GeoJSON standard) or { lat, lng }
  let lat1, lon1, lat2, lon2;

  if (Array.isArray(coord1)) {
    lon1 = coord1[0];
    lat1 = coord1[1];
  } else {
    lat1 = coord1.lat || coord1.latitude;
    lon1 = coord1.lng || coord1.longitude;
  }

  if (Array.isArray(coord2)) {
    lon2 = coord2[0];
    lat2 = coord2[1];
  } else {
    lat2 = coord2.lat || coord2.latitude;
    lon2 = coord2.lng || coord2.longitude;
  }

  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 0;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Formats coordinates safely into GeoJSON Point format
export const toGeoJSONPoint = (lng, lat) => {
  return {
    type: 'Point',
    coordinates: [parseFloat(lng), parseFloat(lat)],
  };
};
