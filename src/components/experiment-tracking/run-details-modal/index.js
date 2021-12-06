import React from 'react';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import Input from '../../ui/input';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import TextArea from '../../ui/textarea';

import '../../settings-modal/settings-modal.css';
import './run-details-modal.css';

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
          <Input defaultValue={selectedRunMetadata?.title} />
        </div>
        <div className="pipeline-settings-modal__content pipeline-settings-modal__content--short">
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">
              Notes (this is searchable)
            </div>
          </div>
          <TextArea
            defaultValue={selectedRunMetadata?.notes || 'Add here'}
            size="small"
            inputType="textarea"
            limit={500}
            rows={4}
          />
        </div>
        <div className="run-details-modal-button-wrapper">
          <Button
            mode="secondary"
            onClick={() => onClose(false)}
            size="small"
            theme={theme}
          >
            Cancel
          </Button>
          <Button size="small" theme={theme}>
            Apply changes
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RunDetailsModal;
