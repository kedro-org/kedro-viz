import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Banner from './banner';

describe('Banner', () => {
  const message = {
    title: 'test title',
    body: 'test body',
  };

  it('shows the banner component with the required message', () => {
    render(<Banner message={message} />);
    expect(screen.getByText(message.title)).toBeInTheDocument();
    expect(screen.getByText(message.body)).toBeInTheDocument();
  });

  it('renders the optional icon when provided', () => {
    const { container } = render(
      <Banner message={message} icon={<svg data-testid="test-icon" />} />
    );
    expect(container.querySelector('.banner-icon')).toBeInTheDocument();
  });

  it('does not render the optional redirect button by default', () => {
    const { container } = render(<Banner message={message} />);
    expect(container.querySelector('.kedro button')).not.toBeInTheDocument();
  });

  it('renders the optional redirect button when provided', () => {
    const btnUrl = 'https://example.com';
    const btnText = 'Test Redirect';
    render(<Banner message={message} btnUrl={btnUrl} btnText={btnText} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', btnUrl);

    const button = screen.getByRole('button', { name: btnText });
    expect(button).toBeInTheDocument();
  });

  it('calls onClose when close icon is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <Banner message={message} onClose={onClose} />
    );

    const closeButton = container.querySelector('.banner-close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the banner with correct positioning class', () => {
    const { container } = render(
      <Banner message={message} position="bottom" />
    );
    expect(container.querySelector('.banner-bottom')).toBeInTheDocument();
  });
});
