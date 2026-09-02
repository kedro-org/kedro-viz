/**
 * NOTE: TODO
 * This test file previously used Enzyme's `shallow` rendering to test the App component in isolation.
 * Since React Testing Library does not support shallow rendering and encourages integration testing instead,
 * most of those shallow tests have been removed.
 *
 * The plan is to reintroduce meaningful integration tests here that validate App behavior with its child components.
 */
import React from 'react';
import { render } from '@testing-library/react';
import App from './index';
import { Flags } from '../../utils/flags';
import getRandomPipeline from '../../utils/random-data';
import spaceflights from '../../utils/data/spaceflights.mock.json';
import * as runStatusActions from '../../actions/run-status';
// import demo from '../../utils/data/demo.mock.json';

describe('App', () => {
  describe('renders without crashing', () => {
    it('renders without crashing with random pipeline data', () => {
      render(<App data={getRandomPipeline()} />);
    });

    it('when loading json data', () => {
      render(<App data="json" />);
    });

    it('when being passed data as a prop', () => {
      render(<App data={spaceflights} />);
    });

    it('when running on a legacy dataset', () => {
      // Strip out all newer features from the test dataset and leave just
      // the essential ones, to test backwards-compatibility:
      const legacyDataset = {
        nodes: spaceflights.nodes.map(({ id, name, type }) => ({
          id,
          name,
          type,
        })),
        edges: spaceflights.edges.map(({ source, target }) => ({
          source,
          target,
        })),
      };
      render(<App data={legacyDataset} />);
    });
  });
  describe('feature flags', () => {
    it('it announces flags', () => {
      const announceFlags = jest.spyOn(App.prototype, 'announceFlags');
      render(<App data={getRandomPipeline()} />);
      expect(announceFlags).toHaveBeenCalledWith(Flags.defaults());
    });
  });

  describe('throws an error', () => {
    render('when data prop is empty', () => {
      expect(() => render(<App />)).toThrow();
    });
  });

  describe('backend API calls', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('does not dispatch run-status loading when embedded with data supplied directly', () => {
      const loadRunStatusSpy = jest.spyOn(
        runStatusActions,
        'loadInitialRunStatusData'
      );

      render(<App data={spaceflights} />);

      expect(loadRunStatusSpy).not.toHaveBeenCalled();
    });

    it('dispatches run-status loading when running against a backend (data="json")', () => {
      const loadRunStatusSpy = jest.spyOn(
        runStatusActions,
        'loadInitialRunStatusData'
      );

      render(<App data="json" />);

      expect(loadRunStatusSpy).toHaveBeenCalled();
    });
  });
});
