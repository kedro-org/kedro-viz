import { Constraint, Operator, Strength } from 'kiwi.js';

/**
 * Constraint base definitions.
 *
 * See `solve` function of `solver.js` for constraint specification.
 */

/**
 * Layout constraint in Y for separating rows
 */
export const rowConstraint = {
  property: 'y',

  solve: (constraint, constants) => {
    const { a, b } = constraint;
    const difference = a.y - b.y;
    const target = constants.spaceY;

    if (difference >= target) {
      return;
    }

    const resolve = difference - target;
    a.y -= 0.5 * resolve;
    b.y += 0.5 * resolve;
  },

  strict: (constraint, constants, variableA, variableB) => {
    return new Constraint(
      variableA.minus(variableB),
      Operator.Ge,
      constants.spaceY,
      Strength.required
    );
  },
};

/**
 * Layout constraint in Y for separating layers
 */
export const layerConstraint = {
  property: 'y',

  solve: (constraint, constants) => {
    const { a, b } = constraint;
    const difference = a.y - b.y;
    const target = constants.layerSpace;

    if (difference >= target) {
      return;
    }

    const resolve = difference - target;
    a.y -= 0.5 * resolve;
    b.y += 0.5 * resolve;
  },

  strict: (constraint, constants, variableA, variableB) => {
    return new Constraint(
      variableA.minus(variableB),
      Operator.Ge,
      constants.layerSpace,
      Strength.required
    );
  },
};

/**
 * Layout constraint in X for minimising distance from source to target for straight edges
 */
export const parallelConstraint = {
  property: 'x',

  solve: (constraint) => {
    const { a, b } = constraint;
    const difference = a.x - b.x;

    if (difference === 0) {
      return;
    }

    const strength =
      1 / Math.max(1, 0.5 * (a.targets.length + b.sources.length));

    const resolve = strength * difference;
    a.x -= 0.5 * resolve;
    b.x += 0.5 * resolve;
  },

  strict: (constraint, constants, variableA, variableB) => {
    return new Constraint(
      variableA.minus(variableB),
      Operator.Eq,
      0,
      Strength.strong
    );
  },
};

/**
 * Layout constraint in X for minimising edge crossings
 */
export const crossingConstraint = {
  property: 'x',

  solve: (constraint, constants) => {
    const { a, b, edgeA, edgeB } = constraint;
    const difference = a.x - b.x;
    const sourceDelta = edgeA.sourceNode.x - edgeB.sourceNode.x;
    const targetDelta = edgeA.targetNode.x - edgeB.targetNode.x;
    const target =
      sourceDelta + targetDelta < 0 ? -constants.basisX : constants.basisX;

    if (target >= 0 ? difference >= target : difference <= target) {
      return;
    }

    const strength = 1 / constants.basisX;

    const resolve = strength * (difference - target);
    a.x -= 0.5 * resolve;
    b.x += 0.5 * resolve;
  },
};

/**
 * Layout constraint in X for minimum node separation
 */
export const separationConstraint = {
  property: 'x',

  solve: (constraint) => {
    const { a, b } = constraint;
    const difference = b.x - a.x;
    const target = constraint.separation;

    if (difference >= target) {
      return;
    }

    const resolve = difference - target;
    a.x += 0.5 * resolve;
    b.x -= 0.5 * resolve;
  },

  strict: (constraint, constants, variableA, variableB) => {
    return new Constraint(
      variableB.minus(variableA),
      Operator.Ge,
      constraint.separation,
      Strength.required
    );
  },
};
