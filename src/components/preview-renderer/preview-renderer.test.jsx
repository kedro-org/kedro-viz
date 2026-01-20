import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PreviewRenderer from './preview-renderer';
import '@testing-library/jest-dom';

// Mock child components
jest.mock('../plotly-renderer', () => {
  return function PlotlyRenderer({ data, layout, view }) {
    return (
      <div data-testid="plotly-renderer" data-view={view}>
        Plotly Chart
      </div>
    );
  };
});

jest.mock('../table-renderer', () => {
  return function TableRenderer({ data, size }) {
    return (
      <div data-testid="table-renderer" data-size={size}>
        Table Content
      </div>
    );
  };
});

jest.mock('../json-renderer', () => {
  return function JsonRenderer({ value, theme }) {
    return (
      <div data-testid="json-renderer" data-theme={theme}>
        JSON Content
      </div>
    );
  };
});

jest.mock('../html-renderer', () => {
  return function HTMLRenderer({ content, fontSize }) {
    return (
      <div data-testid="html-renderer" data-fontsize={fontSize}>
        HTML Content
      </div>
    );
  };
});

jest.mock('../metadata/preview-wrapper', () => {
  return function PreviewWrapper({ children, onExpand, className }) {
    return (
      <div data-testid="preview-wrapper" className={className}>
        {children}
        <button onClick={onExpand}>Expand</button>
      </div>
    );
  };
});

