import React from 'react';
import Banner from './banner';
import sinon from 'sinon';
import { mount } from 'enzyme';

describe('Banner', () => {
  const message = {
    title: 'test title',
    body: 'test body',
  };

  it('shows the  banner component with the required message', () => {
    const wrapper = mount(<Banner message={message} />);

    const bannerMessageTitle = wrapper.find('.banner-message-title');
    const bannerMessageBody = wrapper.find('.banner-message-body');

    expect(bannerMessageTitle.text()).toEqual(message.title);
    expect(bannerMessageBody.text()).toEqual(message.body);
  });

  it('renders the optional icon when provided', () => {
    const wrapper = mount(
      <Banner message={message} icon={<svg data-testid="test-icon"></svg>} />
    );
    expect(wrapper.find('.banner-icon').length).toBe(1);
  });

  it('does not render the optional redirect button by default', () => {
    const wrapper = mount(<Banner message={message} />);
    expect(wrapper.find('.kedro button').length).toBe(0);
  });

  it('renders the optional redirect button when provided', () => {
    const btnUrl = 'https://example.com';
    const btnText = 'Test Redirect';

    const wrapper = mount(
      <Banner message={message} btnUrl={btnUrl} btnText={btnText} />
    );

    const anchorTag = wrapper.find('a');
    expect(anchorTag.prop('href')).toBe(btnUrl);

    const redirectButton = wrapper.find('button');
    expect(redirectButton.text()).toBe(btnText);
  });

  it('closes the banner when close icon is clicked', () => {
    const onClose = sinon.spy();
    const wrapper = mount(
      <Banner message={message} onClose={onClose}></Banner>
    );

    wrapper.find('.banner-close').simulate('click');
    expect(onClose.callCount).toBe(1);
    expect(wrapper.find('banner').length).toBe(0);
  });

  it('renders the banner with correct positioning class', () => {
    const wrapper = mount(
      <Banner message={message} position="bottom"></Banner>
    );
    expect(wrapper.find('.banner-bottom').length).toBe(1);
  });
});
