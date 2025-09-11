import { renderHook, act } from '@testing-library/react';
import useRunnerUrlSelection from '../useRunnerUrlSelection';

// Helper to manipulate window.location without full reload
describe('useRunnerUrlSelection (lean currentSid API)', () => {
  const originalHref = window.location.href;

  const setSearch = (query) => {
    const url = new URL(window.location.href);
    url.search = query.startsWith('?') ? query : `?${query}`;
    window.history.replaceState({}, '', url.toString());
  };

  afterEach(() => {
    window.history.replaceState({}, '', originalHref);
  });

  it('captures currentSid from URL on syncFromUrl', () => {
    setSearch('?sid=test_param');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => {
      result.current.syncFromUrl();
    });
    expect(result.current.currentSid).toBe('test_param');
  });

  it('re-sync with same sid leaves currentSid unchanged', () => {
    setSearch('?sid=abc');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => {
      result.current.syncFromUrl();
    });
    expect(result.current.currentSid).toBe('abc');
    // call again with same sid (no change expected)
    act(() => {
      result.current.syncFromUrl();
    });
    expect(result.current.currentSid).toBe('abc');
  });

  it('sets and removes sid in URL updating currentSid', () => {
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => {
      result.current.setSidInUrl('node123');
    });
    expect(window.location.search).toContain('sid=node123');
    expect(result.current.currentSid).toBe('node123');
    act(() => {
      result.current.removeSidFromUrl();
    });
    expect(window.location.search).not.toContain('sid=');
    expect(result.current.currentSid).toBe(null);
  });

  it('updates currentSid when sid changes to a new value', () => {
    setSearch('?sid=first');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => result.current.syncFromUrl());
    expect(result.current.currentSid).toBe('first');
    // change sid
    setSearch('?sid=second');
    act(() => result.current.syncFromUrl());
    expect(result.current.currentSid).toBe('second');
  });

  it('ignores sync when no sid present', () => {
    setSearch('');
    const { result } = renderHook(() => useRunnerUrlSelection());
    act(() => result.current.syncFromUrl());
    expect(result.current.currentSid).toBe(null);
  });
});
