import React from 'react';

// Mock ReactMarkdown component for Jest testing
const ReactMarkdown = ({ children, ...props }) => {
  return (
    <div data-testid="react-markdown" {...props}>
      {children}
    </div>
  );
};

export default ReactMarkdown;
