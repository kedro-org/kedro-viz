import { useCallback, useState } from 'react';

// Lean hook: expose currentSid reflecting the ?sid= query param.
// Provides helpers to set/remove/sync without pending/processed ceremony.
function useRunnerUrlSelection() {
  // Helper first so we can use it inside lazy initializer
  const getSidFromUrl = useCallback(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search || '');
      return searchParams.get('sid') || searchParams.get('selected_id') || '';
    } catch {
      return '';
    }
  }, []);

  // Seed initial state from URL immediately (avoids a blank frame before sync effect)
  const [currentSid, setCurrentSid] = useState(() => {
    try {
      const initial = getSidFromUrl();
      return initial || null;
    } catch {
      return null;
    }
  });
  // Note: getSidFromUrl defined above (order swapped due to lazy init need)

  const setSidInUrl = useCallback(
    (nodeId) => {
      if (!nodeId) {
        return;
      }
      const sid = getSidFromUrl();
      if (sid === nodeId) {
        return; // already selected
      }
      try {
        const current = new URL(window.location.href);
        current.searchParams.set('sid', nodeId);
        current.searchParams.delete('sn');
        const nextUrl = `${
          current.pathname
        }?${current.searchParams.toString()}`;
        // Use pushState so back button walks selection history; could switch to replaceState if undesired
        window.history.pushState({}, '', nextUrl);
        setCurrentSid(nodeId);
      } catch {
        setCurrentSid(nodeId);
      }
    },
    [getSidFromUrl]
  );

  const removeSidFromUrl = useCallback(() => {
    try {
      const current = new URL(window.location.href);
      current.searchParams.delete('sid');
      const nextUrl = `${current.pathname}?${current.searchParams.toString()}`;
      window.history.pushState({}, '', nextUrl);
      setCurrentSid(null);
    } catch {
      setCurrentSid(null);
    }
  }, []);

  const syncFromUrl = useCallback(() => {
    const sid = getSidFromUrl();
    if (sid) {
      setCurrentSid(sid);
    } else {
      setCurrentSid(null);
    }
  }, [getSidFromUrl]);

  return {
    currentSid,
    syncFromUrl,
    setSidInUrl,
    removeSidFromUrl,
    getSidFromUrl,
  };
}

export default useRunnerUrlSelection;
