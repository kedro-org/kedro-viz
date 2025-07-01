import React from 'react';
import WorkflowWrapper from './workflow-wrapper';
import { setup } from '../../utils/state.mock';

// Mock the Workflow component
jest.mock('../workflow/workflow', () => () => (
  <div data-testid="mock-workflow" />
));

describe('WorkflowWrapper', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(<WorkflowWrapper />);
    const workflow = container.querySelector('[data-testid="mock-workflow"]');
    expect(workflow).toBeInTheDocument();
  });

  it('renders the Workflow component', () => {
    const { getByTestId } = setup.render(<WorkflowWrapper />);
    expect(getByTestId('mock-workflow')).toBeInTheDocument();
  });
});
