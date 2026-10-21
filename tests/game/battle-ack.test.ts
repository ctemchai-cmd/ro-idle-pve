import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleAckSchedule } from '../../src/client/battle-ack.ts';

test('battle acknowledgement waits four wall seconds, independent of render/speed changes', () => {
  const schedule = new BattleAckSchedule();
  assert.equal(schedule.delay('first', 100), 4000);
  for (let now = 150; now < 4100; now += 50) assert.equal(schedule.delay('first', now), 4100 - now);
  assert.equal(schedule.delay('first', 4100), 0);
  schedule.sent('first', 4100);
  assert.equal(schedule.delay('first', 4500), 3600, 'response latency is inside the interval');
  assert.equal(schedule.delay('first', 8100), 0);
});

test('manual acknowledgement moves the deadline; slow responses permit one catch-up, no burst', () => {
  const schedule = new BattleAckSchedule();
  schedule.delay('first', 0);
  schedule.sent('first', 3900); // e.g. confirming the old speed before a speed change
  assert.equal(schedule.delay('first', 4000), 3900);
  assert.equal(schedule.delay('first', 14000), 0);
  schedule.sent('first', 14000);
  assert.equal(schedule.delay('first', 14000), 4000);
});

test('new battles and explicit reset receive their own interval', () => {
  const schedule = new BattleAckSchedule();
  schedule.sent('first', 0);
  assert.equal(schedule.delay('second', 3000), 4000);
  schedule.reset();
  assert.equal(schedule.delay('second', 3200), 4000);
});
