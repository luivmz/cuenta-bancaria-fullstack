import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMutex } from '../src/utils/mutex.js';
test('serializa tareas concurrentes y libera después de un error', async () => {
  const exclusive = createMutex();
  const steps = [];
  const results = await Promise.allSettled([
    exclusive(async () => { steps.push(1); await new Promise((r) => setTimeout(r, 5)); steps.push(2); throw Error('fallo'); }),
    exclusive(async () => { steps.push(3); return 4; }),
  ]);
  assert.deepEqual(steps, [1, 2, 3]);
  assert.equal(results[0].status, 'rejected'); assert.equal(results[1].value, 4);
});
