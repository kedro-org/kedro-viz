import React from 'react';
import {
  EmptyPipelineWarning,
  mapStateToProps,
} from './empty-pipeline-warning';
import { mockState, setup } from '../../utils/state.mock';

describe('EmptyPipelineWarning', () => {
  it('renders without crashing', () => {
    const props = {
      nodes: [],
    };
    const wrapper = setup.mount(<EmptyPipelineWarning {...props} />);
    expect(wrapper.find('.pipeline-warning').length).toBe(1);
  });

  it('does not renders without pipeline is not empty', () => {
    const props = {
      nodes: ['node1', 'node2'],
    };
    const wrapper = setup.mount(<EmptyPipelineWarning {...props} />);
    expect(wrapper.find('.pipeline-warning').length).toBe(0);
  });

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.any(String),
      nodes: expect.any(Object),
      sidebarVisible: expect.any(Boolean),
    };
    expect(mapStateToProps(mockState.spaceflights)).toEqual(expectedResult);
  });
});
