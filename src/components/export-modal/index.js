import React from 'react';
import { connect } from 'react-redux';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import { getGraphSize } from '../../selectors/layout';
import exportGraph from './export-graph';
import './export-modal.css';

/**
 * Kedro-UI modal to allow users to choose between SVG/PNG export formats
 */
const ExportModal = ({ graphSize, theme, toggleModal, visible }) => (
  <Modal
    title="Export pipeline visualisation"
    onClose={() => toggleModal(false)}
    theme={theme}
    visible={visible}>
    <div className="pipeline-icon-modal">
      <Button
        theme={theme}
        onClick={() => {
          exportGraph({ format: 'png', theme, graphSize });
          toggleModal(false);
        }}>
        Download PNG
      </Button>
      <Button
        theme={theme}
        onClick={() => {
          exportGraph({ format: 'svg', theme, graphSize });
          toggleModal(false);
        }}>
        Download SVG
      </Button>
    </div>
  </Modal>
);

export const mapStateToProps = state => ({
  graphSize: getGraphSize(state),
  theme: state.theme
});

export default connect(mapStateToProps)(ExportModal);
