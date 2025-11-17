import React from 'react';
import { render } from '@testing-library/react';
import Dropdown from './dropdown';
import MenuOption from '../menu-option';

const mockData = [
  {
    defaultText: 'Test 123',
    onOpened: jest.fn(),
    onClosed: jest.fn(),
    onChanged: jest.fn(),
  },
  {
    defaultText: 'Test 456',
    onOpened: jest.fn(),
    onClosed: jest.fn(),
    onChanged: jest.fn(),
  },
];

mockData.forEach((dataSet, i) => {
  const jsx = (
    <Dropdown {...dataSet}>
      <MenuOption key={1} primaryText="Menu Item One" value={1} />
      <MenuOption key={2} primaryText="Menu Item Two" value={2} />
      <MenuOption key={3} primaryText="Menu Item Three" value={3} />
    </Dropdown>
  );

  describe(`Dropdown - Test ${i}`, () => {
    it('should be a function', () => {
      expect(typeof Dropdown).toBe('function');
    });

    it('should create a valid React component when called with required props', () => {
      const { container } = render(jsx);
      // Assert 3 children inside the dropdown menu
      const menuItems = container.querySelectorAll('.menu-option');
      expect(menuItems.length).toBe(3);
    });
  });
});
