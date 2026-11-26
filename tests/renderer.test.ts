import assert from 'node:assert/strict';
import { initializeRenderer } from '../src/rendererLifecycle';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = () => {
    let resolve!: (value: { id: number }) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<{ id: number }>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const attached: number[] = [], destroyed: number[] = [], errors: unknown[] = [];
const attach = (renderer: {id: number}) => { attached.push(renderer.id); };
const destroy = (renderer: {id: number}) => { destroyed.push(renderer.id); };
let starts = 0;
const cancelProbe = initializeRenderer(async () => { starts++; return {id: 0}; }, attach, destroy, error => errors.push(error));
cancelProbe();
await flush();
assert.equal(starts, 0, 'StrictMode probe must not allocate a context');

const stale = deferred(), current = deferred();
const cancelStale = initializeRenderer(() => stale.promise, attach, destroy, error => errors.push(error));
await flush();
cancelStale();
const cancelCurrent = initializeRenderer(() => current.promise, attach, destroy, error => errors.push(error));
await flush();
current.resolve({id: 2});
await flush();
stale.resolve({id: 1});
await flush();
assert.deepEqual(attached, [2], 'Only the live canvas may attach');
assert.deepEqual(destroyed, [1], 'Late cleanup must not destroy the live context');
cancelCurrent(); cancelCurrent();
assert.deepEqual(destroyed, [1,2], 'Disposal must happen exactly once');

const failure = deferred();
initializeRenderer(() => failure.promise, attach, destroy, error => errors.push(error));
await flush();
failure.reject(new Error('WebGL unavailable'));
await flush();
assert.equal(errors.length, 1, 'Initialization failures must reach the visible error handler');
console.log('Renderer regressions passed: StrictMode probe, overlapping startup, cancellation, disposal, initialization failure.');
