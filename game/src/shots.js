// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world, steered by a simple autopilot (find the
// order running out first, add its missing ingredients one at a time, serve
// when the plate matches), so the frame is what a short game really looks
// like and the same seed always gives the same frame.

import { STEP } from './config.js';
import { EVENT_OVER, findMatchingOrder } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 120;
const END_LIMIT_SECONDS = 600;
/** The autopilot adds one ingredient every 0.45 s of game time. */
const ADD_EVERY = 0.45;

/** The order running out soonest. */
function urgentOrder(state) {
  let best = null;
  for (const order of state.orders) {
    if (!best || order.remaining < best.remaining) best = order;
  }
  return best;
}

/**
 * One autopilot beat: serve a finished plate, else add the next missing
 * ingredient of the most urgent order. Returns true when it acted.
 */
function autopilotBeat(world) {
  const state = world.state;
  if (findMatchingOrder(state)) {
    world.serve();
    return true;
  }
  const order = urgentOrder(state);
  if (!order) return false;
  for (const id of order.recipe.needs) {
    if (!state.plate.includes(id)) {
      world.addIngredient(id);
      return true;
    }
  }
  return false;
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  const playScene = name === 'play';
  let sinceAdd = 0;
  let served = 0;
  let acted = false;
  for (let index = 0; index < (playScene ? PLAY_SECONDS : END_LIMIT_SECONDS) / STEP; index += 1) {
    // In the end scene the cook serves two dishes, then stops and lets the
    // orders run out, as a tired player would at the end of a long night.
    const cooking = playScene || served < 2;
    if (cooking) {
      sinceAdd += STEP;
      if (sinceAdd >= ADD_EVERY) {
        sinceAdd = 0;
        if (autopilotBeat(world)) {
          acted = true;
          if (findMatchingOrder(world.state) === null && world.state.plate.length === 0 && world.state.served > served) served = world.state.served;
        }
      }
    }
    if (world.step(STEP, false) & EVENT_OVER) break;
    // Play scene: stop the moment a dish is finished and ready to serve,
    // with at least one dish already served so the score shows.
    if (playScene && acted && world.state.served >= 1 && findMatchingOrder(world.state)) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
