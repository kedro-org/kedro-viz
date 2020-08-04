import React from 'react';
import { configure, mount } from 'enzyme';
import App, { dataSources } from './app';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const keys = Object.keys(dataSources);

describe('lib-test', () => {
  test('renders without crashing', () => {
    mount(<App />);
  });

  const testFirstNodeNameMatch = (wrapper, key) => {
    const nodeNames = dataSources[key]().nodes.map(node => node.name);
    const firstNodeName = wrapper
      .find('.pipeline-nodelist--nested')
      .find('NodeListRow')
      .first()
      .text();
    if (key === 'random') {
      let combinedNodeNames = [];
      nodeNames.forEach(name => {
        combinedNodeNames = combinedNodeNames.concat(name.split(' '));
      });
      firstNodeName.split(' ').forEach(word => {
        expect(combinedNodeNames).toContain(word);
      });
    } else {
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
