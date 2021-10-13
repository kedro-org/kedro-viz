import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import App, { dataSources } from './app';

configure({ adapter: new Adapter() });

const keys = Object.keys(dataSources);

describe('lib-test', () => {
  test('renders without crashing', () => {
    mount(<App />);
  });

  /**
   * Get the name of the first node in the NodeList, and check that it's
   * included in the list of the node names in the dataset
   * @param {object} wrapper App component mounted by Enzyme
   * @param {string} key dataSources key: spaceflights/demo/random
   */
  const testFirstNodeNameMatch = (wrapper, key) => {
    const firstNodeName = wrapper
      .find('.pipeline-nodelist__row')
      .find('.pipeline-nodelist__row__text--tree')
      .find('.pipeline-nodelist__row__label')
      .first()
      .text();

      const modularPipelineNames = dataSources[key]().modular_pipelines.map(
        (modularPipeline) => modularPipeline.name
      );
      expect(modularPipelineNames).toContain(firstNodeName);
  };

  test.each(keys)(`uses %s dataset when provided as prop`, (key) => {
    const wrapper = mount(<App initialData={key} />);
    testFirstNodeNameMatch(wrapper, key);
  });

  test.each(keys)(
    `updates to %s dataset when radio button triggers change`,
    (key) => {
      const wrapper = mount(<App />);
      wrapper
        .find('Radio')
        .filter(`[value="${key}"]`)
        .find('input')
        .simulate('change');
      testFirstNodeNameMatch(wrapper, key);
    }
  );
});
