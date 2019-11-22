import React from 'react';
import IconToolbar, {
  ThemeButton,
  LabelButton,
  mapStateToProps,
  mapDispatchToProps
} from './index';
import { mockState, setup } from '../../utils/state.mock';
import { getInitialState } from '../app/load-data';
import formatData from '../../utils/format-data';
import loremIpsum from '../../utils/data/lorem-ipsum.mock';

describe('ThemeButton', () => {
  it('toggles the theme on button click', () => {
    let theme = 'dark';
    const onToggle = t => {
      theme = t;
    };
    const wrapper = setup.shallow(ThemeButton, { theme, onToggle });
    wrapper.find('button').simulate('click');
    expect(theme).toBe('light');
  });
});

describe('LabelButton', () => {
  it('toggles labels on button click', () => {
    let textLabels = false;
    const onToggle = t => {
      textLabels = t;
    };
    const wrapper = setup.shallow(LabelButton, { textLabels, onToggle });
    wrapper.find('button').simulate('click');
    expect(textLabels).toBe(true);
  });

  it('changes text depending on whether labels are visible', () => {
    const wrapper1 = setup.shallow(LabelButton, { textLabels: false });
    expect(wrapper1.find('span').text()).toBe('Show text labels');
    const wrapper2 = setup.shallow(LabelButton, { textLabels: true });
    expect(wrapper2.find('span').text()).toBe('Hide text labels');
  });
});

describe('IconToolbar', () => {
  it('renders without crashing', () => {
    const wrapper = setup.mount(<IconToolbar />);
    expect(wrapper.find('.pipeline-icon-toolbar').length).toBe(1);
    expect(wrapper.find('.pipeline-toggle-theme').length).toBe(1);
    expect(wrapper.find('.pipeline-toggle-labels').length).toBe(1);
  });

  const getState = visible =>
    getInitialState(formatData(loremIpsum), {
      visible
    });

  it('hides both buttons when visible prop is false for each of them', () => {
    const wrapper = setup.mount(
      <IconToolbar />,
      getState({
        themeBtn: false,
        labelBtn: false
      })
    );
    expect(wrapper.find('.pipeline-toggle-theme').length).toBe(0);
    expect(wrapper.find('.pipeline-toggle-labels').length).toBe(0);
  });

  it('hides one button when visible prop is false for one of them', () => {
    const wrapper = setup.mount(
      <IconToolbar />,
      getState({
        labelBtn: false
      })
    );
    expect(wrapper.find('.pipeline-toggle-theme').length).toBe(1);
    expect(wrapper.find('.pipeline-toggle-labels').length).toBe(0);
  });

  it('maps state to props', () => {
    const expectedResult = {
      textLabels: expect.any(Boolean),
      theme: expect.stringMatching(/light|dark/),
      visible: expect.objectContaining({
        themeBtn: expect.any(Boolean),
        labelBtn: expect.any(Boolean)
      })
    };
    expect(mapStateToProps(mockState.lorem)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();

    mapDispatchToProps(dispatch).onToggleTextLabels(false);
    expect(dispatch.mock.calls[0][0]).toEqual({
      textLabels: false,
      type: 'TOGGLE_TEXT_LABELS'
    });

    mapDispatchToProps(dispatch).onToggleTheme('light');
    expect(dispatch.mock.calls[1][0]).toEqual({
      theme: 'light',
      type: 'TOGGLE_THEME'
    });
  });
});
