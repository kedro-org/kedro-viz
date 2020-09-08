import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { NodeListSearch, mapStateToProps } from './node-list-search';
import { mockState, setup } from '../../utils/state.mock';

describe('NodeListSearch', () => {
  it('renders without crashing', () => {
    const wrapper = setup.shallow(NodeListSearch);
    const search = wrapper.find('.pipeline-nodelist-search');
    expect(search.length).toBe(1);
  });

  it('handles escape key events', () => {
    const onUpdateSearchValue = jest.fn();
    const wrapper = setup.shallow(NodeListSearch, { onUpdateSearchValue });
    const search = wrapper.find('.pipeline-nodelist-search');
    search.simulate('keydown', { keyCode: 27 });
    expect(onUpdateSearchValue.mock.calls.length).toBe(1);
  });

  it('focuses when the user types Ctrl+F', () => {
    const { container } = render(<NodeListSearch />);
    const input = container.querySelector('input');
    fireEvent.keyDown(container, { key: 'f', keyCode: 70, ctrlKey: true });
    expect(input).toHaveFocus();
  });

  it('focuses when the user types Cmd+F', () => {
    const { container } = render(<NodeListSearch />);
    const input = container.querySelector('input');
    fireEvent.keyDown(container, { key: 'f', keyCode: 70, metaKey: true });
    expect(input).toHaveFocus();
  });

  it('does not prevent default browser find event if input is already focused', () => {
    const { container } = render(<NodeListSearch />);
    const event = { key: 'f', keyCode: 70, metaKey: true };
    let allowsDefaultEvent = fireEvent.keyDown(container, event);
    expect(allowsDefaultEvent).toBe(false);
    allowsDefaultEvent = fireEvent.keyDown(container, event);
    expect(allowsDefaultEvent).toBe(true);
  });

  it('blurs input if already focused', () => {
    const { container } = render(<NodeListSearch />);
    const input = container.querySelector('input');
    const event = { key: 'f', keyCode: 70, metaKey: true };
    fireEvent.keyDown(container, event);
    expect(input).toHaveFocus();
    fireEvent.keyDown(container, event);
    expect(input).not.toHaveFocus();
  });

  it('maps state to props', () => {
    const expectedResult = {
      theme: expect.any(String)
    };
    expect(mapStateToProps(mockState.animals)).toEqual(expectedResult);
  });
});
