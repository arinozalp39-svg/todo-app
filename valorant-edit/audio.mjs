// Synthesizes the edit's soundtrack (120 BPM, 16 s) to edit.wav, cued to the same timeline as index.html.
// Usage: node valorant-edit/audio.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SR = 48000, DUR = 16, N = SR * DUR, BEAT = 0.5;
const L = new Float32Array(N), R = new Float32Array(N), VERB = new Float32Array(N);
const KILLS = [8.0, 9.0, 9.5, 10.0, 11.0];
let seed = 1;
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
  add(t0, .55, (t, st) => { st.ph = (st.ph ?? 0) + (48 + 130 * Math.exp(-t * 32)) / SR;
    return Math.tanh(1.6 * Math.sin(2 * Math.PI * st.ph)) * Math.exp(-t * 6.5) + rnd() * Math.exp(-t * 400) * .5; }, { gain: .9 * g });
}
function snare(t0, g = 1, verb = .25) {
  add(t0, .35, (t, st) => { const n = rnd(); const bp = n - lp(st, 'a', n, .08);
    return lp(st, 'b', bp, .5) * Math.exp(-t * 16) * 1.4 + Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 28) * .6; }, { gain: .55 * g, verb });
}
function hat(t0, g = 1, open = false) {
  add(t0, open ? .25 : .07, (t, st) => { const n = rnd(); return (n - lp(st, 'a', n, .35)) * Math.exp(-t * (open ? 14 : 70)); },
    { gain: .22 * g, pan: .3 });
}
function impact(t0, g = 1) {
  kick(t0, 1.2 * g);
  add(t0, 2.4, (t, st) => { st.ph = (st.ph ?? 0) + (36 + 30 * Math.exp(-t * 6)) / SR;
    return Math.sin(2 * Math.PI * st.ph) * Math.exp(-t * 1.8); }, { gain: .7 * g });
  add(t0, 1.6, (t, st) => lp(st, 'a', rnd(), .12 * Math.exp(-t * 2) + .01) * Math.exp(-t * 3.2), { gain: .9 * g, verb: .6 });
}
function gunshot(t0, g = 1) { // punchy rifle report: thump + body + crack + tail
  add(t0, .25, (t, st) => { st.ph = (st.ph ?? 0) + (55 + 160 * Math.exp(-t * 40)) / SR;
    return Math.sin(2 * Math.PI * st.ph) * Math.exp(-t * 14); }, { gain: .9 * g });
  add(t0, .5, (t, st) => lp(st, 'a', rnd(), .35 * Math.exp(-t * 12) + .02) * Math.exp(-t * 9) * 2.4, { gain: .8 * g, verb: .5 });
  add(t0, .03, (t, st) => { const n = rnd(); return (n - lp(st, 'a', n, .2)) * Math.exp(-t * 160) * 2; }, { gain: .6 * g, pan: .15 });
  add(t0 + .06, .6, (t, st) => lp(st, 'a', rnd(), .05) * Math.exp(-t * 5) * 1.5, { gain: .35 * g, pan: -.3, verb: .4 });
}
function riser(t0, len, g = 1) {
  add(t0, len, (t, st) => { const p = t / len;
    st.ph = (st.ph ?? 0) + (180 + 1800 * p * p) / SR;
    return (lp(st, 'a', rnd(), .02 + .5 * p * p) * 1.5 + Math.sin(2 * Math.PI * st.ph) * .25) * p * p; }, { gain: .7 * g, verb: .3 });
}
function beep(t0, g = 1) {
  add(t0, .07, t => Math.sin(2 * Math.PI * 2100 * t) * Math.min(1, t * 2000) * Math.exp(-t * 30), { gain: .18 * g, pan: -.15 });
}
function chord(t0, len, notes, { g = 1, cut = .05, attack = .01, verb = .4, decay = 1.2 } = {}) {
  add(t0, len, (t, st) => { let v = 0;
    notes.forEach((n, i) => { for (const d of [-.11, .09]) { const f = midi(n + d * .1) * (1 + d * .004); v += ((t * f + i * .37) % 1) * 2 - 1; } });
    const e = Math.min(1, t / attack) * Math.exp(-t * decay) * Math.min(1, (len - t) * 8);
    return lp(st, 'a', lp(st, 'b', v / notes.length, cut), cut) * e; }, { gain: .5 * g, verb });
}
function bassNote(t0, len, n, g = 1) { // sidechained growl bass
  const f = midi(n);
  add(t0, len, (t, st) => {
    const saw = ((t * f) % 1) * 2 - 1 + ((t * f * 1.006) % 1) * 2 - 1;
    const wob = .03 + .14 * (.5 + .5 * Math.sin(2 * Math.PI * t * 4));
    const duck = 1 - Math.exp(-((t0 + t) % BEAT) * 14);
    return (Math.tanh(lp(st, 'a', saw, wob) * 2.5) * .7 + Math.sin(2 * Math.PI * f * .5 * t) * .6) * duck * Math.min(1, (len - t) * 30);
  }, { gain: .45 * g });
}

