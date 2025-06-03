import React from 'react';
import { render, screen } from '@testing-library/react';
import LazyList from './lazy-list';
import '@testing-library/jest-dom';

// Constants
const itemCount = 500;
const itemHeight = 30;
const visibleStart = 10;
const visibleEnd = 40;
const visibleCount = visibleEnd - visibleStart;
const viewportHeight = itemHeight * visibleCount;
const containerHeight = viewportHeight * 2;
const containerScrollY = itemHeight * visibleStart * 0.5;
const viewportScrollY = containerScrollY;
const itemWidth = itemHeight * 5;

const items = Array.from({ length: itemCount }, (_, i) => i);
const itemHeights = (start, end) => (end - start) * itemHeight;

const listRender = ({
  start,
  end,
  listRef,
  upperRef,
  lowerRef,
  listStyle,
  upperStyle,
  lowerStyle,
}) => (
  <div
    style={{
      overflowY: 'scroll',
      height: containerHeight,
      width: itemWidth,
    }}
  >
    <ul
      className="test-list"
      ref={listRef}
      style={{ ...listStyle, width: itemWidth }}
    >
      <li ref={upperRef} style={upperStyle} />
      <li ref={lowerRef} style={lowerStyle} />
      {items.slice(start, end).map((i) => (
        <li key={i} className="test-item">
          Item {i}
        </li>
      ))}
    </ul>
  </div>
);

// DOM mocks
beforeAll(() => {
  window.innerHeight = viewportHeight;

  window.requestAnimationFrame = (frameCallback) => frameCallback(0);

  window.IntersectionObserver = function (onIntersect) {
    return {
      observe: () => onIntersect(),
      disconnect: () => {},
    };
  };

  Element.prototype.getBoundingClientRect = function () {
    const width = parseInt(this.style?.width) || 0;
    const height = parseInt(this.style?.height) || 0;
    const offsetY = -viewportScrollY - containerScrollY;
    return {
      x: 0,
      y: offsetY,
      top: offsetY,
      bottom: offsetY + height,
      left: 0,
      right: width,
      width,
      height,
    };
  };
});

describe('LazyList', () => {
  it('renders expected visible items and applies correct padding and height', () => {
    render(
      <LazyList
        buffer={0}
        dispose={true}
        height={itemHeights}
        total={items.length}
        container={(el) => el?.parentElement}
      >
        {listRender}
      </LazyList>
    );

    const expectedItems = Array.from(
      { length: visibleCount },
      (_, i) => `Item ${visibleStart + i}`
    );

    const renderedItems = screen
      .getAllByText(/Item \d+/)
      .map((el) => el.textContent);

    expect(renderedItems).toEqual(expectedItems);
    expect(renderedItems.length).toBe(visibleCount);
    expect(renderedItems.length).toBeLessThan(itemCount);

    const listElement = document.querySelector('.test-list');
    const computedStyle = getComputedStyle(listElement);

    expect(parseInt(computedStyle.paddingTop)).toBe(visibleStart * itemHeight);
    expect(parseInt(computedStyle.height)).toBe(itemCount * itemHeight);
  });
});
