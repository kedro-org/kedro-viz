import React from 'react';
import { shallow } from 'enzyme';
import { render, fireEvent, within } from '@testing-library/react';
import App from './index';
import getRandomPipeline from '../../utils/random-data';
import animals from '../../utils/data/animals.mock.json';
import demo from '../../utils/data/demo.mock.json';
import { mockState } from '../../utils/state.mock';
import { Flags } from '../../utils/flags';
import { saveState } from '../../store/helpers';
import { prepareNonPipelineState } from '../../store/initial-state';

describe('App', () => {
  const getState = (wrapper) => wrapper.instance().store.getState();

  describe('renders without crashing', () => {
    test('when loading random data', () => {
      shallow(<App data={getRandomPipeline()} />);
    });

    test('when loading json data', () => {
      shallow(<App data="json" />);
    });

    test('when being passed data as a prop', () => {
      shallow(<App data={animals} />);
    });

    test('when running on a legacy dataset', () => {
      // Strip out all newer features from the test dataset and leave just
      // the essential ones, to test backwards-compatibility:
      const legacyDataset = {
        nodes: animals.nodes.map(({ id, name, type }) => ({ id, name, type })),
        edges: animals.edges.map(({ source, target }) => ({ source, target })),
      };
      shallow(<App data={legacyDataset} />);
    });
  });

  describe('updates the store', () => {
    test('when data prop is set on first load', () => {
      const wrapper = shallow(<App data={animals} />);
      expect(getState(wrapper).node).toEqual(mockState.animals.node);
    });

    test('when data prop is updated', () => {
      const wrapper = shallow(<App data={demo} />);
      wrapper.setProps({ data: animals });
      expect(getState(wrapper).node).toEqual(mockState.animals.node);
    });

    test('but does not override localStorage values', () => {
      const localState = { node: { disabled: { foo: true } } };
      saveState(localState);
      const wrapper = shallow(<App data={demo} />);
      wrapper.setProps({ data: animals });
      expect(getState(wrapper).node.disabled).toEqual(localState.node.disabled);
      window.localStorage.clear();
    });

    test('but does not override non-pipeline values', () => {
      const wrapper = shallow(<App data={demo} />);
      wrapper.setProps({ data: animals });
      expect(getState(wrapper)).toMatchObject(prepareNonPipelineState({}));
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
    test('when data prop is empty', () => {
      expect(() => shallow(<App />)).toThrow();
    });
  });

  it("resets the active pipeline when data prop is updated, if the active pipeline is not included in the new dataset's list of pipelines", () => {
    // Find a pipeline that is in the first dataset but not the second
    const activePipeline = animals.pipelines.find(
      (pipeline) => !demo.pipelines.map((d) => d.id).includes(pipeline.id)
    );
    const { container, rerender } = render(<App data={animals} />);
    const pipelineDropdown = container.querySelector('.pipeline-list');
    const menuOption = within(pipelineDropdown).getByText(activePipeline.name);
    const pipelineDropdownLabel = pipelineDropdown.querySelector(
      '.kui-dropdown__label > span:first-child'
    );
    expect(pipelineDropdownLabel.innerHTML).toBe('Default');
    fireEvent.click(menuOption);
    expect(pipelineDropdownLabel.innerHTML).toBe(activePipeline.name);
    rerender(<App data={demo} />);
    expect(pipelineDropdownLabel.innerHTML).toBe('Default');
  });
});
