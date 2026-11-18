// Resolves the app's import style for `node --test` (Node 22.18+/24 strips
// TypeScript types natively): the "@/..." alias and extensionless imports.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function resolve(specifier, context, nextResolve) {
  let spec = specifier;
  if (spec.startsWith('@/')) spec = pathToFileURL(path.join(root, spec.slice(2))).href;
  const isLocal = spec.startsWith('.') || spec.startsWith('file:');
  if (isLocal && !path.extname(spec)) {
    for (const ext of ['.ts', '.tsx', '/index.ts']) {
      try {
        return await nextResolve(spec + ext, context);
      } catch {
        // try the next extension
      }
    }
  }
  return nextResolve(spec, context);
}
