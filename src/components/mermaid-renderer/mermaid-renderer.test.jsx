import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MermaidRenderer from './mermaid-renderer';

const mockStore = configureStore([]);

const renderWithStore = (props = {}, theme = 'dark') => {
  const store = mockStore({ theme });
  return render(
    <Provider store={store}>
      <MermaidRenderer {...props} />
    </Provider>
  );
};

describe('MermaidRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderWithStore({
      content: 'graph TD; A-->B;',
    });
    expect(
      container.querySelector('.pipeline-mermaid-renderer')
    ).toBeInTheDocument();
  });

  it('renders in preview mode', () => {
    const { container } = renderWithStore({
      content: 'graph TD; A-->B;',
      view: 'preview',
    });
    expect(
      container.querySelector('.pipeline-mermaid-renderer--preview')
    ).toBeInTheDocument();
  });

  it('renders in modal mode', () => {
    const { container } = renderWithStore({
      content: 'graph TD; A-->B;',
      view: 'modal',
    });
    expect(
      container.querySelector('.pipeline-mermaid-renderer--modal')
    ).toBeInTheDocument();
  });

  it('renders diagram content container', async () => {
    const { container } = renderWithStore({
      content: 'graph TD; A-->B;',
    });

    await waitFor(() => {
      expect(
        container.querySelector('.pipeline-mermaid-renderer__content')
      ).toBeInTheDocument();
    });
  });

  it('applies correct theme to mermaid initialization', () => {
    const mermaid = require('mermaid').default;
    renderWithStore({ content: 'graph TD; A-->B;' }, 'light');

    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'default',
        securityLevel: 'strict',
      })
    );
  });

  it('applies dark theme to mermaid initialization', () => {
    const mermaid = require('mermaid').default;
    renderWithStore({ content: 'graph TD; A-->B;' }, 'dark');

    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'dark',
        securityLevel: 'strict',
      })
    );
  });

  it('displays error message when rendering fails', async () => {
    const mermaid = require('mermaid').default;
    // Set up the mock to reject before rendering
    mermaid.render.mockRejectedValue(new Error('Invalid syntax'));

    const { container } = renderWithStore({
      content: 'invalid diagram',
    });

    await waitFor(
      () => {
        const errorElement = container.querySelector(
          '.pipeline-mermaid-renderer__error'
        );
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.textContent).toContain('Failed to render diagram');
      },
      { timeout: 3000 }
    );

    // Reset the mock back to success for other tests
    mermaid.render.mockResolvedValue({ svg: '<svg></svg>' });
  });
});
