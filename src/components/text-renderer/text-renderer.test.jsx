import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import TextRenderer from './text-renderer';

const mockStore = configureStore([]);

const renderWithStore = (props = {}, theme = 'dark') => {
  const store = mockStore({
    theme,
    visible: {
      sidebar: true,
    },
  });
  return render(
    <Provider store={store}>
      <TextRenderer {...props} />
    </Provider>
  );
};

describe('TextRenderer', () => {
  it('renders plain text correctly', () => {
    const { container } = renderWithStore({ content: 'Hello World' });
    const element = container.querySelector('.pipeline-text-renderer');
    expect(element).toBeInTheDocument();
  });

  it('renders text content in preview mode', () => {
    const content = 'Sample text content';
    const { container } = renderWithStore({ content, view: 'preview' });
    const preElement = container.querySelector(
      '.pipeline-text-renderer__content'
    );
    expect(preElement).toBeInTheDocument();
    expect(preElement.textContent).toBe(content);
  });

  it('renders text content in modal mode', () => {
    const { container } = renderWithStore({ content: 'Test', view: 'modal' });
    const element = container.querySelector('.pipeline-text-renderer--modal');
    expect(element).toBeInTheDocument();
  });

  it('renders code with syntax highlighting when language is provided', () => {
    const { container } = renderWithStore({
      content: "def hello():\n    return 'world'",
      meta: { language: 'python' },
    });
    // When language is provided, SyntaxHighlighter component should be used
    const codeWrapper = container.querySelector(
      '.pipeline-text-renderer__code'
    );
    expect(codeWrapper).toBeInTheDocument();
    const syntaxHighlighter = container.querySelector('.syntax-highlighter');
    expect(syntaxHighlighter).toBeInTheDocument();
  });

  it('applies correct theme', () => {
    const { container } = renderWithStore({ content: 'Test' }, 'light');
    expect(
      container.querySelector('.pipeline-text-renderer')
    ).toBeInTheDocument();
  });
});
