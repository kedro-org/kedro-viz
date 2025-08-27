import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Toggle from './toggle';
import '@testing-library/jest-dom';

describe('Toggle', () => {
  const renderToggle = (props = {}) => {
    const defaultProps = {
      checked: false,
      enabled: true,
      onChange: jest.fn(),
    };
    return render(<Toggle {...defaultProps} {...props} />);
  };

  it('is checked when checked is true', () => {
    const { container } = renderToggle({ checked: true });
    const input = container.querySelector('.pipeline-toggle-input');
    const label = container.querySelector('.pipeline-toggle-label');
    expect(input?.checked).toBe(true);
    expect(label?.classList.contains('pipeline-toggle-label--checked')).toBe(
      true
    );
  });

  it('is not checked when checked is false', () => {
    const { container } = renderToggle({ checked: false });
    const input = container.querySelector('.pipeline-toggle-input');
    const label = container.querySelector('.pipeline-toggle-label');
    expect(input?.checked).toBe(false);
    expect(label?.classList.contains('pipeline-toggle-label--checked')).toBe(
      false
    );
  });

  it('is disabled when enabled is false', () => {
    const { container } = renderToggle({ enabled: false });
    const input = container.querySelector('.pipeline-toggle-input');
    expect(input?.disabled).toBe(true);
  });

  it('is not disabled when enabled is true', () => {
    const { container } = renderToggle({ enabled: true });
    const input = container.querySelector('.pipeline-toggle-input');
    expect(input?.disabled).toBe(false);
  });

  it('onChange callback fires when input changed', () => {
    const onChange = jest.fn();
    const { container } = renderToggle({ checked: true, onChange });
    const input = container.querySelector('.pipeline-toggle-input');
    fireEvent.click(input);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
