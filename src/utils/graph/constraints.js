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

  strict: (constraint, constants, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Ge,
      constants.spaceY,
      Strength.required
    ),
};

/**
 * Layout constraint in Y for separating layers
 */
export const layerConstraint = {
  property: 'y',

  strict: (constraint, constants, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Ge,
      constants.layerSpace,
      Strength.required
    ),
};

/**
 * Layout constraint in X for minimising distance from source to target for straight edges
 */
export const parallelConstraint = {
  property: 'x',

  solve: (constraint) => {
    const { a, b, strength } = constraint;
    const resolve = strength * (a.x - b.x);
    a.x -= resolve;
    b.x += resolve;
  },

  strict: (constraint, constants, variableA, variableB) =>
    new Constraint(
      variableA.minus(variableB),
      Operator.Eq,
      0,
      Strength.create(1, 0, 0, constraint.strength)
    ),
};

/**
 * Crossing constraint in X for minimising edge crossings
 */
export const crossingConstraint = {
  property: 'x',

  solve: (constraint) => {
    const {
      edgeA,
      edgeB,
      separationA,
      separationB,
      strength,
    } = constraint;

    const sourceSeparation = edgeA.sourceNode.x - edgeB.sourceNode.x;
    const targetSeparation = edgeA.targetNode.x - edgeB.targetNode.x;

    // Done if constraints are not crossing
    if (sourceSeparation * targetSeparation < 0) {
      return;
    }

    // Resolve larger separations more strongly
    const resolveA =
      strength * ((sourceSeparation - separationA) / separationA);
    const resolveB =
      strength * ((targetSeparation - separationB) / separationB);

    // Choose the minimal solution that resolves crossing
    if (Math.abs(resolveA) < Math.abs(resolveB)) {
      edgeA.sourceNode.x -= resolveA;
      edgeB.sourceNode.x += resolveA;
    } else {
      edgeA.targetNode.x -= resolveB;
      edgeB.targetNode.x += resolveB;
    }
  },
};

/**
 * Layout constraint in X for minimum node separation
 */
export const separationConstraint = {
  property: 'x',

  strict: (constraint, constants, variableA, variableB) =>
    new Constraint(
      variableB.minus(variableA),
      Operator.Ge,
      constraint.separation,
      Strength.required
    ),
};
