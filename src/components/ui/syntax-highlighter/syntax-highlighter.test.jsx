import React from 'react';
import { render } from '@testing-library/react';
import SyntaxHighlighter from './syntax-highlighter';

describe('SyntaxHighlighter', () => {
  it('should be a function', () => {
    expect(typeof SyntaxHighlighter).toBe('function');
  });

  it('renders without crashing with empty code', () => {
    const { container } = render(<SyntaxHighlighter code="" />);
    expect(container.querySelector('.syntax-highlighter')).toBeInTheDocument();
  });

  it('renders plain text code without language specified', () => {
    const code = 'const x = 42;';
    const { container } = render(<SyntaxHighlighter code={code} />);
    const highlighter = container.querySelector('.syntax-highlighter');
    expect(highlighter).toBeInTheDocument();
    expect(highlighter.textContent).toContain(code);
  });

  it('renders code with language specified', () => {
    const code = 'def hello():\n    print("Hello World")';
    const { container } = render(
      <SyntaxHighlighter code={code} language="python" />
    );
    const highlighter = container.querySelector('.syntax-highlighter');
    expect(highlighter).toBeInTheDocument();
    expect(highlighter.textContent).toContain('hello');
  });

  it('renders code with auto-detected language', () => {
    const code = 'function test() { return true; }';
    const { container } = render(<SyntaxHighlighter code={code} />);
    const highlighter = container.querySelector('.syntax-highlighter');
    expect(highlighter).toBeInTheDocument();
    expect(highlighter.textContent).toContain('function');
  });

  it('handles invalid language gracefully', () => {
    const code = 'some code';
    const { container } = render(
      <SyntaxHighlighter code={code} language="invalid-lang" />
    );
    const highlighter = container.querySelector('.syntax-highlighter');
    expect(highlighter).toBeInTheDocument();
    expect(highlighter.textContent).toContain(code);
  });

  it('renders YAML code correctly', () => {
    const code = 'key: value\nlist:\n  - item1\n  - item2';
    const { container } = render(
      <SyntaxHighlighter code={code} language="yaml" />
    );
    const highlighter = container.querySelector('.syntax-highlighter');
    expect(highlighter).toBeInTheDocument();
    expect(highlighter.textContent).toContain('key');
  });

  it('renders JavaScript code correctly', () => {
    const code = 'const myVar = "test";\nconsole.log(myVar);';
    const { container } = render(
      <SyntaxHighlighter code={code} language="javascript" />
    );
    const highlighter = container.querySelector('.syntax-highlighter');
    expect(highlighter).toBeInTheDocument();
    expect(highlighter.textContent).toContain('myVar');
  });

  it('contains a pre element', () => {
    const code = 'test code';
    const { container } = render(<SyntaxHighlighter code={code} />);
    expect(
      container.querySelector('.syntax-highlighter pre')
    ).toBeInTheDocument();
  });

  it('applies dangerouslySetInnerHTML to pre element', () => {
    const code = 'const x = 1;';
    const { container } = render(
      <SyntaxHighlighter code={code} language="javascript" />
    );
    const pre = container.querySelector('.syntax-highlighter pre');
    expect(pre).toBeInTheDocument();
    expect(pre.innerHTML).toBeTruthy();
  });
});
