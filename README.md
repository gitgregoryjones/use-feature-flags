# @geejay/use-feature-flags

```
 _____ ___  ____ ___    _    ____  
|_   _/ _ \| __ )_ _|  / \  / ___| 
  | || | | |  _ \| |  / _ \ \___ \ 
  | || |_| | |_) | | / ___ \ ___) |
  |_| \___/|____/___/_/   \_\____/ 
                                   

```

**TOBIAS** — the **T**otally **O**ptimized **B**ot for **I**ntelligent **A**pp **S**witching (Safe).
A tiny React hook that lets you manage feature flags **at runtime** across React, React Native, and React Native Web—no redeploys required.

---

## ✨ What you get

* **Drop-in hook**: `useFeatureFlags()` returns `isActive(flag)` and `loading`.
* **Instant toggles**: Flip features on/off without reloading your app.
* **Multi-environment**: Scope flags to `dev`, `staging`, `prod`, previews, etc.
* **Multi-tenant**: Keep flags organized per customer or workspace.
* **Friendly UI**: Manage flags from a simple web dashboard.
* **TOBIAS Cleanup**: Our companion bot **scans for stale flags** and **opens PRs** to safely remove them, so your codebase stays clean without the busywork.

---

## 🚀 Installation

```bash
npm install @geejay/use-feature-flags
# or
yarn add @geejay/use-feature-flags
```

---
Here’s the updated **Quick Start** section with your note about the environment parameter baked in — so readers know it’s **usually not needed**.

---

## ⚡️ Quick start

> **One-time init:** Pass your API key on the **first** call anywhere in your app.
> **Thereafter:** Just call `useFeatureFlags()` with **no arguments** — the key is remembered.

The `environment` parameter is **optional** — in most cases you don’t need it.
If omitted, the app will **auto-detect** based on the domain:

* **Web**: Uses the current domain (e.g. `myapp.com`, `staging.myapp.com`)
* **Local dev**: Uses `"localhost"` when testing locally

---

### Example: first call (e.g., in your root)

```tsx
// App.tsx
import { useFeatureFlags } from '@geejay/use-feature-flags';

export default function App() {
  // ✅ Initialize once with your API key
  // Environment is optional — auto-detects in most cases
  const { loading } = useFeatureFlags("YOUR-API-KEY");

  if (loading) return null;
  return <MainRoutes />;
}
```

---

### Example: subsequent calls (no key needed)

```tsx
// components/Dashboard.tsx
import { useFeatureFlags } from '@geejay/use-feature-flags';

export default function Dashboard() {
  // ✅ No API key here — it’s already remembered
  const { isActive, loading } = useFeatureFlags();

  if (loading) return null;
  return isActive('new-dashboard') ? <NewDashboard /> : <OldDashboard />;
}
```

---

### Another component, still no key

```tsx
// components/Header.tsx
import { useFeatureFlags } from '@geejay/use-feature-flags';

export function Header() {
  const { isActive } = useFeatureFlags(); // ✅ key remembered globally
  return isActive('show-announcement') ? <Banner /> : null;
}
```

---

#### Notes

* Pass the API key **only once** — the hook remembers it for all future calls in the same session.
* Environment is **usually not required** — the hook will detect it automatically.

---

**Tips**

* Call `useFeatureFlags("YOUR-API-KEY", "production")` if you want to force the app to use a specific custom environment. Maybe useful for mobile users??
* You can read multiple flags; `isActive` is stable and fast.

---

## 🧰 Flag management

Use the hosted dashboard to:

* Create/edit/delete flags
* Group by environment and tenant
* Toggle in real time and see changes reflected instantly

Get started: **[https://featureflags-ai.netlify.app/](https://featureflags-ai.netlify.app/)**

---

## 🤖 TOBIAS: automatic flag cleanup PRs

Your team shouldn’t spend Fridays hunting down dead flags.
**TOBIAS** keeps your repo tidy by:

* scanning for **stale/retired flags**
* generating **safe diffs** (removing unused checks, dead branches, and config)
* opening **pull requests** with a friendly summary and checklist

Example PR title:

```
🧹 TOBIAS: remove stale flags (billing_v2, heroA/B)
```

Example PR body snippet:

```md
This automated PR removes stale flags detected by TOBIAS.

- Removed: `billing_v2`, `heroA/B`
- Updated: related conditionals and config
- Notes: All changes are no-op at runtime

Review checklist:
- [ ] CI passes
- [ ] Screens relying on removed flags look correct
```

---

## 🧪 Local dev notes

* Works with React 18 (including Strict Mode).
* Designed for modern bundlers (Next.js, Vite, Expo/Metro).
* If you test the library locally via `yalc`, remember to remove the yalc reference before deploying your app.

---

## 🤝 Contributing

Issues and PRs welcome! If you’ve got ideas for smarter cleanup rules or integrations, open a ticket—TOBIAS loves new tricks.

---

## 📄 License

MIT © GeeJay

---
