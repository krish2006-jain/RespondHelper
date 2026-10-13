import L from 'leaflet';

// Helper to generate SVG Pin Icons for Leaflet
const createSvgIcon = (color, svgInner) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 2 C9.16 2 2 9.16 2 18 C2 29 18 46 18 46 C18 46 34 29 34 18 C34 9.16 26.84 2 18 2 Z" fill="${color}" filter="url(#shadow)" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="18" cy="18" r="11" fill="#FFFFFF"/>
      <g transform="translate(10, 10)" fill="${color}">
        ${svgInner}
      </g>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: svg,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44],
  });
};

// Critical Request (Wine Red Alert #B0303C)
export const criticalIcon = createSvgIcon(
  '#B0303C',
  `<path d="M8 1 L15 14 L1 14 Z" fill="#B0303C"/><rect x="7" y="5" width="2" height="5" fill="#FFFFFF"/><circle cx="8" cy="12" r="1" fill="#FFFFFF"/>`
);

// High Request (Vintage Burgundy #9B1D30)
export const highIcon = createSvgIcon(
  '#9B1D30',
  `<circle cx="8" cy="8" r="6" fill="#9B1D30"/><text x="8" y="11" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">!</text>`
);

// Normal Request (Burgundy #800020)
export const normalRequestIcon = createSvgIcon(
  '#800020',
  `<circle cx="8" cy="8" r="5" fill="#800020"/>`
);

// Verified Volunteer (Green)
export const volunteerIcon = createSvgIcon(
  '#2F8F5B',
  `<circle cx="8" cy="4" r="3" fill="#2F8F5B"/><path d="M2 14 C2 10 5 9 8 9 C11 9 14 10 14 14 Z" fill="#2F8F5B"/>`
);

// NGO (Blue)
export const ngoIcon = createSvgIcon(
  '#2B6CB0',
  `<path d="M8 1 L15 6 L15 15 L1 15 L1 6 Z" fill="#2B6CB0"/><rect x="6" y="9" width="4" height="6" fill="#FFFFFF"/>`
);

// Shelter (Purple)
export const shelterIcon = createSvgIcon(
  '#6B4FA0',
  `<path d="M8 2 L1 8 L3 8 L3 14 L13 14 L13 8 L15 8 Z" fill="#6B4FA0"/><rect x="6.5" y="8.5" width="3" height="5.5" fill="#FFFFFF"/>`
);

// Resource (Amber / Gold)
export const resourceIcon = createSvgIcon(
  '#D97706',
  `<rect x="2" y="3" width="12" height="10" rx="1" fill="#D97706"/><line x1="2" y1="6" x2="14" y2="6" stroke="#FFFFFF" stroke-width="1.5"/><line x1="8" y1="6" x2="8" y2="13" stroke="#FFFFFF" stroke-width="1.5"/>`
);

// Survivor Location Marker (Teal Pulse Pin)
export const userLocationIcon = L.divIcon({
  className: 'user-pin-icon',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <span class="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping"></span>
      <span class="relative inline-flex rounded-full h-5 w-5 bg-primary border-2 border-white shadow-md"></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
