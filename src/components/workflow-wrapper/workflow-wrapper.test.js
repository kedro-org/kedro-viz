import React from 'react';
import WorkflowWrapper from './workflow-wrapper';
import { setup } from '../../utils/state.mock';

// Mock the Workflow component
jest.mock('../workflow/workflow', () => () => (
  <div data-testid="mock-workflow" />
));
// Mock the RunNotFoundWarning component
jest.mock('../run-not-found-warning/run-not-found-warning', () => () => (
  <div data-testid="mock-run-not-found-warning" />
));

// Mock the selector to control which component is rendered
const mockIsRunStatusAvailable = jest.fn();
jest.mock('../../selectors/run-status', () => ({
  isRunStatusAvailable: () => mockIsRunStatusAvailable(),
}));

describe('WorkflowWrapper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Workflow component when run status is available', () => {
    mockIsRunStatusAvailable.mockReturnValue(true);
    const { getByTestId, queryByTestId } = setup.render(<WorkflowWrapper />);
    expect(getByTestId('mock-workflow')).toBeInTheDocument();
    expect(queryByTestId('mock-run-not-found-warning')).not.toBeInTheDocument();
  });

  it('renders the RunNotFoundWarning component when run status is not available', () => {
    mockIsRunStatusAvailable.mockReturnValue(false);
    const { getByTestId, queryByTestId } = setup.render(<WorkflowWrapper />);
    expect(getByTestId('mock-run-not-found-warning')).toBeInTheDocument();
    expect(queryByTestId('mock-workflow')).not.toBeInTheDocument();
  });
});
