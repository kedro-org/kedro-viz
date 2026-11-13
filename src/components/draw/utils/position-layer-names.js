/**
 * Position the layer-name labels next to their bands for the given view
 * transform. Reads the label elements from `container` and offsets each one.
 * @param {HTMLElement} container The layer-names list element, or null.
 * @param {Array} layers The layers, each with x/y/width/height.
 * @param {Object} transform The current view transform ({ k, x, y }), or null.
 * @param {String} orientation 'vertical' or 'horizontal'.
 */
export const positionLayerNames = (
  container,
  layers,
  transform,
  orientation
) => {
  if (!container || !transform) {
    return;
  }
  const { k: scale, x, y } = transform;
  const layerNames = container.querySelectorAll('.pipeline-layer-name');
  layers.forEach((layer, i) => {
    const el = layerNames[i];
    if (!el) {
      return;
    }
    if (orientation === 'vertical') {
      const updateY = y + (layer.y + (layer.height || 0) / 2) * scale;
      el.style.transform = `translateY(${updateY}px)`;
    } else {
      const updateX = x + (layer.x + (layer.width || 0) / 2) * scale;
      el.style.transform = `translateX(${updateX}px) translateX(-50%)`;
    }
  });
};
