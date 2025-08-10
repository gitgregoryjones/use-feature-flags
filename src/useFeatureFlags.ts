
import { useEffect, useMemo, useRef, useState } from 'react';
import { FeatureFlag, featureFlagsAtom } from './store';
import { useAtom } from 'jotai';
import { getSupabase, DEFAULT_SUPABASE_URL } from './supabaseClient';

const EDGE_FN_URL = `${DEFAULT_SUPABASE_URL}/functions/v1/get-feature-flags`;




type FlagState = {
  flags: FeatureFlag[];
  loading: boolean;
};

let initialized = false;

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
    console.log(
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
        setState({ flags: [], loading: false });
        return;
      }

      const flags = json.flags || [];
      setState({ flags, loading: false });
      console.log('[use-feature-flags] fetched flags', flags);

      // Store environment_id from first flag (assumes all have same env)
      if (flags.length > 0 && flags[0].environment_id) {
        setEnvId(flags[0].environment_id);
      }
    } catch (err: any) {
      console.error('Error fetching flags:', err.message);
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
      console.log('[use-feature-flags] isActive', key, active);
      return active;
    },
    flags: state.flags,
    loading: state.loading,
  };
}





