import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAdvanceBattleFrame } from '../../src/client/battle-frame.ts';

test('battle clock flushes every final1–49ms remainder instead of waiting forever below its deadline', () => {
  for (const limit of [60000, 90000]) for (let remaining = 1; remaining < 50; remaining++) {
    let current = limit - remaining;
    // The old >=50ms gate cannot advance in this state: every subsequent frame is capped at limit.
    assert.equal(limit - current >= 50, false);
    if (shouldAdvanceBattleFrame(current, limit, limit)) current = limit;
    assert.equal(current, limit);
    assert.equal(shouldAdvanceBattleFrame(current, limit, limit), false);
  }
  assert.equal(shouldAdvanceBattleFrame(1000, 1030, 60000), false);
  assert.equal(shouldAdvanceBattleFrame(1000, 1050, 60000), true);
});
