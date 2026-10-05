// Renders a composition to an H.264 MP4, one deterministic frame at a time.
//
//   node marketing/launch-video/render.mjs                        index.html    -> out/jobmatchly-launch.mp4
//   node marketing/launch-video/render.mjs --page features.html   features.html -> out/jobmatchly-features.mp4
//   node marketing/launch-video/render.mjs --workers 6            render frame ranges in parallel
//   node marketing/launch-video/render.mjs --stills 1,5.2         PNG stills -> out/stills/
//   node marketing/launch-video/render.mjs --from 9 --to 13 --out out/clip.mp4
//
// Needs Playwright's Chromium (already a dependency) and an FFmpeg with
// libx264: set FFMPEG_PATH, put ffmpeg on PATH, or `pip install imageio-ffmpeg`.
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const FPS = 30;

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const pageFile = opt('page', 'index.html');
const defaultOut = pageFile === 'index.html' ? 'jobmatchly-launch' : `jobmatchly-${basename(pageFile, '.html')}`;

function findFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const py = spawnSync('python', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())'], { encoding: 'utf8' });
  if (py.status === 0 && py.stdout.trim()) return py.stdout.trim();
  throw new Error('FFmpeg not found. Set FFMPEG_PATH, install ffmpeg, or `pip install imageio-ffmpeg`.');
}

// Serve the repo root so the page can load fonts from node_modules.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
function serve() {
  const server = http.createServer((req, res) => {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!path.startsWith(root + sep) || !existsSync(path) || statSync(path).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    createReadStream(path).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

const server = await serve();
const url = `http://127.0.0.1:${server.address().port}/marketing/launch-video/${pageFile}`;
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  return page;
}

// Encodes frames [start, end) of the timeline to one MP4.
async function renderRange(ff, page, from, start, end, out, progress) {
  const enc = spawn(ff, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high',
    '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', '-r', String(FPS), out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => enc.on('close', (c) => (c === 0 ? ok() : fail(new Error(`ffmpeg exited ${c}`)))));
  for (let i = start; i < end; i++) {
    await page.evaluate((t) => window.renderAt(t), from + i / FPS);
    const buf = await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
    if (!enc.stdin.write(buf)) await new Promise((ok) => enc.stdin.once('drain', ok));
    progress();
  }
  enc.stdin.end();
  await done;
}

try {
  const first = await openPage();
  const duration = await first.evaluate(() => window.DURATION);
  const stills = opt('stills');

  if (stills) {
    const dir = join(here, 'out', 'stills');
    mkdirSync(dir, { recursive: true });
    const prefix = pageFile === 'index.html' ? 't' : `${basename(pageFile, '.html')}-t`;
    for (const s of stills.split(',').map(Number)) {
      const file = join(dir, `${prefix}${s.toFixed(2).padStart(5, '0')}.png`);
      await first.evaluate((t) => window.renderAt(t), s);
      await first.screenshot({ path: file });
      console.log('still', file);
    }
  } else {
    const from = Number(opt('from', 0));
    const to = Math.min(Number(opt('to', duration)), duration);
    const out = resolve(here, opt('out', `out/${defaultOut}.mp4`));
    const workers = Math.max(1, Number(opt('workers', 1)));
    mkdirSync(dirname(out), { recursive: true });
    const ff = findFfmpeg();

    const total = Math.round((to - from) * FPS);
    const started = Date.now();
    let rendered = 0;
    const progress = () => {
      rendered++;
      if (rendered % 30 === 0) console.log(`frame ${rendered}/${total}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
    };

    if (workers === 1) {
      await renderRange(ff, first, from, 0, total, out, progress);
    } else {
      // Contiguous chunks, each encoded separately with identical settings, then
      // joined without re-encoding. Every chunk opens on a keyframe.
      const size = Math.ceil(total / workers);
      const segDir = join(here, 'out', `.segments-${process.pid}`);
      mkdirSync(segDir, { recursive: true });
      const pages = [first, ...(await Promise.all(Array.from({ length: workers - 1 }, openPage)))];
      const segs = pages.map((_, k) => join(segDir, `seg-${k}.mp4`));
      await Promise.all(pages.map((p, k) =>
        renderRange(ff, p, from, k * size, Math.min(total, (k + 1) * size), segs[k], progress)));
      const list = join(segDir, 'list.txt');
      writeFileSync(list, segs.map((s) => `file '${s.replace(/\\/g, '/')}'`).join('\n'));
      const cat = spawnSync(ff, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' });
      if (cat.status !== 0) throw new Error('ffmpeg concat failed');
      rmSync(segDir, { recursive: true, force: true });
    }
    console.log(`wrote ${out} (${total} frames, ${(total / FPS).toFixed(2)}s) in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
} finally {
  await browser.close();
  server.close();
}
