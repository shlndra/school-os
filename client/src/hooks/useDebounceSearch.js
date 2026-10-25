import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced API search with AbortController cancellation
 * and strict bearer token transmission.
 */
export function useDebounceSearch({ token, delay = 250, minChars = 2 } = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const trimmed = query.trim();

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (trimmed.length < minChars) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          headers,
          signal: controller.signal
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            throw new Error(errData.error || 'Authentication required: session is unauthorized or expired');
          }
          throw new Error(errData.error || `Search failed with status ${res.status}`);
        }

        const data = await res.json();
        setResults(data);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') {
          // Request aborted due to new keystroke; do not overwrite state with error
          return;
        }
        setError(err.message);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, token, delay, minChars]);

  const clear = () => {
    setQuery('');
    setResults(null);
    setLoading(false);
    setError(null);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clear
  };
}
