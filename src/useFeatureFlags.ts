
import { useEffect, useMemo, useRef, useState } from 'react';
import { FeatureFlag, featureFlagsAtom } from './store';
import { useAtom } from 'jotai';
import { getSupabase, DEFAULT_SUPABASE_URL } from './supabaseClient';

const EDGE_FN_URL = `${DEFAULT_SUPABASE_URL}/functions/v1/get-feature-flags`;
const CACHE_KEY_PREFIX = 'use-feature-flags-cache';




type FlagState = {
  flags: FeatureFlag[];
  loading: boolean;
};

type CachedFlags = {
  flags: FeatureFlag[];
  envId: number | null;
  updatedAt: number;
};

let initialized = false;

function getCacheKey(environment: string) {
  return `${CACHE_KEY_PREFIX}:${environment}`;
}

function getCachedFlags(environment: string): CachedFlags | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(getCacheKey(environment));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFlags;
    if (!Array.isArray(parsed.flags)) return null;

    return {
      flags: parsed.flags,
      envId: parsed.envId ?? null,
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch (error) {
    console.warn('[use-feature-flags] failed reading cache', error);
    return null;
  }
}

function setCachedFlags(environment: string, flags: FeatureFlag[], envId: number | null) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const payload: CachedFlags = {
      flags,
      envId,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(getCacheKey(environment), JSON.stringify(payload));
  } catch (error) {
    console.warn('[use-feature-flags] failed writing cache', error);
  }
}

export function useFeatureFlags(
  passedKey?: string,
  environment = window?.location?.hostname || 'localhost'
) {
  const sanitizedEnvironment = useMemo(
    () => environment.replace(/:\d+$/, ''),
    [environment]
  );
  const [state, setState] = useAtom(featureFlagsAtom);
  const [envId, setEnvId] = useState<number | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const apiKey = passedKey;

  useEffect(() => {
   process.env.DEBUG && console.log(
      '[use-feature-flags] initializing',
      `environment: ${sanitizedEnvironment}`,
      `apiKey provided: ${Boolean(apiKey)}`
    );
  }, [sanitizedEnvironment, apiKey]);
  const supabase = getSupabase();

  const fetchFlags = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    console.log('[use-feature-flags] fetching flags for', sanitizedEnvironment);

    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           ...(apiKey ? { 'api-key': apiKey } : {}),
        },
        body: JSON.stringify({ environment: sanitizedEnvironment }),
      });

      const json = await res.json();
      if (!res.ok) {
        console.warn('Edge function error:', json?.error || res.statusText);
        const cached = getCachedFlags(sanitizedEnvironment);
        if (cached) {
          setState({ flags: cached.flags, loading: false });
          setEnvId(cached.envId);
          return;
        }

        setState({ flags: [], loading: false });
        return;
      }

      const flags = json.flags || [];
      setState({ flags, loading: false });
      console.log('[use-feature-flags] fetched flags', flags);

      // Store environment_id from first flag (assumes all have same env)
      const nextEnvId = flags.length > 0 ? flags[0]?.environment_id ?? null : null;
      setEnvId(nextEnvId);
      setCachedFlags(sanitizedEnvironment, flags, nextEnvId);
    } catch (err: any) {
      console.error('Error fetching flags:', err.message);
      const cached = getCachedFlags(sanitizedEnvironment);
      if (cached) {
        setState({ flags: cached.flags, loading: false });
        setEnvId(cached.envId);
        return;
      }

      setState({ flags: [], loading: false });
    }
  };

  useEffect(() => {
    if (!apiKey || initialized) return;
    initialized = true;

    fetchFlags();

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [sanitizedEnvironment, apiKey]);

  // Subscribe to flag changes for the correct environment
  useEffect(() => {
    if (!envId) return;

    const channel = supabase
      .channel(`flags-${sanitizedEnvironment}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
          filter: `environment_id=eq.${envId}`,
        },
        () => {
          if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
          debounceTimeout.current = setTimeout(fetchFlags, 300);
        }
      )
      .subscribe();

    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = () => supabase.removeChannel(channel);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [envId]);

  return {
    isActive: (key: string) => {
      const active = state.flags.some((f) => f.key === key && f.enabled === true);
      process.env.DEBUG && console.log('[use-feature-flags] isActive', key, active);
      return active;
    },
    flags: state.flags,
    loading: state.loading,
  };
}




