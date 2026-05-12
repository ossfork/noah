// Vitest setup file
// @testing-library/jest-dom matchers are not used; standard vitest
// assertions + getByText/queryByText handle all test assertions.

// jsdom defaults navigator.platform to "", which makes the platform
// helpers in lib/platform.ts resolve to deviceLabel="computer". Pin
// it to a Mac value so existing component tests that assert "Mac"
// strings keep working; per-test overrides remain possible.
if (typeof globalThis.navigator !== "undefined") {
  try {
    Object.defineProperty(globalThis.navigator, "platform", {
      configurable: true,
      value: "MacIntel",
    });
  } catch {
    // Some environments (pure node) lack a writable navigator — fine.
  }
}

// Node 25 exposes a stub localStorage global that shadows jsdom's full
// implementation (missing getItem, setItem, clear, etc.). Patch it so
// browser APIs work in both node and jsdom environments.
if (typeof globalThis.localStorage?.getItem !== "function") {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } satisfies Storage;

  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
}
