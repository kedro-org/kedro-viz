import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App, { dataSources } from './app';

const keys = Object.keys(dataSources).filter((key) => key !== 'random');

describe('lib-test', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  /**
   * Get the name of the first node in the NodeList, and check that it's
   * included in the list of the node names in the dataset
   * * @param {object} container App component mounted
   * @param {string} key dataSources key: spaceflights/demo/random
   */
  const testFirstNodeNameMatch = (container, key) => {
    const firstNodeName = container
      .querySelector('.pipeline-nodelist__row')
      .querySelector('.pipeline-nodelist__row__text--tree')
      .querySelector('.pipeline-nodelist__row__label')
      .textContent;

    const modularPipelinesTree = dataSources[key]().modular_pipelines;
    const modularPipelineNames = Object.keys(modularPipelinesTree).map(
      (modularPipelineID) => modularPipelinesTree[modularPipelineID].name
    );
    expect(modularPipelineNames).toContain(firstNodeName);
  };

  test.each(keys)(`uses %s dataset when provided as prop`, (key) => {
    const { container } =  render(<App initialData={key} />);
    testFirstNodeNameMatch(container, key);
  });

  test.each(keys)(
    `updates to %s dataset when radio button triggers change`,
    (key) => {
      const { container } = render(<App />);

      const radioInput = container.querySelector(`[value="${key}"]`);
      fireEvent.click(radioInput, { target: { value: key } });
      testFirstNodeNameMatch(container, key);
    }
  );
});
