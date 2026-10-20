// Logging in keeps what a guest put in the cart: merged into the account's cart, plain products summed, designs kept apart.
import assert from 'assert';
import { fileURLToPath } from 'url';
const REPO = process.env.REPO || fileURLToPath(new URL('..', import.meta.url));
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
// Vite resolves extensionless imports; copy the two modules with explicit extensions so Node can load them
const dir = mkdtempSync(join(tmpdir(), 'cartmerge-'));
for (const name of ['cartItem', 'productQuantityPricing']) {
  const src = readFileSync(`${REPO}/client/src/utils/${name}.js`, 'utf8').replace(/from '\.\/(\w+)'/g, "from './$1.mjs'");
  writeFileSync(join(dir, `${name}.mjs`), src);
}
const { mergeGuestCart } = await import(join(dir, 'cartItem.mjs'));

const mugId = 'a'.repeat(24), shirtId = 'b'.repeat(24);
const account = [{ id: 'acc-1', productId: mugId, name: 'ספל', price: 50, quantity: 1 }];
const guest = [
  { id: 'g-1', productId: mugId, name: 'ספל', price: 50, quantity: 2 },
  { id: 'g-2', productId: shirtId, name: 'חולצה', price: 80, quantity: 1 },
  { id: 'g-3', productId: mugId, name: 'ספל בעיצוב אישי', price: 50, quantity: 1, customDesign: { projectId: 'p' } },
  { id: 'g-4', itemType: 'photo-print', name: 'פיתוח תמונה 10x15', size: '10x15', price: 1.2, quantity: 3 },
];

const merged = mergeGuestCart(account, guest);
assert.strictEqual(merged.length, 4, 'mug merged, shirt + design + photo added');
assert.strictEqual(merged.find((i) => i.id === 'acc-1').quantity, 3, 'same plain product: quantities added up');
assert.ok(merged.some((i) => i.customDesign), 'design kept as its own row');
assert.ok(merged.some((i) => i.itemType === 'photo-print'), 'photo kept');
assert.strictEqual(new Set(merged.map((i) => i.id)).size, merged.length, 'unique row ids');

assert.strictEqual(mergeGuestCart(account, account).length, 1, 'the same rows are not added twice');
assert.strictEqual(mergeGuestCart([], guest).length, 4, 'empty account cart: all guest items kept');
assert.strictEqual(mergeGuestCart(account, []).length, 1, 'no guest items: account cart unchanged');

// tiered product: the merged quantity gets the tier price
const tiered = { id: 't-1', productId: shirtId, name: 'מגנט', price: 10, quantity: 5, priceTiers: [{ minQuantity: 10, price: 8 }] };
const tieredMerged = mergeGuestCart([tiered], [{ ...tiered, id: 't-2', quantity: 5 }]);
assert.strictEqual(tieredMerged[0].quantity, 10);
console.log('CART MERGE TESTS PASSED');
