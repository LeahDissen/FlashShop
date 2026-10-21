// Cart across guest / login / refresh / logout, run against the real cart store with the server calls stubbed.
import assert from 'assert';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, symlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
const REPO = process.env.REPO || fileURLToPath(new URL('..', import.meta.url));
const SRC = `${REPO}/client/src`;

// fake localStorage (zustand persist)
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };

// copy the store + helpers into a temp module tree; server calls and UI stores are stubs
const dir = mkdtempSync(join(tmpdir(), 'cartlogin-'));
for (const d of ['store', 'utils', 'api']) mkdirSync(join(dir, d));
symlinkSync(`${REPO}/client/node_modules`, join(dir, 'node_modules'));
const fixImports = (src) => src.replace(/from '(\.{1,2}\/[\w/]+)'/g, "from '$1.mjs'");
for (const f of ['utils/cartItem', 'utils/productQuantityPricing', 'utils/photoQuantityPricing']) writeFileSync(join(dir, `${f}.mjs`), fixImports(readFileSync(`${SRC}/${f}.js`, 'utf8')));
writeFileSync(join(dir, 'store/cartStore.mjs'), fixImports(readFileSync(`${SRC}/store/cartStore.js`, 'utf8')));
writeFileSync(join(dir, 'store/authStore.mjs'), 'export default { getState: () => globalThis.__auth };');
writeFileSync(join(dir, 'store/toastStore.mjs'), 'export default { getState: () => ({ showToast() {} }) };');
writeFileSync(join(dir, 'utils/cartThumbnail.mjs'), 'export const prepareCartDisplayImage = async (i) => i;');
writeFileSync(join(dir, 'api/cart.mjs'), `
export const fetchCartFromDB = async (userId) => globalThis.__serverDown ? null : structuredClone(globalThis.__db[userId] || []);
export const saveCartToDB = async (userId, items) => { globalThis.__db[userId] = structuredClone(items); };`);
writeFileSync(join(dir, 'api/photo.mjs'), `export const getPhotoPricing = async () => ({ sizes: [{ size: '10x15', tiers: [{ minQuantity: 1, price: 2 }, { minQuantity: 5, price: 1 }] }] });`);

globalThis.__db = {}; globalThis.__auth = { userId: null };
let { useCartStore } = await import(join(dir, 'store/cartStore.mjs'));
const store = () => useCartStore.getState();
const names = () => store().cartItems.map((i) => `${i.name}x${i.quantity}`).sort().join(',');
const MUG = 'a'.repeat(24), SHIRT = 'b'.repeat(24);
const mug = (q = 1) => ({ productId: MUG, name: 'mug', price: 50, quantity: q });
const shirt = () => ({ productId: SHIRT, name: 'shirt', price: 80, quantity: 1 });
const photo = (q) => ({ itemType: 'photo-print', name: 'photo', size: '10x15', price: 2, quantity: q });
const login = async (id) => { globalThis.__auth = { userId: id }; await store().loadCart(id); };
const logout = () => { globalThis.__auth = { userId: null }; store().resetCartLocal(); };
// a page refresh = what App.jsx does on load
const refresh = async () => { const id = globalThis.__auth.userId; if (id) await store().loadCart(id); else store().dropOtherAccountCart(); };

// 1. guest cart survives a refresh (the reported bug)
await store().addToCart([mug()]);
await refresh();
assert.strictEqual(names(), 'mugx1', 'guest cart kept on refresh');

// 2. login with an empty account: guest items move into the account and are saved
await login('A');
assert.strictEqual(names(), 'mugx1');
assert.strictEqual(globalThis.__db.A.length, 1, 'saved to the account');

// 3. logged-in refresh: unchanged behaviour, nothing duplicated
await refresh(); await refresh();
assert.strictEqual(names(), 'mugx1', 'no duplicates on refresh');

// 4. logout clears the browser, the account keeps its cart
logout();
assert.strictEqual(names(), '', 'cleared on logout');
assert.strictEqual(globalThis.__db.A.length, 1);

// 5. guest adds the same mug + a shirt, logs in: merged, mug quantities summed
await store().addToCart([mug(2), shirt()]);
await login('A');
assert.strictEqual(names(), 'mugx3,shirtx1', 'merged into the account cart');
assert.strictEqual(globalThis.__db.A.length, 2);

// 6. another account logging in on the same browser never sees A's cart
logout(); await login('B');
assert.strictEqual(names(), '', 'B does not get As items');
// ... also when A's session simply expired (no logout click) and the page reloads
globalThis.__auth = { userId: 'A' }; await store().loadCart('A'); // A again
globalThis.__auth = { userId: null }; await refresh();               // session ended
assert.strictEqual(names(), '', 'expired session: As cart not left for the next person');

// 7. A logs in directly over B's cart without logging out (login page while signed in)
logout(); await login('B'); await store().addToCart([shirt()]);
globalThis.__auth = { userId: 'A' }; await store().loadCart('A');
assert.strictEqual(names(), 'mugx3,shirtx1', 'A gets only As saved cart');

// 8. server down at login: guest items kept, nothing overwritten; another account's items dropped
logout(); await store().addToCart([shirt()]);
globalThis.__serverDown = true; await login('C');
assert.strictEqual(names(), 'shirtx1', 'guest items kept when the server is unreachable');
globalThis.__auth = { userId: 'D' }; await store().loadCart('D');
assert.strictEqual(names(), '', 'Cs items not shown to D');
globalThis.__serverDown = false;

// 9. photos on both sides: the per-photo price follows the combined count (2 + 3 = 5 → tier 1 ₪)
logout(); globalThis.__db.E = [photo(2)];
await store().addToCart([photo(3)]);
await login('E');
assert.deepStrictEqual(store().cartItems.map((i) => i.price), [1, 1], 'photos repriced after merge');

// 10. an old cart saved before this change (no owner): same behaviour as before for a logged-in user
mem.set('cart-storage', JSON.stringify({ state: { cartItems: [{ id: 'old', productId: MUG, name: 'legacy', price: 5, quantity: 1 }] }, version: 0 }));
await useCartStore.persist.rehydrate();
globalThis.__db.F = [];
globalThis.__auth = { userId: 'F' }; await store().loadCart('F');
assert.strictEqual(names(), 'legacyx1', 'legacy cart kept when the account has none (old behaviour)');
await useCartStore.persist.rehydrate();
mem.set('cart-storage', JSON.stringify({ state: { cartItems: [{ id: 'old', productId: MUG, name: 'legacy', price: 5, quantity: 1 }] }, version: 0 }));
await useCartStore.persist.rehydrate();
globalThis.__auth = { userId: null }; await refresh();
assert.strictEqual(names(), '', 'legacy cart of a logged-out visitor cleared (old behaviour)');

console.log('CART LOGIN TESTS PASSED');
