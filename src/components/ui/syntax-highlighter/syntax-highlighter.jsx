import React, { useRef, useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import javascript from 'highlight.js/lib/languages/javascript';
import './syntax-highlighter.scss';

hljs.registerLanguage('python', python);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('javascript', javascript);

/**
 * SyntaxHighlighter - Pure UI component for displaying syntax-highlighted code
 * @param {string} code - The code content to display
 * @param {string} language - Optional language for syntax highlighting
 */
const SyntaxHighlighter = ({ code = '', language }) => {
  const codeRef = useRef();

  const highlighted = useMemo(() => {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    const detected = hljs.highlightAuto(code);
    const detectedLang = detected.language || detected.second_best?.language;
    return detectedLang
      ? hljs.highlight(code, { language: detectedLang }).value
      : code;
  }, [code, language]);

  return (
    <code className="syntax-highlighter">
      <pre ref={codeRef} dangerouslySetInnerHTML={{ __html: highlighted }} />
    </code>
  );
};

export default SyntaxHighlighter;
