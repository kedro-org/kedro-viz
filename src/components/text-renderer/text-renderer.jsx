import React from 'react';
import classnames from 'classnames';
import SyntaxHighlighter from '../ui/syntax-highlighter';
import './text-renderer.scss';

/**
 * TextRenderer component for displaying plain text or code with syntax highlighting
 * @param {string} content - The text content to display
 * @param {Object} meta - Optional metadata (e.g., language for syntax highlighting)
 * @param {string} view - View mode ('preview' or 'modal')
 */
const TextRenderer = ({ content, meta = {}, view = 'preview' }) => {
  const { language } = meta;
  const isCode = Boolean(language);

  return (
    <div
      className={classnames(
        'pipeline-text-renderer',
        `pipeline-text-renderer--${view}`
      )}
    >
      {isCode ? (
        <div className="pipeline-text-renderer__code">
          <SyntaxHighlighter code={content} language={language} />
        </div>
      ) : (
        <pre className="pipeline-text-renderer__content">{content}</pre>
      )}
    </div>
  );
};

export default TextRenderer;
