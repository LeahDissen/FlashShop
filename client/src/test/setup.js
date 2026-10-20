// Node 25+ has its own (file-backed) localStorage, which hides jsdom's and is undefined without a file.
// The tests use jsdom's storage, as in the browser.
for (const name of ['localStorage', 'sessionStorage']) {
    if (typeof globalThis[name] === 'undefined' && globalThis.jsdom) {
        Object.defineProperty(globalThis, name, { value: globalThis.jsdom.window[name], configurable: true });
    }
}
