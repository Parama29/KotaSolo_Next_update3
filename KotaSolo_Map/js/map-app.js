/**
 * Solo Explorer — Application entry point
 * Bootstraps all modules and wires them together.
 */

import { CONFIG } from './map-config.js';
import { fetchInitialData } from './map-api.js';
import { initMap, getMap, flyTo } from './map-engine.js';
import { setDestinations, setStops, setRoutes } from './map-layers.js';
import { initSearch } from './map-search.js';
import { initFilters, filterByCategory } from './map-filters.js';
import { initBottomSheet, openSheet, closeSheet } from './map-bottomsheet.js?v=20261104-1';
import { initLocation } from './map-location.js';
import { getState, setState } from './map-state.js';
import { toast, escapeHtml } from './map-utils.js';

/* ---------- Lucide Icon Helper ---------- */
function updateIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/* ---------- Bootstrap ---------- */

(async function bootstrap() {
  initTheme();

  const map = initMap('map');
  setState({ mapReady: true });

  // Wire UI before data arrives (so interactions don't block on network)
  initBottomSheet();
  initLocation();
  
  initFilters({
    onFilterChange: (cat) => applyCategoryFilter(cat),
    onLayerChange: (key, visible) => toast(`${label(key)} ${visible ? 'ditampilkan' : 'disembunyikan'}`)
  });

  initSearch({
    onSelectDestination: (item, kind) => {
      if (kind === 'stop') {
        flyTo(item.lat, item.lng, 16);
      } else {
        handleDestinationSelect(item);
      }
    }
  });

  document.getElementById('btn-zoom-in')?.addEventListener('click', () => map.zoomIn());
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => map.zoomOut());

  // ---- Load data ----
  let data;
  try {
    data = await fetchInitialData();
  } catch (err) {
    showError('Gagal memuat data peta.', err);
    hideLoading();
    return;
  }

  setState({
    destinations: data.destinations,
    stops: data.stops,
    routes: data.routes
  });

  // ---- Render layers ----
  setDestinations(data.destinations, handleDestinationSelect);
  setStops(data.stops, handleStopSelect);
  
  if (data.routes && data.routes.length) {
    setRoutes(data.routes);
  }

  // ---- Fit bounds to destinations ----
  if (data.destinations.length) {
    const latlngs = data.destinations.map((d) => [d.lat, d.lng]);
    try { map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 14 }); }
    catch (_) { /* noop */ }
  }

  hideLoading();
  updateIcons(); // Render Lucide icons in the sidebar/search

  if (data.destinations.length === 0) {
    showError('Tidak ada data destinasi. Periksa endpoint API pada js/map-config.js.');
  }

  // ---- Restore deep-link (?dest=<id>) ----
  const params = new URLSearchParams(location.search);
  const deepId = params.get('dest');
  if (deepId) {
    const d = data.destinations.find((x) => x.id === deepId);
    if (d) setTimeout(() => handleDestinationSelect(d), 300);
  }

  /* ---------- Handlers ---------- */

  function handleDestinationSelect(dest) {
    setState({ selectedId: dest.id });
  
    setDestinations(getState('destinations'), handleDestinationSelect, dest.id);
  
    flyTo(dest.lat, dest.lng, Math.max(getMap().getZoom(), 16));
  
    // Desktop & Tablet: sidebar. Mobile: bottom sheet.
    if (window.matchMedia('(min-width: 768px)').matches) {
      renderSidebarCard(dest);
    } else {
      openSheet(dest, { map });
    }
  }

  // --- FUNGSI BARU: Mencegah ReferenceError yang membuat loading stuck ---
  function handleStopSelect(stop) {
    flyTo(stop.lat, stop.lng, 16);
    toast(`Mendekati ${stop.name || 'Halte'}`);
  }

  function applyCategoryFilter(cat) {
    const filtered = filterByCategory(getState('destinations'), cat);
    setDestinations(filtered, handleDestinationSelect, getState('selectedId'));
    updateIcons();
  
    if (!filtered.some((d) => d.id === getState('selectedId'))) {
      setState({ selectedId: null });
      closeSheet();
    }
  
    if (filtered.length) {
      const latlngs = filtered.map((d) => [d.lat, d.lng]);
      try { map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 15 }); }
      catch (_) {}
    }
  }
})();

