import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import NodeIcon from '../../components/icons/node-icon';
import IconButton from '../../components/icon-button';
import {
  getVisibleMetaSidebar,
  getClickedNodeMetaData
} from '../../selectors/metadata';
import './styles/metadata.css';

/**
 * Shows node meta data
 */
const MetaData = ({ visible, metadata }) => {
  const [runCommandText, setRunCommandText] = useState();
  const node = metadata ? metadata.node : null;

  if (!runCommandText && metadata) {
    setRunCommandText(metadata.runCommand);
  }

  const onCopyClick = () => {
    navigator.clipboard.writeText(metadata.runCommand);
    setRunCommandText('Copied to clipboard.');
    setTimeout(() => setRunCommandText(metadata.runCommand), 2500);
  };

  return (
    <div
      className={classnames('pipeline-metadata kedro', {
        'pipeline-metadata--visible': visible
      })}>
      {metadata && (
        <>
          <div className="pipeline-metadata__row">
            <h2 className="pipeline-metadata__title">
              <NodeIcon className="pipeline-metadata__icon" type={node.type} />
              {node.name}
            </h2>
          </div>
          <div className="pipeline-metadata__row">
            <h3 className="pipeline-metadata__property">Type:</h3>
            <code className="pipeline-metadata__value pipeline-metadata__value--token">
              {node.type}
            </code>
          </div>
          <div className="pipeline-metadata__row">
            <h3 className="pipeline-metadata__property">Inputs:</h3>
            {metadata.inputs.length > 0 ? (
              <ul className="pipeline-metadata__value-list pipeline-metadata__value-list--inline pipeline-metadata__value-list--commas">
                {metadata.inputs.map(node => (
                  <li key={node.id}>
                    <span className="pipeline-metadata__value">
                      {node.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="pipeline-metadata__value">-</span>
            )}
          </div>
          <div className="pipeline-metadata__row">
            <h3 className="pipeline-metadata__property">Outputs:</h3>
            {metadata.outputs.length > 0 ? (
              <ul className="pipeline-metadata__value-list pipeline-metadata__value-list--inline pipeline-metadata__value-list--commas">
                {metadata.outputs.map(node => (
                  <li key={node.id}>
                    <span className="pipeline-metadata__value">
                      {node.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="pipeline-metadata__value">-</span>
            )}
          </div>
          <div className="pipeline-metadata__row">
            <h3 className="pipeline-metadata__property">Tags:</h3>
            <ul className="pipeline-metadata__value-list pipeline-metadata__value-list--inline">
              {metadata.tags.map(tag => (
                <li key={tag}>
                  <span className="pipeline-metadata__value pipeline-metadata__value--token">
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pipeline-metadata__row">
            <h3 className="pipeline-metadata__property">Pipeline:</h3>
            <span className="pipeline-metadata__value">
              {metadata.pipeline}
            </span>
          </div>
          <div className="pipeline-metadata__row">
            <h3 className="pipeline-metadata__property">Run Command:</h3>
            <code className="pipeline-metadata__property-toolbox-container">
              <span className="pipeline-metadata__value pipeline-metadata__value--token pipeline-metadata__run-command-value">
                {runCommandText}
              </span>
              <ul className="pipeline-metadata__property-toolbox">
                <IconButton
                  icon="copy"
                  onClick={onCopyClick}
                  className="pipeline-metadata__property-toolbox-copy"
                />
              </ul>
            </code>
          </div>
        </>
      )}
    </div>
  );
};

export const mapStateToProps = (state, ownProps) => ({
  visible: getVisibleMetaSidebar(state),
  metadata: getClickedNodeMetaData(state),
  ...ownProps
});

export default connect(mapStateToProps)(MetaData);
