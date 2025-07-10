import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ToggleControl } from './toggle-control';

const DummyIcon = (props) => <svg {...props} data-testid="icon" />;

describe('ToggleControl', () => {
  const baseProps = {
    name: 'Test Node',
    onChange: jest.fn(),
    onToggleHoveredFocusMode: jest.fn(),
    IconComponent: DummyIcon,
  };

  it('applies correct class for kind prop', () => {
    const kinds = ['modularPipeline', 'data', 'task'];
    kinds.forEach((kind) => {
      const { container } = render(
        <ToggleControl {...baseProps} kind={kind} />
      );
      const root = container.firstChild;
      expect(root.classList.contains(`toggle-control--kind-${kind}`)).toBe(
        true
      );
    });
  });

  it('does not apply "all-unchecked" class when allUnchecked is false', () => {
    const { container } = render(
      <ToggleControl {...baseProps} allUnchecked={false} />
    );
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.classList.contains('toggle-control--icon--all-unchecked')).toBe(
      false
    );
  });

  it('does not apply "disabled" class when disabled is false', () => {
    const { container } = render(
      <ToggleControl {...baseProps} disabled={false} />
    );
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.classList.contains('toggle-control--icon--disabled')).toBe(
      false
    );
  });

  it('does not apply "checked" class when isChecked is false', () => {
    const { container } = render(
      <ToggleControl {...baseProps} isChecked={false} />
    );
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.classList.contains('toggle-control--icon--checked')).toBe(
      false
    );
  });

  it('does not apply "parent" class when isParent is false', () => {
    const { container } = render(
      <ToggleControl {...baseProps} isParent={false} />
    );
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.classList.contains('toggle-control--icon--parent')).toBe(false);
  });

  it('does not throw if onToggleHoveredFocusMode is not provided', () => {
    const { container } = render(
      <ToggleControl {...baseProps} onToggleHoveredFocusMode={undefined} />
    );
    expect(() => {
      fireEvent.mouseEnter(container.firstChild);
    }).not.toThrow();
  });

  it('triggers onToggleHoveredFocusMode when provided', () => {
    const onToggleHoveredFocusMode = jest.fn();
    const { container } = render(
      <ToggleControl
        {...baseProps}
        onToggleHoveredFocusMode={onToggleHoveredFocusMode}
      />
    );
    fireEvent.mouseEnter(container.firstChild);
    expect(onToggleHoveredFocusMode).toHaveBeenCalledWith(true);
  });
});
