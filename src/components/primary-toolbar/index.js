import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  toggleExportModal,
  toggleLayers,
  toggleSidebar,
  toggleTextLabels,
} from '../../actions';
import IconButton from '../icon-button';
import MenuIcon from '../icons/menu';
import LabelIcon from '../icons/label';
import ExportIcon from '../icons/export';
import LayersIcon from '../icons/layers';
import { getVisibleLayerIDs } from '../../selectors/disabled';
import './primary-toolbar.css';

/**
 * Main controls for filtering the chart data
 * @param {Function} onToggleTextLabels Handle toggling text labels on/off
 * @param {Boolean} textLabels Whether text labels are displayed
 */
export const PrimaryToolbar = ({
  disableLayerBtn,
  isExperimentView,
  onToggleExportModal,
  onToggleLayers,
  onToggleSidebar,
  onToggleTextLabels,
  textLabels,
  visible,
  visibleLayers,
}) => (
  <>
    <ul className="pipeline-primary-toolbar kedro">
      <IconButton
        ariaLabel={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
        className={classnames(
          'pipeline-menu-button',
          'pipeline-menu-button--menu',
          {
            'pipeline-menu-button--inverse': !visible.sidebar,
          }
        )}
        onClick={() => onToggleSidebar(!visible.sidebar)}
        icon={MenuIcon}
        labelText={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
      />
      {isExperimentView ? null : (
        <>
          <IconButton
            ariaLive="polite"
            className={'pipeline-menu-button--labels'}
            onClick={() => onToggleTextLabels(!textLabels)}
            icon={LabelIcon}
            labelText={`${textLabels ? 'Hide' : 'Show'} text labels`}
            visible={visible.labelBtn}
          />
          <IconButton
            ariaLabel={`Turn data layers ${visibleLayers ? 'off' : 'on'}`}
            className={'pipeline-menu-button--layers'}
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
        </>
      )}
    </ul>
  </>
);

export const mapStateToProps = (state) => ({
  disableLayerBtn: !state.layer.ids.length,
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

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryToolbar);
