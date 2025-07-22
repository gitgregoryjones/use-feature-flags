import { atom } from 'jotai';

export type FeatureFlag = {
  id: string;
  key: string;
  enabled: boolean;
  environment: string;
};

export const featureFlagsAtom = atom<{ flags: FeatureFlag[]; loading: boolean }>({
  flags: [],
  loading: true,
});

// store.ts
let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

export function getApiKey() {
  return apiKey;
}
