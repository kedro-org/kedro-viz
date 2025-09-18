import { renderMarkdownToHTML } from './utils';
import './markdown-renderer.scss';

const MarkdownRenderer = ({ content, className = '', size = 'default' }) => {
  return (
    <div
      className={`markdown-renderer markdown-renderer--${size} ${className}`}
      dangerouslySetInnerHTML={{
        __html: renderMarkdownToHTML(content),
      }}
    />
  );
};

export default MarkdownRenderer;
