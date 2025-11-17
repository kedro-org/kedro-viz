import classnames from 'classnames';
import DOMPurify from 'isomorphic-dompurify';
import { renderMarkdownToHTML } from './utils';

import './html-renderer.scss';

const HTMLRenderer = ({ content, className = '', fontSize }) => {
  const style = fontSize ? { fontSize } : {};

  // Sanitise the raw content first
  const sanitisedContent = DOMPurify.sanitize(content || '');

  // Convert the sanitised markdown to HTML
  const htmlContent = renderMarkdownToHTML(sanitisedContent);

  return (
    <div
      className={classnames('html-renderer', className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default HTMLRenderer;
