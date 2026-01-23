import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PreviewWrapper from './preview-wrapper';
import '@testing-library/jest-dom';

describe('PreviewWrapper', () => {
  it('should be a function', () => {
    expect(typeof PreviewWrapper).toBe('function');
  });

  it('should render children content', () => {
    const testContent = 'Test preview content';
    const { getByText } = render(
      <PreviewWrapper>
        <div>{testContent}</div>
      </PreviewWrapper>
    );
    expect(getByText(testContent)).toBeInTheDocument();
  });

  it('should render expand button with correct text', () => {
    const { getByRole } = render(
      <PreviewWrapper>
        <div>Content</div>
      </PreviewWrapper>
    );
    const expandButton = getByRole('button', { name: /expand preview/i });
    expect(expandButton).toBeInTheDocument();
  });

  it('should call onExpand when expand button is clicked', () => {
    const onExpand = jest.fn();
    const { getByRole } = render(
      <PreviewWrapper onExpand={onExpand}>
        <div>Content</div>
      </PreviewWrapper>
    );
    const expandButton = getByRole('button', { name: /expand preview/i });
    fireEvent.click(expandButton);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('should render shadow boxes when showShadows is true', () => {
    const { container } = render(
      <PreviewWrapper showShadows={true}>
        <div>Content</div>
      </PreviewWrapper>
    );
    expect(
      container.querySelector('.scrollable-container')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.pipeline-metadata__preview-shadow-box-right')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.pipeline-metadata__preview-shadow-box-bottom')
    ).toBeInTheDocument();
  });

  it('should not render shadow boxes when showShadows is false', () => {
    const { container } = render(
      <PreviewWrapper showShadows={false}>
        <div>Content</div>
      </PreviewWrapper>
    );
    expect(
      container.querySelector('.scrollable-container')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('.pipeline-metadata__preview-shadow-box-right')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('.pipeline-metadata__preview-shadow-box-bottom')
    ).not.toBeInTheDocument();
  });

  it('should apply default className when not provided', () => {
    const { container } = render(
      <PreviewWrapper>
        <div>Content</div>
      </PreviewWrapper>
    );
    expect(
      container.querySelector('.pipeline-metadata__preview')
    ).toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    const customClass = 'custom-preview-class';
    const { container } = render(
      <PreviewWrapper className={customClass}>
        <div>Content</div>
      </PreviewWrapper>
    );
    expect(container.querySelector(`.${customClass}`)).toBeInTheDocument();
  });

  it('should call onClick when preview container is clicked', () => {
    const onClick = jest.fn();
    const { container } = render(
      <PreviewWrapper onClick={onClick}>
        <div>Content</div>
      </PreviewWrapper>
    );
    const previewContainer = container.querySelector(
      '.pipeline-metadata__preview'
    );
    fireEvent.click(previewContainer);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not throw error when onClick is not provided', () => {
    const { container } = render(
      <PreviewWrapper>
        <div>Content</div>
      </PreviewWrapper>
    );
    const previewContainer = container.querySelector(
      '.pipeline-metadata__preview'
    );
    expect(() => fireEvent.click(previewContainer)).not.toThrow();
  });

  it('should not throw error when onExpand is not provided', () => {
    const { getByRole } = render(
      <PreviewWrapper>
        <div>Content</div>
      </PreviewWrapper>
    );
    const expandButton = getByRole('button', { name: /expand preview/i });
    expect(() => fireEvent.click(expandButton)).not.toThrow();
  });
});