// ---------- arrangement ----------
// 0-2: cold open — dark pad, ticking hats, three hits
chord(0, 2.1, [45, 52, 57, 60], { g: .9, cut: .03, attack: .6, decay: .2, verb: .5 });
for (let t = 0; t < 2; t += BEAT / 2) hat(t, .6);
[.5, 1.0].forEach(t => { kick(t, .9); snare(t, .5, .5); });
impact(1.5, .6); riser(1.5, .5, .6);
// 2-4: agent select
impact(2.0, .8);
for (let b = 1; b < 4; b++) kick(2 + b * BEAT);
for (let t = 2; t < 4; t += BEAT / 2) hat(t + BEAT / 4, .8);
chord(2, 2, [45, 52, 57, 60, 64], { g: .7, cut: .06, attack: .05, decay: .8 });
impact(3.0, 1); snare(3.0, 1.2, .6);
// 4-8: plant + build
impact(4.0, .7);
for (let t = 4; t < 7.5; t += BEAT) kick(t, .95);
for (let t = 4; t < 8; t += BEAT) { hat(t + BEAT / 2, 1, true); hat(t + BEAT / 4, .6); hat(t + 3 * BEAT / 4, .6); }
for (let t = 4; t < 7; t += BEAT / 2) bassNote(t, BEAT / 2 - .02, t < 6 ? 33 : 36, .6);
impact(5.0, .9);
chord(4, 3.9, [45, 48, 52, 57], { g: .6, cut: .025, attack: 1.5, decay: .1 });
{ let t = 5.0; while (t < 7.92) { beep(t); const p = (t - 5) / 3; t += .5 - .44 * Math.pow(p, .8); } }
{ let t = 7.0, step = BEAT / 2; while (t < 7.9) { snare(t, .5 + (t - 7) * .7, .15); t += step; if (t > 7.5) step = BEAT / 8; else if (t > 7.25) step = BEAT / 4; } }
riser(6.4, 1.55, 1.1);
// 8-12: the drop
impact(8.0, 1.2);
for (let t = 8; t < 12; t += BEAT) kick(t);
for (let t = 8.5; t < 12; t += 1) snare(t, 1.1);
for (let t = 8; t < 12; t += BEAT / 4) hat(t, (t * 4) % 2 ? .55 : .9);
[[8, 33], [9, 33], [10, 36], [11, 31]].forEach(([t, n]) => bassNote(t, 1, n));
chord(8, 4, [45, 52, 57, 60, 64], { g: .55, cut: .08, attack: .01, decay: .6, verb: .5 });
KILLS.forEach((t, i) => gunshot(t, i === 4 ? 1.2 : 1));
riser(10.4, .6, .7);
impact(11.0, 1.4);
chord(11, 1.2, [57, 61, 64, 69, 73], { g: .9, cut: .12, attack: .005, decay: 1.4, verb: .8 });
// 12-14.5: victory
impact(12.0, 1);
chord(12, 2.5, [53, 57, 60, 65], { g: .8, cut: .1, attack: .01, decay: .9, verb: .8 });
chord(13, 1.5, [55, 59, 62, 67], { g: .7, cut: .1, attack: .01, decay: .9, verb: .8 });
chord(13.75, 1.0, [57, 61, 64, 69], { g: .8, cut: .12, attack: .01, decay: .7, verb: .9 });
for (let t = 12; t < 14.5; t += BEAT) kick(t, .9);
for (let t = 12.5; t < 14.5; t += 1) snare(t, 1);
for (let t = 12; t < 14.5; t += BEAT / 2) hat(t + BEAT / 4, .8, true);
snare(12.5, 1.2, .5);
// 14.5-16: outro
impact(14.5, 1);
chord(14.5, 1.5, [45, 52, 57, 64], { g: .7, cut: .04, attack: .01, decay: 1.5, verb: .9 });

// ---------- reverb (Schroeder) on the send bus ----------
function reverb(src) {
  const combs = [1557, 1617, 1491, 1422].map(d => ({ d: Math.floor(d * SR / 44100), b: new Float32Array(Math.floor(d * SR / 44100)), i: 0, f: 0 }));
  const aps = [225, 556].map(d => ({ d: Math.floor(d * SR / 44100), b: new Float32Array(Math.floor(d * SR / 44100)), i: 0 }));
  const outL = new Float32Array(N), outR = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    let s = 0;
    combs.forEach((c, j) => { const y = c.b[c.i]; c.f = y * .75 + c.f * .25; c.b[c.i] = src[n] * .25 + c.f * .84; c.i = (c.i + 1) % c.d; s += j % 2 ? -y : y; });
    for (const a of aps) { const y = a.b[a.i]; a.b[a.i] = s + y * .5; s = y - s * .5; a.i = (a.i + 1) % a.d; }
    outL[n] = s; outR[n] = n > 300 ? outL[n - 300] : 0;
  }
  return [outL, outR];
}
const [vl, vr] = reverb(VERB);
// mix: glue + soft clip + fade out
const pcm = Buffer.alloc(N * 4);
let peak = 0;
for (let n = 0; n < N; n++) { L[n] += vl[n] * .5; R[n] += vr[n] * .5; peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); }
const drive = 2.6 / peak; // drive into the soft clipper for a loud, compressed master
for (let n = 0; n < N; n++) {
  const fade = Math.min(1, (DUR - n / SR) / .6);
  const l = Math.tanh(L[n] * drive) * .89 * fade, r = Math.tanh(R[n] * drive) * .89 * fade;
  pcm.writeInt16LE(Math.round(l * 32767), n * 4); pcm.writeInt16LE(Math.round(r * 32767), n * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'edit.wav');
writeFileSync(outPath, Buffer.concat([hdr, pcm]));
console.log(`wrote ${outPath}`);
