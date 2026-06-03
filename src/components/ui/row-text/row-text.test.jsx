import React from 'react';
import { render } from '@testing-library/react';
import { RowText } from './row-text';

describe('RowText', () => {
  it('renders search highlight markers as bold text', () => {
    const { container } = render(
      <RowText kind="element" label="before <b>match</b> after" />
    );

    const label = container.querySelector('.row-text__label');
    const boldMatch = label.querySelector('b');

    expect(label).toHaveTextContent('before match after');
    expect(boldMatch).toHaveTextContent('match');
  });

  it('renders non-highlight HTML-like labels as text', () => {
    const labelText = '<img src=x onerror=alert(1)> <b><lambda></b>';
    const { container } = render(<RowText kind="element" label={labelText} />);

    const label = container.querySelector('.row-text__label');

    expect(label).toHaveTextContent('<img src=x onerror=alert(1)> <lambda>');
    expect(label.querySelector('img')).not.toBeInTheDocument();
    expect(label.querySelector('b')).toHaveTextContent('<lambda>');
  });
});
