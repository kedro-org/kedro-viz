import React from 'react';
import Tooltip, { insertZeroWidthSpace } from './tooltip';
import { setup } from '../../../utils/state.mock';
import { globalToolbarWidth, sidebarWidth } from '../../../config';

const mockProps = {
  chartSize: {
    height: 766,
    left: 0,
    outerHeight: 766,
    outerWidth: 1198,
    sidebarWidth: sidebarWidth.open,
    top: 0,
    width: 898,
  },
  targetRect: {
    bottom: 341.05895,
    height: 2.1011,
    left: 856.19622,
    right: 866.03076,
    top: 338.95785,
    width: 9.83453,
    x: 856.19622,
    y: 338.95785,
  },
  text: 'lorem_ipsum-dolor: sit [amet]',
  visible: true,
};

describe('Tooltip', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(<Tooltip {...mockProps} />);
    expect(container.querySelector('.pipeline-tooltip')).toBeInTheDocument();
  });

  it('does not add --top when tooltip is towards bottom', () => {
    const { container } = setup.render(
      <Tooltip
        {...mockProps}
        targetRect={{
          ...mockProps.targetRect,
          top: mockProps.chartSize.height - 10,
        }}
      />
    );
    expect(
      container.querySelector('.pipeline-tooltip--top')
    ).not.toBeInTheDocument();
  });

  it('does not add --right when tooltip is towards left', () => {
    const { container } = setup.render(
      <Tooltip
        {...mockProps}
        targetRect={{ ...mockProps.targetRect, left: 10 }}
      />
    );
    expect(
      container.querySelector('.pipeline-tooltip--right')
    ).not.toBeInTheDocument();
  });

  it('adds --top when tooltip is towards top', () => {
    const { container } = setup.render(
      <Tooltip
        {...mockProps}
        targetRect={{ ...mockProps.targetRect, top: 10 }}
      />
    );
    expect(
      container.querySelector('.pipeline-tooltip--top')
    ).toBeInTheDocument();
  });

  it('adds --right when tooltip is towards right', () => {
    const { container } = setup.render(
      <Tooltip
        {...mockProps}
        targetRect={{
          ...mockProps.targetRect,
          left: mockProps.chartSize.width - 10 + globalToolbarWidth,
        }}
      />
    );
    expect(
      container.querySelector('.pipeline-tooltip--right')
    ).toBeInTheDocument();
  });

  it('adds --no-delay when noDelay is true', () => {
    const { container } = setup.render(
      <Tooltip
        {...mockProps}
        noDelay
        targetRect={{
          ...mockProps.targetRect,
          left: mockProps.chartSize.width - 10 + globalToolbarWidth,
        }}
      />
    );
    expect(
      container.querySelector('.pipeline-tooltip--no-delay')
    ).toBeInTheDocument();
  });

  it('adds --center-arrow when centerArrow is true', () => {
    const { container } = setup.render(
      <Tooltip
        {...mockProps}
        centerArrow
        targetRect={{
          ...mockProps.targetRect,
          left: mockProps.chartSize.width - 10 + globalToolbarWidth,
        }}
      />
    );
    expect(
      container.querySelector('.pipeline-tooltip--center-arrow')
    ).toBeInTheDocument();
  });

  it('adds --small-arrow when arrowSize is small', () => {
    const { container } = setup.render(
      <Tooltip
        {...mockProps}
        arrowSize="small"
        targetRect={{
          ...mockProps.targetRect,
          left: mockProps.chartSize.width - 10 + globalToolbarWidth,
        }}
      />
    );
    expect(
      container.querySelector('.pipeline-tooltip--small-arrow')
    ).toBeInTheDocument();
  });
});

describe('insertZeroWidthSpace', () => {
  const zero = String.fromCharCode(0x200b);
  const wrap = (text) => zero + text + zero;

  describe('special characters', () => {
    const characters = '-_[]/:\\!@£$%^&*()'.split('');
    test.each(characters)('wraps %s with zero-width space', (char) => {
      const result = insertZeroWidthSpace(char);
      expect(result).toBe(wrap(char));
      expect(result.length).toBe(3);
    });
  });

  describe('alphanumeric characters', () => {
    const characters = ['a', 'B', '123', 'aBc123', '0', ''];
    test.each(characters)('does not wrap %s', (char) => {
      const result = insertZeroWidthSpace(char);
      expect(result).toBe(char);
      expect(result.length).toBe(char.length);
    });
  });

  describe('spaces', () => {
    const characters = [' ', '\t', '\n', 'a b', ' a '];
    test.each(characters)('does not wrap %s', (char) => {
      const result = insertZeroWidthSpace(char);
      expect(result).toBe(char);
      expect(result.length).toBe(char.length);
    });
  });
});
