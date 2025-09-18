import React from 'react';
import { renderMarkdownToHTML } from './utils';
import './html-renderer.scss';

const HTMLRenderer = ({ content, className = '', size = 'default' }) => {
  return (
    <div
      className={`html-renderer html-renderer--${size} ${className}`}
      dangerouslySetInnerHTML={{
        __html: renderMarkdownToHTML(content),
      }}
    />
  );
};

export default HTMLRenderer;
