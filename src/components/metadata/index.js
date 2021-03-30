import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import modifiers from '../../utils/modifiers';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/icon-button';
import CopyIcon from '../icons/copy';
import CloseIcon from '../icons/close';
import MetaDataRow from './metadata-row';
import MetaDataValue from './metadata-value';
import MetaDataCode from './metadata-code';
import MetaCodeToggle from './metadata-code-toggle';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData,
} from '../../selectors/metadata';
import { toggleNodeClicked } from '../../actions/nodes';
import { toggleCode } from '../../actions';
import './styles/metadata.css';

/**
 * Shows node meta data
 */
const MetaData = ({
  visible = true,
  metadata,
  visibleCode,
  onToggleCode,
  onToggleNodeSelected,
}) => {
  const [showCopied, setShowCopied] = useState(false);

  // Hide code panel when selected metadata changes
  useEffect(() => onToggleCode(false), [metadata, onToggleCode]);

  const isTaskNode = metadata?.node.type === 'task';
  const isDataNode = metadata?.node.type === 'data';
  const isParametersNode = metadata?.node.type === 'parameters';

  const hasCode = Boolean(metadata?.code);
  const showCodePanel = visible && visibleCode && hasCode;
  const showCodeSwitch = hasCode;

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(metadata.runCommand);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const onCloseClick = () => {
    // Deselecting a node automatically hides MetaData panel
    onToggleNodeSelected(null);
  };

  return (
    <>
      <MetaDataCode visible={showCodePanel} value={metadata?.code} />
      <div className={modifiers('pipeline-metadata', { visible }, 'kedro')}>
        {metadata && (
          <>
            <div className="pipeline-metadata__header-toolbox">
              <div className="pipeline-metadata__header">
                <NodeIcon
                  className="pipeline-metadata__icon"
                  type={metadata.node.type}
                />
                <h2 className="pipeline-metadata__title">
                  {metadata.node.name}
                </h2>
              </div>
              <IconButton
                container={React.Fragment}
                ariaLabel="Close Metadata Panel"
                className={modifiers('pipeline-metadata__close-button', {
                  hasCode,
                })}
                icon={CloseIcon}
                onClick={onCloseClick}
              />
              {showCodeSwitch && (
                <MetaCodeToggle
                  showCode={visibleCode}
                  hasCode={hasCode}
                  onChange={(event) => onToggleCode(event.target.checked)}
                />
              )}
            </div>
            <dl className="pipeline-metadata__list">
              <MetaDataRow label="Type:" value={metadata.node.type} />
              <MetaDataRow
                label="Dataset Type:"
                visible={isDataNode}
                kind="type"
                value={metadata.datasetType}
              />
              <MetaDataRow
                label="File Path:"
                kind="path"
                value={metadata.filepath}
              />
              <MetaDataRow
                label={`Parameters (${metadata.parameters?.length || '-'}):`}
                visible={isParametersNode || isTaskNode}
                commas={false}
                inline={false}
                value={metadata.parameters}
                limit={10}
              />
              <MetaDataRow
                label="Inputs:"
                property="name"
                visible={isTaskNode}
                value={metadata.inputs}
              />
              <MetaDataRow
                label="Outputs:"
                property="name"
                visible={isTaskNode}
                value={metadata.outputs}
              />
              <MetaDataRow
                label="Tags:"
                kind="token"
                commas={false}
                value={metadata.tags}
              />
              <MetaDataRow
                label="Pipeline:"
                visible={Boolean(metadata.pipeline)}
                value={metadata.pipeline}
              />
              <MetaDataRow
                label="Run Command:"
                visible={Boolean(metadata.runCommand)}>
                <div className="pipeline-metadata__toolbox-container">
                  <MetaDataValue
                    container={'code'}
                    className={modifiers(
                      'pipeline-metadata__run-command-value',
                      {
                        visible: !showCopied,
                      }
                    )}
                    value={metadata.runCommand}
                  />
                  {window.navigator.clipboard && (
                    <>
                      <span
                        className={modifiers(
                          'pipeline-metadata__copy-message',
                          {
                            visible: showCopied,
                          }
                        )}>
                        Copied to clipboard.
                      </span>
                      <ul className="pipeline-metadata__toolbox">
                        <IconButton
                          ariaLabel="Copy run command to clipboard."
                          className="pipeline-metadata__copy-button"
                          icon={CopyIcon}
                          onClick={onCopyClick}
                        />
                      </ul>
                    </>
                  )}
                </div>
              </MetaDataRow>
              <MetaDataRow
                label="Description (docstring):"
                visible={isTaskNode}
                value={metadata.docstring}
              />
            </dl>
          </>
        )}
      </div>
    </>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  visible: getVisibleMetaSidebar(state),
  metadata: getClickedNodeMetaData(state),
  visibleCode: state.visible.code,
  ...ownProps,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleNodeSelected: (nodeID) => {
    dispatch(toggleNodeClicked(nodeID));
  },
  onToggleCode: (visible) => {
    dispatch(toggleCode(visible));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MetaData);
