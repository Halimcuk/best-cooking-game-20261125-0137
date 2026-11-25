// Lantern Noodle Stall — boot and the one loop: input is read every frame,
// the world advances in fixed 1/60 s steps (several in a slow frame, none in
// a fast one), and the renderer paints what is there. The game moves between
// four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED, EVENT_WRONG } from './world.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sounds } from './sounds.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem('lantern-noodle-stall.best') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem('lantern-noodle-stall.best', String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, 5);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  const input = createInput(canvas, () => screen);

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    sounds.unlock();
    sounds.click();
    announce(`Playing. ${3} hearts. Match the orders on the board.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    sounds.over();
    announce(`Game over. Score ${world.state.score}. Coins ${world.state.coins}. Best ${best}.`);
  }

  function handleEvents() {
    for (const event of input.takeEvents()) {
      if (event.type === 'confirm') {
        if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
        else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      } else if (event.type === 'pause') {
        if (screen === SCREEN_PLAY) {
          screen = SCREEN_PAUSED;
          announce('Paused.');
        } else if (screen === SCREEN_PAUSED) {
          screen = SCREEN_PLAY;
          announce('Playing.');
        }
      } else if (screen !== SCREEN_PLAY) {
        continue;
      } else if (event.type === 'add') {
        if (world.addIngredient(event.id)) sounds.add();
      } else if (event.type === 'serve') {
        const result = world.serve();
        if (result === EVENT_SERVED) {
          sounds.serve();
          announce(`Served ${world.state.lastServed.name} for ${world.state.lastServed.coins} coins.`);
        } else if (result === EVENT_WRONG) {
          sounds.wrong();
          announce('That plate does not match any order yet.');
        }
      } else if (event.type === 'trash') {
        if (world.trashLast()) sounds.click();
      } else if (event.type === 'plate') {
        // Clicking the plate takes its last ingredient back off.
        if (world.trashLast()) sounds.click();
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, true);
      return;
    }
    const events = world.step(STEP, false);
    if (events & EVENT_SERVED) sounds.serve();
    if (events & EVENT_EXPIRED) {
      sounds.expire();
      announce(world.state.hearts === 1 ? 'An order was lost. 1 heart left.' : `An order was lost. ${world.state.hearts} hearts left.`);
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleEvents();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, now / 1000);
  }

  // Leaving the tab pauses a running game rather than letting orders run out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Lantern Noodle Stall. Press Space or click Start Cooking to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
