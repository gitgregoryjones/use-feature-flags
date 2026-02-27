export type EnvValue = string | undefined;

declare global {
  // React Native / Expo dev global
  // eslint-disable-next-line no-var
  var __DEV__: boolean | undefined;
}

type EnvRecord = Record<string, unknown>;

let importMetaEnvGetter: (() => EnvRecord | undefined) | null = null;

function getProcessEnv(): EnvRecord | undefined {
  if (typeof process === 'undefined' || !process) return undefined;
  const proc = process as unknown as { env?: EnvRecord };
  if (!proc.env || typeof proc.env !== 'object') return undefined;
  return proc.env;
}

function getImportMetaEnv(): EnvRecord | undefined {
  if (importMetaEnvGetter) return importMetaEnvGetter();

  try {
    // Keep import.meta access runtime-safe across CJS/ESM bundlers.
    const fn = new Function(
      'return (typeof import.meta !== "undefined" && import.meta && import.meta.env) ? import.meta.env : undefined;'
    ) as () => EnvRecord | undefined;

    importMetaEnvGetter = fn;
    return fn();
  } catch {
    importMetaEnvGetter = () => undefined;
    return undefined;
  }
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

export function getEnvVar(name: string): EnvValue {
  const processValue = toStringValue(getProcessEnv()?.[name]);
  if (processValue !== undefined) return processValue;

  const importMetaValue = toStringValue(getImportMetaEnv()?.[name]);
  if (importMetaValue !== undefined) return importMetaValue;

  return undefined;
}

function getNodeEnv(): string {
  const nodeEnv = getEnvVar('NODE_ENV');
  if (nodeEnv) return nodeEnv;

  const mode = toStringValue(getImportMetaEnv()?.MODE);
  if (mode) return mode;

  return 'production';
}

export function isDevelopment(): boolean {
  if (getNodeEnv() === 'development') return true;

  const importMetaDev = getImportMetaEnv()?.DEV;
  if (importMetaDev === true || importMetaDev === 'true' || importMetaDev === 1 || importMetaDev === '1') {
    return true;
  }

  if (typeof globalThis !== 'undefined' && (globalThis as typeof globalThis & { __DEV__?: unknown }).__DEV__ === true) {
    return true;
  }

  return false;
}

export function isDebugEnabled(): boolean {
  const debug = getEnvVar('DEBUG');
  if (!debug) return false;

  const normalized = debug.toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === '*';
}
