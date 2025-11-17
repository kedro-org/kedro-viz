import React from 'react';
import { render } from '@testing-library/react';
import { MetaDataCode } from './metadata-code';
import '@testing-library/jest-dom';

describe('MetaDataCode', () => {
  const testCode = 'def test(): print "hello"';

  it('shows the value as highlighted code', () => {
    const { container } = render(
      <MetaDataCode visible={true} value={testCode} />
    );

    const codeBlock = container.querySelector(
      '.pipeline-metadata-code__code pre'
    );

    expect(codeBlock?.innerHTML).toContain(
      '<span class="hljs-title">test</span>'
    );
    expect(codeBlock?.innerHTML).toContain(
      '<span class="hljs-string">"hello"</span>'
    );
  });

  it('adds sidebarVisible class when sidebarVisible is true', () => {
    const { container } = render(
      <MetaDataCode sidebarVisible={true} visible={true} value={testCode} />
    );

    const wrapper = container.querySelector('.pipeline-metadata-code');
    expect(
      wrapper?.classList.contains('pipeline-metadata-code--sidebarVisible')
    ).toBe(true);
    expect(
      wrapper?.classList.contains('pipeline-metadata-code--no-sidebarVisible')
    ).toBe(false);
  });

  it('adds no-sidebarVisible class when sidebarVisible is false', () => {
    const { container } = render(
      <MetaDataCode sidebarVisible={false} visible={true} value={testCode} />
    );

    const wrapper = container.querySelector('.pipeline-metadata-code');
    expect(
      wrapper?.classList.contains('pipeline-metadata-code--sidebarVisible')
    ).toBe(false);
    expect(
      wrapper?.classList.contains('pipeline-metadata-code--no-sidebarVisible')
    ).toBe(true);
  });
});
