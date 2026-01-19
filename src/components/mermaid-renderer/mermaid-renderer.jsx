import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import deepmerge from 'deepmerge';
import mermaid from 'mermaid';
import './mermaid-renderer.scss';

/**
 * Get default Mermaid configuration
 * @returns {object} Default configuration
 */
const getDefaultConfig = () => ({
  securityLevel: 'strict',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    wrappingWidth: 250,
    useMaxWidth: true,
    nodeSpacing: 50,
    rankSpacing: 50,
  },
  themeVariables: {
    fontSize: '14px',
  },
  textStyle: {
    whiteSpace: 'normal',
    wordBreak: 'normal',
    overflowWrap: 'normal',
    overflow: 'visible',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    padding: '4px',
    lineHeight: '1.2',
  },
});

/**
 * MermaidRenderer component for rendering Mermaid diagrams
 * @param {string} content - The Mermaid diagram markup
 * @param {string} theme - Current theme (light/dark)
 * @param {string} view - View mode ('preview' or 'modal')
 * @param {object} config - Optional Mermaid configuration object
 */
const MermaidRenderer = ({ content, theme, view = 'preview', config = {} }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  // Initialize mermaid with merged configuration
  useEffect(() => {
    const defaultConfig = getDefaultConfig();
    const mergedConfig = deepmerge(defaultConfig, config);

    // Extract textStyle from config (not part of Mermaid's config)
    const { textStyle, ...mermaidConfig } = mergedConfig;

    // Initialize Mermaid with merged config plus theme
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      ...mermaidConfig,
    });
  }, [theme, config]);

  // Render diagram when content or theme changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !content) {return;}

      try {
        setError(null);
        // Small delay to ensure container is sized
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Generate unique ID for each diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, content);

        // Insert SVG into container
        containerRef.current.innerHTML = svg;

        // Post-process: Apply text styling to nodes
        const defaultConfig = getDefaultConfig();
        const mergedConfig = deepmerge(defaultConfig, config);
        const textStyle = mergedConfig.textStyle;

        const foreignObjects =
          containerRef.current.querySelectorAll('foreignObject');
        foreignObjects.forEach((foreignObject) => {
          const div = foreignObject.querySelector('div');
          if (div) {
            // Apply text styles to div
            Object.keys(textStyle).forEach((key) => {
              div.style[key] = textStyle[key];
            });
          }
        });
      } catch (err) {
        setError(err.message || 'Failed to render diagram');
        console.error('Mermaid rendering error:', err);
      }
    };

    renderDiagram();
  }, [content, theme, config]);

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
