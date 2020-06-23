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

import { distance1d } from './common';

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
 * Returns the value `a - b`
 * @param {number} a The first number
 * @param {number} b The second number
 * @returns {number} The result
 */
export const subtract = (a, b) => a - b;

/**
 * Given a `solver` operator function, returns the equivalent kiwi.js operator if defined
 * @param {function} operator The operator function
 * @returns {object|undefined} The kiwi.js operator
 */
const toStrictOperator = operator => {
  if (operator === equalTo) return kiwi.Operator.Eq;
  if (operator === greaterOrEqual) return kiwi.Operator.Ge;
};

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
 * Applies the given constraints to the objects in-place.
 * If `strict` is set, limitations apply but an exact solution is attempted,
 * otherwise a solution is approximated iteratively
 * @param {array} constraints The constraints to apply
 * @param {object} constraint.a The first object to constrain
 * @param {object} constraint.b The second object to constrain
 * @param {string} constraint.key The property name on `a` and `b` to constrain
 * @param {boolean=true} constraint.required Whether the constraint must be satisfied during strict solving
 * @param {function=} constraint.delta A signed difference function given `a` and `b`. Default `subtract`
 * @param {function=} constraint.distance An absolute distance function given `a` and `b`. Default `distance1d`
 * @param {function=} constraint.target A target difference for `a` and `b`. Default `() => 0`
 * @param {function=} constraint.weightA The amount to adjust `a[key]`. Default `() => 1`
 * @param {function=} constraint.weightB The amount to adjust `b[key]`. Default `() => 1`
 * @param {number=1} iterations The number of iterations
 * @param {boolean=false} strict
 */
export const solve = (constraints, iterations = 1, strict = false) => {
  if (strict) return solveStrict(constraints);
  return solveLoose(constraints, iterations);
};

/**
 * Applies the given constraints to the objects in-place.
 * Constraint targets and operators can be static or dynamic.
 * A solution is approximated iteratively
 * @param {array} constraints The constraints. See docs for `solve`
 * @param {number} iterations The number of iterations
 */
const solveLoose = (constraints, iterations) => {
  for (let i = 0; i < iterations; i += 1) {
    for (const co of constraints) {
      const delta = (co.delta || subtract)(co.a[co.key], co.b[co.key], co);
      const distance = (co.distance || distance1d)(
        co.a[co.key],
        co.b[co.key],
        co
      );
      const target = co.target(co.a[co.key], co.b[co.key], co, delta, distance);

      if (!(co.operator || equalTo)(distance, target, delta)) {
        const resolve = (co.strength ? co.strength(co) : 1) * (delta - target);

        let weightA = co.weightA ? co.weightA(co) : 1;
        let weightB = co.weightB ? co.weightB(co) : 1;

        weightA = weightA / (weightA + weightB);
        weightB = 1 - weightA;

        co.a[co.key] -= weightA * resolve;
        co.b[co.key] += weightB * resolve;
      }
    }
  }
};

/**
 * Applies the given constraints to the objects in-place.
 * Limitations:
 *  - Constraint targets and operators must be static
 *  - `delta` is always subtract
 *  - `distance` is always subtract (i.e. signed)
 * A solution is found exactly if possible, otherwise throws an error
 * @param {array} constraints The constraints. See docs for `solve`
 */
const solveStrict = constraints => {
  const solver = new kiwi.Solver();
  const variables = {};

  for (const co of constraints) {
    variables[key(co.a, co.key)] = new kiwi.Variable();
    variables[key(co.b, co.key)] = new kiwi.Variable();
  }

  for (const co of constraints) {
    const expression = variables[key(co.a, co.key)].minus(
      variables[key(co.b, co.key)]
    );

    co.constraint = new kiwi.Constraint(
      expression,
      toStrictOperator(co.operator || equalTo),
      co.target(),
      co.required === true ? kiwi.Strength.required : kiwi.Strength.strong
    );

    solver.addConstraint(co.constraint);
  }

  solver.updateVariables();

  for (const co of constraints) {
    co.a[co.key] = variables[key(co.a, co.key)].value();
    co.b[co.key] = variables[key(co.b, co.key)].value();
  }
};
