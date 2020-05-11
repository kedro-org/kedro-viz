import React from 'react';
import { shallow } from 'enzyme';
import App from './index';
import getRandomPipeline from '../../utils/random-data';
import animals from '../../utils/data/animals.mock';
import loremIpsum from '../../utils/data/lorem-ipsum.mock';

describe('App', () => {
  describe('renders without crashing', () => {
    it('when loading random data', () => {
      shallow(<App data={getRandomPipeline()} />);
    });

    it('when loading json data', () => {
      shallow(<App data="json" />);
    });

    it('when being passed data as a prop', () => {
      shallow(<App data={loremIpsum} />);
    });
  });

  describe('updates the store', () => {
    const getSchemaID = wrapper => wrapper.instance().store.getState().id;

    it('when data prop is set on first load', () => {
      const wrapper = shallow(<App data={loremIpsum} />);
      expect(getSchemaID(wrapper)).toEqual(loremIpsum.schema_id);
    });

    it('when data prop is updated', () => {
      const wrapper = shallow(<App data={loremIpsum} />);
      wrapper.setProps({ data: animals });
      expect(getSchemaID(wrapper)).toEqual(animals.schema_id);
    });
  });

  describe('throws an error', () => {
    it('when data prop is empty', () => {
      expect(() => shallow(<App />)).toThrow();
    });
  });
});
