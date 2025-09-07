import React, { useRef, useState, useCallback, useEffect } from 'react';


function useWatchModal() {
  const [selectedToAdd, setSelectedToAdd] = useState({});
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [paramsDialogSelectedKey, setParamsDialogSelectedKey] = useState(null);

}

export default useWatchModal;