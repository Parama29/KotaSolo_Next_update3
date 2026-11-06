/**
 * Solo Explorer — Marker factory & lifecycle
 */

import { CONFIG } from './map-config.js';

// SVG murni dari Lucide untuk memastikan warnanya selalu PUTIH
const iconSvg = {
  'map': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  'mosque': '<path d="M3 19h18"/><path d="M3 21h18"/><path d="M21 19V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v14"/><path d="M10 5v4"/><path d="M14 5v4"/><path d="M10 9h4"/><path d="M8 21v-4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4"/><path d="M12 21v-4"/>',
  'landmark': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>'
};

/** Build a Leaflet DivIcon for a destination. */
export function destinationIcon(destination, selected = false) {
  const cat = CONFIG.categories[destination.category] || CONFIG.categories.experience;
  const symbol = cat.icon; 
  
  const cls = [
    'se-marker',
    `se-marker--${destination.category}`,
    selected ? 'se-marker--selected' : ''
  ].filter(Boolean).join(' ');

  const svgContent = iconSvg[symbol] || iconSvg['sparkles'];

  return L.divIcon({
    className: cls,
    // Gunakan SVG langsung dengan stroke putih
    html: `
      <div class="se-marker__inner">
        <svg
          class="se-marker__glyph"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          ${svgContent}
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30]
  });
}

/** Build a Leaflet DivIcon for a transport stop. */
export function stopIcon(stop) {
  const cls = `se-stop-marker ${stop.mode === 'krl' ? 'se-stop-marker--krl' : ''}`;
  return L.divIcon({
    className: cls,
    html: `<div class="se-stop-marker__inner"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

/** User location icon. */
export function userIcon() {
  return L.divIcon({
    className: 'se-user-marker',
    html: `<div class="se-user-marker__dot"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

/** Build layer destinasi */
export function buildDestinationLayer(destinations, onSelect, selectedId = null) {
  const group = L.layerGroup();
  for (const d of destinations) {
    const marker = L.marker([d.lat, d.lng], {
      icon: destinationIcon(d, d.id === selectedId),
      title: d.name,
      riseOnHover: true,
      keyboard: true
    });
    marker.on('click', () => onSelect(d));
    marker._seDestId = d.id;
    group.addLayer(marker);
  }
  return group;
}

/** Build layer halte */
export function buildStopLayer(stops, mode, onSelect) {
  const group = L.layerGroup();
  const filtered = stops.filter((s) => s.mode === mode);
  
  for (const s of filtered) {
    const m = L.marker([s.lat, s.lng], {
      icon: stopIcon(s),
      title: s.name,
      riseOnHover: true
    });
    m.on('click', () => onSelect(s));
    group.addLayer(m);
  }
  return { group, stops: filtered };
}