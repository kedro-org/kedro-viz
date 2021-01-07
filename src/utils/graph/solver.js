/** @license kiwi.js v1.1.2
 * #------------------------------------------------------------------------------
 * # Copyright (c) 2013, Nucleic Development Team & H. Rutjes.
 * #
 * # Distributed under the terms of the Modified BSD License.
 * #
 * # The full license is in the file COPYING.txt, distributed with this software.
 * #------------------------------------------------------------------------------
 **/
import * as kiwi from 'kiwi.js';

import { equalTo, greaterOrEqual } from './common';

/**
 * Combines the given object's id and key to create a new key
 * @param {number} obj An object with `id` property
 * @param {number} key An identifier string
 * @returns {string} The combined key
 */
const key = (obj, key) => {
  if (typeof obj.id === 'undefined')
    throw new Error(`Object is missing property 'id' required for key.`);
  return obj.id + '_' + key;
};

/**
 * Given an operator function, returns the equivalent kiwi.js operator if defined
 * @param {function} operator The operator function
 * @returns {object|undefined} The kiwi.js operator
 */
export const toStrictOperator = operator => {
  if (operator === equalTo) return kiwi.Operator.Eq;
  if (operator === greaterOrEqual) return kiwi.Operator.Ge;
};

/**
 * Applies the given constraints to the objects in-place.
 * If `strict` is set, limitations apply but an exact solution is attempted,
 * otherwise a solution is approximated iteratively
 * @param {array} constraints The constraints to apply
 * @param {object} constraint.a The first object to constrain
 * @param {object} constraint.b The second object to constrain
 * @param {string} constraint.base.property The property name on `a` and `b` to constrain
 * @param {boolean} constraint.base.required Whether the constraint must be satisfied during strict solving
 * @param {function} constraint.base.difference A signed difference function given `a` and `b`
 * @param {function} constraint.base.distance An absolute distance function given `a` and `b`
 * @param {function} constraint.base.target A target difference for `a` and `b`
 * @param {function} constraint.base.weightA The amount to adjust `a[property]`
 * @param {function} constraint.base.weightB The amount to adjust `b[property]`
 * @param {object=} constants The constants used by constraints
 * @param {number=1} iterations The number of iterations
 * @param {boolean=false} strict
 */
export const solve = (
  constraints,
  constants = {},
  iterations = 1,
  strict = false
) => {
  if (strict) return solveStrict(constraints, constants);
  return solveLoose(constraints, constants, iterations);
};

/**
 * Applies the given constraints to the objects in-place.
 * Constraint targets and operators can be static or dynamic.
 * A solution is approximated iteratively
 * @param {array} constraints The constraints. See docs for `solve`
 * @param {object} constants The constants used by constraints
 * @param {number} iterations The number of iterations
 */
const solveLoose = (constraints, constants, iterations) => {
  for (let i = 0; i < iterations; i += 1) {
    for (const co of constraints) {
      const base = co.base;
      const a = co.a[base.property];
      const b = co.b[base.property];
      const difference = base.difference(a, b, co, constants);
      const distance = base.distance(a, b, co, constants);
      const target = base.target(a, b, co, constants, difference, distance);

      if (!base.operator(distance, target, difference)) {
        const resolve = base.strength(co, constants) * (difference - target);
        let weightA = base.weightA(co, constants);
        let weightB = base.weightB(co, constants);

        weightA = weightA / (weightA + weightB);
        weightB = 1 - weightA;

        co.a[base.property] -= weightA * resolve;
        co.b[base.property] += weightB * resolve;
      }
    }
  }
};

/**
 * Applies the given constraints to the objects in-place.
 * A solution is found exactly if possible, otherwise throws an error
 * Limitations:
 *  - Constraint targets and operators must be static
 *  - `constraint.difference` is always subtract
 *  - `constraint.distance` is always subtract (i.e. signed)
 * @param {array} constraints The constraints. See docs for `solve`
 * @param {object} constants The constants used by constraints
 */
const solveStrict = (constraints, constants) => {
  const solver = new kiwi.Solver();
  const variables = {};

  for (const co of constraints) {
    const base = co.base;
    variables[key(co.a, base.property)] = new kiwi.Variable();
    variables[key(co.b, base.property)] = new kiwi.Variable();
  }

  for (const co of constraints) {
    const base = co.base;
    const expression = variables[key(co.a, base.property)].minus(
      variables[key(co.b, base.property)]
    );

    co.constraint = new kiwi.Constraint(
      expression,
      toStrictOperator(base.operator),
      base.target(null, null, co, constants),
      base.required === true ? kiwi.Strength.required : kiwi.Strength.strong
    );

    solver.addConstraint(co.constraint);
  }

  solver.updateVariables();

  for (const co of constraints) {
    const base = co.base;
    co.a[base.property] = variables[key(co.a, base.property)].value();
    co.b[base.property] = variables[key(co.b, base.property)].value();
  }
};
