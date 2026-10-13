# todo-app
ToDo App

## Motion showreel

`showreel/` holds a 15-second motion graphics showreel built with the Canvas 2D API. It has six scenes cut to a 120 BPM beat: a particle intro, a geometry grid with shockwave rings, kinetic type, a 3D dot sphere, a flipping tile mosaic, and an outro.

- **Watch live:** open `showreel/index.html` in a browser. Hover to show the controls (play/pause, loop, scrub); Space toggles play.
- **Video:** `showreel/showreel.mp4` (1920×1080, 30 fps, H.264 with a synthesized beat).
- **Re-render:** `NODE_PATH=$(npm root -g) node showreel/render.mjs [fps]` (needs Playwright and ffmpeg).
