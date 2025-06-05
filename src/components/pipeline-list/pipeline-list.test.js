import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import PipelineList, {
  mapStateToProps,
  mapDispatchToProps,
} from './pipeline-list';
import { mockState, setup } from '../../utils/state.mock';
import userEvent from '@testing-library/user-event';
import configureStore from 'redux-mock-store';

const mockHistoryPush = jest.fn();
const mockLocationSearch = '?query=mockQuery';
const mockLocationPathname = '/';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
    location: {
      search: mockLocationSearch,
      pathname: mockLocationPathname,
    },
  }),
}));

describe('PipelineList', () => {
  const pipelineIDs = mockState.spaceflights.pipeline.ids.map((id, i) => [
    id,
    i,
  ]);

  it('renders without crashing', () => {
    const { container } = setup.render(
      <PipelineList onToggleOpen={jest.fn()} />
    );
    const list = container.querySelector('.pipeline-list');
    expect(list).toBeInTheDocument();
  });

  it('should call onToggleOpen when opening/closing', async () => {
    const user = userEvent.setup();
    const onToggleOpen = jest.fn();
    const { getByRole } = setup.render(
      <PipelineList onToggleOpen={onToggleOpen} />
    );
    const dropdownButton = getByRole('button');

    await user.click(dropdownButton);
    expect(onToggleOpen).toHaveBeenLastCalledWith(true);

    await user.click(dropdownButton);
    expect(onToggleOpen).toHaveBeenLastCalledWith(false);
  });

  it('should disable the dropdown button when there are no pipelines', () => {
    const emptyState = {
      pipeline: {
        ids: [],
        name: {},
        active: null,
      },
      dataSource: 'json',
      isPrettyName: false,
    };

    const store = configureStore()(emptyState);
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <PipelineList />
        </MemoryRouter>
      </Provider>
    );

    const button = container.querySelector('.dropdown__label');
    expect(button).toBeDisabled();

    const wrapper = container.querySelector('.dropdown');
    expect(wrapper).toHaveClass('dropdown--disabled');
  });

  test.each(pipelineIDs)(
    'should change the active pipeline to %s on clicking menu option %s, and set URL to "/?pid=%s"',
    async (id, i) => {
      const user = userEvent.setup();
      const { getAllByRole, container } = setup.render(
        <PipelineList onToggleOpen={jest.fn()} />
      );

      console.log('Dropdown HTML:', container.innerHTML);

      const options = getAllByRole('option');
      console.log(
        'Found options:',
        options.map((opt) => opt.textContent)
      );

      await user.click(options[i]);

      console.log(`Clicked option ${i}:`, options[i].textContent);
      console.log('History push calls:', mockHistoryPush.mock.calls);

      expect(mockHistoryPush).toHaveBeenCalledWith(`/?pid=${id}`);
    }
  );

  it('should apply an active class to the active pipeline option', () => {
    const { container } = setup.render(<PipelineList />);
    const activeOption = container.querySelector(
      '.pipeline-list__option--active'
    );
    expect(activeOption).toBeInTheDocument();
  });

  it('should not apply active class to an inactive pipeline row', () => {
    const { container } = setup.render(<PipelineList />);
    const allOptions = Array.from(container.querySelectorAll('.menu-option'));
    const inactiveOptions = allOptions.filter(
      (el) => !el.classList.contains('pipeline-list__option--active')
    );
    expect(inactiveOptions.length).toBeGreaterThan(0);
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.spaceflights)).toEqual({
      asyncDataSource: expect.any(Boolean),
      pipeline: {
        active: expect.any(String),
        main: expect.any(String),
        name: expect.any(Object),
        ids: expect.any(Array),
      },
      isPrettyName: expect.any(Boolean),
    });
  });

  it('maps dispatch to props', () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch).onUpdateActivePipeline({ value: '123' });

    expect(dispatch.mock.calls.length).toEqual(2);
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: 'TOGGLE_MODULAR_PIPELINE_FOCUS_MODE',
      modularPipeline: null,
    });
  });
});
