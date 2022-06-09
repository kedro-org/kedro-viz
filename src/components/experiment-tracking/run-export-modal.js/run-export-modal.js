import React, { useState, useCallback } from 'react';
import { CSVLink } from 'react-csv';

import { constructExportData } from '../../../utils/experiment-tracking-utils';

import Button from '../../ui/button';
import Modal from '../../ui/modal';

import './run-export-modal.css';

const RunExportModal = ({
  theme,
  visible,
  setShowRunExportModal,
  runMetadata,
  runTrackingData,
}) => {
  const [exportData, setExportData] = useState([]);
  const [isExported, setIsExported] = useState(false);

  const updateExportData = useCallback(() => {
    setExportData(constructExportData(runMetadata, runTrackingData));
  }, [runMetadata, runTrackingData]);

  const handleClick = () => {
    const setLocalStateTimeout = setTimeout(() => {
      setIsExported(true);
    }, 500);

    // so user is able to see the success message on the button first before the modal goes away
    const resetTimeout = setTimeout(() => {
      setShowRunExportModal(false);
    }, 1500);

    // so the user can't see the button text change.
    const resetLocalStateTimeout = setTimeout(() => {
      setIsExported(false);
    }, 2000);

    return () => {
      clearTimeout(setLocalStateTimeout);
      clearTimeout(resetTimeout);
      clearTimeout(resetLocalStateTimeout);
    };
  };

  return (
    <div className="pipeline-run-export-modal pipeline-run-export-modal--experiment-tracking">
      <Modal
        closeModal={() => setShowRunExportModal(false)}
        theme={theme}
        title="Export experiment run"
        visible={visible}
      >
        <div className="run-export-modal-button-wrapper">
          <Button mode="secondary" onClick={() => setShowRunExportModal(false)}>
            Cancel
          </Button>
          <CSVLink
            data={exportData}
            asyncOnClick={true}
            onClick={updateExportData}
            filename="run-data.csv"
          >
            <Button onClick={handleClick}>
              {isExported ? (
                <>
                  Done <span className="success-check-mark">✅</span>
                </>
              ) : (
                'Export all and close'
              )}
            </Button>
          </CSVLink>
        </div>
      </Modal>
    </div>
  );
};

export default RunExportModal;
