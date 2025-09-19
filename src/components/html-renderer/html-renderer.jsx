import React from 'react';
import { renderMarkdownToHTML } from './utils';
import './html-renderer.scss';

const HTMLRenderer = ({ content, className = '', fontSize }) => {
  const style = fontSize ? { fontSize } : {};

  return (
    <div
      className={`html-renderer ${className}`}
      style={style}
      dangerouslySetInnerHTML={{
        __html: renderMarkdownToHTML(content),
      }}
    />
  );
};

export default HTMLRenderer;
