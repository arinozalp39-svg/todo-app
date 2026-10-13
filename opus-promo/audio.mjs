// Synthesizes the promo's soundtrack (120 BPM, 20 s, D major) to promo.wav, cued to index.html's timeline.
// Usage: node opus-promo/audio.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SR = 48000, DUR = 20, N = SR * DUR, BEAT = 0.5;
const L = new Float32Array(N), R = new Float32Array(N), VERB = new Float32Array(N);
const CUTS = [3, 6, 9, 12, 15, 17.5], WIPE = 0.45;
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

function add(t0, len, fn, { gain = 1, pan = 0, verb = 0 } = {}) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  const st = {};
  for (let i = 0; i < n; i++) {
    const k = s0 + i; if (k < 0 || k >= N) continue;
    const v = fn(i / SR, st);
    L[k] += v * gl; R[k] += v * gr; VERB[k] += v * gain * verb;
  }
}
const lp = (st, key, x, a) => (st[key] = (st[key] ?? 0) + a * (x - (st[key] ?? 0)));

function kick(t0, g = 1) {
  add(t0, .45, (t, st) => { st.ph = (st.ph ?? 0) + (46 + 90 * Math.exp(-t * 30)) / SR;
    return Math.sin(2 * Math.PI * st.ph) * Math.exp(-t * 7); }, { gain: .75 * g });
}
function clap(t0, g = 1) {
  add(t0, .3, (t, st) => { const n = rnd(); const bp = lp(st, 'b', n - lp(st, 'a', n, .1), .45);
    const env = Math.exp(-t * 22) + (t > .012 ? .6 * Math.exp(-(t - .012) * 30) : 0); return bp * env * 1.6; }, { gain: .3 * g, verb: .45 });
}
function hat(t0, g = 1) {
  add(t0, .06, (t, st) => { const n = rnd(); return (n - lp(st, 'a', n, .4)) * Math.exp(-t * 80); }, { gain: .14 * g, pan: .35 });
}
function pluck(t0, n, g = 1, pan = 0) {
  const f = midi(n);
  add(t0, 1.2, (t, st) => { const tri = Math.abs(((t * f) % 1) * 4 - 2) - 1;
    return lp(st, 'a', Math.sin(2 * Math.PI * f * t) * .7 + tri * .3, .25) * Math.exp(-t * 5) * Math.min(1, t * 400); },
    { gain: .22 * g, pan, verb: .5 });
}
function bell(t0, n, g = 1, pan = 0) {
  const f = midi(n);
  add(t0, 3, t => [[1, 1, 2.2], [2.76, .4, 4], [5.4, .2, 7], [8.9, .1, 10]]
    .reduce((s, [r, a, d]) => s + Math.sin(2 * Math.PI * f * r * t) * a * Math.exp(-t * d), 0) * Math.min(1, t * 600),
    { gain: .16 * g, pan, verb: .7 });
}
function pad(t0, len, notes, g = 1, attack = .8) {
  add(t0, len, (t, st) => { let v = 0;
    notes.forEach((n, i) => { for (const d of [-1, 1]) v += ((t * midi(n) * (1 + d * .0035) + i * .29) % 1) * 2 - 1; });
    const e = Math.min(1, t / attack) * Math.min(1, (len - t) / .6);
    return lp(st, 'b', lp(st, 'a', v / notes.length, .018), .03) * e; }, { gain: .5 * g, verb: .6 });
}
function sub(t0, len, n, g = 1) {
  const f = midi(n);
  add(t0, len, t => Math.sin(2 * Math.PI * f * t) * (1 - Math.exp(-((t0 + t) % BEAT) * 10)) * Math.min(1, t * 80, (len - t) * 40), { gain: .32 * g });
}
function whoosh(tEnd, len = WIPE + .2, g = 1) {
  add(tEnd - len, len + .35, (t, st) => { const p = clamp01(t / len), down = t > len ? Math.exp(-(t - len) * 9) : 1;
    return lp(st, 'b', lp(st, 'a', rnd(), .01 + .3 * p * p), .5) * (p * p) * down * 2.2; }, { gain: .45 * g, verb: .35, pan: .1 });
}
function bloom(t0, g = 1) { // soft impact: low thump + airy swell
  add(t0, 1.8, (t, st) => { st.ph = (st.ph ?? 0) + (40 + 40 * Math.exp(-t * 8)) / SR; return Math.sin(2 * Math.PI * st.ph) * Math.exp(-t * 2.5); }, { gain: .55 * g });
  add(t0, 1.6, (t, st) => lp(st, 'a', rnd(), .04) * Math.exp(-t * 2.4) * 1.5, { gain: .3 * g, verb: .8 });
}
const clamp01 = v => Math.min(1, Math.max(0, v));
function arp(t0, t1, notes, step, g = 1) {
  let i = 0; for (let t = t0; t < t1 - 1e-6; t += step, i++) pluck(t, notes[i % notes.length], g * (i % 4 === 0 ? 1 : .75), (i % 2 ? .25 : -.25));
}

