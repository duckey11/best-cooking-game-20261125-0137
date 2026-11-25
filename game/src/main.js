// Midnight Sizzle entry point: the game loop, the screens, and the
// screenshot scenes. Loads the world, draws it every frame, and plays the
// sound cues the world collects.
import { FIELD } from './config.js';
import { createInput } from './input.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createWorld, resetWorld, step } from './world.js';
import { render } from './render.js';
import { playCue, setMuted, setSizzle } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = FIELD.width;
canvas.height = FIELD.height;
// Fit the 960x600 stage into the window without stretching it (some
// headless engines do not implement min() with mixed units, so size it here).
function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

const world = createWorld(seed);
// Read-only handle for automated play-testing through the real keyboard
// path (the page itself never uses it).
window.__world = world;
let shot = null;
if (shotName) {
  shot = stageShot(shotName, world);
  world.screen = shot.screen;
}

let lastTime = performance.now();
let best = shot ? shot.best : 0;

function startPlaying() {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  best = 0;
}

// Title / end-screen keys and mute, shared by the live loop and the test
// hook below so both drive the same transitions.
function handleScreenInput() {
  if (input.mutePressed) {
    world.muted = !world.muted;
    setMuted(world.muted);
  }
  if (!shotName) {
    if (world.screen === SCREEN_TITLE && input.anyKeyPressed) {
      startPlaying();
      playCue('click');
    } else if (world.screen === SCREEN_OVER && input.restartPressed) {
      startPlaying();
      playCue('click');
    } else if (world.screen === SCREEN_PLAY && input.restartPressed) {
      startPlaying();
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  handleScreenInput();

  if (world.screen === SCREEN_PLAY) {
    step(world, dt, input);
    best = Math.max(best, world.score);
  } else {
    // The title and end screens still breathe: the chef's idle bob and the
    // pulsing "press a key" prompt use the clock.
    world.time += dt;
  }

  for (const event of world.events) playCue(event);
  world.events.length = 0;
  setSizzle(world.screen === SCREEN_PLAY && world.sizzle && !world.muted);

  render(ctx, world);
  input.consumeFrame();
  requestAnimationFrame(frame);
}

// Test hook: advance the world by dt seconds through the real input state.
// Headless runs throttle rAF, so automated tests drive time this way; real
// play never calls it.
window.__tick = function advanceForTest(dt) {
  handleScreenInput();
  if (world.screen === SCREEN_PLAY) {
    step(world, dt, input);
    best = Math.max(best, world.score);
  }
  input.consumeFrame();
};

render(ctx, world);
if (shotName) {
  // Screenshot scenes are fully staged before the first paint, so the frame
  // is ready as soon as it is drawn.
  window.__shotReady = true;
  window.__best = best;
} else {
  requestAnimationFrame(frame);
}
