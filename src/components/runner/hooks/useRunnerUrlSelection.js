import { useCallback, useRef, useState, useEffect } from 'react';

// Hook to manage ?sid= URL parameter lifecycle (selection of param/dataset)
export default function useRunnerUrlSelection() {
  const lastSidRef = useRef(null);
  const [pendingSid, setPendingSid] = useState(null);

  const getSidFromUrl = useCallback(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search || '');
      return searchParams.get('sid') || searchParams.get('selected_id') || '';
    } catch {
      return '';
    }
  }, []);

  const setSidInUrl = useCallback((nodeId) => {
    if (!nodeId) {
      return;
    }
    try {
      const current = new URL(window.location.href);
      current.searchParams.set('sid', nodeId);
      current.searchParams.delete('sn');
      const nextUrl = `${current.pathname}?${current.searchParams.toString()}`;
      window.history.pushState({}, '', nextUrl);
      lastSidRef.current = nodeId;
    } catch {}
  }, []);

  const removeSidFromUrl = useCallback(() => {
    try {
      const current = new URL(window.location.href);
      current.searchParams.delete('sid');
      const nextUrl = `${current.pathname}?${current.searchParams.toString()}`;
      window.history.pushState({}, '', nextUrl);
      lastSidRef.current = null;
    } catch {}
  }, []);

  const syncFromUrl = useCallback(() => {
    const sid = getSidFromUrl();
    if (!sid || sid === lastSidRef.current) {
      return;
    }
    setPendingSid(sid);
  }, [getSidFromUrl]);

  const markSidProcessed = useCallback(() => {
    if (pendingSid) {
      lastSidRef.current = pendingSid;
      setPendingSid(null);
    }
  }, [pendingSid]);

  // Optional: keep in sync with popstate outside consumer if wanted
  useEffect(() => {
    // nothing automatic here; consumer decides when to call syncFromUrl
  }, []);

  return {
    pendingSid,
    syncFromUrl,
    setSidInUrl,
    removeSidFromUrl,
    markSidProcessed,
    getSidFromUrl, // exported in case consumer wants direct read
  };
}
