import React from 'react';
import { render, screen } from '@testing-library/react';
import LazyList, {
  range,
  rangeUnion,
  rangeEqual,
  thresholds,
} from './lazy-list';
import '@testing-library/jest-dom';

// Constants for rendering test
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

beforeAll(() => {
  window.innerHeight = viewportHeight;
  window.requestAnimationFrame = (callback) => callback(0);
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
  it('renders expected visible child items with padding for non-visible items', () => {
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

  it('range(from, to, min, max) returns [max(from, min), min(to, max)]', () => {
    expect(range(0, 1, 0, 1)).toEqual([0, 1]);
    expect(range(-1, 1, 0, 1)).toEqual([0, 1]);
    expect(range(-1, 2, 0, 1)).toEqual([0, 1]);
  });

  it('rangeUnion(a, b) returns [min(a[0], b[0]), max(a[1], b[1])]', () => {
    expect(rangeUnion([3, 7], [2, 10])).toEqual([2, 10]);
    expect(rangeUnion([2, 10], [3, 7])).toEqual([2, 10]);
    expect(rangeUnion([1, 7], [2, 10])).toEqual([1, 10]);
    expect(rangeUnion([3, 11], [2, 10])).toEqual([2, 11]);
    expect(rangeUnion([1, 11], [2, 10])).toEqual([1, 11]);
  });

  it('rangeEqual(a, b) returns true if a[0] = b[0] && a[1] = b[1]', () => {
    expect(rangeEqual([1, 2], [1, 2])).toBe(true);
    expect(rangeEqual([1, 2], [1, 3])).toBe(false);
    expect(rangeEqual([1, 2], [3, 1])).toBe(false);
  });

  it('thresholds(t) returns [0, ...n / t] except t = `0` returns `[0]`', () => {
    expect(thresholds(0)).toEqual([0]);
    expect(thresholds(1)).toEqual([0, 1]);
    expect(thresholds(2)).toEqual([0, 1 / 2, 1]);
    expect(thresholds(3)).toEqual([0, 1 / 3, 2 / 3, 1]);
    expect(thresholds(4)).toEqual([0, 1 / 4, 2 / 4, 3 / 4, 1]);
  });
});