describe('PreviewRenderer', () => {
  it('should be a function', () => {
    expect(typeof PreviewRenderer).toBe('function');
  });

  it('should return null when normalizedPreview is null', () => {
    const { container } = render(
      <PreviewRenderer normalizedPreview={null} view="preview" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should return null when normalizedPreview is undefined', () => {
    const { container } = render(
      <PreviewRenderer normalizedPreview={undefined} view="preview" />
    );
    expect(container.firstChild).toBeNull();
  });

  describe('Plotly previews', () => {
    const plotlyPreview = {
      kind: 'plotly',
      content: {
        data: [{ x: [1, 2, 3], y: [4, 5, 6] }],
        layout: { title: 'Test Plot' },
      },
    };

    it('should render PlotlyRenderer in preview mode', () => {
      const { getByTestId } = render(
        <PreviewRenderer
          normalizedPreview={plotlyPreview}
          view="preview"
          theme="light"
        />
      );
      expect(getByTestId('plotly-renderer')).toBeInTheDocument();
      expect(getByTestId('plotly-renderer')).toHaveAttribute(
        'data-view',
        'preview'
      );
      expect(getByTestId('preview-wrapper')).toBeInTheDocument();
    });

    it('should render PlotlyRenderer in modal mode', () => {
      const { getByTestId, queryByTestId } = render(
        <PreviewRenderer
          normalizedPreview={plotlyPreview}
          view="modal"
          theme="light"
        />
      );
      expect(getByTestId('plotly-renderer')).toBeInTheDocument();
      expect(getByTestId('plotly-renderer')).toHaveAttribute(
        'data-view',
        'modal'
      );
      expect(queryByTestId('preview-wrapper')).not.toBeInTheDocument();
    });
  });

  describe('Image previews', () => {
    const imagePreview = {
      kind: 'image',
      content: 'base64EncodedImage',
    };

    it('should render image in preview mode with base64 encoding', () => {
      const { container, getByAltText } = render(
        <PreviewRenderer
          normalizedPreview={imagePreview}
          view="preview"
          theme="light"
        />
      );
      const img = getByAltText('Preview visualization');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute(
        'src',
        'data:image/png;base64,base64EncodedImage'
      );
      expect(
        container.querySelector('.pipeline-metadata__plot-image')
      ).toBeInTheDocument();
    });

    it('should render image in modal mode', () => {
      const { container, getByAltText } = render(
        <PreviewRenderer
          normalizedPreview={imagePreview}
          view="modal"
          theme="light"
        />
      );
      const img = getByAltText('Matplotlib rendering');
      expect(img).toBeInTheDocument();
      expect(
        container.querySelector('.pipeline-matplotlib-chart')
      ).toBeInTheDocument();
      expect(
        container.querySelector('.pipeline-metadata__plot-image--expanded')
      ).toBeInTheDocument();
    });
  });

  describe('Table previews', () => {
    const tablePreview = {
      kind: 'table',
      content: {
        columns: ['col1', 'col2'],
        data: [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      },
    };

    it('should render TableRenderer in preview mode', () => {
      const { getByTestId } = render(
        <PreviewRenderer
          normalizedPreview={tablePreview}
          view="preview"
          theme="light"
        />
      );
      expect(getByTestId('table-renderer')).toBeInTheDocument();
      expect(getByTestId('table-renderer')).toHaveAttribute(
        'data-size',
        'small'
      );
      expect(getByTestId('preview-wrapper')).toBeInTheDocument();
    });

    it('should render TableRenderer in modal mode with row count', () => {
      const { getByTestId, getByText } = render(
        <PreviewRenderer
          normalizedPreview={tablePreview}
          view="modal"
          theme="light"
        />
      );
      expect(getByTestId('table-renderer')).toBeInTheDocument();
      expect(getByTestId('table-renderer')).toHaveAttribute(
        'data-size',
        'large'
      );
      expect(getByText('Previewing first 3 rows')).toBeInTheDocument();
    });

    it('should not show row count when data is empty in modal mode', () => {
      const emptyTablePreview = {
        kind: 'table',
        content: {
          columns: ['col1', 'col2'],
          data: [],
        },
      };
      const { queryByText } = render(
        <PreviewRenderer
          normalizedPreview={emptyTablePreview}
          view="modal"
          theme="light"
        />
      );
      expect(queryByText(/Previewing first/)).not.toBeInTheDocument();
    });
  });

  describe('JSON previews', () => {
    const jsonPreview = {
      kind: 'json',
      content: '{"key": "value", "number": 123}',
    };

    it('should render JsonRenderer in preview mode', () => {
      const { getByTestId } = render(
        <PreviewRenderer
          normalizedPreview={jsonPreview}
          view="preview"
          theme="dark"
        />
      );
      expect(getByTestId('json-renderer')).toBeInTheDocument();
      expect(getByTestId('json-renderer')).toHaveAttribute(
        'data-theme',
        'dark'
      );
      expect(getByTestId('preview-wrapper')).toBeInTheDocument();
    });

    it('should render JsonRenderer in modal mode', () => {
      const { getByTestId, container } = render(
        <PreviewRenderer
          normalizedPreview={jsonPreview}
          view="modal"
          theme="light"
        />
      );
      expect(getByTestId('json-renderer')).toBeInTheDocument();
      expect(
        container.querySelector('.pipeline-metadata-modal__preview-json')
      ).toBeInTheDocument();
    });
  });

  describe('HTML previews', () => {
    const htmlPreview = {
      kind: 'html',
      content: '<div>HTML Content</div>',
    };

    it('should render HTMLRenderer in preview mode', () => {
      const { getByTestId } = render(
        <PreviewRenderer
          normalizedPreview={htmlPreview}
          view="preview"
          theme="light"
        />
      );
      expect(getByTestId('html-renderer')).toBeInTheDocument();
      expect(getByTestId('preview-wrapper')).toBeInTheDocument();
    });

    it('should render HTMLRenderer in modal mode with fontSize', () => {
      const { getByTestId, container } = render(
        <PreviewRenderer
          normalizedPreview={htmlPreview}
          view="modal"
          theme="light"
        />
      );
      expect(getByTestId('html-renderer')).toBeInTheDocument();
      expect(getByTestId('html-renderer')).toHaveAttribute(
        'data-fontsize',
        '15px'
      );
      expect(
        container.querySelector('.pipeline-metadata-modal__preview-markdown')
      ).toBeInTheDocument();
    });
  });

  describe('Unknown preview types', () => {
    it('should return null for unknown preview kind', () => {
      const unknownPreview = {
        kind: 'unknown-type',
        content: 'some content',
      };
      const { container } = render(
        <PreviewRenderer
          normalizedPreview={unknownPreview}
          view="preview"
          theme="light"
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('onExpand callback', () => {
    it('should pass onExpand to PreviewWrapper for plotly preview', () => {
      const onExpand = jest.fn();
      const plotlyPreview = {
        kind: 'plotly',
        content: {
          data: [{ x: [1, 2], y: [3, 4] }],
          layout: {},
        },
      };
      const { getByText } = render(
        <PreviewRenderer
          normalizedPreview={plotlyPreview}
          view="preview"
          theme="light"
          onExpand={onExpand}
        />
      );
      const expandButton = getByText('Expand');
      fireEvent.click(expandButton);
      expect(onExpand).toHaveBeenCalledTimes(1);
    });
  });
});
