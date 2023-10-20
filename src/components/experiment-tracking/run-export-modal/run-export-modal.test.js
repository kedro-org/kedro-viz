import React from 'react';
import configureMockStore from 'redux-mock-store';
import RunExportModal from './index';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure } from 'enzyme';
import { render, screen } from '@testing-library/react';
import { ButtonTimeoutContext } from '../../../utils/button-timeout-context';
import { setup } from '../../../utils/state.mock';
import { runs } from '../../experiment-wrapper/mock-data';

// to help find text which is made by multiple HTML elements
// eg: <div>Hello <span>world</span></div>
const findTextWithTags = (textMatch) => {
  return screen.findByText((content, node) => {
    const hasText = (node) => node.textContent === textMatch;
    const nodeHasText = hasText(node);
    const childrenDontHaveText = Array.from(node?.children || []).every(
      (child) => !hasText(child)
    );
    return nodeHasText && childrenDontHaveText;
  });
};

const mockValue = {
  handleClick: jest.fn(),
  isSuccessful: false,
  setIsSuccessful: jest.fn(),
  showModal: false,
};
configure({ adapter: new Adapter() });
const mockStore = configureMockStore();

describe('RunExportModal', () => {
  let store;
  beforeEach(() => {
    const initialState = {
      runsMetadata: { [runs[0].id]: runs[0], [runs[1].id]: runs[1] },
    };

    store = mockStore(initialState);
  });

  it('renders the component without crashing', () => {
    const wrapper = setup.mount(
      <ButtonTimeoutContext.Provider value={mockValue}>
        <RunExportModal store={store} visible />
      </ButtonTimeoutContext.Provider>
    );

    expect(
      wrapper.find('.pipeline-run-export-modal--experiment-tracking').length
    ).toBe(1);
  });

  it('modal closes when cancel button is clicked', () => {
    const setVisible = jest.fn();
    const wrapper = setup.mount(
      <ButtonTimeoutContext.Provider value={mockValue}>
        <RunExportModal
          store={store}
          setShowRunExportModal={() => setVisible(true)}
        />
      </ButtonTimeoutContext.Provider>
    );
    const onClick = jest.spyOn(React, 'useState');
    const closeButton = wrapper.find(
      '.pipeline-run-export-modal--experiment-tracking .button__btn--secondary'
    );

    onClick.mockImplementation((visible) => [visible, setVisible]);

    closeButton.simulate('click');

    expect(
      wrapper.find(
        '.pipeline-run-export-modal--experiment-tracking .kui-modal--visible'
      ).length
    ).toBe(0);
  });

  it('Text is updated to "Done ✅" when the "Export all and close" is clicked, and modal is closed', () => {
    const setVisible = jest.fn();
    const wrapper = setup.mount(
      <ButtonTimeoutContext.Provider value={mockValue}>
        <RunExportModal
          store={store}
          setShowRunExportModal={() => setVisible(true)}
        />
      </ButtonTimeoutContext.Provider>
    );

    // original text should be "Export all and close"
    const { getByText } = render(
      <ButtonTimeoutContext.Provider value={mockValue}>
        <RunExportModal store={store} visible />
      </ButtonTimeoutContext.Provider>
    );
    expect(getByText(/Export all and close/i)).toBeVisible();

    const onClick = jest.spyOn(React, 'useState');
    const exportAllAndCloseBtn = wrapper.find(
      '.pipeline-run-export-modal--experiment-tracking .button__btn--primary'
    );

    onClick.mockImplementation((visible) => [visible, setVisible]);
    exportAllAndCloseBtn.simulate('click');

    // expect the text to be changed first
    expect(findTextWithTags('Done ✅ ')).toBeTruthy();

    // then the modal is closed
    expect(
      wrapper.find(
        '.pipeline-run-export-modal--experiment-tracking .kui-modal--visible'
      ).length
    ).toBe(0);
  });
});
