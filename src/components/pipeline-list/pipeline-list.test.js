import React from 'react';
import PipelineList, { mapStateToProps, mapDispatchToProps } from './index';
import { mockState, setup } from '../../utils/state.mock';

describe('PipelineList', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<PipelineList onToggleOpen={jest.fn()} />);
    const container = wrapper.find('.pipeline-list');
    expect(container.length).toBe(1);
  });

  it('should call onToggleOpen when opening/closing', () => {
    const onToggleOpen = jest.fn();
    const wrapper = setup.mount(<PipelineList onToggleOpen={onToggleOpen} />);
    wrapper.find('.kui-dropdown__label').simulate('click');
    expect(onToggleOpen).toHaveBeenLastCalledWith(true);
    wrapper.find('.kui-dropdown__label').simulate('click');
    expect(onToggleOpen).toHaveBeenLastCalledWith(false);
  });

  const pipelineIDs = mockState.animals.pipeline.ids.map((id, i) => [id, i]);
  test.each(pipelineIDs)(
    'should change the active pipeline to %s on clicking menu option %s',
    (id, i) => {
      const wrapper = setup.mount(<PipelineList onToggleOpen={jest.fn()} />);
      wrapper
        .find('MenuOption')
        .at(i)
        .simulate('click');
      expect(wrapper.find('PipelineList').props().pipeline.active).toBe(id);
    }
  );

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.animals)).toEqual({
      pipeline: {
        active: expect.any(String),
        main: expect.any(String),
        name: expect.any(Object),
        ids: expect.any(Array)
      },
      theme: mockState.animals.theme
    });
  });

  it('maps dispatch to props', async () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch).onUpdateActivePipeline({ value: '123' });
    expect(dispatch.mock.calls.length).toEqual(1);
  });
});
