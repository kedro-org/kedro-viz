import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'isomorphic-dompurify';

import './html-renderer.scss';

const HTMLRenderer = ({ content, className = '', fontSize }) => {
  const style = fontSize ? { fontSize } : {};

  const sanitizedContent = DOMPurify.sanitize(content || '');

  return (
    <div className={`html-renderer ${className}`} style={style}>
      <ReactMarkdown
        // Enable GitHub Flavored Markdown features (tables, strikethrough, task lists, autolinks, footnotes)
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children, ...props }) => (
            <table className="markdown-table" {...props}>
              {children}
            </table>
          ),
          code: ({ inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="code-block">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default HTMLRenderer;
