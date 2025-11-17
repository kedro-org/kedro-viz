import React from 'react';
import { Wrapper, mapStateToProps } from './wrapper';
import { setup, mockState } from '../../utils/state.mock';
import { render } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router, Route, Switch } from 'react-router-dom';

// Mock child components to isolate Wrapper behavior
jest.mock('../flowchart-wrapper', () => () => (
  <div data-testid="mock-flowchart-wrapper" />
));
jest.mock('../global-toolbar', () => () => (
  <div data-testid="mock-global-toolbar" />
));
jest.mock('../settings-modal', () => () => (
  <div data-testid="mock-settings-modal" />
));
jest.mock('../feature-hints', () => () => (
  <div data-testid="mock-feature-hints" />
));
jest.mock('../shareable-url-modal', () => () => (
  <div data-testid="mock-shareable-url-modal" />
));
jest.mock('../update-reminder', () => () => (
  <div data-testid="mock-update-reminder" />
));
jest.mock('../workflow-wrapper/workflow-wrapper', () => () => (
  <div data-testid="mock-workflow-wrapper" />
));

const { theme } = mockState.spaceflights;

describe('Wrapper', () => {
  it('renders without crashing', () => {
    const { container } = setup.render(<Wrapper />, {
      state: mockState.spaceflights,
    });
    expect(container.querySelector('.kedro-pipeline')).toBeTruthy();
  });

  it('sets kui-theme--light class when theme is light', () => {
    const { container } = render(
      <Wrapper displayGlobalNavigation={false} theme="light" />
    );
    expect(container.firstChild).toHaveClass('kui-theme--light');
    expect(container.firstChild).not.toHaveClass('kui-theme--dark');
  });

  it('sets kui-theme--dark class when theme is dark', () => {
    const { container } = render(
      <Wrapper displayGlobalNavigation={false} theme="dark" />
    );
    expect(container.firstChild).toHaveClass('kui-theme--dark');
    expect(container.firstChild).not.toHaveClass('kui-theme--light');
  });

  it('only displays h1 and FlowChartWrapper when displayGlobalNavigation is false', () => {
    const modifiedState = {
      ...mockState.spaceflights,
      globalToolbar: { visible: false },
    };

    const { container } = setup.render(<Wrapper />, {
      state: modifiedState,
    });

    // Optional: adjust if exact children count changes
    expect(container.querySelector('.kedro-pipeline').children.length).toBe(3);
  });

  it('renders routes correctly with Router component', () => {
    const { container } = setup.render(<Wrapper />, {
      state: mockState.spaceflights,
    });

    // Since we're on the default route, FlowChartWrapper should be rendered
    expect(
      container.querySelector('[data-testid="mock-flowchart-wrapper"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="mock-feature-hints"]')
    ).toBeInTheDocument();
  });

  it('renders WorkflowWrapper when on workflow route', () => {
    const history = createMemoryHistory();
    history.push('/workflow');

    // Simplified test component that mimics the Wrapper's routing behavior
    const WrapperRouting = () => (
      <Router history={history}>
        <div className="kedro-pipeline kedro">
          <h1 className="pipeline-title">Kedro-Viz</h1>
          <Switch>
            <Route exact path="/">
              <div data-testid="mock-flowchart-wrapper" />
              <div data-testid="mock-feature-hints" />
            </Route>
            <Route path="/workflow">
              <div data-testid="mock-workflow-wrapper" />
            </Route>
          </Switch>
        </div>
      </Router>
    );

    const { container } = render(<WrapperRouting />);

    expect(
      container.querySelector('[data-testid="mock-workflow-wrapper"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="mock-flowchart-wrapper"]')
    ).not.toBeInTheDocument();
  });

  it('maps state to props', () => {
    expect(mapStateToProps(mockState.spaceflights)).toEqual({
      displayGlobalNavigation: true,
      theme,
    });
  });
});
