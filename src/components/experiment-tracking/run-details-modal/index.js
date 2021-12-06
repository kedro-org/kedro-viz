import React, { useEffect, useState } from 'react';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';

import '../../settings-modal/settings-modal.css';
import './run-details-modal.css';

const Input = ({ defaultValue = '', size = 'large', inputType = 'input' }) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  if (inputType === 'textarea') {
    return (
      <textarea
        className={`run-details-modal-input run-details-modal-input--${size}`}
        onChange={handleChange}
        rows="4"
        value={value}
      />
    );
  } else {
    return (
      <input
        className={`run-details-modal-input run-details-modal-input--${size}`}
        onChange={handleChange}
        type="text"
        value={value}
      />
    );
  }
};

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
          <Input
            defaultValue={selectedRunMetadata?.notes || 'Add here'}
            size="small"
            inputType="textarea"
          />
        </div>
        <div className="run-details-modal-btn-wrapper">
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
