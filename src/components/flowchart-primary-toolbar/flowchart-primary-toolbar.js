import React from 'react';
import { connect } from 'react-redux';
import {
  toggleExportModal,
  toggleLayers,
  toggleSidebar,
  toggleTextLabels,
} from '../../actions';
import IconButton from '../ui/icon-button';
import LabelIcon from '../icons/label';
import ExportIcon from '../icons/export';
import LayersIcon from '../icons/layers';
import PrimaryToolbar from '../primary-toolbar';
import { getVisibleLayerIDs } from '../../selectors/disabled';

/**
 * Main controls for filtering the chart data
 * @param {Function} onToggleTextLabels Handle toggling text labels on/off
 * @param {Boolean} textLabels Whether text labels are displayed
 */
export const FlowchartPrimaryToolbar = ({
  disableLayerBtn,
  displaySidebar,
  onToggleExportModal,
  onToggleLayers,
  onToggleSidebar,
  onToggleTextLabels,
  textLabels,
  visible,
  visibleLayers,
}) => (
  <>
    <PrimaryToolbar
      displaySidebar={displaySidebar}
      onToggleSidebar={onToggleSidebar}
      visible={visible}
    >
      <IconButton
        ariaLabel={`${textLabels ? 'Hide' : 'Show'} text labels`}
        className={'pipeline-menu-button--labels'}
        onClick={() => onToggleTextLabels(!textLabels)}
        icon={LabelIcon}
        labelText={`${textLabels ? 'Hide' : 'Show'} text labels`}
        visible={visible.labelBtn}
      />
      <IconButton
        ariaLabel={`Turn data layers ${visibleLayers ? 'off' : 'on'}`}
        className={'pipeline-menu-button--layers'}
        dataHeapEvent={`visible.layers.${visibleLayers}`}
        onClick={() => onToggleLayers(!visibleLayers)}
        icon={LayersIcon}
        labelText={`${visibleLayers ? 'Hide' : 'Show'} layers`}
        disabled={disableLayerBtn}
        visible={visible.layerBtn}
      />
      <IconButton
        ariaLabel="Export graph as SVG or PNG"
        className={'pipeline-menu-button--export'}
        onClick={() => onToggleExportModal(true)}
        icon={ExportIcon}
        labelText="Export visualisation"
        visible={visible.exportBtn}
      />
    </PrimaryToolbar>
  </>
);

export const mapStateToProps = (state) => ({
  disableLayerBtn: !state.layer.ids.length,
  displaySidebar: state.display.sidebar,
  textLabels: state.textLabels,
  visible: state.visible,
  visibleLayers: Boolean(getVisibleLayerIDs(state).length),
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleExportModal: (value) => {
    dispatch(toggleExportModal(value));
  },
  onToggleLayers: (value) => {
    dispatch(toggleLayers(Boolean(value)));
  },
  onToggleSidebar: (visible) => {
    dispatch(toggleSidebar(visible));
  },
  onToggleTextLabels: (value) => {
    dispatch(toggleTextLabels(Boolean(value)));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlowchartPrimaryToolbar);
