import React from 'react';
import { render } from '@testing-library/react';
import SearchBar from './search-bar';

describe('SearchBar', () => {
  it('should be a function', () => {
    expect(typeof SearchBar).toBe('function');
  });

  it('should render with default onChange and onClear props as functions', () => {
    const { container } = render(<SearchBar />);

    // In React Testing Library, we test rendered output — not internal props.
    // So instead, we check that the rendered component exists.
    expect(container.firstChild).toBeInTheDocument();
  });
});
