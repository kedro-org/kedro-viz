import React from 'react';
import { connect } from 'react-redux';
import PlotlyChart from '../plotly-chart';
import CollapseIcon from '../icons/collapse';
import BackIcon from '../icons/back';
import NodeIcon from '../../components/icons/node-icon';
import { togglePlotModal } from '../../actions';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import './plotly-modal.css';

const PlotlyModal = ({ metadata, onToggle, visible }) => {
  const hasPlot = Boolean(metadata?.plot);
  const nodeTypeIcon = metadata?.datasetType || metadata?.node.type;

  const onCollapsePlotClick = () => {
    // Deselecting a node automatically hides MetaData panel
    onToggle(false);
  };
  if (!visible.plotModal) {
    return null;
  }
  return (
    <div className="pipeline-plotly-modal">
      <div className="pipeline-plot-modal__top">
        <div
          className="pipeline-plot-modal__back"
          onClick={onCollapsePlotClick}>
          <BackIcon className="pipeline-plot-modal-icon__back"></BackIcon>
          <span className="pipeline-plot-modal-text__back">Back</span>
        </div>
        {hasPlot && (
          <div className="pipeline-plot-modal__header">
            <NodeIcon
              className="pipeline-plot-modal__icon"
              icon={nodeTypeIcon}
            />
            <span className="pipeline-plot-modal__title">
              {' '}
              {metadata.node.name}{' '}
            </span>
          </div>
        )}
        <span></span>
      </div>
      {hasPlot && (
        <PlotlyChart
          data={metadata.plot.data}
          layout={metadata.plot.layout}
          view="modal"
        />
      )}
      <div className="pipeline-plot-modal__bottom">
        <div
          className="pipeline-plot-modal__collapse-plot"
          onClick={onCollapsePlotClick}>
          <CollapseIcon className="pipeline-plot-modal-icon__collapse-plot"></CollapseIcon>
          <span className="pipeline-plot-modal-text__collapse-plot">
            Collapse Plotly Visualization
          </span>
        </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(PlotlyModal);