// ---------- arrangement ----------
const Dmaj9 = [50, 54, 57, 61, 64], Bm9 = [47, 50, 54, 57, 61], Gmaj9 = [43, 47, 50, 54, 57], Em9 = [40, 47, 50, 54, 55], A6 = [45, 49, 52, 54, 57];
// 0-3 intro
pad(0, 3.2, Dmaj9, .9, 1.6);
[1.0, 1.5, 2.0, 2.5].forEach((t, i) => bell(t, [74, 78, 81, 85][i], .7, i % 2 ? .3 : -.3));
bloom(1.25, .8);
// 3-6 context
bloom(3, .9);
pad(3, 3.1, Bm9, .7);
for (let t = 3; t < 6; t += BEAT) kick(t, .8);
arp(3, 6, [71, 74, 78, 81, 78, 74], BEAT / 2, .9);
sub(3, 3, 35);
// 6-9 output
pad(6, 3.1, Gmaj9, .7);
for (let t = 6; t < 9; t += BEAT) { kick(t); hat(t + BEAT / 2); }
for (let t = 6.5; t < 9; t += 1) clap(t);
arp(6, 9, [67, 71, 74, 78, 81, 78], BEAT / 4, .7);
sub(6, 3, 31);
// 9-12 thinking: arp climbs with each effort step
pad(9, 3.1, Em9, .7);
for (let t = 9; t < 12; t += BEAT) { kick(t); hat(t + BEAT / 2); }
for (let t = 9.5; t < 12; t += 1) clap(t);
[9.9, 10.24, 10.58, 10.92, 11.26].forEach((t, i) => bell(t, 74 + [0, 4, 7, 11, 14][i], .6));
arp(9, 12, [64, 67, 71, 74], BEAT / 4, .7);
sub(9, 3, 28);
// 12-15 price
pad(12, 3.1, Dmaj9, .8);
for (let t = 12; t < 15; t += BEAT) { kick(t); hat(t + BEAT / 2); hat(t + BEAT / 4, .5); }
for (let t = 12.5; t < 15; t += 1) clap(t);
arp(12, 15, [74, 78, 81, 85, 81, 78], BEAT / 4, .75);
sub(12, 3, 38);
bell(13.9, 86, .9); bell(13.9, 81, .5);
// 15-17.5 fast mode: denser, building
pad(15, 2.6, A6, .8);
for (let t = 15; t < 17.5; t += BEAT) kick(t, 1.05);
for (let t = 15; t < 17.5; t += BEAT / 4) hat(t, (t * 4) % 2 ? .6 : 1);
for (let t = 15.5; t < 17.5; t += 1) clap(t, 1.1);
arp(15, 17.5, [69, 73, 76, 81, 76, 73], BEAT / 4, .85);
for (let t = 15; t < 17.5; t += BEAT / 2) sub(t, BEAT / 2 - .02, 33, 1.1);
// 17.5-20 outro bloom
bloom(17.5, 1.1);
pad(17.5, 2.5, [38, 50, 54, 57, 61, 64], 1, .05);
[[17.5, 78], [17.75, 81], [18.0, 86], [18.5, 85]].forEach(([t, n], i) => bell(t, n, .9, i % 2 ? .25 : -.25));
CUTS.forEach(c => whoosh(c, WIPE + .2, c === 17.5 ? 1.2 : 1));

// ---------- reverb (Schroeder) on the send bus ----------
function reverb(src) {
  const combs = [1687, 1601, 2053, 2251].map(d => ({ d: Math.floor(d * SR / 44100), b: new Float32Array(Math.floor(d * SR / 44100)), i: 0, f: 0 }));
  const aps = [347, 113].map(d => ({ d: Math.floor(d * SR / 44100), b: new Float32Array(Math.floor(d * SR / 44100)), i: 0 }));
  const outL = new Float32Array(N), outR = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    let s = 0;
    combs.forEach((c, j) => { const y = c.b[c.i]; c.f = y * .6 + c.f * .4; c.b[c.i] = src[n] * .25 + c.f * .88; c.i = (c.i + 1) % c.d; s += j % 2 ? -y : y; });
    for (const a of aps) { const y = a.b[a.i]; a.b[a.i] = s + y * .5; s = y - s * .5; a.i = (a.i + 1) % a.d; }
    outL[n] = s; outR[n] = n > 420 ? outL[n - 420] : 0;
  }
  return [outL, outR];
}
const [vl, vr] = reverb(VERB);
const pcm = Buffer.alloc(N * 4);
let peak = 0;
for (let n = 0; n < N; n++) { L[n] += vl[n] * .45; R[n] += vr[n] * .45; peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); }
const drive = 1.25 / peak; // gentle soft-clip glue, keeps the dynamics
for (let n = 0; n < N; n++) {
  const fade = Math.min(1, n / (SR * .05), (DUR - n / SR) / .8);
  const l = Math.tanh(L[n] * drive) * .9 * fade, r = Math.tanh(R[n] * drive) * .9 * fade;
  pcm.writeInt16LE(Math.round(l * 32767), n * 4); pcm.writeInt16LE(Math.round(r * 32767), n * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'promo.wav');
writeFileSync(outPath, Buffer.concat([hdr, pcm]));
console.log(`wrote ${outPath}`);
