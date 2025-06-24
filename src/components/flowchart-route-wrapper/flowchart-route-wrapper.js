import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { setView } from '../../actions';
import { VIEW } from '../../config';
import FlowChartWrapper from '../flowchart-wrapper';
import FeatureHints from '../feature-hints';

/**
 * Flowchart route wrapper component that handles its own state initialization
 */
const FlowchartRouteWrapper = ({ onSetView }) => {
  useEffect(() => {
    onSetView(VIEW.FLOWCHART);
  }, [onSetView]);

  return (
    <>
      <FlowChartWrapper />
      <FeatureHints />
    </>
  );
};

const mapDispatchToProps = (dispatch) => ({
  onSetView: (view) => {
    dispatch(setView(view));
  },
});

export default connect(null, mapDispatchToProps)(FlowchartRouteWrapper);
