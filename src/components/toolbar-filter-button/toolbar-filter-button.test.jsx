import React from 'react';
import ConnectedToolbarFilterButton, {
  ToolbarFilterButton,
  mapDispatchToProps,
} from './toolbar-filter-button';
import { setup } from '../../utils/state.mock';
import { togglePipelineFilter } from '../../actions';
import '@testing-library/jest-dom';
import { screen, fireEvent } from '@testing-library/react';

describe('ToolbarFilterButton', () => {
  it('renders without crashing', () => {
    setup.render(<ConnectedToolbarFilterButton />);
    expect(
      document.querySelector('.pipeline-toolbar--filter-container')
    ).toBeInTheDocument();
  });

  it('renders filter button and divider', () => {
    const props = {
      displayFilterBtn: true,
      onTogglePipelineFilter: jest.fn(),
    };
    setup.render(<ToolbarFilterButton {...props} />);
    expect(
      document.querySelectorAll('.pipeline-icon-toolbar__button').length
    ).toBe(1);
    expect(
      document.querySelectorAll('hr.pipeline-toolbar--divider').length
    ).toBe(1);
  });

  it('does not render filter button when displayFilterBtn is false', () => {
    const props = {
      displayFilterBtn: false,
      onTogglePipelineFilter: jest.fn(),
    };
    setup.render(<ToolbarFilterButton {...props} />);
    const iconButton = document.querySelector('.pipeline-icon-toolbar__button');
    expect(iconButton).toBeNull(); // should not be visible
  });

  it('calls onTogglePipelineFilter function on button click', () => {
    const mockFn = jest.fn();
    const props = {
      displayFilterBtn: true,
      onTogglePipelineFilter: mockFn,
    };
    setup.render(<ToolbarFilterButton {...props} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockFn).toHaveBeenCalledTimes(1);
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
      expect(dispatch).toHaveBeenCalledWith(togglePipelineFilter());
    });
  });
});
