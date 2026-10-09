const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');

/** SHA-256 hash chain: hash[i] = sha256(hash[i-1] + entry[i]). Pure function, so it can run in a Web Worker. */
export async function chainHashes(entries: string[], onProgress: (pct: number) => void): Promise<string[]> {
  const enc = new TextEncoder();
  const out: string[] = [];
  let prev = '0'.repeat(64);
  for (let i = 0; i < entries.length; i++) {
    prev = hex(await crypto.subtle.digest('SHA-256', enc.encode(prev + entries[i])));
    out.push(prev);
    if (i % 500 === 0) onProgress(Math.round((i / entries.length) * 100));
  }
  onProgress(100);
  return out;
}
