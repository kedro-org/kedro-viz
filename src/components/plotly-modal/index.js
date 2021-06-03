import React from 'react';
import { connect } from 'react-redux';
import PlotlyChart from '../plotly-chart';
import CollapseIcon from '../icons/collapse';
import BackIcon from '../icons/back';
import NodeIcon from '../../components/icons/node-icon';
import { togglePlotModal } from '../../actions';
import getShortType from '../../utils/short-type';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import './plotly-modal.css';

const PlotlyModal = ({ metadata, onToggle, visible }) => {
  const nodeTypeIcon = getShortType(metadata?.datasetType, metadata?.node.type);

  const onCollapsePlotClick = () => {
    onToggle(false);
  };
  if (!visible.plotModal) {
    return null;
  }
  return (
    <div className="pipeline-plotly-modal">
      <div className="pipeline-plot-modal__top">
        <button
          className="pipeline-plot-modal__back"
          onClick={onCollapsePlotClick}>
          <BackIcon className="pipeline-plot-modal__back-icon"></BackIcon>
          <span className="pipeline-plot-modal__back-text">Back</span>
        </button>
        <div className="pipeline-plot-modal__header">
          <NodeIcon className="pipeline-plot-modal__icon" icon={nodeTypeIcon} />
          <span className="pipeline-plot-modal__title">
            {metadata.node.name}
          </span>
        </div>
      </div>
      <PlotlyChart
        data={metadata.plot.data}
        layout={metadata.plot.layout}
        view="modal"
      />
      <div className="pipeline-plot-modal__bottom">
        <button
          className="pipeline-plot-modal__collapse-plot"
          onClick={onCollapsePlotClick}>
          <CollapseIcon className="pipeline-plot-modal__collapse-plot-icon"></CollapseIcon>
          <span className="pipeline-plot-modal__collapse-plot-text">
            Collapse Plotly Visualization
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

export default connect(mapStateToProps, mapDispatchToProps)(PlotlyModal);
