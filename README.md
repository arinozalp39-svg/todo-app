# todo-app
ToDo App

## Motion showreel

`showreel/` holds a 15-second motion graphics showreel built with the Canvas 2D API. It has six scenes cut to a 120 BPM beat: a particle intro, a geometry grid with shockwave rings, kinetic type, a 3D dot sphere, a flipping tile mosaic, and an outro.

- **Watch live:** open `showreel/index.html` in a browser. Hover to show the controls (play/pause, loop, scrub); Space toggles play.
- **Video:** `showreel/showreel.mp4` (1920×1080, 30 fps, H.264 with a synthesized beat).
- **Re-render:** `NODE_PATH=$(npm root -g) node showreel/render.mjs [fps]` (needs Playwright and ffmpeg).

## Valorant fan edit

`valorant-edit/` holds a 16-second Valorant-style motion graphics edit, built as a canvas animation with its own synthesized soundtrack.

It runs at 120 BPM, and every cut, hit and shot lands on the beat:

| Time | Scene |
|---|---|
| 0–2s | Cold open: radar sweep, "ONE ROUND LEFT" landing on beats, red slash transition |
| 2–4s | Agent select: role cards fly in, the initiator card is picked, then a **LOCKED IN** stamp |
| 4–8s | Spike plant: plant progress ring, **SPIKE PLANTED**, countdown, faster and faster beeps, riser and white-out |
| 8–12s | The drop: first-person flick shots, enemies shattering, kill feed, kill banners, **ACE** |
| 12–14.5s | **VICTORY**, with the score flipping to 13–11 |
| 14.5–16s | GG outro |

Post effects: screen shake, zoom punches, chromatic aberration, glitch slices, flashes, film grain, scanlines, vignette and 4-sample motion blur.

- **Watch live:** serve the folder (for example `python3 -m http.server` inside `valorant-edit/`), then open `index.html` and click *Play with sound*.
- **Video:** `valorant-edit/valorant-edit.mp4` (1920×1080, 60 fps, H.264 CRF 14, AAC 320 kbps).
- **Re-render:** `NODE_PATH=$(npm root -g) node valorant-edit/render.mjs` (add `--4k` for 3840×2160). `audio.mjs` regenerates `edit.wav`.

This is an unofficial fan edit. It is not affiliated with or endorsed by Riot Games, and it contains no game footage or Riot assets: every visual and sound is generated in code. The fonts are Anton and Chakra Petch, both under the SIL Open Font License (see `valorant-edit/fonts/`).

## Opus 5.5 tanıtım videosu

`opus-promo/` holds a 20-second Turkish motion-design video introducing Claude Opus 5.5. It is a canvas animation with its own synthesized soundtrack (120 BPM, D major).

| Süre | Sahne |
|---|---|
| 0–3s | Giriş: "Tanışın — Claude Opus 5.5" |
| 3–6s | 1M token bağlam penceresi: sayaç ve dolan token ızgarası |
| 6–9s | Tek yanıtta 128K çıktı token'ı, gerçek bir TypeScript SDK çağrısıyla |
| 9–12s | Uyarlanabilir düşünme: effort seviyeleri (low → max, varsayılan medium) ve büyüyen düşünce ağacı |
| 12–15s | Fiyat: 1M token başına $4 girdi / $20 çıktı (Opus 5'te $5 / $25), %20 daha düşük |
| 15–17.5s | Hızlı mod: 2,5 kata kadar daha hızlı çıktı (araştırma önizlemesi) |
| 17.5–20s | Kapanış: `claude-opus-5-5` |

- **İzle:** serve the folder (for example `python3 -m http.server` inside `opus-promo/`), open `index.html`, then click *Sesli oynat*.
- **Video:** `opus-promo/opus-promo.mp4` (1920×1080, 60 fps, H.264 CRF 14, AAC 320 kbps).
- **Yeniden üret:** `NODE_PATH=$(npm root -g) node opus-promo/render.mjs` (add `--4k` for 3840×2160). `audio.mjs` regenerates `promo.wav`.

This is an independent promo. It was not made by Anthropic and uses no Anthropic logos or brand assets; the mark in the video is an original design. Every figure comes from Anthropic's published model documentation: no benchmark scores are claimed. The fonts are Instrument Serif, Inter and JetBrains Mono, all under the SIL Open Font License (see `opus-promo/fonts/`).

## NVIDIA tanıtım videosu

`nvidia-promo/` holds a 20-second Turkish motion-design video introducing NVIDIA. It is a canvas animation with its own synthesized soundtrack (120 BPM, E minor). A timeline runs along the bottom from 1993 to 2022+.

| Süre | Sahne |
|---|---|
| 0–3s | Giriş: çekirdekleri yanan bir GPU yongası, ardından "NVIDIA · Hızlandırılmış bilişimin öncüsü" |
| 3–6s | 1993: üç kurucu (Jensen Huang, Chris Malachowsky, Curtis Priem), merkez Santa Clara |
| 6–9s | 1999: GeForce 256, "GPU" adıyla tanıtılan ilk ürün (dönen, gölgelendirilmiş bir 3D model) |
| 9–12s | 2006: CUDA (birkaç CPU çekirdeği ile binlerce paralel GPU çekirdeğinin karşılaştırması) |
| 12–14.5s | 2018: RTX, gerçek zamanlı ışın izleme (kameradan kürelere ve ışığa giden ışınlar) |
| 14.5–17.5s | Yapay zekâ çağı: Hopper (2022), Blackwell (2024); piyasa değeri $1T → $5T, 29 Ekim 2025'te 5 trilyon doları aşan ilk şirket |
| 17.5–20s | Kapanış: "NVIDIA · Geleceği hızlandırıyor." |

- **İzle:** serve the folder (for example `python3 -m http.server` inside `nvidia-promo/`), open `index.html`, then click *Sesli oynat*.
- **Video:** `nvidia-promo/nvidia-promo.mp4` (1920×1080, 60 fps, H.264 CRF 14, AAC 320 kbps).
- **Yeniden üret:** `NODE_PATH=$(npm root -g) node nvidia-promo/render.mjs` (add `--4k` for 3840×2160). `audio.mjs` regenerates `promo.wav`.

This is an independent promo. It is not affiliated with or endorsed by NVIDIA, and it uses no NVIDIA logos or brand assets; the name is set in Archivo. NVIDIA, GeForce, CUDA and RTX are trademarks of NVIDIA Corporation. The fonts are Archivo, Inter and JetBrains Mono, all under the SIL Open Font License (see `nvidia-promo/fonts/`).
