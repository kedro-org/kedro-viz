import { positionLayerNames } from './position-layer-names';

// Builds a <ul> holding one `.pipeline-layer-name` <li> per layer.
const makeContainer = (count) => {
  const list = document.createElement('ul');
  for (let i = 0; i < count; i++) {
    const item = document.createElement('li');
    item.className = 'pipeline-layer-name';
    list.appendChild(item);
  }
  return list;
};

describe('positionLayerNames', () => {
  it('positions labels along the Y-axis in vertical orientation', () => {
    const container = makeContainer(2);
    const layers = [
      { id: 'a', y: 100, height: 40 },
      { id: 'b', y: 200, height: 40 },
    ];
    positionLayerNames(container, layers, { k: 2, x: 10, y: 20 }, 'vertical');
    const labels = container.querySelectorAll('.pipeline-layer-name');
    // y + (layer.y + height / 2) * scale
    expect(labels[0].style.transform).toBe('translateY(260px)');
    expect(labels[1].style.transform).toBe('translateY(460px)');
  });

  it('positions labels along the X-axis in horizontal orientation', () => {
    const container = makeContainer(1);
    const layers = [{ id: 'a', x: 50, width: 30 }];
    positionLayerNames(container, layers, { k: 2, x: 10, y: 20 }, 'horizontal');
    const label = container.querySelector('.pipeline-layer-name');
    // x + (layer.x + width / 2) * scale, then centre with -50%
    expect(label.style.transform).toBe('translateX(140px) translateX(-50%)');
  });

  it('does nothing when the container or transform is missing', () => {
    const container = makeContainer(1);
    const layers = [{ id: 'a', y: 0, height: 0 }];
    expect(() =>
      positionLayerNames(null, layers, { k: 1, x: 0, y: 0 }, 'vertical')
    ).not.toThrow();
    expect(() =>
      positionLayerNames(container, layers, null, 'vertical')
    ).not.toThrow();
    // No transform was applied to the label
    expect(
      container.querySelector('.pipeline-layer-name').style.transform
    ).toBe('');
  });
});
