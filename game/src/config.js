// Lantern Noodle Stall — every tuning number, colour and layout in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const HEARTS = 3;
export const LEVEL = { servedPerLevel: 4, max: 8 };
export const BEST_KEY = 'lantern-noodle-stall.best';

/** The eight ingredients on the counter, in key order 1-8. */
export const INGREDIENTS = [
  { id: 'noodles', name: 'Noodles', key: '1', color: '#f2c94c', dark: '#c9a227', shape: 'swirl' },
  { id: 'broth', name: 'Broth', key: '2', color: '#d97b2f', dark: '#a85c1d', shape: 'splash' },
  { id: 'egg', name: 'Egg', key: '3', color: '#fff3c4', dark: '#e8b93c', shape: 'egg' },
  { id: 'chilli', name: 'Chilli', key: '4', color: '#e5534b', dark: '#a8322c', shape: 'chilli' },
  { id: 'herbs', name: 'Herbs', key: '5', color: '#4caf6d', dark: '#2e7d46', shape: 'leaf' },
  { id: 'tofu', name: 'Tofu', key: '6', color: '#f5efe0', dark: '#cbbf9e', shape: 'cube' },
  { id: 'mushroom', name: 'Mushroom', key: '7', color: '#b08968', dark: '#7d5f45', shape: 'cap' },
  { id: 'prawn', name: 'Prawn', key: '8', color: '#ff8a65', dark: '#d95f3a', shape: 'prawn' },
];

export function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

/** The menu: every dish is a set of ingredients, in any order. Longer recipes appear as the level rises. */
export const RECIPES = [
  { name: 'Classic Noodle', needs: ['noodles', 'broth', 'egg'], coins: 8, time: 45 },
  { name: 'Spicy Fire Bowl', needs: ['noodles', 'broth', 'chilli', 'herbs'], coins: 10, time: 50 },
  { name: 'Mushroom Melt', needs: ['noodles', 'broth', 'mushroom', 'egg', 'tofu'], coins: 12, time: 52 },
  { name: 'Garden Veggie', needs: ['noodles', 'broth', 'mushroom', 'tofu', 'herbs'], coins: 12, time: 55 },
  { name: 'Prawn Deluxe', needs: ['noodles', 'broth', 'prawn', 'egg', 'chilli'], coins: 14, time: 55 },
  { name: 'Chilli Prawn', needs: ['noodles', 'broth', 'prawn', 'chilli', 'herbs'], coins: 13, time: 55 },
];

/** Recipes a level may draw from: the first three at level 1, the whole menu by level 4. */
export function recipesForLevel(level) {
  const count = Math.min(RECIPES.length, 2 + level);
  return RECIPES.slice(0, count);
}

/** How many orders may sit on the board at once. */
export function maxOrdersForLevel(level) {
  return Math.min(3, 1 + Math.floor((level - 1) / 2));
}

/** Seconds between new orders, shrinking as the level rises. */
export function spawnIntervalForLevel(level) {
  return Math.max(4, 9 - level);
}

/** An order's timer, shrinking as the level rises, never below 22 seconds. */
export function orderTimeForLevel(recipe, level) {
  return Math.max(22, recipe.time * (1 - 0.04 * (level - 1)));
}

/** Fixed screen layout, shared by the renderer and the click handling. */
export const LAYOUT = {
  board: { x: 24, y: 118, w: 300, h: 330 },
  plate: { x: 560, y: 300, w: 300, h: 210 },
  serveButton: { x: 900, y: 330, w: 150, h: 64 },
  trashButton: { x: 900, y: 410, w: 150, h: 44 },
  bins: { y: 560, h: 118, gap: 8, firstX: 24, width: 148 },
  startButton: { x: 490, y: 480, w: 300, h: 72 },
  restartButton: { x: 490, y: 520, w: 300, h: 72 },
};

/** The rectangle of ingredient bin `index` (0-7). */
export function binRect(index) {
  const bins = LAYOUT.bins;
  return { x: bins.firstX + index * (bins.width + bins.gap), y: bins.y, w: bins.width, h: bins.h };
}

export const PALETTE = {
  skyTop: '#1d2340',
  skyBottom: '#3a2b4d',
  awningRed: '#c0392b',
  awningCream: '#f6e7c8',
  wood: '#7a5230',
  woodDark: '#5d3d22',
  counter: '#8a5f38',
  board: '#2b2f3a',
  boardEdge: '#4a4f5e',
  chalk: '#f2ead8',
  plate: '#f8f4e8',
  bowl: '#d94f3d',
  text: '#fff6e3',
  muted: '#c9bda6',
  gold: '#f2c94c',
  heart: '#e5534b',
  serve: '#4caf6d',
  trash: '#8b93a3',
  timerGood: '#4caf6d',
  timerWarn: '#f2a93c',
  timerBad: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
