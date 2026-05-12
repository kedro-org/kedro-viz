import React from 'react';
import { render } from '@testing-library/react';
import PlotlyRenderer from './plotly-renderer';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { toggleTheme } from '../../actions';
import { mockState } from '../../utils/state.mock';

const mockStore = configureStore([]);

const renderWithStore = (props = {}, theme = 'dark') => {
  const store = mockStore({
    ...mockState.spaceflights,
    theme,
  });
  store.dispatch(toggleTheme(theme)); // mimic your afterLayoutActions logic

  return render(
    <Provider store={store}>
      <PlotlyRenderer {...props} />
    </Provider>
  );
};

describe('PlotlyRenderer', () => {
  it('renders without crashing', () => {
    const { container } = renderWithStore();
    expect(
      container.querySelector('.pipeline-plotly-chart')
    ).toBeInTheDocument();
  });

  it('renders dark theme plotly preview', () => {
    const { container } = renderWithStore(
      { data: [], layout: {}, theme: 'dark', view: 'preview' },
      'dark'
    );
    const plotlyDiv = container.querySelector('.pipeline-plotly-chart');
    expect(plotlyDiv).toHaveClass('pipeline-plotly__preview');
  });

  it('renders dark theme plotly modal', () => {
    const { container } = renderWithStore(
      { data: [], layout: {}, theme: 'dark', view: 'modal' },
      'dark'
    );
    const plotlyDiv = container.querySelector('.pipeline-plotly-chart');
    expect(plotlyDiv).toHaveClass('pipeline-plotly__modal');
  });

  it('renders light theme plotly preview', () => {
    const { container } = renderWithStore(
      { data: [], layout: {}, theme: 'light', view: 'preview' },
      'light'
    );
    const plotlyDiv = container.querySelector('.pipeline-plotly-chart');
    expect(plotlyDiv).toHaveClass('pipeline-plotly__preview');
  });

  it('renders light theme plotly modal', () => {
    const { container } = renderWithStore(
      { data: [], layout: {}, theme: 'light', view: 'modal' },
      'light'
    );
    const plotlyDiv = container.querySelector('.pipeline-plotly-chart');
    expect(plotlyDiv).toHaveClass('pipeline-plotly__modal');
  });
});
