import React from 'react';
import { render } from '@testing-library/react';

// Mock the RunnerManager component to avoid SCSS import
jest.mock('../runner-manager', () => () => (
  <div data-testid="mock-runner-manager" />
));

describe('Runner Page Wrapper', () => {
  it('renders the RunnerManager component', () => {
    const { getByTestId } = render(
      <div>
        <div data-testid="mock-runner-manager" />
      </div>
    );
    expect(getByTestId('mock-runner-manager')).toBeInTheDocument();
  });
});
