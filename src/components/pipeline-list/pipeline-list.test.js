import React from 'react';
import PipelineList, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('PipelineList', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<PipelineList />);
    const container = wrapper.find('.pipeline-list');
    expect(container.length).toBe(1);
  });

  it('should change the active pipeline on clicking a menu option', () => {
    const wrapper = setup.mount(<PipelineList />);
    expect(wrapper.find('PipelineList').props().pipeline.active).toBe(
      '__default__'
    );
    wrapper
      .find('MenuOption')
      .at(1)
      .simulate('click');
    expect(wrapper.find('PipelineList').props().pipeline.active).toBe('de');
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.animals)).toEqual({
      pipeline: {
        active: expect.any(String),
        name: expect.any(Object),
        ids: expect.any(Array)
      },
      theme: mockState.animals.theme
    });
  });

  it('maps dispatch to props', () => {
    const value = '123';
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onUpdateActivePipeline({ value });
    expect(dispatch.mock.calls[0][0]).toEqual({
      pipeline: value,
      type: 'UPDATE_ACTIVE_PIPELINE'
    });
  });
});
