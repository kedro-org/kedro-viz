import React from 'react';
import { shallow } from 'enzyme';
import App from './index';
import getRandomPipeline from '../../utils/random-data';
import animals from '../../utils/data/animals.mock';
import demo from '../../utils/data/demo.mock';
import { Flags } from '../../utils/flags';

describe('App', () => {
  describe('renders without crashing', () => {
    it('when loading random data', () => {
      shallow(<App data={getRandomPipeline()} />);
    });

    it('when loading json data', () => {
      shallow(<App data="json" />);
    });

    it('when being passed data as a prop', () => {
      shallow(<App data={animals} />);
    });
  });

  describe('updates the store', () => {
    const getSchemaID = wrapper => wrapper.instance().store.getState().id;

    it('when data prop is set on first load', () => {
      const wrapper = shallow(<App data={animals} />);
      expect(getSchemaID(wrapper)).toEqual(animals.schema_id);
    });

    it('when data prop is updated', () => {
      const wrapper = shallow(<App data={demo} />);
      wrapper.setProps({ data: animals });
      expect(getSchemaID(wrapper)).toEqual(animals.schema_id);
    });
  });

  describe('feature flags', () => {
    it('it announces flags', () => {
      const announceFlags = jest.spyOn(App.prototype, 'announceFlags');
      shallow(<App data={animals} />);
      expect(announceFlags).toHaveBeenCalledWith(Flags.defaults());
    });
  });

  describe('throws an error', () => {
    it('when data prop is empty', () => {
      expect(() => shallow(<App />)).toThrow();
    });
  });
});
