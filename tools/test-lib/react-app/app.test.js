import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { LOREM_IPSUM } from '@quantumblack/kedro-viz/lib/utils/random-utils';
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
   * @param {string} key dataSources key: animals/demo/random
   */
  const testFirstNodeNameMatch = (wrapper, key) => {
    const firstNodeName = wrapper
      .find('.pipeline-nodelist__group--type-task')
      .find('.pipeline-nodelist__list--nested')
      .find('NodeListRow')
      .first()
      .text();
    if (key === 'random') {
      // The random dataset is generated on load, so instead check that each
      // of the node name words are included in the LOREM_IPSUM source
      firstNodeName.split(' ').forEach(word => {
        expect(LOREM_IPSUM).toContain(word);
      });
    } else {
      const nodeNames = dataSources[key]().nodes.map(node => node.name);
      expect(nodeNames).toContain(firstNodeName);
    }
  };

  test.each(keys)(`uses %s dataset when provided as prop`, key => {
    const wrapper = mount(<App initialData={key} />);
    testFirstNodeNameMatch(wrapper, key);
  });

  test.each(keys)(
    `updates to %s dataset when radio button triggers change`,
    key => {
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
