
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FeatureFlag, featureFlagsAtom } from './store';
import { useAtom } from 'jotai';

export const DEFAULT_SUPABASE_URL = 'https://khppgsehvvlukzfdqbuo.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocHBnc2VodnZsdWt6ZmRxYnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2ODU1MzQsImV4cCI6MjA2ODI2MTUzNH0.8Z4VY4HFMm95UgO21c-DnDkbLPN_0mbDBZJPExaghDk';
const EDGE_FN_URL = `${DEFAULT_SUPABASE_URL}/functions/v1/get-feature-flags`;




type FlagState = {
  flags: FeatureFlag[];
  loading: boolean;
};

let initialized = false;

export function useFeatureFlags(
  passedKey?: string,
  environment = window.location.hostname || 'localhost'
) {
  const sanitizedEnvironment = useMemo(
    () => environment.replace(/:\d+$/, ''),
    [environment]
  );
  const [state, setState] = useAtom(featureFlagsAtom);
  const [envId, setEnvId] = useState<number | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<() => void>();

  const apiKey = passedKey;

  useEffect(() => {
    console.log(
      '[use-feature-flags] initializing',
      `environment: ${sanitizedEnvironment}`,
      `apiKey provided: ${Boolean(apiKey)}`
    );
  }, [sanitizedEnvironment, apiKey]);

  const supabase = createClient(
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`, // 👈 dynamic access token
      },
    },
  }
);

  const fetchFlags = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    console.log('[use-feature-flags] fetching flags for', sanitizedEnvironment);

    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
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





