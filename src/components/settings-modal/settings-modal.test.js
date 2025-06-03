import React from 'react';
import SettingsModal, {
  mapStateToProps,
  mapDispatchToProps,
} from './settings-modal';
// import { screen, fireEvent } from '@testing-library/react';
import { setup } from '../../utils/state.mock';
import { toggleSettingsModal } from '../../actions';
import { prepareState } from '../../utils/state.mock';
import spaceflights from '../../utils/data/spaceflights.mock.json';

describe('SettingsModal', () => {
  it('renders without crashing', () => {
    const state = prepareState({ data: spaceflights });
    const { container } = setup.render(<SettingsModal />, { state });

    expect(
      container.querySelector('.pipeline-settings-modal__content')
    ).toBeInTheDocument();
  });

  it('renders with a disabled primary button', () => {
    const state = prepareState({
      data: spaceflights,
      afterLayoutActions: [() => toggleSettingsModal(true)],
    });

    const { container } = setup.render(<SettingsModal />, { state });

    const primaryButton = container.querySelector('.button__btn--primary');
    expect(primaryButton).toBeInTheDocument();
  });

  //TODO : FIX Tests
  // it('modal closes when cancel button is clicked', () => {
  //   const state = prepareState({
  //     data: spaceflights,
  //     afterLayoutActions: [() => toggleSettingsModal(true)],
  //   });

  //   const { container, store } = setup.render(<SettingsModal />, { state });

  //   const dispatchSpy = jest.spyOn(store, 'dispatch');

  //   expect(container.querySelector('.modal__content--visible')).toBeInTheDocument();

  //   const cancelButton = container.querySelector(
  //     '.pipeline-settings-modal .button__btn.button__btn--secondary'
  //   );
  //   fireEvent.click(cancelButton);

  //   expect(dispatchSpy).toHaveBeenCalledWith(toggleSettingsModal(false));
  // });

  it('maps state to props', () => {
    const state = prepareState({ data: spaceflights });
    const expectedResult = {
      visible: expect.objectContaining({
        exportModal: expect.any(Boolean),
        settingsModal: expect.any(Boolean),
      }),
      flags: expect.any(Object),
      isPrettyName: expect.any(Boolean),
      showFeatureHints: expect.any(Boolean),
      showDatasetPreviews: expect.any(Boolean),
    };
    expect(mapStateToProps(state)).toEqual(expectedResult);
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    const props = mapDispatchToProps(dispatch);

    props.showSettingsModal(false);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_SETTINGS_MODAL',
      visible: false,
    });

    props.onToggleFlag('sizewarning', false);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'CHANGE_FLAG',
      name: 'sizewarning',
      value: false,
    });

    props.onToggleIsPrettyName(false);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_IS_PRETTY_NAME',
      isPrettyName: false,
    });

    props.onToggleShowDatasetPreviews(false);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_SHOW_DATASET_PREVIEWS',
      showDatasetPreviews: false,
    });
  });
});
