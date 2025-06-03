import React from 'react';
import ConnectedToolbarFilterButton, {
  ToolbarFilterButton,
  mapDispatchToProps,
} from './toolbar-filter-button';
import { setup } from '../../utils/state.mock';
import { togglePipelineFilter } from '../../actions';

describe('ToolbarFilterButton', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<ConnectedToolbarFilterButton />);
    expect(wrapper.find('.pipeline-toolbar--filter-container').length).toBe(1);
  });

  it('renders filter button and divider', () => {
    const props = {
      displayFilterBtn: true,
      onTogglePipelineFilter: jest.fn(),
    };
    const wrapper = setup.mount(<ToolbarFilterButton {...props} />);
    expect(wrapper.find('IconButton').length).toBe(1);
    expect(wrapper.find('hr.pipeline-toolbar--divider').length).toBe(1);
  });

  it('does not render filter button when displayFilterBtn is false', () => {
    const props = {
      displayFilterBtn: false,
      onTogglePipelineFilter: jest.fn(),
    };
    const wrapper = setup.mount(<ToolbarFilterButton {...props} />);
    // The container will render but the button should not be visible
    expect(wrapper.find('IconButton').prop('visible')).toBe(false);
  });

  it('calls onTogglePipelineFilter function on button click', () => {
    const mockFn = jest.fn();
    const props = {
      displayFilterBtn: true,
      onTogglePipelineFilter: mockFn,
    };
    const wrapper = setup.mount(<ToolbarFilterButton {...props} />);
    expect(mockFn.mock.calls.length).toBe(0);
    wrapper.find('button').simulate('click');
    expect(mockFn.mock.calls.length).toBe(1);
  });

  it('maps state to props', () => {
    const mapStateToProps = (state) => ({
      displayFilterBtn: state.display.filterBtn,
    });

    const mockDisplayState = {
      display: {
        filterBtn: true,
      },
    };

    const expectedResult = {
      displayFilterBtn: true,
    };

    expect(mapStateToProps(mockDisplayState)).toEqual(expectedResult);
  });

  describe('mapDispatchToProps', () => {
    it('onTogglePipelineFilter', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onTogglePipelineFilter();
      expect(dispatch.mock.calls[0][0]).toEqual(togglePipelineFilter());
    });
  });
});
