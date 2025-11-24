import React from 'react';
import { connect } from 'react-redux';
import PlotlyChart from '../plotly-chart';
import PreviewTable from '../preview-table';
import JSONObject from '../../components/json-object';
import HTMLRenderer from '../html-renderer';
import BackIcon from '../icons/back';
import NodeIcon from '../icons/node-icon';
import { togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import './metadata-modal.scss';

const MetadataModal = ({ metadata, onToggle, visible, theme }) => {
  // Data node previews
  const hasPlot = metadata?.previewType === 'PlotlyPreview';
  const hasImage = metadata?.previewType === 'ImagePreview';
  const hasTable = metadata?.previewType === 'TablePreview';
  const hasJSON = metadata?.previewType === 'JSONPreview';
  const hasHTML = metadata?.previewType === 'HTMLPreview';

  // Task node previews
  const isTaskNode = metadata?.type === 'task';
  const hasTaskPreview = isTaskNode && metadata?.preview;
  const hasMermaidPreview =
    hasTaskPreview && metadata?.preview?.kind === 'mermaid';
  const hasTaskJSONPreview =
    hasTaskPreview && metadata?.preview?.kind === 'json';
  const hasTaskTextPreview =
    hasTaskPreview && metadata?.preview?.kind === 'text';
  const hasTaskImagePreview =
    hasTaskPreview && metadata?.preview?.kind === 'image';
  const hasTaskPlotlyPreview =
    hasTaskPreview && metadata?.preview?.kind === 'plotly';
  const hasTaskTablePreview =
    hasTaskPreview && metadata?.preview?.kind === 'table';
  const hasTaskCustomPreview =
    hasTaskPreview && metadata?.preview?.kind === 'custom';

  const hasMetadataContent =
    hasPlot ||
    hasImage ||
    hasTable ||
    hasJSON ||
    hasHTML ||
    hasMermaidPreview ||
    hasTaskJSONPreview ||
    hasTaskTextPreview ||
    hasTaskImagePreview ||
    hasTaskPlotlyPreview ||
    hasTaskTablePreview ||
    hasTaskCustomPreview;

  if (!visible.metadataModal || !hasMetadataContent) {
    return null;
  }

  const nodeTypeIcon = getShortType(metadata?.datasetType, metadata?.type);

  const onCollapsePlotClick = () => {
    onToggle(false);
  };

  return (
    <div className="pipeline-metadata-modal">
      <div className="pipeline-metadata-modal__top">
        <button
          className="pipeline-metadata-modal__back"
          onClick={onCollapsePlotClick}
        >
          <BackIcon className="pipeline-metadata-modal__back-icon"></BackIcon>
          <span className="pipeline-metadata-modal__back-text">Back</span>
        </button>
        <div className="pipeline-metadata-modal__header">
          <NodeIcon
            className="pipeline-metadata-modal__icon"
            icon={nodeTypeIcon}
          />
          <span className="pipeline-metadata-modal__title">
            {metadata.name}
          </span>
        </div>
        {hasTable && (
          <div className="pipeline-metadata-modal__preview-text">
            Previewing first{' '}
            {metadata.preview.data && metadata.preview.data.length} rows
          </div>
        )}
      </div>
      {hasPlot && (
        <>
          <PlotlyChart
            data={metadata.preview.data}
            layout={metadata.preview.layout}
            view="modal"
          />
        </>
      )}
      {hasImage && (
        <div className="pipeline-matplotlib-chart">
          <div className="pipeline-metadata__plot-image-container">
            <img
              alt="Matplotlib rendering"
              className="pipeline-metadata__plot-image--expanded"
              src={`data:image/png;base64,${metadata.preview}`}
            />
          </div>
        </div>
      )}
      {hasTable && (
        <div className="pipeline-metadata-modal__preview">
          <PreviewTable data={metadata.preview} size="large" />
        </div>
      )}
      {hasJSON && (
        <div className="pipeline-metadata-modal__preview-json">
          <JSONObject
            value={JSON.parse(metadata.preview)}
            theme={theme}
            style={{ background: 'transparent', fontSize: '15px' }}
            collapsed={3}
          />
        </div>
      )}
      {hasHTML && (
        <div className="pipeline-metadata-modal__preview-markdown">
          <HTMLRenderer content={metadata.preview} fontSize="15px" />
        </div>
      )}
      {hasMermaidPreview && (
        <div className="pipeline-metadata-modal__preview-mermaid">
          <div
            className="pipeline-metadata-modal__mermaid-container"
            ref={(el) => {
              if (el && metadata?.preview?.content) {
                const renderMermaid = async () => {
                  try {
                    const mermaid = await import('mermaid');
                    mermaid.default.initialize({
                      startOnLoad: false,
                      theme: 'default',
                      securityLevel: 'loose',
                    });

                    el.innerHTML = '';
                    const id = `mermaid-modal-${Date.now()}`;
                    const { svg } = await mermaid.default.render(
                      id,
                      metadata.preview.content
                    );
                    el.innerHTML = svg;
                  } catch (error) {
                    console.error('Mermaid modal error:', error);
                    el.innerHTML = `
                      <div style="padding: 20px; border: 1px solid red; background: #ffe6e6; color: red; text-align: center;">
                        <strong>Mermaid Error:</strong><br/>
                        ${error.message}
                      </div>
                    `;
                  }
                };
                renderMermaid();
              }
            }}
          />
        </div>
      )}
      {hasTaskJSONPreview && (
        <div className="pipeline-metadata-modal__preview-json">
          <JSONObject
            value={JSON.parse(metadata.preview.content)}
            theme={theme}
            style={{ background: 'transparent', fontSize: '15px' }}
            collapsed={3}
          />
        </div>
      )}
      {hasTaskTextPreview && (
        <div className="pipeline-metadata-modal__preview-text">
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: '15px',
              padding: '20px',
            }}
          >
            {metadata.preview.content}
          </pre>
        </div>
      )}
      {hasTaskImagePreview && (
        <div className="pipeline-matplotlib-chart">
          <div className="pipeline-metadata__plot-image-container">
            <img
              alt="Task preview image"
              className="pipeline-metadata__plot-image--expanded"
              src={metadata.preview.content}
            />
          </div>
        </div>
      )}
      {hasTaskPlotlyPreview && (
        <PlotlyChart
          data={JSON.parse(metadata.preview.content).data}
          layout={JSON.parse(metadata.preview.content).layout}
          view="modal"
        />
      )}
      {hasTaskTablePreview && (
        <div className="pipeline-metadata-modal__preview">
          <PreviewTable
            data={JSON.parse(metadata.preview.content)}
            size="large"
          />
        </div>
      )}
      {hasTaskCustomPreview && (
        <div className="pipeline-metadata-modal__preview-custom">
          <div
            className="pipeline-metadata-modal__custom-content"
            style={{ fontSize: '15px', padding: '20px' }}
            dangerouslySetInnerHTML={{ __html: metadata.preview.content }}
          />
        </div>
      )}
    </div>
  );
};

export const mapStateToProps = (state) => ({
  metadata: getClickedNodeMetaData(state),
  theme: state.theme,
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(togglePlotModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetadataModal);
