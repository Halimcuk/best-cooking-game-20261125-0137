// Lantern Noodle Stall — the rules. Orders arrive on the board with a timer;
// the player builds the matching dish on the plate from the counter bins and
// serves it for coins plus a speed tip. A timer that runs out costs a heart.
// Three hearts lost ends the night. Levels rise every few dishes served:
// recipes get longer, orders faster and the board busier.

import {
  HEARTS, LEVEL, STEP, maxOrdersForLevel, orderTimeForLevel,
  recipesForLevel, spawnIntervalForLevel,
} from './config.js';
import { pickRandom } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_ADD = 1;
export const EVENT_SERVED = 2;
export const EVENT_WRONG = 4;
export const EVENT_EXPIRED = 8;
export const EVENT_OVER = 16;
export const EVENT_TRASH = 32;

let nextOrderId = 1;

/** A fresh order drawn from the level's menu. */
export function createOrder(random, level) {
  const recipe = pickRandom(random, recipesForLevel(level));
  const total = orderTimeForLevel(recipe, level);
  return { id: nextOrderId, recipe, remaining: total, total, served: false };
}

/** True when the plate holds exactly the recipe's ingredients, in any order. */
export function plateMatchesOrder(plate, order) {
  if (plate.length !== order.recipe.needs.length) return false;
  const remaining = [...order.recipe.needs];
  for (const item of plate) {
    const at = remaining.indexOf(item);
    if (at === -1) return false;
    remaining.splice(at, 1);
  }
  return remaining.length === 0;
}

/** The first board order the plate completes, or null. */
export function findMatchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatchesOrder(state.plate, order)) return order;
  }
  return null;
}

/** A fresh night: score, coins, hearts, level and an empty plate. */
export function createWorld(random) {
  const state = {
    random,
    score: 0,
    coins: 0,
    hearts: HEARTS,
    level: 1,
    served: 0,
    orders: [],
    plate: [],
    elapsed: 0,
    spawnIn: 1.2,
    shake: 0,
    floats: [],
    steam: 0,
    lastServed: null,
    over: false,
  };
  return {
    state,

    reset() {
      state.score = 0;
      state.coins = 0;
      state.hearts = HEARTS;
      state.level = 1;
      state.served = 0;
      state.orders = [];
      state.plate = [];
      state.elapsed = 0;
      state.spawnIn = 1.2;
      state.shake = 0;
      state.floats = [];
      state.steam = 0;
      state.lastServed = null;
      state.over = false;
      nextOrderId = 1;
      state.orders.push(createOrder(state.random, 1));
    },

    /** Add one ingredient to the plate; returns true when it went on. */
    addIngredient(id) {
      if (state.over || state.plate.length >= 6) return false;
      state.plate.push(id);
      state.steam = 0.6;
      return true;
    },

    /** Take the last ingredient off the plate; returns true when one came off. */
    trashLast() {
      if (state.plate.length === 0) return false;
      state.plate.pop();
      return true;
    },

    /** Take one named ingredient off the plate (clicking it on the plate). */
    removeIngredient(id) {
      const at = state.plate.indexOf(id);
      if (at === -1) return false;
      state.plate.splice(at, 1);
      return true;
    },

    /** Serve the plate: a match pays coins plus a speed tip; a miss just buzzes. */
    serve() {
      if (state.over) return EVENT_NONE;
      const order = findMatchingOrder(state);
      if (!order) {
        state.shake = 0.35;
        return EVENT_WRONG;
      }
      const tip = Math.round((order.remaining / order.total) * 5);
      const earned = order.recipe.coins + tip;
      state.coins += earned;
      state.score += 100 + tip * 20 + state.level * 10;
      state.served += 1;
      state.lastServed = { name: order.recipe.name, coins: earned, tip };
      state.floats.push({ text: `+${earned} coins`, life: 1.4, x: 710, y: 300 });
      state.orders = state.orders.filter((item) => item !== order);
      state.plate = [];
      state.steam = 0.9;
      state.level = Math.min(LEVEL.max, 1 + Math.floor(state.served / LEVEL.servedPerLevel));
      return EVENT_SERVED;
    },

    /**
     * Advance the night by `dt` seconds. On the title screen `attract` is true:
     * orders drift in and out for the backdrop, but no heart is ever lost.
     * Returns an event bitmask.
     */
    step(dt, attract) {
      let events = EVENT_NONE;
      if (state.over) return events;
      state.elapsed += dt;
      if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
      if (state.steam > 0) state.steam = Math.max(0, state.steam - dt);
      for (const float of state.floats) float.life -= dt;
      state.floats = state.floats.filter((float) => float.life > 0);

      state.spawnIn -= dt;
      if (state.spawnIn <= 0 && state.orders.length < maxOrdersForLevel(state.level)) {
        state.orders.push(createOrder(state.random, state.level));
        state.spawnIn = spawnIntervalForLevel(state.level);
      }

      for (const order of state.orders) order.remaining -= dt;
      const expired = state.orders.filter((order) => order.remaining <= 0);
      if (expired.length > 0) {
        state.orders = state.orders.filter((order) => order.remaining > 0);
        if (!attract) {
          state.hearts -= expired.length;
          state.plate = [];
          events |= EVENT_EXPIRED;
          if (state.hearts <= 0) {
            state.hearts = 0;
            state.over = true;
            events |= EVENT_OVER;
          }
        }
      }
      return events;
    },
  };
}

// Keep the fixed step import used: the loop steps the world in STEP-sized slices.
export { STEP };
