import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Button from './button';
import '@testing-library/jest-dom';

describe('Button', () => {
  it('should be a function', () => {
    expect(typeof Button).toBe('function');
  });

  it('should include only one button field', () => {
    const { container } = render(<Button />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1);
  });

  it('should correctly render its text value', () => {
    const text = 'I am a button!';
    const { getByRole } = render(<Button>{text}</Button>);
    expect(getByRole('button')).toHaveTextContent(text);
  });

  it('should handle click events', () => {
    const onClick = jest.fn();
    const { getByRole } = render(<Button onClick={onClick} />);
    fireEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should handle submit events in form', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    const { getByRole } = render(
      <form onSubmit={onSubmit}>
        <Button type="submit" />
      </form>
    );
    fireEvent.submit(getByRole('button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
