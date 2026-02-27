/* eslint-disable id-length */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { FlowChartWrapper, mapStateToProps } from './flowchart-wrapper';
import { mockState } from '../../utils/state.mock';
import rootReducer from '../../reducers';

// Polyfill for D3 transitions in jsdom
if (typeof window.WebKitCSSMatrix === 'undefined') {
  window.WebKitCSSMatrix = class WebKitCSSMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  };
}

describe('FlowChartWrapper', () => {
  describe('mapStateToProps', () => {
    it('maps tagIds from state', () => {
      const result = mapStateToProps(mockState.spaceflights);
      expect(result.tagIds).toEqual(expect.any(Array));
      expect(result.tagIds.length).toBeGreaterThan(0);
    });
  });

  describe('InvalidTagsInUrl', () => {
    const defaultProps = {
      fullNodeNames: {},
      displaySidebar: false,
      graph: { nodes: [{ id: 'node1', type: 'task' }] },
      loading: false,
      modularPipelinesTree: {},
      nodes: {},
      onToggleFocusMode: jest.fn(),
      onToggleModularPipelineActive: jest.fn(),
      onToggleModularPipelineExpanded: jest.fn(),
      onToggleNodeSelected: jest.fn(),
      onUpdateActivePipeline: jest.fn(),
      pipelines: ['__default__'],
      sidebarVisible: false,
      activePipeline: '__default__',
      tag: { features: true },
      tagIds: ['features', 'preprocessing', 'split', 'train'],
      nodeType: {},
      expandAllPipelines: false,
      displayMetadataPanel: false,
      displayExportBtn: false,
      displayBanner: {},
      setView: jest.fn(),
    };

    const renderWithStore = (component, initialEntries = ['/']) => {
      const store = configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
          }),
        preloadedState: mockState.spaceflights,
      });

      return render(
        <Provider store={store}>
          <MemoryRouter initialEntries={initialEntries}>
            {component}
          </MemoryRouter>
        </Provider>
      );
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('shows invalid URL warning when URL contains a nonexistent tag', async () => {
      renderWithStore(<FlowChartWrapper {...defaultProps} />, [
        '/?tags=nonexistent-tag&pid=__default__',
      ]);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(
        screen.getByText(/oops, this URL isn't valid/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/nonexistent-tag/i)).toBeInTheDocument();
    });

    it('shows multiple invalid tags in the warning message', async () => {
      renderWithStore(<FlowChartWrapper {...defaultProps} />, [
        '/?tags=bad-one,bad-two&pid=__default__',
      ]);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(
        screen.getByText(/oops, this URL isn't valid/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/bad-one/i)).toBeInTheDocument();
      expect(screen.getByText(/bad-two/i)).toBeInTheDocument();
    });

    it('does not show warning when all tags are valid', async () => {
      renderWithStore(<FlowChartWrapper {...defaultProps} />, [
        '/?tags=features,train&pid=__default__',
      ]);

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(
        screen.queryByText(/oops, this URL isn't valid/i)
      ).not.toBeInTheDocument();
    });
  });
});
