import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import MetaDataCode from '../metadata/metadata-code';
import './text-renderer.scss';

/**
 * TextRenderer component for displaying plain text or code with syntax highlighting
 * @param {string} content - The text content to display
 * @param {Object} meta - Optional metadata (e.g., language for syntax highlighting)
 * @param {string} theme - Current theme (light/dark)
 * @param {string} view - View mode ('preview' or 'modal')
 */
const TextRenderer = ({ content, meta = {}, theme, view = 'preview' }) => {
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
        <MetaDataCode
          value={content}
          visible={true}
          theme={theme}
          previewMode={true}
        />
      ) : (
        <pre className="pipeline-text-renderer__content">{content}</pre>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(TextRenderer);
