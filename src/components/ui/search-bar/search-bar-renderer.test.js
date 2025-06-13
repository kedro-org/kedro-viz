import React from 'react';
import { render } from '@testing-library/react';
import SearchBarRenderer from './search-bar-renderer';

describe('SearchBarRenderer', () => {
  it('should be a function', () => {
    expect(typeof SearchBarRenderer).toBe('function');
  });

  it('should render correct structure', () => {
    const { container } = render(
      <SearchBarRenderer
        placeholder="hello world"
        isFocused={true}
        onBlur={() => {}}
        onChange={() => {}}
        onClear={() => {}}
        onFocus={() => {}}
        showClearButton={true}
        theme="dark"
        value="hello world"
      />
    );

    const searchIcon = container.querySelector(
      '.search-bar__icon-wrapper .icon'
    );
    const closeIcon = container.querySelector(
      '.search-bar__dynamic-icon .icon'
    );

    expect(searchIcon).toBeInTheDocument();
    expect(closeIcon).toBeInTheDocument();
  });
});
