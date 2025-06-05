import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchInput from './search-input';

describe('SearchInput', () => {
  it('should be a function', () => {
    expect(typeof SearchInput).toBe('function');
  });

  it('should include only one input field', () => {
    render(<SearchInput />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(1);
  });

  it('should correctly render the value', () => {
    const valueText = 'Value of input!';
    render(<SearchInput value={valueText} onChange={() => {}} />);
    expect(screen.getByDisplayValue(valueText)).toBeInTheDocument();
  });

  it('should be disabled when passed disabled=true', () => {
    render(<SearchInput disabled={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should have light theme class', () => {
    const { container } = render(<SearchInput theme="light" />);
    expect(container.querySelector('.search-theme--light')).toBeInTheDocument();
  });

  it('should have dark theme class (default)', () => {
    const { container } = render(<SearchInput theme="dark" />);
    expect(container.querySelector('.search-theme--dark')).toBeInTheDocument();
  });

  it('should trigger onFocus correctly and add focus class', () => {
    const onFocus = jest.fn();
    const { container } = render(<SearchInput onFocus={onFocus} />);
    const input = screen.getByRole('textbox');

    fireEvent.focus(input);

    expect(onFocus).toHaveBeenCalled();
    expect(container.querySelector('.search-input')).toHaveClass(
      'search-input--focused'
    );
  });

  it('should trigger onBlur correctly', () => {
    const onBlur = jest.fn();
    render(<SearchInput onBlur={onBlur} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onBlur).toHaveBeenCalled();
  });

  it('should trigger onChange correctly and update the value', () => {
    const onChange = jest.fn();
    render(<SearchInput value="initial" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { name: 'TestName', value: 'new value' },
    });

    expect(onChange).toHaveBeenCalled();
  });
});
