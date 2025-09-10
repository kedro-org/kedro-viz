import React from 'react';
import {
  PipelineWarning,
  mapStateToProps,
  mapDispatchToProps,
} from './pipeline-warning';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { mockState } from '../../utils/state.mock';

describe('PipelineWarning', () => {
  describe('LargePipelineWarning', () => {
    const defaultProps = {
      onDisable: jest.fn(),
      onHide: jest.fn(),
      nodes: ['node1', 'node2'],
      visible: true,
    };

    it('renders large pipeline warning without crashing', () => {
      render(<PipelineWarning {...defaultProps} />);
      expect(screen.getByText(/chonky pipeline/i)).toBeInTheDocument();
    });

    it('calls onHide when clicking "Render anyway"', () => {
      render(<PipelineWarning {...defaultProps} />);
      const renderBtn = screen.getByText(/render it anyway/i);
      fireEvent.click(renderBtn);
      expect(defaultProps.onHide).toHaveBeenCalled();
    });

    it('calls onDisable when clicking "Don’t show this again"', () => {
      render(<PipelineWarning {...defaultProps} />);
      const disableBtn = screen.getByText(/don't show this again/i);
      fireEvent.click(disableBtn);
      expect(defaultProps.onDisable).toHaveBeenCalled();
    });
  });

  describe('EmptyPipelineWarning', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('renders empty pipeline warning after delay', async () => {
      const props = {
        onDisable: jest.fn(),
        onHide: jest.fn(),
        nodes: [],
        visible: false,
      };
      render(<PipelineWarning {...props} />);
      await act(() => {
        jest.runAllTimers();
      });
      expect(
        screen.getByText(/oops, there's nothing to see here/i)
      ).toBeInTheDocument();
    });

    it('does not render warning when pipeline has nodes', () => {
      const props = {
        onDisable: jest.fn(),
        onHide: jest.fn(),
        nodes: ['node1'],
        visible: false,
      };
      render(<PipelineWarning {...props} />);
      expect(
        screen.queryByText(/oops, there's nothing to see here/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('mapStateToProps', () => {
    it('maps state to props', () => {
      const expectedResult = {
        theme: expect.any(String),
        nodes: expect.any(Object),
        sidebarVisible: expect.any(Boolean),
        visible: expect.any(Boolean),
      };
      expect(mapStateToProps(mockState.spaceflights)).toEqual(expectedResult);
    });
  });

  describe('mapDispatchToProps', () => {
    it('disables the size warning flag', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onDisable();
      expect(dispatch.mock.calls[0][0]).toEqual({
        type: 'CHANGE_FLAG',
        name: 'sizewarning',
        value: false,
      });
    });

    it('hides the size warning', () => {
      const dispatch = jest.fn();
      mapDispatchToProps(dispatch).onHide();
      expect(dispatch.mock.calls[0][0]).toEqual({
        type: 'TOGGLE_IGNORE_LARGE_WARNING',
        ignoreLargeWarning: true,
      });
    });
  });
});
