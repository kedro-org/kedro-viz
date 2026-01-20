import React from 'react';
import PlotlyRenderer from '../plotly-renderer';
import TableRenderer from '../table-renderer';
import JsonRenderer from '../json-renderer';
import HTMLRenderer from '../html-renderer';
import PreviewWrapper from '../metadata/preview-wrapper';

/**
 * Unified DataNode preview renderer component
 * Renders different preview types based on normalized preview data
 * Supports both 'preview' (sidebar) and 'modal' (expanded) views
 */
const PreviewRenderer = ({
  normalizedPreview,
  view = 'preview',
  theme,
  onExpand,
}) => {
  if (!normalizedPreview) {
    return null;
  }

  const { kind, content } = normalizedPreview;
  const isModal = view === 'modal';

  // Handle plotly previews
  if (kind === 'plotly') {
    if (isModal) {
      return (
        <PlotlyRenderer
          data={content.data}
          layout={content.layout}
          view="modal"
        />
      );
    }

    return (
      <PreviewWrapper onExpand={onExpand}>
        <PlotlyRenderer
          data={content.data}
          layout={content.layout}
          view="preview"
        />
      </PreviewWrapper>
    );
  }

  // Handle image previews
  if (kind === 'image') {
    const imageSrc = `data:image/png;base64,${content}`;

    if (isModal) {
      return (
        <div className="pipeline-matplotlib-chart">
          <div className="pipeline-metadata__plot-image-container">
            <img
              alt="Matplotlib rendering"
              className="pipeline-metadata__plot-image--expanded"
              src={imageSrc}
            />
          </div>
        </div>
      );
    }

    return (
      <PreviewWrapper
        onExpand={onExpand}
        className="pipeline-metadata__plot"
        showShadows={false}
        onClick={onExpand}
      >
        <img
          alt="Preview visualization"
          className="pipeline-metadata__plot-image"
          src={imageSrc}
        />
      </PreviewWrapper>
    );
  }

  // Handle table previews
  if (kind === 'table') {
    const rowCount = content?.data?.length || 0;

    if (isModal) {
      return (
        <>
          {rowCount > 0 && (
            <div className="pipeline-metadata-modal__preview-text">
              Previewing first {rowCount} rows
            </div>
          )}
          <div className="pipeline-metadata-modal__preview">
            <TableRenderer data={content} size="large" />
          </div>
        </>
      );
    }

    return (
      <PreviewWrapper onExpand={onExpand}>
        <TableRenderer data={content} size="small" onClick={onExpand} />
      </PreviewWrapper>
    );
  }

  // Handle JSON previews
  if (kind === 'json') {
    const jsonValue = JSON.parse(content);
    const fontSize = isModal ? '15px' : '14px';

    if (isModal) {
      return (
        <div className="pipeline-metadata-modal__preview-json">
          <JsonRenderer
            value={jsonValue}
            theme={theme}
            style={{ background: 'transparent', fontSize }}
            collapsed={3}
          />
        </div>
      );
    }

    return (
      <PreviewWrapper
        onExpand={onExpand}
        className="pipeline-metadata__preview-json"
      >
        <JsonRenderer
          value={jsonValue}
          theme={theme}
          style={{ background: 'transparent', fontSize }}
          collapsed={3}
        />
      </PreviewWrapper>
    );
  }

  // Handle HTML previews
  if (kind === 'html') {
    const fontSize = isModal ? '15px' : undefined;

    if (isModal) {
      return (
        <div className="pipeline-metadata-modal__preview-markdown">
          <HTMLRenderer content={content} fontSize={fontSize} />
        </div>
      );
    }

    return (
      <PreviewWrapper
        onExpand={onExpand}
        className="pipeline-metadata__preview-html"
      >
        <HTMLRenderer content={content} />
      </PreviewWrapper>
    );
  }

  return null;
};

export default PreviewRenderer;
