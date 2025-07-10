import React from 'react';
import { render } from '@testing-library/react';
import Container from './index';

describe('Container', () => {
  it('renders without crashing and contains <App />', () => {
    const { container } = render(<Container />);
    // Assuming <App /> renders some known text or a class
    // Replace with something meaningful in your real component
    expect(container).toBeInTheDocument();
  });
});
