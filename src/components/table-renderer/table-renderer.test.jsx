import React from 'react';
import { render } from '@testing-library/react';
import TableRenderer from './table-renderer';

const mockData = {
  columns: ['id', 'company_rating', 'company_location', 'bool_col'],
  index: [0, 1, 2],
  data: [
    [1, '90%', 'London', true],
    [2, '80%', 'Paris', false],
    [3, '40%', 'Milan', true],
  ],
};

describe('TableRenderer', () => {
  it('renders without crashing', () => {
    const { container } = render(<TableRenderer data={mockData} />);
    expect(container.querySelector('.table-renderer')).toBeInTheDocument();
  });

  it('renders the correct number of headers and rows', () => {
    const { container } = render(<TableRenderer data={mockData} />);

    const headers = container.querySelectorAll('.table-renderer__header');
    const rows = container.querySelectorAll('.table-renderer__row');

    expect(headers.length).toBe(mockData.columns.length);
    expect(rows.length).toBe(mockData.index.length);
  });

  it('renders boolean values as strings', () => {
    const { container } = render(<TableRenderer data={mockData} />);

    const lastColumnCells = container.querySelectorAll(
      '.table-renderer__row > td:last-child'
    );

    lastColumnCells.forEach((cell) => {
      expect(['true', 'false']).toContain(cell.textContent);
    });
  });
});
