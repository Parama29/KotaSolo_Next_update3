/**
 * Solo Explorer — Geolocation
 * Only activated on explicit user action (never automatically).
 */

import { getMap, flyTo } from './map-engine.js';
import { userIcon } from './map-markers.js';
import { setState, getState } from './map-state.js';
import { toast } from './map-utils.js';

let _marker = null;

export function initLocation() {
  const btn = document.getElementById('btn-locate');
  if (!btn) return;
  btn.addEventListener('click', locateUser);
}

function locateUser() {
  const btn = document.getElementById('btn-locate');
  if (!navigator.geolocation) {
    toast('Perangkat tidak mendukung geolokasi.');
    return;
  }

  btn.classList.add('is-active');
  navigator.geolocation.getCurrentPosition(
    onSuccess,
    onError,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );

  function onSuccess(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    setState({ userLocation: { lat: latitude, lng: longitude, accuracy } });

    const map = getMap();
    if (!map) return;

    if (_marker) map.removeLayer(_marker);
    _marker = L.marker([latitude, longitude], { icon: userIcon(), zIndexOffset: 2000 });
    _marker.addTo(map);

    // Accuracy circle (optional, subtle)
    L.circle([latitude, longitude], {
      radius: Math.min(accuracy || 50, 200),
      color: '#2f9cf4', weight: 1, fillOpacity: 0.08
    }).addTo(map);

    flyTo(latitude, longitude, 16);
    toast('Lokasi ditemukan.');
    btn.classList.remove('is-active');
  }

  function onError(err) {
    btn.classList.remove('is-active');
    const msg = {
      1: 'Izin lokasi ditolak.',
      2: 'Lokasi tidak tersedia.',
      3: 'Waktu permintaan lokasi habis.'
    }[err.code] || 'Gagal mendapatkan lokasi.';
    toast(msg);
  }
}