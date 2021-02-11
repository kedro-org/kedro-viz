import React from 'react';
import { MetaDataCode } from './metadata-code';
import MetaCodeToggle from './metadata-code-toggle';
import { setup } from '../../utils/state.mock';

describe('MetaDataCode', () => {
  const testCode = 'def test(): print "hello"';

  it('shows the value as highlighted code', () => {
    const wrapper = setup.mount(
      <MetaDataCode visible={true} value={testCode} />
    );

    // Jest can't query DOM rendered by highlight.js
    const highlighted = wrapper
      .find('.pipeline-metadata-code__code pre')
      .html();

    // Test a sample of expected highlighted code
    expect(highlighted.includes('<span class="hljs-title">test</span>')).toBe(
      true
    );
    expect(
      highlighted.includes('<span class="hljs-string">"hello"</span>')
    ).toBe(true);
  });

  it('adds sidebarVisible class when sidebarVisible prop is true', () => {
    const wrapper = setup.mount(
      <MetaDataCode sidebarVisible={true} visible={true} value={testCode} />
    );
    expect(
      wrapper.find('.pipeline-metadata-code--sidebarVisible').exists()
    ).toBe(true);
    expect(
      wrapper.find('.pipeline-metadata-code--no-sidebarVisible').exists()
    ).toBe(false);
  });

  it('removes sidebarVisible class when sidebarVisible prop is false', () => {
    const wrapper = setup.mount(
      <MetaDataCode sidebarVisible={false} visible={true} value={testCode} />
    );
    expect(
      wrapper.find('.pipeline-metadata-code--sidebarVisible').exists()
    ).toBe(false);
    expect(
      wrapper.find('.pipeline-metadata-code--no-sidebarVisible').exists()
    ).toBe(true);
  });
});

describe('MetaCodeToggle', () => {
  const input = (wrapper) =>
    wrapper.find('.pipeline-metadata__code-toggle-input');
  const label = (wrapper) =>
    wrapper.find('.pipeline-metadata__code-toggle-label');

  it('is checked when showCode is true', () => {
    const wrapper = setup.mount(
      <MetaCodeToggle showCode={true} hasCode={true} onChange={jest.fn()} />
    );
    expect(input(wrapper).prop('checked')).toBe(true);
    expect(
      label(wrapper).hasClass('pipeline-metadata__code-toggle-label--checked')
    ).toBe(true);
  });

  it('is not checked when showCode is false', () => {
    const wrapper = setup.mount(
      <MetaCodeToggle showCode={false} hasCode={true} onChange={jest.fn()} />
    );
    expect(input(wrapper).prop('checked')).toBe(false);
    expect(
      label(wrapper).hasClass('pipeline-metadata__code-toggle-label--checked')
    ).toBe(false);
  });

  it('is disabled when hasCode is false', () => {
    const wrapper = setup.mount(
      <MetaCodeToggle showCode={true} hasCode={false} onChange={jest.fn()} />
    );
    expect(input(wrapper).prop('disabled')).toBe(true);
  });

  it('is not disabled when hasCode is true', () => {
    const wrapper = setup.mount(
      <MetaCodeToggle showCode={true} hasCode={true} onChange={jest.fn()} />
    );
    expect(input(wrapper).prop('disabled')).toBe(false);
  });

  it('onChange callback fires when input changed', () => {
    const wrapper = setup.mount(
      <MetaCodeToggle showCode={true} hasCode={true} onChange={jest.fn()} />
    );

    expect(input(wrapper).prop('checked')).toBe(true);

    // Simulate user changing the input (directly as Enzyme doesn't support it)
    input(wrapper).prop('onChange')();

    expect(wrapper.find(MetaCodeToggle).prop('onChange')).toHaveBeenCalled();
  });
});
