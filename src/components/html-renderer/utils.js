/**
 * Simple markdown-to-HTML converter for basic markdown features
 */

export const renderMarkdownToHTML = (markdown) => {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let html = markdown;

  // Tables - process before other replacements
  html = html.replace(
    /\|(.+)\|\n\|[-s|:]+\|\n((?:\|.+\|\n?)*)/gim,
    (match, header, rows) => {
      const headerCells = header
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell);
      const headerRow =
        '<tr>' +
        headerCells.map((cell) => `<th>${cell}</th>`).join('') +
        '</tr>';

      const bodyRows = rows
        .trim()
        .split('\n')
        .map((row) => {
          const cells = row
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell) => cell);
          return (
            '<tr>' + cells.map((cell) => `<td>${cell}</td>`).join('') + '</tr>'
          );
        })
        .join('');

      return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
    }
  );

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

  // Code blocks (```language or ```)
  html = html.replace(
    /```(\w+)?\n([\s\S]*?)```/gim,
    '<pre><code class="language-$1">$2</code></pre>'
  );

  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/gim,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Lists (numbered)
  html = html.replace(/^\d+\.\s(.+)$/gim, '<li>$1</li>');

  // Lists (bulleted)
  html = html.replace(/^[*-]\s(.+)$/gim, '<li>$1</li>');

  // Wrap consecutive list items in ul/ol tags
  html = html.replace(/(<li>.*<\/li>)/gims, (match) => {
    // Check if this was originally a numbered list
    const originalText = markdown.substring(
      markdown.indexOf(match.replace(/<\/?li>/g, ''))
    );
    if (/^\d+\./.test(originalText)) {
      return '<ol>' + match + '</ol>';
    }
    return '<ul>' + match + '</ul>';
  });
  html = html.replace(/<\/(ul|ol)>\s*<\1>/gim, '');

  // Line breaks - handle last to avoid interfering with other patterns
  html = html.replace(/\n\s*\n/gim, '</p><p>');
  html = html.replace(/\n/gim, '<br>');

  // Wrap in paragraph tags
  html = '<p>' + html + '</p>';

  // Clean up - remove empty paragraphs and fix table/list wrapping
  html = html.replace(/<p><\/p>/gim, '');
  html = html.replace(/<p><br><\/p>/gim, '');
  html = html.replace(/<p>(<table>.*?<\/table>)<\/p>/gims, '$1');
  html = html.replace(/<p>(<[uo]l>.*?<\/[uo]l>)<\/p>/gims, '$1');
  html = html.replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/gims, '$1');

  return html;
};
