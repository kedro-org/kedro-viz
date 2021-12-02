import React from 'react';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';

import '../../settings-modal/settings-modal.css';

const RunDetailsModal = ({ onClose, selectedRunMetadata, theme, visible }) => {
  return (
    <div className="pipeline-settings-modal">
      <Modal
        onClose={() => onClose(false)}
        theme={theme}
        title="Edit run details"
        visible={visible}
      >
        <div className="pipeline-settings-modal__content pipeline-settings-modal__content--short">
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">Run name</div>
          </div>
          <input type="text" value={selectedRunMetadata?.title} />
        </div>
        <div className="pipeline-settings-modal__content pipeline-settings-modal__content--short">
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">
              Notes (this is searchable)
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RunDetailsModal;
