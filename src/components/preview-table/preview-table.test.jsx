import React from 'react';
import { render } from '@testing-library/react';
import PreviewTable from './preview-table';

const mockData = {
  columns: ['id', 'company_rating', 'company_location'],
  index: [0, 1, 2],
  data: [
    [1, '90%', 'London'],
    [2, '80%', 'Paris'],
    [3, '40%', 'Milan'],
  ],
};

describe('PreviewTable', () => {
  it('renders without crashing', () => {
    const { container } = render(<PreviewTable data={mockData} />);
    expect(container.querySelector('.preview-table')).toBeInTheDocument();
  });

  it('renders the correct number of headers and rows', () => {
    const { container } = render(<PreviewTable data={mockData} />);

    const headers = container.querySelectorAll('.preview-table__header');
    const rows = container.querySelectorAll('.preview-table__row');

    expect(headers.length).toBe(mockData.columns.length);
    expect(rows.length).toBe(mockData.index.length);
  });
});
