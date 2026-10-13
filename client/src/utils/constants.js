export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Relief Network';
export const EMERGENCY_HELPLINE = import.meta.env.VITE_EMERGENCY_HELPLINE || '112';

export const MAP_DEFAULTS = {
  lat: parseFloat(import.meta.env.VITE_DEFAULT_MAP_LAT) || 19.0760,
  lng: parseFloat(import.meta.env.VITE_DEFAULT_MAP_LNG) || 72.8777,
  zoom: parseInt(import.meta.env.VITE_DEFAULT_MAP_ZOOM, 10) || 12,
  tileUrl: import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

export const CATEGORIES = [
  'Food',
  'Water',
  'Medicine',
  'Shelter',
  'Rescue',
  'Transport',
  'Medical Assistance',
  'Clothing',
  'Emergency Supplies',
  'Other',
];

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export const ROLES = {
  SURVIVOR: 'survivor',
  VOLUNTEER: 'volunteer',
  NGO: 'ngo',
  SHELTER: 'shelter',
  RESOURCE_PROVIDER: 'resource_provider',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  survivor: 'Survivor',
  volunteer: 'Volunteer',
  ngo: 'NGO Coordinator',
  shelter: 'Shelter Manager',
  resource_provider: 'Resource Provider',
  admin: 'Command Center Admin',
};

export const REQUEST_STATUSES = [
  'Submitted',
  'Verified',
  'Assigned',
  'In Progress',
  'Delivered',
  'Resolved',
  'Cancelled',
];

export const VOLUNTEER_SKILLS = [
  'First Aid',
  'Medical Doctor',
  'Search & Rescue',
  'Boat Rescue',
  'Food Distribution',
  'Driving / Logistics',
  'Counseling',
  'Shelter Management',
];

export const SHELTER_FACILITIES = [
  'Food',
  'Water',
  'Medical',
  'Washrooms',
  'Electricity',
  'Bedding',
  'Accessibility',
  'Pet-friendly',
];

export const DEMO_ACCOUNTS = [
  { role: 'admin', label: 'Command Center Admin', email: 'admin@relief.org', pass: 'Admin@12345', badge: 'Admin' },
  { role: 'survivor', label: 'Survivor (Aarav Sharma)', email: 'survivor@relief.org', pass: 'Password@123', badge: 'Survivor' },
  { role: 'volunteer', label: 'Volunteer (Dr. Rahul Verma)', email: 'volunteer@relief.org', pass: 'Password@123', badge: 'Volunteer' },
  { role: 'ngo', label: 'NGO (Sewa Relief Foundation)', email: 'ngo@relief.org', pass: 'Password@123', badge: 'NGO' },
  { role: 'shelter', label: 'Shelter Manager (Shivaji Park)', email: 'shelter@relief.org', pass: 'Password@123', badge: 'Shelter' },
  { role: 'resource_provider', label: 'Resource Provider (Apex Supplies)', email: 'provider@relief.org', pass: 'Password@123', badge: 'Provider' },
];
