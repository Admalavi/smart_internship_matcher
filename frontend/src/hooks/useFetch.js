import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../services/api';

/** Runs an async loader; returns {data, loading, error, reload, setData}. */
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const ref = useRef(loader);
  ref.current = loader;
  const run = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try { setState({ data: await ref.current(), loading: false, error: null }); }
    catch (e) { setState({ data: null, loading: false, error: errMsg(e) }); }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
