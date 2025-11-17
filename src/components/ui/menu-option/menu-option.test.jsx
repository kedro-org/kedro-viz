import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MenuOption from '.';

const mockData = [
  {
    primaryText: 'Test 123',
    onSelected: jest.fn(),
  },
  {
    primaryText: 'Test 456',
    onSelected: jest.fn(),
  },
];

mockData.forEach((dataSet, i) => {
  const jsx = <MenuOption {...dataSet} />;

  describe(`Menu Option - Test ${i}`, () => {
    it('should be a function', () => {
      expect(typeof MenuOption).toBe('function');
    });

    it('should contain text', () => {
      const { container } = render(jsx);
      const content = container.querySelector('.menu-option__content');

      expect(content).not.toBeNull();
      expect(content?.textContent).toBe(dataSet.primaryText);
      expect(content?.getAttribute('title')).toBe(dataSet.primaryText);
    });

    if (typeof dataSet.onSelected === 'function') {
      it('should fire onSelected event handler when clicked', () => {
        const { container } = render(jsx);
        const content = container.querySelector('.menu-option__content');
        fireEvent.click(content);
        expect(dataSet.onSelected).toHaveBeenCalled();
      });
    }
  });
});
