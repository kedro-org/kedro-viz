import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Switch from './switch';

describe('Switch', () => {
  it('renders without crashing', () => {
    const { container } = render(<Switch />);
    expect(container.querySelector('.switch')).toBeInTheDocument();
  });

  it('renders with a default checked option', () => {
    const { container } = render(<Switch defaultChecked />);
    expect(
      container.querySelector('.switch__base--active')
    ).toBeInTheDocument();
  });

  it('calls a function on click and adds an active class', () => {
    const { container } = render(<Switch />);
    const toggle = container.querySelector('.switch');

    // Pre-check: should not have active class
    expect(
      container.querySelector('.switch__base--active')
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    // Post-check: should have active class
    expect(
      container.querySelector('.switch__base--active')
    ).toBeInTheDocument();
  });
});
