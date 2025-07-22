# use-feature-flags

A lightweight React hook for fetching feature flags from Supabase. It ships with sensible defaults so you can drop it in and start using feature flags immediately.

## Installation

```
npm install use-feature-flags
```

or

```
yarn add use-feature-flags
```

## Usage

```tsx
import { useFeatureFlags } from 'use-feature-flags';

export default function MyComponent() {
  const { isActive, loading } = useFeatureFlags("YOUR-API-KEY"); //API param only needed on the first useFeatureFlags call

  if (loading) return null;

  return isActive('new-dashboard') ? <NewDashboard /> : <OldDashboard />;
}
```



## Flag Management

visit https://featureflags-ai.netlify.app/ to get an API key and manage your feature flags from the web.  
- one-step install for your react/react-native/react-native-web apps
- toggles features on/off WITHOUT reload of your REACT app
- supports multiple environments/ subdomains from one UI
- supports multiple tenants
- bi-directional creation of flags and more!

