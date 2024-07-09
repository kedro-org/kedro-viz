import React from 'react';
import { connect } from 'react-redux';
import {
  toggleExportModal,
  toggleLayers,
  toggleSidebar,
  toggleTextLabels,
  toggleExpandAllPipelines,
} from '../../actions';
import { loadInitialPipelineData } from '../../actions/pipelines';
import IconButton from '../ui/icon-button';
import LabelIcon from '../icons/label';
import ExportIcon from '../icons/export';
import LayersIcon from '../icons/layers';
import PrimaryToolbar from '../primary-toolbar';
import { getVisibleLayerIDs } from '../../selectors/disabled';
import ExpandPipelinesIcon from '../icons/expand-pipelines';
import CollapsePipelinesIcon from '../icons/collapse-pipelines';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';

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
  expandedPipelines,
  onToggleExpandAllPipelines,
}) => {
  const { toSetQueryParam } = useGeneratePathname();

  const handleToggleExpandAllPipelines = () => {
    const isExpanded = !expandedPipelines;
    onToggleExpandAllPipelines(isExpanded);
    toSetQueryParam('expandAllPipelines', isExpanded.toString());
  };

  return (
    <>
      <PrimaryToolbar
        displaySidebar={displaySidebar}
        onToggleSidebar={onToggleSidebar}
        visible={visible}
      >
        <IconButton
          active={textLabels}
          ariaLabel={`${textLabels ? 'Hide' : 'Show'} text labels`}
          className={'pipeline-menu-button--labels'}
          dataTest={'btnToggleLabels'}
          icon={LabelIcon}
          labelText={`${textLabels ? 'Hide' : 'Show'} text labels`}
          onClick={() => onToggleTextLabels(!textLabels)}
          visible={visible.labelBtn}
        />
        <IconButton
          active={visibleLayers}
          ariaLabel={`Turn data layers ${visibleLayers ? 'off' : 'on'}`}
          className={'pipeline-menu-button--layers'}
          dataHeapEvent={`visible.layers.${visibleLayers}`}
          dataTest={'btnToggleLayers'}
          disabled={disableLayerBtn}
          icon={LayersIcon}
          labelText={`${visibleLayers ? 'Hide' : 'Show'} layers`}
          onClick={() => onToggleLayers(!visibleLayers)}
          visible={visible.layerBtn}
        />
        <IconButton
          active={expandedPipelines}
          ariaLabel={
            expandedPipelines
              ? 'Collapse all modular pipelines'
              : 'Expand all modular pipelines'
          }
          className={'pipeline-menu-button--pipeline'}
          dataTest={'btnTogglePipeline'}
          icon={expandedPipelines ? CollapsePipelinesIcon : ExpandPipelinesIcon}
          labelText={
            expandedPipelines ? 'Collapse pipelines' : 'Expand pipelines'
          }
          data-test={'expand-all-pipelines-toggle'}
          onClick={handleToggleExpandAllPipelines}
          visible={visible.pipelineBtn}
        />
        <IconButton
          ariaLabel="Export graph as SVG or PNG"
          className={'pipeline-menu-button--export'}
          dataTest={'btnExportGraph'}
          icon={ExportIcon}
          labelText="Export visualisation"
          onClick={() => onToggleExportModal(true)}
          visible={visible.exportBtn}
        />
      </PrimaryToolbar>
    </>
  );
};

export const mapStateToProps = (state) => ({
  disableLayerBtn: !state.layer.ids.length,
  displaySidebar: state.display.sidebar,
  textLabels: state.textLabels,
  visible: state.visible,
  visibleLayers: Boolean(getVisibleLayerIDs(state).length),
  expandedPipelines: state.expandAllPipelines,
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
  onToggleExpandAllPipelines: (isExpanded) => {
    dispatch(toggleExpandAllPipelines(isExpanded));
    dispatch(loadInitialPipelineData());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlowchartPrimaryToolbar);
