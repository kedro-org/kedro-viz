import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import modifiers from '../../utils/modifiers';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/ui/icon-button';
import PreviewTable from '../../components/preview-table';
import JSONObject from '../../components/json-object';
import CommandCopier from '../ui/command-copier/command-copier';
import PlotlyChart from '../plotly-chart';
import CloseIcon from '../icons/close';
import ExpandIcon from '../icons/expand';
import MetaDataRow from './metadata-row';
import MetaDataCode from './metadata-code';
import Toggle from '../ui/toggle';
import ErrorLog from '../error-log';
import { VIEW } from '../../config';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData,
} from '../../selectors/metadata';
import { getNodeError, getDatasetError } from '../../selectors/run-status';
import { toggleNodeClicked } from '../../actions/nodes';
import { toggleCode, togglePlotModal, toggleTraceback } from '../../actions';
import getShortType from '../../utils/short-type';
import { useGeneratePathname } from '../../utils/hooks/use-generate-pathname';
import { getDataTestAttribute } from '../../utils/get-data-test-attribute';

import './styles/metadata.scss';
import MetaDataStats from './metadata-stats';

/**
 * Shows node meta data
 */
const MetaData = ({
  isPrettyName,
  metadata,
  onToggleCode,
  onToggleTraceback,
  onToggleMetadataModal,
  onToggleNodeSelected,
  theme,
  visible = true,
  visibleCode,
  visibleTraceback,
  showDatasetPreviews,
  getDatasetError,
  getNodeError,
  view,
}) => {
  const { toSelectedPipeline } = useGeneratePathname();

  // Hide code panel when selected metadata changes
  useEffect(() => onToggleCode(false), [metadata, onToggleCode]);

  // Hide traceback panel when selected metadata changes
  useEffect(() => onToggleTraceback(false), [metadata, onToggleTraceback]);

  // Hide plot modal when selected metadata changes
  useEffect(
    () => onToggleMetadataModal(false),
    [metadata, onToggleMetadataModal]
  );

  const isTaskNode = metadata?.type === 'task';
  const isDataNode = metadata?.type === 'data';
  const isParametersNode = metadata?.type === 'parameters';
  const nodeTypeIcon = getShortType(metadata?.datasetType, metadata?.type);
  const hasPreview = showDatasetPreviews && metadata?.preview;
  const hasPlot = hasPreview && metadata?.previewType === 'PlotlyPreview';
  const hasImage = hasPreview && metadata?.previewType === 'ImagePreview';
  const hasTablePreview =
    hasPreview && metadata?.previewType === 'TablePreview';
  const hasJSONPreview = hasPreview && metadata?.previewType === 'JSONPreview';
  const hasCode = Boolean(metadata?.code);
  const isTranscoded = Boolean(metadata?.originalType);
  const isWorkflowView = view === VIEW.WORKFLOW;
  const showCodePanel = visible && visibleCode && hasCode;
  const showTracebackPanel = isWorkflowView && visibleTraceback;
  const showCodeSwitch = hasCode;

  let runCommand = metadata?.runCommand;
  if (!runCommand) {
    // provide a help text for user to know why the run command is not available for the task node
    runCommand = isTaskNode
      ? 'Please provide a name argument for this node in order to see a run command.'
      : null;
  }

  // translates the naming for the different types of nodes
  const translateMetadataType = (metadataType) => {
    if (metadataType === 'task') {
      return 'node';
    } else if (metadataType === 'data') {
      return 'dataset';
    }

    return metadataType;
  };

  const onCloseClick = () => {
    // Deselecting a node automatically hides MetaData panel
    onToggleNodeSelected(null);
    // and reset the URL to the current active pipeline
    toSelectedPipeline();
  };

  const onExpandMetaDataClick = () => {
    onToggleMetadataModal(true);
  };

  // Since we style the path right-to-left, remove the initial slash
  const removeInitialSlash = (string) => {
    return string?.replace(/^\//g, '');
  };

  const shortenDatasetType = (value) => {
    const isList = Array.isArray(value);
    // Extract the library (first part) and the dataset type (last part)
    const getQualifier = (val) => {
      if (typeof val === 'string' && val.includes('.')) {
        const parts = val.split('.');
        return `${parts[0]}.${parts.pop()}`;
      }
      // If val is not a string or does not include a dot return as is
      return val;
    };

    return isList ? value.map(getQualifier) : getQualifier(value);
  };

  // Retrieves error details for a specific node
  const getErrorDetails = (nodeId) => {
    if (!nodeId) {
      return null;
    }

    return isDataNode ? getDatasetError(nodeId) : getNodeError(nodeId);
  };

  // Cache error details to avoid multiple calls
  const currentErrorDetails = metadata?.id
    ? getErrorDetails(metadata.id)
    : null;
  const hasError = Boolean(currentErrorDetails);

  // Gets the appropriate code/traceback value based on current view
  const getCodeValue = () => {
    if (isWorkflowView) {
      return currentErrorDetails?.traceback || '';
    }

    return metadata?.code || '';
  };

  // Determines if the code/traceback panel should be shown
  const shouldShowPanel = () => {
    return isWorkflowView ? showTracebackPanel : showCodePanel;
  };

  // Gets the appropriate title for the code panel
  const getPanelTitle = () => {
    return isWorkflowView ? 'Error traceback' : 'Code block';
  };

  // Handles the error log toggle callback safely
  const handleErrorLogToggle = (event) => {
    if (event?.target) {
      onToggleTraceback(event.target.checked);
    }
  };

  return (
    <>
      <MetaDataCode
        visible={shouldShowPanel()}
        value={getCodeValue()}
        title={getPanelTitle()}
      />
      <div className={modifiers('pipeline-metadata', { visible }, 'kedro')}>
        {metadata && (
          <>
            <div className="pipeline-metadata__header-toolbox">
              <div className="pipeline-metadata__header">
                <NodeIcon
                  className="pipeline-metadata__icon"
                  icon={nodeTypeIcon}
                />
                <h2 className="pipeline-metadata__title">{metadata.name}</h2>
              </div>
              <IconButton
                ariaLabel="Close Metadata Panel"
                className={modifiers('pipeline-metadata__close-button', {
                  hasCode,
                })}
                container={React.Fragment}
                icon={CloseIcon}
                onClick={onCloseClick}
              />
              {!isWorkflowView && showCodeSwitch && (
                <Toggle
                  id="code"
                  dataTest={`metadata-code-toggle-${visibleCode}`}
                  checked={visibleCode}
                  enabled={hasCode}
                  title="Show Code"
                  onChange={(event) => {
                    onToggleCode(event.target.checked);
                  }}
                />
              )}
            </div>
            <div className="pipeline-metadata__list">
              <dl className="pipeline-metadata__properties">
                {isPrettyName ? (
                  <MetaDataRow
                    label="Original node name:"
                    value={metadata.fullName}
                  />
                ) : (
                  <MetaDataRow
                    label="Pretty node name:"
                    value={metadata.prettyName}
                  />
                )}
                <MetaDataRow
                  label="Type:"
                  value={translateMetadataType(metadata.type)}
                />
                <MetaDataRow
                  label="Error Log:"
                  visible={isWorkflowView && hasError}
                >
                  <ErrorLog
                    errorDetails={currentErrorDetails}
                    className="pipeline-metadata__error-log"
                    onToggleCode={handleErrorLogToggle}
                    dataTest={getDataTestAttribute('metadata', 'error-log')}
                    visibleTraceback={visibleTraceback}
                    isDataNode={isDataNode}
                    nodeName={metadata.name}
                  />
                </MetaDataRow>
                {!isTranscoded && (
                  <MetaDataRow
                    label="Dataset Type:"
                    visible={isDataNode}
                    kind="type"
                    title={metadata.datasetType}
                    value={shortenDatasetType(metadata.datasetType)}
                  />
                )}
                {isTranscoded && (
                  <>
                    <MetaDataRow
                      label="Original Type:"
                      visible={isDataNode}
                      value={shortenDatasetType(metadata.originalType)}
                    />
                    <MetaDataRow
                      label="Transcoded Types:"
                      visible={isDataNode}
                      value={shortenDatasetType(metadata.transcodedTypes)}
                    />
                  </>
                )}
                <MetaDataRow
                  label="File Path:"
                  kind="path"
                  empty="N/A"
                  value={removeInitialSlash(metadata.filepath)}
                />
                <MetaDataRow
                  label="Parameters:"
                  theme={theme}
                  visible={isParametersNode || isTaskNode}
                  kind="parameters"
                  commas={false}
                  inline={false}
                  value={metadata.parameters}
                  limit={10}
                />
                <MetaDataRow
                  label="Inputs:"
                  visible={isTaskNode}
                  value={metadata.inputs}
                />
                <MetaDataRow
                  label="Outputs:"
                  visible={isTaskNode}
                  value={metadata.outputs}
                />
                {metadata.type === 'task' && (
                  <MetaDataRow
                    label="Tags:"
                    kind="token"
                    commas={false}
                    value={metadata.tags}
                  />
                )}
                <MetaDataRow label="Run Command:" visible={Boolean(runCommand)}>
                  <CommandCopier
                    command={runCommand}
                    classNames={'pipeline-metadata__value'}
                    isCommand={metadata?.runCommand}
                    dataTest={'metadata-copy-command'}
                  />
                </MetaDataRow>
                {isDataNode && (
                  <>
                    <span
                      className="pipeline-metadata__label"
                      data-label="Dataset statistics:"
                    >
                      Dataset statistics:
                    </span>
                    <MetaDataStats stats={metadata?.stats}></MetaDataStats>
                  </>
                )}
              </dl>
              {hasPlot && (
                <>
                  <div
                    className="pipeline-metadata__plot"
                    onClick={onExpandMetaDataClick}
                  >
                    <PlotlyChart
                      data={metadata?.preview.data}
                      layout={metadata?.preview.layout}
                      view="preview"
                    />
                  </div>
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
                    </span>
                  </button>
                </>
              )}
              {hasImage && (
                <>
                  <div
                    className="pipeline-metadata__plot"
                    onClick={onExpandMetaDataClick}
                  >
                    <img
                      alt="Matplotlib rendering"
                      className="pipeline-metadata__plot-image"
                      src={`data:image/png;base64,${metadata?.preview}`}
                    />
                  </div>
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
                    </span>
                  </button>
                </>
              )}
              {hasTablePreview && (
                <>
                  {!isWorkflowView && (
                    <div className="pipeline-metadata__preview">
                      <div className="scrollable-container">
                        <PreviewTable
                          data={metadata?.preview}
                          size="small"
                          onClick={onExpandMetaDataClick}
                        />
                      </div>
                      <div className="pipeline-metadata__preview-shadow-box-right" />
                      <div className="pipeline-metadata__preview-shadow-box-bottom" />
                    </div>
                  )}
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
                    </span>
                  </button>
                </>
              )}
              {hasJSONPreview && (
                <>
                  <div className="pipeline-metadata__preview-json">
                    <div className="scrollable-container">
                      <JSONObject
                        value={JSON.parse(metadata.preview)}
                        theme={theme}
                        style={{ background: 'transparent', fontSize: '14px' }}
                        collapsed={3}
                      />
                    </div>
                    <div className="pipeline-metadata__preview-shadow-box-right" />
                    <div className="pipeline-metadata__preview-shadow-box-bottom" />
                  </div>
                  <button
                    className="pipeline-metadata__link"
                    onClick={onExpandMetaDataClick}
                  >
                    <ExpandIcon className="pipeline-metadata__link-icon"></ExpandIcon>
                    <span className="pipeline-metadata__link-text">
                      Expand preview
                    </span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  isPrettyName: state.isPrettyName,
  metadata: getClickedNodeMetaData(state),
  theme: state.theme,
  visible: getVisibleMetaSidebar(state),
  visibleCode: state.visible.code,
  visibleTraceback: state.visible.traceback,
  showDatasetPreviews: state.showDatasetPreviews,
  getDatasetError: (nodeId) => getDatasetError(state, nodeId),
  getNodeError: (nodeId) => getNodeError(state, nodeId),
  view: state.view,
  ...ownProps,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleNodeSelected: (nodeID) => {
    dispatch(toggleNodeClicked(nodeID));
  },
  onToggleCode: (visible) => {
    dispatch(toggleCode(visible));
  },
  onToggleTraceback: (visible) => {
    dispatch(toggleTraceback(visible));
  },
  onToggleMetadataModal: (visible) => {
    dispatch(togglePlotModal(visible));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetaData);
