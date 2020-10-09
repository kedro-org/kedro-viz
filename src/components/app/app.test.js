import React from 'react';
import { shallow } from 'enzyme';
import App from './index';
import getRandomPipeline from '../../utils/random-data';
import input from '../../utils/data/input.json';
import demo from '../../utils/data/demo.mock';
import { mockState } from '../../utils/state.mock';
import { Flags } from '../../utils/flags';
import { saveState } from '../../store/helpers';
import { prepareNonPipelineState } from '../../store/initial-state';

describe('App', () => {
  describe('renders without crashing', () => {
    it('when loading random data', () => {
      shallow(<App data={getRandomPipeline()} />);
    });

    it('when loading json data', () => {
      shallow(<App data="json" />);
    });

    it('when being passed data as a prop', () => {
      shallow(<App data={input} />);
    });
  });

  describe('updates the store', () => {
    const getState = wrapper => wrapper.instance().store.getState();

    it('when data prop is set on first load', () => {
      const wrapper = shallow(<App data={input} />);
      expect(getState(wrapper).node).toEqual(mockState.input.node);
    });

    it('when data prop is updated', () => {
      const wrapper = shallow(<App data={demo} />);
      wrapper.setProps({ data: input });
      expect(getState(wrapper).node).toEqual(mockState.input.node);
    });

    it('but does not override localStorage values', () => {
      const localState = { node: { disabled: { foo: true } } };
      saveState(localState);
      const wrapper = shallow(<App data={demo} />);
      wrapper.setProps({ data: input });
      expect(getState(wrapper).node.disabled).toEqual(localState.node.disabled);
      window.localStorage.clear();
    });

    it('but does not override non-pipeline values', () => {
      const wrapper = shallow(<App data={demo} />);
      wrapper.setProps({ data: input });
      expect(getState(wrapper)).toMatchObject(prepareNonPipelineState({}));
    });
  });

  describe('feature flags', () => {
    it('it announces flags', () => {
      const announceFlags = jest.spyOn(App.prototype, 'announceFlags');
      shallow(<App data={input} />);
      expect(announceFlags).toHaveBeenCalledWith(Flags.defaults());
    });
  });

  describe('throws an error', () => {
    it('when data prop is empty', () => {
      expect(() => shallow(<App />)).toThrow();
    });
  });
});
