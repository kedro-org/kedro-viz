import React from 'react';
import { connect } from 'react-redux';
import CheckboxTree from 'react-checkbox-tree';
import {
  loadPipelineTreeData,
  expandTreeNode
} from '../../actions/pipeline-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheckSquare,
  faSquare,
  faAngleDown,
  faAngleRight,
  faFolder,
  faFolderOpen,
  faFile,
  faPlusSquare,
  faMinusSquare
} from '@fortawesome/free-solid-svg-icons';
library.add(
  faCheckSquare,
  faSquare,
  faAngleDown,
  faAngleRight,
  faFolder,
  faFolderOpen,
  faFile,
  faPlusSquare,
  faMinusSquare
);

function prepareIcon(className, icon) {
  return <FontAwesomeIcon className={className} icon={icon} />;
}

/**
 * A Tree displaying a tree of sub-pipelines
 * @param {Object} pipelineTree Tree of sub-pipelines
 */

export const PipelineTree = ({
  asyncDataSource,
  pipelineTree,
  onCheck,
  onExpand
}) => {
  if (!pipelineTree || (!pipelineTree.length && !asyncDataSource)) {
    return null;
  }
  return (
    <div className="pipeline-tree kedro">
      <h2 className="pipeline-nodelist-section__title">Pipelines tree</h2>
      <CheckboxTree
        nodes={pipelineTree.tree}
        checked={pipelineTree.checked}
        expanded={pipelineTree.expanded}
        onCheck={onCheck}
        onExpand={onExpand}
        noCascade={true}
        showExpandAll={true}
        icons={{
          check: prepareIcon('rct-icon-check', ['fas', 'check-square']),
          uncheck: prepareIcon('rct-icon-uncheck', ['fas', 'square']),
          halfCheck: prepareIcon('rct-icon-half-check', 'check-square'),
          expandClose: prepareIcon('rct-icon-expand-close', [
            'fas',
            'angle-right'
          ]),
          expandOpen: prepareIcon('rct-icon-expand-open', [
            'fas',
            'angle-down'
          ]),
          expandAll: prepareIcon('rct-icon-expand-all', ['fas', 'plus-square']),
          collapseAll: prepareIcon('rct-icon-collapse-all', [
            'fas',
            'minus-square'
          ]),
          parentClose: prepareIcon('rct-icon-parent-close', ['fas', 'folder']),
          parentOpen: prepareIcon('rct-icon-parent-open', [
            'fas',
            'folder-open'
          ]),
          leaf: prepareIcon('rct-icon-leaf-close', ['fas', 'file'])
        }}
      />
    </div>
  );
};

export const mapStateToProps = state => ({
  asyncDataSource: state.asyncDataSource,
  pipelineTree: state.pipelineTree
  //  theme: state.theme
});

export const mapDispatchToProps = dispatch => ({
  onCheck: (checked, targetNode) => {
    dispatch(loadPipelineTreeData(checked));
  },
  onExpand: (expanded, targetNode) => {
    dispatch(expandTreeNode(expanded));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PipelineTree);
