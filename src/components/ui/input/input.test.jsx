import React from 'react';
import { render, screen } from '@testing-library/react';
import Input from '.';

describe('Input', () => {
  it('renders without crashing', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('.input')).toBeInTheDocument();
    expect(container.querySelector('.input--large')).toBeInTheDocument();
  });

  it('renders with a smaller font size and a character counter', () => {
    const { container } = render(<Input characterLimit={50} size="small" />);
    expect(container.querySelector('.input')).toBeInTheDocument();
    expect(container.querySelector('.input--small')).toBeInTheDocument();
    expect(
      container.querySelector('.input-character-count')
    ).toBeInTheDocument();
  });

  it('renders with a default text value with type textarea', () => {
    render(<Input type="textarea" defaultValue="Default!" />);
    const textarea = screen.getByDisplayValue('Default!');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders with a default text value with type input', () => {
    render(<Input type="input" defaultValue="Default!" />);
    const input = screen.getByDisplayValue('Default!');
    expect(input.tagName).toBe('INPUT');
  });
});
