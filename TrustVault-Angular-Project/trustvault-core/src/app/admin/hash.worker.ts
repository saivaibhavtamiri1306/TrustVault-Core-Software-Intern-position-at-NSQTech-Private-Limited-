/// <reference lib="webworker" />
import { chainHashes } from './hash-chain';

addEventListener('message', async ({ data }: MessageEvent<string[]>) => {
  const t0 = performance.now();
  const hashes = await chainHashes(data, pct => postMessage({ type: 'progress', pct }));
  postMessage({ type: 'done', hashes, ms: Math.round(performance.now() - t0) });
});
