import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ErrorLog from './error-log';

describe('ErrorLog Component', () => {
  const mockOnToggleCode = jest.fn();

  const defaultProps = {
    onToggleCode: mockOnToggleCode,
    visibleTraceback: false,
    isDataNode: false,
    nodeName: 'test_node',
  };

  const mockErrorDetails = {
    message: 'Test error message',
    error_operation: 'loading', // eslint-disable-line camelcase
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ErrorLog {...defaultProps} />);
    expect(screen.getByText('No error details available.')).toBeInTheDocument();
  });

  describe('when no error details are provided', () => {
    it('displays fallback message', () => {
      render(<ErrorLog {...defaultProps} errorDetails={null} />);
      expect(
        screen.getByText('No error details available.')
      ).toBeInTheDocument();
    });
  });

  describe('when error details are provided', () => {
    it('renders complete error log structure', () => {
      render(<ErrorLog {...defaultProps} errorDetails={mockErrorDetails} />);

      expect(screen.getByText('Show traceback')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Please refer to the CLI for the full error log and details.'
        )
      ).toBeInTheDocument();
      expect(
        document.querySelector('.error-log--details pre')
      ).toBeInTheDocument();
    });

    it('displays error message content', () => {
      render(<ErrorLog {...defaultProps} errorDetails={mockErrorDetails} />);

      const preElement = document.querySelector('.error-log--details pre');
      expect(preElement.innerHTML).toBe('Test error message');
    });
  });

  describe('error headers', () => {
    it('shows task node header with node name', () => {
      render(
        <ErrorLog
          {...defaultProps}
          errorDetails={mockErrorDetails}
          isDataNode={false}
          nodeName="my_task"
        />
      );

      expect(
        screen.getByText('Failed while performing function: my_task')
      ).toBeInTheDocument();
    });

    it('shows data node header for loading operation', () => {
      render(
        <ErrorLog
          {...defaultProps}
          errorDetails={mockErrorDetails}
          isDataNode={true}
        />
      );

      expect(
        screen.getByText('Failed while loading data from dataset.')
      ).toBeInTheDocument();
    });

    it('shows data node header for saving operation', () => {
      const savingErrorDetails = {
        ...mockErrorDetails,
        error_operation: 'saving', // eslint-disable-line camelcase
      };

      render(
        <ErrorLog
          {...defaultProps}
          errorDetails={savingErrorDetails}
          isDataNode={true}
        />
      );

      expect(
        screen.getByText('Failed while saving data to dataset.')
      ).toBeInTheDocument();
    });

    it('shows default data node header when operation is missing', () => {
      const noOperationErrorDetails = {
        message: 'Test error message',
      };

      render(
        <ErrorLog
          {...defaultProps}
          errorDetails={noOperationErrorDetails}
          isDataNode={true}
        />
      );

      expect(
        screen.getByText('Failed while loading/saving data to/from dataset.')
      ).toBeInTheDocument();
    });
  });

  describe('toggle functionality', () => {
    it('calls onToggleCode when toggle is clicked', () => {
      render(<ErrorLog {...defaultProps} errorDetails={mockErrorDetails} />);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(mockOnToggleCode).toHaveBeenCalledTimes(1);
    });
  });
});
