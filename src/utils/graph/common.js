const halfPI = Math.PI * 0.5;

const clamp = (value, min, max) =>
  value < min ? min : value > max ? max : value;
const snap = (value, unit) => Math.round(value / unit) * unit;
const distance1d = (a, b) => Math.abs(a - b);
const angle = (a, b) => Math.atan2(a.y - b.y, a.x - b.x);

const nodeLeft = node => node.x - node.width * 0.5;
const nodeRight = node => node.x + node.width * 0.5;
const nodeTop = node => node.y - node.height * 0.5;
const nodeBottom = node => node.y + node.height * 0.5;

const compare = (a, b, ...args) => {
  const delta = typeof a === 'string' ? a.localeCompare(b) : a - b;
  return delta !== 0 || args.length === 0 ? delta : compare(...args);
};

const offsetNode = (node, offset) => ({
  ...node,
  x: node.x - offset.x,
  y: node.y - offset.y
});

const offsetEdge = (edge, offset) => ({
  ...edge,
  points: edge.points.map(p => ({ x: p.x - offset.x, y: p.y - offset.y }))
});

const nearestOnLine = (x, y, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const position = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1);
  const positionClamped = clamp(position, 0, 1);

  return {
    x: ax + dx * positionClamped,
    y: ay + dy * positionClamped,
    ax,
    ay,
    bx,
    by
  };
};

export {
  compare,
  halfPI,
  clamp,
  snap,
  distance1d,
  angle,
  nearestOnLine,
  nodeLeft,
  nodeRight,
  nodeTop,
  nodeBottom,
  offsetNode,
  offsetEdge
};
