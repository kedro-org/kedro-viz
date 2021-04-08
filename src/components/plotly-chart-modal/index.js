import React from 'react';
import { connect } from 'react-redux';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import Plot from 'react-plotly.js';
import { togglePlotModal } from '../../actions';
import deepmerge from 'deepmerge';
import { dark_modal } from '../../utils/chart_templates/dark';
import { light_modal } from '../../utils/chart_templates/light';
import './plotly-chart-modal.css';

/**
 * Kedro-UI modal to allow users to choose between SVG/PNG export formats
 */
const PlotModal = ({ theme, data, layout, onToggle, visible }) => {
  if (!visible.plotModal) return null;
  return (
    <Modal
      title="Plotly Visualization"
      onClose={() => onToggle(false)}
      theme={theme}
      visible={visible.plotModal}>
      <Plot
        data={data}
        layout={updateLayout(theme, layout)}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </Modal>
  );
};

PlotModal.defaultProps = {
  data: {},
  layout: {},
};

const updateLayout = (theme, layout) => {
  const template = theme === 'light' ? light_modal : dark_modal;
  return deepmerge(layout, template);
};

export const mapStateToProps = (state) => ({
  visible: state.visible,
  theme: state.theme,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(togglePlotModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PlotModal);
