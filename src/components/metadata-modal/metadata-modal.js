import React from 'react';
import { connect } from 'react-redux';
import PlotlyChart from '../plotly-chart';
import PreviewTable from '../preview-table';
import CollapseIcon from '../icons/collapse';
import BackIcon from '../icons/back';
import NodeIcon from '../icons/node-icon';
import { togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import './metadata-modal.scss';

const MetadataModal = ({ metadata, onToggle, visible }) => {
  const hasPlot = metadata?.previewType === 'PlotlyPreview';
  const hasImage = metadata?.previewType === 'ImagePreview';
  const hasTable = metadata?.previewType === 'TablePreview';

  if (!visible.metadataModal || (!hasPlot && !hasImage && !hasTable)) {
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
            Previewing first {metadata.preview.length} rows
          </div>
        )}
      </div>
      {hasPlot && (
        <PlotlyChart
          data={metadata.preview.data}
          layout={metadata.preview.layout}
          view="modal"
        />
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
      {!hasTable && (
        <div className="pipeline-metadata-modal__bottom">
          <button
            className="pipeline-metadata-modal__collapse-plot"
            onClick={onCollapsePlotClick}
          >
            <CollapseIcon className="pipeline-metadata-modal__collapse-plot-icon"></CollapseIcon>
            <span className="pipeline-metadata-modal__collapse-plot-text">
              {hasPlot
                ? 'Collapse Plotly Visualization'
                : 'Collapse Matplotlib Image'}
            </span>
          </button>
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
