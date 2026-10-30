import test from 'node:test';
import assert from 'node:assert/strict';

let sequence = 0;
async function speedModule(value: string | null, failRead = false, failWrite = false) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>(value === null ? [] : [['ro.battleSpeed', value]]), writes: string[] = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem(key: string) { if (failRead) throw new Error('Storage denied'); return values.get(key) ?? null; },
    setItem(key: string, next: string) { if (failWrite) throw new Error('Storage denied'); writes.push(key); values.set(key, next); },
  } });
  const restore = () => { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); };
  try { return { speed: await import(`../../src/client/battle-speed.ts?selector=${++sequence}`), values, writes, restore }; }
  catch (error) { restore(); throw error; }
}

test('old4x preference becomes3x; subscribers receive only1/2/3 and only the device preference is written', async () => {
  const m = await speedModule('4');
  try {
    assert.equal(m.speed.battleSpeed(), 3); assert.equal(m.values.get('ro.battleSpeed'), '3');
    const seen: number[] = [], stop = m.speed.subscribeBattleSpeed(() => seen.push(m.speed.battleSpeed()));
    for (let i = 0; i < 3; i++) m.speed.cycleBattleSpeed();
    assert.deepEqual(seen, [1, 2, 3]); assert.deepEqual(m.speed.BATTLE_SPEEDS, [1, 2, 3]);
    stop(); m.speed.cycleBattleSpeed(); assert.deepEqual(seen, [1, 2, 3]);
    assert.deepEqual([...new Set(m.writes)], ['ro.battleSpeed']);
  } finally { m.restore(); }
});
test('3x survives a new browser module and2x is preserved', async () => {
  for (const value of ['2', '3']) {
    const m = await speedModule(value);
    try { assert.equal(m.speed.battleSpeed(), Number(value)); assert.deepEqual(m.writes, []); }
    finally { m.restore(); }
  }
});
test('missing or invalid device speeds start at1x', async () => {
  for (const value of [null, '0', '8', '-1', 'NaN', '1.5']) {
    const m = await speedModule(value);
    try { assert.equal(m.speed.battleSpeed(), 1); } finally { m.restore(); }
  }
});
test('storage failure does not disable speed controls or lose the old4x fallback', async () => {
  for (const [read, write, expected] of [[true, true, 1], [false, true, 3]] as const) {
    const m = await speedModule('4', read, write);
    try { assert.equal(m.speed.battleSpeed(), expected); assert.doesNotThrow(() => m.speed.cycleBattleSpeed()); }
    finally { m.restore(); }
  }
});
