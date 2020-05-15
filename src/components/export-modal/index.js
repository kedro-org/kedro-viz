import React from 'react';
import { connect } from 'react-redux';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import { toggleExportModal } from '../../actions';
import { getGraphSize } from '../../selectors/layout';
import exportGraph from './export-graph';
import './export-modal.css';

/**
 * Kedro-UI modal to allow users to choose between SVG/PNG export formats
 */
const ExportModal = ({ graphSize, theme, onToggle, visible }) => {
  if (!visible.exportBtn) {
    return null;
  }
  return (
    <Modal
      title="Export pipeline visualisation"
      onClose={() => onToggle(false)}
      theme={theme}
      visible={visible.exportModal}>
      <div className="pipeline-icon-modal">
        <Button
          theme={theme}
          onClick={() => {
            exportGraph({ format: 'png', theme, graphSize });
            onToggle(false);
          }}>
          Download PNG
        </Button>
        <Button
          theme={theme}
          onClick={() => {
            exportGraph({ format: 'svg', theme, graphSize });
            onToggle(false);
          }}>
          Download SVG
        </Button>
      </div>
    </Modal>
  );
};

export const mapStateToProps = state => ({
  graphSize: getGraphSize(state),
  visible: state.visible,
  theme: state.theme
});

export const mapDispatchToProps = dispatch => ({
  onToggle: value => {
    dispatch(toggleExportModal(value));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ExportModal);
