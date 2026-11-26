import { build } from 'esbuild';
for (const entry of ['tests/renderer.test.ts']) {
const result = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false });
await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

}
