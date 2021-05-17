import React from 'react';
import { connect } from 'react-redux';
import PlotlyChart from '../plotly-chart';
import ExpandIcon from '../icons/expand';
import { togglePlotModal } from '../../actions';
import { getClickedNodeMetaData } from '../../selectors/metadata';
import './plotly-modal.css';

const PlotlyModal = ({ metadata, theme, onToggle, visible }) => {
  const hasPlot = Boolean(metadata?.plot);

  const onCollapsePlotClick = () => {
    // Deselecting a node automatically hides MetaData panel
    onToggle(false);
  };

  if (!visible.plotModal || !hasPlot) {
    return null;
  }
  return (
    <div className="plotly-modal">
      {hasPlot && (
        <div className="pipeline-plot-modal__top">
          <div
            className="pipeline-plot-modal__back"
            onClick={onCollapsePlotClick}>
            <ExpandIcon className="pipeline-metadata-icon"></ExpandIcon>
            <span className="pipeline-metadata-icon__text">Back</span>
          </div>
          <div className="pipeline-plot-modal__title">
            <p>{metadata.node.name}</p>
          </div>
        </div>
      )}
      {hasPlot && (
        <PlotlyChart
          data={metadata.plot.data}
          layout={metadata.plot.layout}
          view="modal"
        />
      )}
      {hasPlot && (
        <div className="pipeline-plot-modal__bottom">
          <div
            className="pipeline-plot-modal__collapse-plot"
            onClick={onCollapsePlotClick}>
            <ExpandIcon className="pipeline-metadata-icon"></ExpandIcon>
            <span className="pipeline-metadata-icon__text">
              Collapse Plotly Visualization
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const mapStateToProps = (state) => ({
  graphSize: state.graph.size || {},
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
