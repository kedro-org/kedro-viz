import React, { createContext, useState } from 'react';

export const HoverStateContext = createContext(null);

export const HoverStateContextProvider = ({ children }) => {
  const [hoveredElementId, setHoveredElementId] = useState(null);

  return (
    <HoverStateContext.Provider
      value={{
        hoveredElementId,
        setHoveredElementId,
      }}
    >
      {children}
    </HoverStateContext.Provider>
  );
};
