import React from 'react';
import { render } from '@testing-library/react';
import FiltersRow from './filters-row';

describe('FiltersRow Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<FiltersRow container="div" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders correct visible classnames', () => {
    const { container } = render(<FiltersRow container="div" visible={true} />);
    const row = container.querySelector('.filter-row');
    expect(row).toHaveClass('filter-row--visible');
  });

  it('renders correct unchecked classnames', () => {
    const { container } = render(
      <FiltersRow container="div" checked={false} />
    );
    const row = container.querySelector('.filter-row');
    expect(row).toHaveClass('filter-row--unchecked');
  });
});
