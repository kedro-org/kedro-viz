import React, { createContext, useState } from 'react';

export const HoverStateContext = createContext(null);

/**
 * Provides a way to pass different states to a button depending on whether
 * it's successful or not.
 * {@returns hasNotInteracted and setHasNotInteracted} these 2 are only used for modal with editable fields
 */
export const HoverStateContextProvider = ({ children }) => {
  const [isHovered, setIsHovered] = useState(null);

  const handleMouseOver = (runId) => {
    setIsHovered(runId);
  };
  const handleMouseOut = () => {
    setIsHovered(null);
  };

  return (
    <HoverStateContext.Provider
      value={{
        handleMouseOut,
        handleMouseOver,
        isHovered,
      }}
    >
      {children}
    </HoverStateContext.Provider>
  );
};
