import * as kiwi from 'kiwi.js';

import { distance1d } from './common';

const key = (obj, key) => obj.id + '_' + key;
const subtract = (a, b) => a - b;
const equalTo = (a, b) => a === b;
const greaterThan = (a, b) => a > b;

const toStrictOperator = operator => {
  if (operator === equalTo) return kiwi.Operator.Eq;
  if (operator === greaterThan) return kiwi.Operator.Ge;
};

const solve = (constraints, iterations = 1, strict = false) => {
  if (strict) return solveStrict(constraints);
  return solveLoose(constraints, iterations);
};

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

export { equalTo, greaterThan, solve };
