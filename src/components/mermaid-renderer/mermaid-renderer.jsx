import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import mermaid from 'mermaid';
import './mermaid-renderer.scss';

/**
 * MermaidRenderer component for rendering Mermaid diagrams
 * @param {string} content - The Mermaid diagram markup
 * @param {string} theme - Current theme (light/dark)
 * @param {string} view - View mode ('preview' or 'modal')
 */
const MermaidRenderer = ({ content, theme, view = 'preview' }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  // Initialize mermaid with theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'var(--font-stack-default)',
    });
  }, [theme]);

  // Render diagram when content or theme changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !content) {return;}

      try {
        setError(null);
        // Generate unique ID for each diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, content);
        containerRef.current.innerHTML = svg;
      } catch (err) {
        setError(err.message || 'Failed to render diagram');
        console.error('Mermaid rendering error:', err);
      }
    };

    renderDiagram();
  }, [content, theme]);

  return (
    <div
      className={classnames(
        'pipeline-mermaid-renderer',
        `pipeline-mermaid-renderer--${view}`
      )}
    >
      {error ? (
        <div className="pipeline-mermaid-renderer__error">
          <p>Failed to render diagram:</p>
          <code>{error}</code>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="pipeline-mermaid-renderer__content"
        />
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(MermaidRenderer);
