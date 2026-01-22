import React from 'react';
import { render } from '@testing-library/react';
import TextRenderer from './text-renderer';

describe('TextRenderer', () => {
  it('renders plain text correctly', () => {
    const { container } = render(<TextRenderer content="Hello World" />);
    const element = container.querySelector('.pipeline-text-renderer');
    expect(element).toBeInTheDocument();
  });

  it('renders text content in preview mode', () => {
    const content = 'Sample text content';
    const { container } = render(
      <TextRenderer content={content} view="preview" />
    );
    const preElement = container.querySelector(
      '.pipeline-text-renderer__content'
    );
    expect(preElement).toBeInTheDocument();
    expect(preElement.textContent).toBe(content);
  });

  it('renders text content in modal mode', () => {
    const { container } = render(<TextRenderer content="Test" view="modal" />);
    const element = container.querySelector('.pipeline-text-renderer--modal');
    expect(element).toBeInTheDocument();
  });

  it('renders code with syntax highlighting when language is provided', () => {
    const { container } = render(
      <TextRenderer
        content="def hello():\n    return 'world'"
        meta={{ language: 'python' }}
      />
    );
    // When language is provided, SyntaxHighlighter component should be used
    const codeWrapper = container.querySelector(
      '.pipeline-text-renderer__code'
    );
    expect(codeWrapper).toBeInTheDocument();
    const syntaxHighlighter = container.querySelector('.syntax-highlighter');
    expect(syntaxHighlighter).toBeInTheDocument();
  });

  it('renders without meta prop', () => {
    const { container } = render(<TextRenderer content="Test content" />);
    expect(
      container.querySelector('.pipeline-text-renderer__content')
    ).toBeInTheDocument();
  });
});
