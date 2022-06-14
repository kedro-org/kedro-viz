import React, { createContext, useState } from 'react';

export const ButtonTimeoutContext = createContext(null);

/**
 * provides a way to pass different states to button depends on whether its successful, or not
 * {@return hasInteracted and setHasInteracted} these 2 are only used for modal with editable fields
 */
export const ButtonTimeoutContextProvider = ({ children }) => {
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleClick = () => {
    setShowModal(true);

    const localStateTimeout = setTimeout(() => {
      setIsSuccessful(true);
    }, 500);

    // so user is able to see the success message on the button first before the modal goes away
    const modalTimeout = setTimeout(() => {
      setShowModal(false);
    }, 1500);

    // Delay the reset so the user can't see the button text change.
    const resetTimeout = setTimeout(() => {
      setIsSuccessful(false);
      setHasInteracted(false);
    }, 2000);

    return () => {
      clearTimeout(localStateTimeout);
      clearTimeout(modalTimeout);
      clearTimeout(resetTimeout);
    };
  };

  return (
    <ButtonTimeoutContext.Provider
      value={{
        isSuccessful,
        showModal,
        hasInteracted,
        handleClick,
        setIsSuccessful: (state) => setIsSuccessful(state),
        setHasInteracted: (state) => setHasInteracted(state),
      }}
    >
      {children}
    </ButtonTimeoutContext.Provider>
  );
};
