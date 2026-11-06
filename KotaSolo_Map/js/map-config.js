/**
 * Solo Explorer — Centralised Configuration
 */

export const CONFIG = {
    /* --- API & Data Sources --- */
    api: {
      base: '..',
      destinations: '/data/destinations.json',
      stops:        '/data/stops.json',
    },
  
    /* --- Map defaults (Surakarta) --- */
    map: {
      center: [-7.5670, 110.8300],
      zoom: 13,
      minZoom: 10,
      maxZoom: 19,
      maxBounds: [[-7.75, 110.65], [-7.40, 111.00]],
      maxBoundsViscosity: 0.7
    },
  
    /* --- Tile provider --- */
    tile: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    },
  
    /* --- Marker / performance tuning --- */
    markers: {
      stopMinZoom: 13, // Turunkan ke 13 agar halte langsung muncul
    },
  
    /* --- State persistence keys --- */
    storage: {
      theme: 'solo-explorer:theme',
      favorites: 'solo-explorer:favorites'
    },
  
    /* --- Categories --- */
    categories: {
      all:        { label: 'Semua',      icon: 'map' },
      religi:     { label: 'Religi',     icon: 'mosque' },
      sejarah:    { label: 'Sejarah',    icon: 'landmark' },
      belanja:    { label: 'Belanja',    icon: 'shopping-bag' },
      experience: { label: 'Experience', icon: 'sparkles' }
    },
  
    /* --- Route Colors for Polylines --- */
    routeColors: {
      '1': '#e74c3c', '2': '#3498db', '3': '#2ecc71', '4': '#9b59b6', '5': '#f1c40f',
      'F7': '#e67e22', 'F8': '#1abc9c', 'F9': '#e84393', 'F10': '#34495e', 'F12': '#95a5a6',
      'S1': '#16a085', 'S2': '#c0392b'
    },
  
    /* --- Timeouts --- */
    requestTimeoutMs: 12000,
    searchDebounceMs: 220
  };
  
  export const ENDPOINTS = {
    destinations: CONFIG.api.base + CONFIG.api.destinations,
    stops:        CONFIG.api.base + CONFIG.api.stops,
  };