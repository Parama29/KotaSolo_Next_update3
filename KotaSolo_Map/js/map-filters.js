/**
 * Solo Explorer — Category filters + layer toggles
 */

import { getState, setState, toggleLayer } from './map-state.js';
import { applyVisibility } from './map-layers.js';

let _filterCallback = () => {};

export function initFilters({ onFilterChange, onLayerChange }) {
  _filterCallback = onFilterChange;

  // Category chips
  document.querySelectorAll('.chip[data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-category]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const cat = btn.dataset.category;
      setState({ activeCategory: cat });
      _filterCallback(cat);
    });
  });

  // Layer panel toggles
  document.querySelectorAll('.layer-item input[data-layer]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.layer;
      const visible = toggleLayer(key, input.checked);
      // Keep legacy global in sync for map-layers zoom listener
      window.__SE_LAYER_STATE__ = { ...getState('layers') };
      applyVisibility(key);
      if (onLayerChange) onLayerChange(key, visible);
    });
  });

  // Open/close layer panel
  const btn = document.getElementById('btn-layers');
  const panel = document.getElementById('layer-panel');
  if (btn && panel) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = panel.hidden;
      panel.hidden = !isHidden;
      btn.setAttribute('aria-expanded', String(isHidden));
    });
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !e.target.closest('#layer-panel') && !e.target.closest('#btn-layers')) {
        panel.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Publish initial layer state
  window.__SE_LAYER_STATE__ = { ...getState('layers') };
}

/** Filter destination data by category key ('all' returns everything). */
export function filterByCategory(destinations, category) {
  if (!category || category === 'all') return destinations;
  return destinations.filter((d) => d.category === category);
}