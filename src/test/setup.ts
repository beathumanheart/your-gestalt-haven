import "@testing-library/jest-dom";

// Under Node 22, `localStorage` is a partial object without a `getItem` method,
// which makes the Supabase auth auto-refresh tick throw
// "storage.getItem is not a function" as an unhandled rejection after tests
// finish (failing `vitest run` even when every test passes). Install a complete
// in-memory Storage so storage access is a harmless no-op. Must run before the
// Supabase client module is imported, which is why it lives in setupFiles.
const createStorageMock = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;
};

const storageMock = createStorageMock();
for (const target of [globalThis, window]) {
  Object.defineProperty(target, "localStorage", {
    writable: true,
    configurable: true,
    value: storageMock,
  });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
