import { renderHook, act } from '@testing-library/react';
import useRunnerUrlSelection from '../useRunnerUrlSelection';

// Helper to manipulate window.location without full reload
describe('useRunnerUrlSelection', () => {
  const originalHref = window.location.href;

  const setSearch = (query) => {
    const url = new URL(window.location.href);
    url.search = query.startsWith('?') ? query : `?${query}`;
    window.history.replaceState({}, '', url.toString());
  };

  afterEach(() => {
    window.history.replaceState({}, '', originalHref);
  });

  it('captures pendingSid from URL on syncFromUrl', () => {
    setSearch('?sid=test_param');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => {
      result.current.syncFromUrl();
    });
    expect(result.current.pendingSid).toBe('test_param');
  });

  it('does not re-set pendingSid if same sid processed', () => {
    setSearch('?sid=abc');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => {
      result.current.syncFromUrl();
    });
    expect(result.current.pendingSid).toBe('abc');
    // mark processed
    act(() => {
      result.current.markSidProcessed();
    });
    // call again with same sid
    act(() => {
      result.current.syncFromUrl();
    });
    // pendingSid should remain null after processing if unchanged
    expect(result.current.pendingSid).toBe(null);
  });

  it('sets and removes sid in URL', () => {
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => {
      result.current.setSidInUrl('node123');
    });
    expect(window.location.search).toContain('sid=node123');
    act(() => {
      result.current.removeSidFromUrl();
    });
    expect(window.location.search).not.toContain('sid=');
  });

  it('updates pendingSid when sid changes to a new value', () => {
    setSearch('?sid=first');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => result.current.syncFromUrl());
    expect(result.current.pendingSid).toBe('first');
    act(() => result.current.markSidProcessed());
    // change sid
    setSearch('?sid=second');
    act(() => result.current.syncFromUrl());
    expect(result.current.pendingSid).toBe('second');
  });

  it('ignores sync when no sid present', () => {
    setSearch('');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => result.current.syncFromUrl());
    expect(result.current.pendingSid).toBe(null);
  });
});
