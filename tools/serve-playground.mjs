// Serves /playground and transpiles the pure domain .ts modules on the fly so
// the browser sandbox always runs the REAL game rules (no duplicated logic).
// Usage: node tools/serve-playground.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2] || 8080);

/**
 * Browsers cache ES-module graph resolution per resolved URL, so we hand out a
 * unique URL per request (cache-busting `?m=<nonce>` on every re-written
 * import). That lets us serve extension-less specifiers directly: the browser
 * asks for `/src/app/domain/board/coordinates` and gets JS back — no `.js`
 * rewrite dance needed. The nonce is constant within one server run, so the
 * module graph still dedupes while you play.
 */
const RUN_NONCE = Math.random().toString(36).slice(2, 8);

const fileExists = async (p) => {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
};

/** Rewrite relative imports in transpiled JS to carry the cache-buster. */
function busterize(code) {
  return code.replace(
    /(from\s+|import\s*\(\s*)'(\.\/[^']+)'/g,
    (_m, kw, spec) => `${kw}'${spec}?m=${RUN_NONCE}'`,
  );
}

/** Map a request path to an on-disk source file. */
async function resolveFile(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]);
  if (p === '/' || p === '/index.html') return join(ROOT, 'playground/index.html');
  if (p.startsWith('/src/app/domain/')) {
    // Only allow importing the pure domain layer.
    const target = normalize(join(ROOT, p));
    if (!target.startsWith(join(ROOT, 'src/app/domain'))) return null;
    // Extension-less specifiers map onto the .ts sources (and .js too, just
    // in case someone writes the extension explicitly).
    const candidates = [`${target}.ts`, target, join(target, 'index.ts')];
    for (const c of candidates) if (await fileExists(c)) return c;
    return null;
  }
  if (p.startsWith('/playground/')) return join(ROOT, p);
  return null;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const file = await resolveFile(req.url ?? '/');
    if (!file) {
      res.writeHead(404).end('not found');
      return;
    }
    const ext = extname(file);
    let body;
    let type;
    if (ext === '.ts') {
      const source = await readFile(file, 'utf8');
      // Serve the .ts file verbatim to the transpiler: `export * from './x'`
      // stays extension-less so the browser can fetch '/x' and our resolver
      // maps it back onto '/x.ts'.
      body = busterize(
        ts.transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
          fileName: file,
        }).outputText,
      );
      type = MIME['.js'];
    } else if (file.endsWith('.mjs')) {
      // Playground modules import the domain with bare TS-style specifiers;
      // rewrite them to server-resolvable paths before shipping to the browser.
      const source = await readFile(file, 'utf8');
      body = source.replace(
        /(from\s+')\/src\/app\/domain\/([^']+)\/index\.js(')/g,
        (_m, a, dir, b) => `${a}/src/app/domain/${dir}/index${b}`,
      );
      type = MIME['.js'];
    } else {
      body = await readFile(file);
      type = MIME[ext] ?? 'application/octet-stream';
    }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }).end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end(String(err));
  }
});

server.listen(PORT, () => {
  console.log(`Chrono Garden playground → http://localhost:${PORT}/`);
});
