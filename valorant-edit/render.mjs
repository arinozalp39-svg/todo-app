// Renders the edit to valorant-edit.mp4: 60 fps, 4-sample motion blur, H.264 high quality + the synthesized track.
// Usage: node valorant-edit/render.mjs [--4k] [--fps 60] [--samples 4]   (needs playwright + ffmpeg)
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

// require() so a globally installed playwright works via NODE_PATH
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : Number(args[i + 1]); };
const scale = args.includes('--4k') ? 2 : 1, fps = opt('--fps', 60), samples = opt('--samples', 4);
const out = path.join(dir, scale === 2 ? 'valorant-edit-4k.mp4' : 'valorant-edit.mp4');
const wav = path.join(dir, 'edit.wav');
if (!existsSync(wav)) execFileSync('node', [path.join(dir, 'audio.mjs')], { stdio: 'inherit' });

// fonts need http (file:// blocks @font-face), so serve the folder locally
const types = { '.html': 'text/html', '.woff2': 'font/woff2', '.wav': 'audio/wav' };
const server = createServer(async (req, res) => {
  try { const f = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!f.startsWith(dir)) throw 0;
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(await readFile(f)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/index.html?capture&scale=${scale}`);
await page.evaluate(() => window.fontsReady);
const duration = await page.evaluate(() => window.EDIT_DURATION);
const frames = Math.round(duration * fps);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', scale === 2 ? '16' : '14', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-x264-params', 'keyint=60',
  '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  // pull the frame straight off the canvas at full resolution
  const b64 = await page.evaluate(([t, f, s]) => { window.renderFrame(t, f, s);
    return document.getElementById('c').toDataURL('image/png').slice(22); }, [i / fps, fps, samples]);
  if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\rframe ${i}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close(); server.close();
console.log(`\nwrote ${out}`);
