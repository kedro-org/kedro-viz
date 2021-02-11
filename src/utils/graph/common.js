/**
 * PI / 2 constant
 */
export const halfPI = Math.PI * 0.5;

/**
 * Clamps the value between min and max
 * @param {number} value The number to clamp
 * @param {number} min The minimum value
 * @param {number} max The maximum value
 * @returns {number} The value clamped
 */
export const clamp = (value, min, max) =>
  value < min ? min : value > max ? max : value;

/**
 * Rounds the value to the nearest unit value
 * @param {number} value The value to snap
 * @param {number} unit The unit
 * @returns {number} The value snapped
 */
export const snap = (value, unit) => Math.round(value / unit) * unit;

/**
 * Returns the distance between two values
 * @param {number} a The first value
 * @param {number} b The second value
 * @returns {number} The distance
 */
export const distance1d = (a, b) => Math.abs(a - b);

/**
 * Returns the value `a - b`
 * @param {number} a The first number
 * @param {number} b The second number
 * @returns {number} The result
 */
export const subtract = (a, b) => a - b;

/**
 * Returns `true` if `a === b` otherwise `false`
 * @param {number} a The first value
 * @param {number} b The second value
 * @returns {boolean} The result
 */
export const equalTo = (a, b) => a === b;

/**
 * Returns `true` if `a >= b` otherwise `false`
 * @param {number} a The first number
 * @param {number} b The second number
 * @returns {boolean} The result
 */
export const greaterOrEqual = (a, b) => a >= b;

/**
 * Returns the angle in radians between the points a and b relative to the X-axis about the origin
 * @param {object} a The first point
 * @param {object} b The second point
 * @returns {number} The angle
 */
export const angle = (a, b) => Math.atan2(a.y - b.y, a.x - b.x);

/**
 * Returns the left edge x-position of the node
 * @param {object} node The node
 * @returns {number} The left edge position
 */
export const nodeLeft = (node) => node.x - node.width * 0.5;

/**
 * Returns the right edge x-position of the node
 * @param {object} node The node
 * @returns {number} The right edge position
 */
export const nodeRight = (node) => node.x + node.width * 0.5;

/**
 * Returns the top edge y-position of the node
 * @param {object} node The node
 * @returns {number} The top edge position
 */
export const nodeTop = (node) => node.y - node.height * 0.5;

/**
 * Returns the bottom edge y-position of the node
 * @param {object} node The node
 * @returns {number} The bottom edge position
 */
export const nodeBottom = (node) => node.y + node.height * 0.5;

/**
 * Finds the rows formed by nodes given the their positions in Y.
 * The result is sorted in X and Y.
 * Adds a `row` property to each node in-place
 * @param {array} nodes The input nodes
 * @returns {array} The sorted rows of nodes
 */
export const groupByRow = (nodes) => {
  const rows = {};

  // Create rows using node Y values
  for (const node of nodes) {
    rows[node.y] = rows[node.y] || [];
    rows[node.y].push(node);
  }

  // Sort the set of rows accounting for keys being strings
  const rowNumbers = Object.keys(rows).map((row) => parseFloat(row));
  rowNumbers.sort((a, b) => a - b);

  // Sort rows in order of X position if set. Break ties with ids for stability
  const sortedRows = rowNumbers.map((row) => rows[row]);
  for (let i = 0; i < sortedRows.length; i += 1) {
    sortedRows[i].sort((a, b) => compare(a.x, b.x, a.id, b.id));

    for (const node of sortedRows[i]) {
      node.row = i;
    }
  }

  return sortedRows;
};

/**
 * Generalised comparator function for sorting
 * If values are strings then `localeCompare` is used, otherwise values are subtracted
 * Compares the first pair of values and returns the difference if non equal,
 * otherwise ties are broken by comparing the subsequent pairs of values
 * @param {number|string} a Value to compare with `b`
 * @param {number|string} b Value to compare with `a`
 * @param {...number|string} values Any number of further pairs of values to compare as tie-breakers
 * @returns {number} A standard signed comparator result
 */
export const compare = (a, b, ...values) => {
  const delta = typeof a === 'string' ? a.localeCompare(b) : a - b;
  return delta !== 0 || values.length === 0 ? delta : compare(...values);
};

/**
 * Returns the node with the position translated in-place
 * @param {object} node The node
 * @param {object} offset The translation vector
 * @returns {object} The node
 */
export const offsetNode = (node, offset) => {
  node.x = node.x - offset.x;
  node.y = node.y - offset.y;
  // Node sort order for tabindex:
  node.order = node.x + node.y * 9999;
  return node;
};

/**
 * Returns the edge with each point translated in-place
 * @param {object} edge The edge
 * @param {object} offset The translation vector
 * @returns {object} The edge
 */
export const offsetEdge = (edge, offset) => {
  edge.points.forEach((point) => {
    point.x = point.x - offset.x;
    point.y = point.y - offset.y;
  });
  return edge;
};

/**
 * Returns the point on the line segment `ax, ay, bx, by` closest to point `x, y`
 * @param {number} x The test point x
 * @param {number} y The test point y
 * @param {number} ax The start of the line segement x point
 * @param {number} ay The start of the line segement y point
 * @param {number} bx The end of the line segement x point
 * @param {number} by The end of the line segement y point
 * @returns {object} An object with the closest point and both line segment points
 */
export const nearestOnLine = (x, y, ax, ay, bx, by) => {
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
    by,
  };
};
