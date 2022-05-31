import React from 'react';
import { connect } from 'react-redux';
import PlotlyChart from '../plotly-chart';
import CollapseIcon from '../icons/collapse';
import BackIcon from '../icons/back';
import NodeIcon from '../icons/node-icon';
import { togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import './metadata-modal.css';

const MetadataModal = ({ metadata, onToggle, visible }) => {
  if (!visible.metadataModal || (!metadata?.plot && !metadata?.image)) {
    return null;
  }

  const nodeTypeIcon = getShortType(metadata?.datasetType, metadata?.type);

  const onCollapsePlotClick = () => {
    onToggle(false);
  };

  return (
    <div className="pipeline-metadata-modal">
      <div className="pipeline-plot-modal__top">
        <button
          className="pipeline-plot-modal__back"
          onClick={onCollapsePlotClick}
        >
          <BackIcon className="pipeline-plot-modal__back-icon"></BackIcon>
          <span className="pipeline-plot-modal__back-text">Back</span>
        </button>
        <div className="pipeline-plot-modal__header">
          <NodeIcon className="pipeline-plot-modal__icon" icon={nodeTypeIcon} />
          <span className="pipeline-plot-modal__title">{metadata.name}</span>
        </div>
      </div>
      {metadata?.plot ? (
        <PlotlyChart
          data={metadata.plot.data}
          layout={metadata.plot.layout}
          view="modal"
        />
      ) : (
        <div className="pipeline-matplolib-chart">
          <img
            alt="Matplotlib rendering"
            className="pipeline-metadata__plot-image"
            src={`data:image/png;base64,${metadata.image}`}
          />
        </div>
      )}
      <div className="pipeline-plot-modal__bottom">
        <button
          className="pipeline-plot-modal__collapse-plot"
          onClick={onCollapsePlotClick}
        >
          <CollapseIcon className="pipeline-plot-modal__collapse-plot-icon"></CollapseIcon>
          <span className="pipeline-plot-modal__collapse-plot-text">
            {metadata?.plot
              ? 'Collapse Plotly Visualization'
              : 'Collapse Matplotlib Image'}
          </span>
        </button>
      </div>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  visible: state.visible,
  metadata: getClickedNodeMetaData(state),
  theme: state.theme,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(togglePlotModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetadataModal);
