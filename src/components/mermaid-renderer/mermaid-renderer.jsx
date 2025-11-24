import React, { useEffect, useRef, forwardRef } from 'react';
import mermaid from 'mermaid';
import './mermaid-renderer.scss';

// Simple mermaid initialization
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const MermaidRenderer = forwardRef(({ content, className = '' }, ref) => {
  const mermaidRef = useRef(null);

  useEffect(() => {
    const renderDiagram = async () => {
      const targetElement = ref?.current || mermaidRef.current;
      if (!targetElement) {
        return;
      }

      // Use provided content, fallback to test content if none provided
      const diagramContent =
        content ||
        `graph TD
    A[No Content] --> B[Check Backend]
    B --> C[Provide Preview Data]`;

      try {
        // Clear any previous content
        targetElement.innerHTML = '';

        // Generate a unique ID
        const id = `mermaid-${Date.now()}`;

        console.log('Rendering mermaid with content:', diagramContent);

        // Render the diagram
        const { svg } = await mermaid.render(id, diagramContent);

        // Insert the rendered SVG directly
        targetElement.innerHTML = svg;

        console.log('Mermaid diagram rendered successfully!');
      } catch (error) {
        console.error('Mermaid error:', error);
        targetElement.innerHTML = `
          <div style="padding: 20px; border: 1px solid red; background: #ffe6e6; color: red;">
            <strong>Mermaid Error:</strong><br/>
            ${error.message}<br/>
            <details>
              <summary>Content:</summary>
              <pre>${diagramContent}</pre>
            </details>
          </div>
        `;
      }
    };

    renderDiagram();
  }, [content, ref]); // Re-render when content changes

  // Return a simple div only if no external ref is provided
  if (ref) {
    return null;
  }

  return (
    <div
      className={`mermaid-renderer ${className}`}
      ref={mermaidRef}
      style={{
        minHeight: '200px',
      }}
    >
      Loading diagram...
    </div>
  );
});

export default MermaidRenderer;