/* ---------- Helpers ---------- */

function renderSidebarCard(dest) {
  const container = document.getElementById('sidebar-content');
  if (!container) return;
  
  const catLabel = CONFIG.categories[dest.category]?.label || dest.category;
  
  // Layout Card Premium dengan Ikon Lucide
  container.innerHTML = `
    <div class="card">
      <div class="card__media">
        ${dest.image ? `<img src="${escapeHtml(dest.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      </div>
      <div class="card__body">
        <div class="card__cat">${escapeHtml(catLabel)}</div>
        <h3 class="card__title">${escapeHtml(dest.name)}</h3>
        <p class="card__desc">${escapeHtml(dest.description || 'Tidak ada deskripsi.')}</p>
        
        <div class="card__meta">
          ${dest.address ? `<span><i data-lucide="map-pin" width="14"></i> ${escapeHtml(dest.address)}</span>` : ''}
          <span><i data-lucide="crosshair" width="14"></i> ${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}</span>
        </div>
        
        <div class="card__actions">
          <button class="btn btn--primary" data-action="route">
            <i data-lucide="navigation" width="16"></i> Rute
          </button>
          <button class="btn btn--ghost" data-action="share">
            <i data-lucide="share-2" width="16"></i> Bagikan
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Render Ikon
  updateIcons();

  // Event Listeners
  container.querySelector('[data-action="route"]')?.addEventListener('click', () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
  });
  
  container.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('dest', dest.id);
    if (navigator.share) { 
      try { await navigator.share({ title: dest.name, url: url.toString() }); } catch (_) {} 
    } else { 
      try { await navigator.clipboard.writeText(url.toString()); toast('Tautan disalin.'); } catch (_) { prompt('Salin tautan:', url.toString()); } 
    }
  });
}

function initTheme() {
  const saved = localStorage.getItem(CONFIG.storage.theme) || 'dark';
  document.documentElement.dataset.theme = saved;

  // Update semua ikon tema (desktop & mobile)
  updateThemeIcons(saved);

  // Desktop Theme Toggle
  const btnDesktop = document.getElementById('theme-toggle');
  btnDesktop?.addEventListener('click', () => toggleTheme());

  // Mobile Theme Toggle
  const btnMobile = document.getElementById('theme-toggle-mobile');
  btnMobile?.addEventListener('click', () => toggleTheme());

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.dataset.theme = next;
    localStorage.setItem(CONFIG.storage.theme, next);
    updateThemeIcons(next);
  }
}

function updateThemeIcons(theme) {
  const iconName = theme === 'dark' ? 'moon' : 'sun';
  
  // Update desktop
  const iconDesktop = document.getElementById('theme-icon');
  if (iconDesktop) {
    iconDesktop.setAttribute('data-lucide', iconName);
  }

  // Update mobile
  const btnMobile = document.getElementById('theme-toggle-mobile');
  if (btnMobile) {
    const mobileIcon = btnMobile.querySelector('i');
    if (mobileIcon) mobileIcon.setAttribute('data-lucide', iconName);
  }

  updateIcons();
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  overlay.classList.add('is-hidden');
  setTimeout(() => overlay.setAttribute('hidden', ''), 350);
}

function showError(message, err) {
  const container = document.getElementById('sidebar-content');
  if (!container) return;
  
  container.innerHTML = `
    <div class="error-state" style="margin: 16px; text-align: center;">
      <i data-lucide="alert-triangle" width="32" style="color: var(--primary); margin-bottom: 12px;"></i>
      <strong>${escapeHtml(message)}</strong>
      <p style="font-size: 13px; margin-top: 8px;">Buka konsol browser untuk detail. Periksa konfigurasi endpoint pada <code>js/map-config.js</code>.</p>
      ${err ? `<small style="display:block; margin-top:8px; opacity:0.6;">${escapeHtml(String(err.message || err))}</small>` : ''}
    </div>
  `;
  
  updateIcons();
}

function label(key) {
  return {
    destinations: 'Destinasi',
    'bst-stops': 'Halte BST',
    'krl-stops': 'Stasiun KRL',
    'bst-routes': 'Rute BST'
  }[key] || key;
}