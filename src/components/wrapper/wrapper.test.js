// TODO :FIX TESTS
import React from 'react';
import { Wrapper, mapStateToProps } from './wrapper';
// import { toggleTheme } from '../../actions';
import { setup, mockState } from '../../utils/state.mock';
// import spaceflights from '../../utils/data/spaceflights.mock.json';

const { theme } = mockState.spaceflights;

describe('Wrapper', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(<Wrapper />, {
      state: mockState.spaceflights,
    });
    expect(container.querySelector('.kedro-pipeline')).toBeTruthy();
  });

  //   it('sets kui-theme--light class when theme is light', () => {
  //   const { container } = setup.render(<Wrapper />, {
  //     state: {
  //       ...mockState.spaceflights,
  //       theme: 'light',
  //     },
  //   });

  //   const wrapper = container.querySelector('.kedro-pipeline');
  //   expect(wrapper.classList.contains('kui-theme--light')).toBe(true);
  //   expect(wrapper.classList.contains('kui-theme--dark')).toBe(false);
  // });

  // it('sets kui-theme--dark class when theme is dark', () => {
  //   const { container } = setup.render(<Wrapper />, {
  //     state: {
  //       ...mockState.spaceflights,
  //       theme: 'dark',
  //     },
  //   });
  //   const wrapper = container.querySelector('.kedro-pipeline');
  //   expect(wrapper.classList.contains('kui-theme--dark')).toBe(true);
  //   expect(wrapper.classList.contains('kui-theme--light')).toBe(false);
  // });

  it('only displays the h1 and the FlowChartWrapper when displayGlobalNavigation is false', () => {
    const modifiedState = {
      ...mockState.spaceflights,
      globalToolbar: { visible: false },
    };

    const { container } = setup.render(<Wrapper />, {
      state: modifiedState,
    });

    // If expecting only 2 direct children
    expect(container.querySelector('.kedro-pipeline').children.length).toBe(2);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.spaceflights)).toEqual({
      displayGlobalNavigation: true,
      theme,
    });
  });
});
