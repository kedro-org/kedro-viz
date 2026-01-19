import React from 'react';
import { connect } from 'react-redux';
import PlotlyRenderer from '../plotly-renderer';
import PreviewTable from '../preview-table';
import JSONObject from '../../components/json-object';
import HTMLRenderer from '../html-renderer';
import TextRenderer from '../text-renderer';
import MermaidRenderer from '../mermaid-renderer';
import BackIcon from '../icons/back';
import NodeIcon from '../icons/node-icon';
import { togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import './metadata-modal.scss';

const MetadataModal = ({ metadata, onToggle, visible, theme }) => {
  // DataNode previews
  const hasDataNodePreview = metadata?.preview && metadata?.previewType;
  const hasPlot =
    hasDataNodePreview && metadata.previewType === 'PlotlyPreview';
  const hasImage =
    hasDataNodePreview && metadata.previewType === 'ImagePreview';
  const hasTable =
    hasDataNodePreview && metadata.previewType === 'TablePreview';
  const hasJSON = hasDataNodePreview && metadata.previewType === 'JSONPreview';
  const hasHTML = hasDataNodePreview && metadata.previewType === 'HTMLPreview';

  // TaskNode previews
  const hasTaskNodePreview = metadata?.preview && metadata.preview.kind;
  const previewKind = hasTaskNodePreview ? metadata.preview.kind : null;
  const previewContent = hasTaskNodePreview ? metadata.preview.content : null;
  const previewMeta = hasTaskNodePreview ? metadata.preview.meta || {} : {};

  // Transform table data from list of dicts to {columns, data} format
  const transformTableData = (tableContent) => {
    if (
      !tableContent ||
      !Array.isArray(tableContent) ||
      tableContent.length === 0
    ) {
      return { columns: [], data: [] };
    }
    const columns = Object.keys(tableContent[0]);
    const data = tableContent.map((row) => columns.map((col) => row[col]));
    return { columns, data };
  };

  const hasMetadataContent =
    hasPlot || hasImage || hasTable || hasJSON || hasHTML || hasTaskNodePreview;

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
        {hasTaskNodePreview && previewKind === 'table' && (
          <div className="pipeline-metadata-modal__preview-text">
            Previewing first {previewContent && previewContent.length} rows
          </div>
        )}
      </div>
      {hasPlot && (
        <>
          <PlotlyRenderer
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
      {/* TaskNode PreviewPayload renderers */}
      {hasTaskNodePreview && previewKind === 'text' && (
        <div className="pipeline-metadata-modal__preview">
          <TextRenderer
            content={previewContent}
            meta={previewMeta}
            view="modal"
          />
        </div>
      )}
      {hasTaskNodePreview && previewKind === 'mermaid' && (
        <div className="pipeline-metadata-modal__preview">
          <MermaidRenderer content={previewContent} view="modal" />
        </div>
      )}
      {hasTaskNodePreview && previewKind === 'plotly' && (
        <>
          <PlotlyRenderer
            data={previewContent.data}
            layout={previewContent.layout}
            view="modal"
          />
        </>
      )}
      {hasTaskNodePreview && previewKind === 'table' && (
        <div className="pipeline-metadata-modal__preview">
          <PreviewTable
            data={transformTableData(previewContent)}
            size="large"
          />
        </div>
      )}
      {hasTaskNodePreview && previewKind === 'json' && (
        <div className="pipeline-metadata-modal__preview-json">
          <JSONObject
            value={previewContent}
            theme={theme}
            style={{ background: 'transparent', fontSize: '15px' }}
            collapsed={3}
          />
        </div>
      )}
      {hasTaskNodePreview && previewKind === 'image' && (
        <div className="pipeline-matplotlib-chart">
          <div className="pipeline-metadata__plot-image-container">
            <img
              alt="Preview visualization"
              className="pipeline-metadata__plot-image--expanded"
              src={
                previewContent.startsWith('data:')
                  ? previewContent
                  : `data:image/png;base64,${previewContent}`
              }
            />
          </div>
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
