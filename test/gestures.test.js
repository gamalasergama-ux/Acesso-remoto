import test from 'node:test';
import assert from 'node:assert/strict';
import { Gestures } from '../web/scripts/gestures.js';
function fixture() { const events = []; const g = new Gestures(e => events.push(e), () => ({ width: 200, height: 100 }), () => 10); g.x = 50; g.y = 50; return { g, events }; }
test('tap generates balanced left click; repeated taps support double click', () => {
  const { g, events } = fixture(); for (let i = 0; i < 2; i++) { g.start(1, 3, 4); g.end(1); }
  assert.deepEqual(events.map(e => e.type), ['down', 'up', 'down', 'up']);
});
test('relative touchpad motion clamps inside remote canvas', () => {
  const { g, events } = fixture(); g.start(1, 1, 1); g.move(1, 1000, -1000); g.end(1);
  assert.deepEqual(events, [{ type: 'move', x: 199, y: 0 }]);
});
test('direct mode maps display coordinates and long hold drags', () => {
  const { g, events } = fixture(); g.mode = 'direct'; g.start(1, 20, 30); g.hold(); g.move(1, 40, 50); g.end(1);
  assert.deepEqual(events.map(e => e.type), ['move', 'down', 'move', 'up']); assert.equal(events.at(-1).x, 40);
});
test('cancellation releases held button exactly once and clears pointers', () => {
  const { g, events } = fixture(); g.start(1, 1, 1); g.hold(); g.cancel(); g.cancel(); g.end(1);
  assert.deepEqual(events.map(e => e.type), ['down', 'up']); assert.equal(g.points.size, 0);
});
test('second finger cancels drag, scrolls, and never clicks on release', () => {
  const { g, events } = fixture(); g.start(1, 1, 1); g.hold(); g.start(2, 20, 20); g.move(2, 20, 35); g.end(2); g.end(1);
  assert.deepEqual(events.map(e => e.type), ['down', 'up', 'scroll']); assert.equal(events[2].delta, -45);
});
test('movement cancels long-press activation; stale events ignored', () => {
  const { g, events } = fixture(); g.start(1, 1, 1); g.move(1, 5, 5); g.hold(); g.end(1); g.move(9, 5, 5); g.end(9);
  assert.deepEqual(events.map(e => e.type), ['move']);
});
test('right click preserves button identity', () => { const { g, events } = fixture(); g.click(2); assert.deepEqual(events.map(e => [e.type, e.button]), [['down', 2], ['up', 2]]); });
