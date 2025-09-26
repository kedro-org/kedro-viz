import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { renderMarkdownToHTML } from './utils';

import './html-renderer.scss';

const HTMLRenderer = ({ content, className = '', fontSize }) => {
  const style = fontSize ? { fontSize } : {};

  // Sanitise the raw content first to prevent XSS attacks
  const sanitisedContent = DOMPurify.sanitize(content || '');

  // Convert the sanitized markdown to HTML using our utility function
  const htmlContent = renderMarkdownToHTML(sanitisedContent);

  return (
    <div
      className={`html-renderer ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default HTMLRenderer;
