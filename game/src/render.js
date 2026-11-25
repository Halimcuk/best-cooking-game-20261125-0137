// Lantern Noodle Stall — the renderer. Warm flat colours and simple rounded
// shapes on one canvas: a night-market stall under paper lanterns, the order
// board on the left, the counter bins along the bottom, and the plate in the
// middle. Every screen (title, play, paused, game over) is painted here.

import { FIELD, FONT, INGREDIENTS, LAYOUT, PALETTE, binRect, ingredientById } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const LANTERNS = [
  { x: 90, y: 62, r: 26, color: '#e5534b' },
  { x: 260, y: 48, r: 20, color: '#f2a93c' },
  { x: 470, y: 58, r: 24, color: '#e5534b' },
  { x: 700, y: 46, r: 20, color: '#f2c94c' },
  { x: 920, y: 58, r: 24, color: '#e5534b' },
  { x: 1120, y: 50, r: 22, color: '#f2a93c' },
  { x: 1230, y: 66, r: 18, color: '#f2c94c' },
];

const STARS = [
  [60, 130], [150, 100], [330, 120], [520, 90], [640, 130], [820, 100],
  [990, 120], [1180, 110], [210, 150], [760, 150], [1060, 150], [420, 150],
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** One ingredient's little picture: a coloured shape per ingredient. */
export function drawIngredientIcon(ctx, ingredient, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = ingredient.color;
  ctx.strokeStyle = ingredient.dark;
  ctx.lineWidth = 2;
  if (ingredient.shape === 'swirl') {
    for (let ring = 3; ring >= 1; ring -= 1) {
      ctx.beginPath();
      ctx.arc(0, 0, (r * ring) / 3, 0.3, Math.PI * 1.7);
      ctx.stroke();
    }
  } else if (ingredient.shape === 'splash') {
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.35, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingredient.shape === 'egg') {
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a93c';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingredient.shape === 'chilli') {
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.4);
    ctx.quadraticCurveTo(0, -r * 1.3, r * 0.9, -r * 0.5);
    ctx.quadraticCurveTo(r * 0.4, r * 0.5, -r * 0.6, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4caf6d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.7, -r * 0.5);
    ctx.quadraticCurveTo(r * 1.2, -r * 0.9, r * 1.1, -r * 0.2);
    ctx.stroke();
  } else if (ingredient.shape === 'leaf') {
    for (const offset of [-0.45, 0, 0.45]) {
      ctx.save();
      ctx.rotate(offset);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.35, r * 0.28, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (ingredient.shape === 'cube') {
    ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 0.35);
  } else if (ingredient.shape === 'cap') {
    ctx.beginPath();
    ctx.arc(0, r * 0.2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(-r * 0.3, r * 0.1, r * 0.6, r * 0.7);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0.2, Math.PI * 1.6);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSkyAndLanterns(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = 'rgba(255,246,227,0.8)';
  for (const [x, y] of STARS) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(20,16,30,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.quadraticCurveTo(640, 70, 1280, 30);
  ctx.stroke();
  for (const lantern of LANTERNS) {
    const sway = Math.sin(time * 0.8 + lantern.x) * 3;
    ctx.strokeStyle = '#2a2118';
    ctx.beginPath();
    ctx.moveTo(lantern.x, 32);
    ctx.lineTo(lantern.x + sway, lantern.y - lantern.r);
    ctx.stroke();
    ctx.fillStyle = lantern.color;
    ctx.beginPath();
    ctx.ellipse(lantern.x + sway, lantern.y, lantern.r * 0.75, lantern.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(lantern.x + sway - lantern.r * 0.25, lantern.y - lantern.r * 0.35, lantern.r * 0.2, lantern.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(lantern.x + sway - 4, lantern.y - lantern.r - 5, 8, 5);
    ctx.fillRect(lantern.x + sway - 4, lantern.y + lantern.r, 8, 5);
  }
  // Distant stalls and rooftops along the horizon.
  ctx.fillStyle = '#241d33';
  for (const [x, w, h] of [[40, 180, 60], [300, 150, 80], [980, 200, 70], [1180, 100, 55]]) {
    ctx.fillRect(x, 300 - h, w, h);
  }
}

function drawAwning(ctx) {
  for (let index = 0; index < 8; index += 1) {
    ctx.fillStyle = index % 2 === 0 ? PALETTE.awningRed : PALETTE.awningCream;
    const x = index * 160;
    ctx.beginPath();
    ctx.moveTo(x, 168);
    ctx.lineTo(x + 160, 168);
    ctx.lineTo(x + 160, 196);
    ctx.quadraticCurveTo(x + 80, 214, x, 196);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(0, 168, FIELD.width, 6);
}

function drawHearts(ctx, hearts) {
  for (let index = 0; index < 3; index += 1) {
    const x = 1130 + index * 42;
    const y = 36;
    ctx.fillStyle = index < hearts ? PALETTE.heart : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.bezierCurveTo(x - 16, y - 6, x - 8, y - 18, x, y - 6);
    ctx.bezierCurveTo(x + 8, y - 18, x + 16, y - 6, x, y + 10);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(20,16,30,0.55)';
  roundRect(ctx, 16, 14, 500, 56, 14);
  ctx.fill();
  text(ctx, `SCORE ${state.score}`, 32, 42, 24, PALETTE.text, 'left');
  text(ctx, `${state.coins} COINS`, 220, 42, 22, PALETTE.gold, 'left');
  text(ctx, `LEVEL ${state.level}`, 400, 42, 22, PALETTE.text, 'left');
  text(ctx, `Served ${state.served}`, 560, 42, 20, PALETTE.muted, 'left');
  drawHearts(ctx, state.hearts);
}

function drawOrderBoard(ctx, state, time) {
  const board = LAYOUT.board;
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, board.x, board.y, board.w, board.h, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'ORDER BOARD', board.x + 18, board.y + 28, 22, PALETTE.chalk, 'left');
  text(ctx, 'serve the dish before time runs out', board.x + 18, board.y + 52, 14, PALETTE.muted, 'left');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet —', board.x + 18, board.y + 110, 18, PALETTE.muted, 'left');
    text(ctx, 'the night is young.', board.x + 18, board.y + 136, 18, PALETTE.muted, 'left');
    return;
  }
  state.orders.forEach((order, index) => {
    const y = board.y + 76 + index * 88;
    const fraction = Math.max(0, order.remaining / order.total);
    const urgent = fraction < 0.3;
    ctx.fillStyle = urgent && Math.sin(time * 6) > 0 ? '#4a2b2b' : 'rgba(255,255,255,0.07)';
    roundRect(ctx, board.x + 12, y, board.w - 24, 78, 12);
    ctx.fill();
    text(ctx, `#${order.id} ${order.recipe.name}`, board.x + 24, y + 20, 18, PALETTE.chalk, 'left');
    order.recipe.needs.forEach((id, dot) => {
      const ingredient = ingredientById(id);
      ctx.fillStyle = ingredient.color;
      ctx.beginPath();
      ctx.arc(board.x + 30 + dot * 26, y + 48, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    text(ctx, `${Math.ceil(order.remaining)}s`, board.x + board.w - 26, y + 48, 16, urgent ? '#ff8a7a' : PALETTE.chalk, 'right');
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, board.x + 24, y + 62, board.w - 48, 8, 4);
    ctx.fill();
    ctx.fillStyle = fraction > 0.5 ? PALETTE.timerGood : fraction > 0.25 ? PALETTE.timerWarn : PALETTE.timerBad;
    roundRect(ctx, board.x + 24, y + 62, (board.w - 48) * fraction, 8, 4);
    ctx.fill();
  });
}

function drawPlate(ctx, state, time) {
  const plate = LAYOUT.plate;
  const shakeX = state.shake > 0 ? Math.sin(time * 40) * 6 * state.shake : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  // Wooden counter under the plate.
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, plate.x - 40, plate.y + 130, plate.w + 80, 46, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(plate.x - 40, plate.y + 130, plate.w + 80, 6);
  text(ctx, 'YOUR PLATE', plate.x, plate.y - 14, 18, PALETTE.muted, 'left');
  // The big serving bowl.
  ctx.fillStyle = PALETTE.bowl;
  ctx.beginPath();
  ctx.ellipse(plate.x + plate.w / 2, plate.y + 78, 132, 62, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6e7c8';
  ctx.beginPath();
  ctx.ellipse(plate.x + plate.w / 2, plate.y + 78, 132, 62, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8d9b0';
  ctx.beginPath();
  ctx.ellipse(plate.x + plate.w / 2, plate.y + 76, 112, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.plate.length === 0) {
    text(ctx, 'empty — add ingredients below', plate.x + plate.w / 2, plate.y + 76, 15, '#8a7a5c', 'center', 600);
  } else {
    const count = state.plate.length;
    state.plate.forEach((id, index) => {
      const ingredient = ingredientById(id);
      const x = plate.x + plate.w / 2 + (index - (count - 1) / 2) * 44;
      const y = plate.y + 62 + (index % 2) * 22;
      drawIngredientIcon(ctx, ingredient, x, y, 17);
    });
    const names = state.plate.map((id) => ingredientById(id).name).join(' + ');
    text(ctx, names, plate.x + plate.w / 2, plate.y + 158, 14, PALETTE.text, 'center', 600);
  }
  // Steam while the dish is fresh.
  if (state.steam > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * state.steam})`;
    ctx.lineWidth = 3;
    for (const offset of [-30, 0, 30]) {
      ctx.beginPath();
      ctx.moveTo(plate.x + plate.w / 2 + offset, plate.y + 10);
      ctx.quadraticCurveTo(plate.x + plate.w / 2 + offset + 8, plate.y - 12, plate.x + plate.w / 2 + offset - 4, plate.y - 30);
      ctx.stroke();
    }
  }
  ctx.restore();
  // Serve and trash buttons.
  const serve = LAYOUT.serveButton;
  const ready = state.plate.length > 0;
  ctx.fillStyle = ready ? PALETTE.serve : '#3a4a3a';
  roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 14);
  ctx.fill();
  text(ctx, 'SERVE', serve.x + serve.w / 2, serve.y + 24, 24, '#ffffff', 'center');
  text(ctx, '(Space)', serve.x + serve.w / 2, serve.y + 48, 14, 'rgba(255,255,255,0.8)', 'center', 600);
  const trash = LAYOUT.trashButton;
  ctx.fillStyle = PALETTE.trash;
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 10);
  ctx.fill();
  text(ctx, 'Trash last  (Bksp)', trash.x + trash.w / 2, trash.y + 22, 15, '#ffffff', 'center', 600);
  if (state.lastServed) {
    text(ctx, `Last served: ${state.lastServed.name}  +${state.lastServed.coins} coins (tip ${state.lastServed.tip})`, 560, 500, 16, PALETTE.gold, 'left', 600);
  }
}

function drawBins(ctx) {
  text(ctx, 'COUNTER — click a bin or press its number key', 24, 540, 18, PALETTE.text, 'left');
  INGREDIENTS.forEach((ingredient, index) => {
    const rect = binRect(index);
    ctx.fillStyle = '#f6e7c8';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
    ctx.fill();
    ctx.fillStyle = ingredient.color;
    roundRect(ctx, rect.x + 8, rect.y + 8, rect.w - 16, 52, 10);
    ctx.fill();
    drawIngredientIcon(ctx, ingredient, rect.x + rect.w / 2, rect.y + 34, 20);
    ctx.fillStyle = '#5d3d22';
    ctx.font = `700 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ingredient.key, rect.x + 16, rect.y + 18);
    text(ctx, ingredient.name, rect.x + rect.w / 2, rect.y + 78, 17, '#3a2b1c', 'center');
    text(ctx, 'click / ' + ingredient.key, rect.x + rect.w / 2, rect.y + 100, 12, '#8a7a5c', 'center', 600);
  });
}

function drawFloats(ctx, state) {
  for (const float of state.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, float.life));
    text(ctx, float.text, float.x, float.y - (1.4 - float.life) * 40, 26, PALETTE.gold, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state, best, time) {
  ctx.fillStyle = 'rgba(16,12,28,0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const bob = Math.sin(time * 1.4) * 6;
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.ellipse(640, 190 + bob, 70, 84, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(622, 158 + bob, 16, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c94c';
  ctx.font = `800 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(' noodle ', 640, 196 + bob);
  text(ctx, 'LANTERN NOODLE STALL', 640, 300, 58, PALETTE.text, 'center', 800);
  text(ctx, 'A cozy night-market noodle stall. Cook fast, serve true, keep your hearts.', 640, 348, 22, PALETTE.muted, 'center', 600);
  text(ctx, 'Click bins or press 1–8 to add ingredients  •  Space to serve  •  Backspace to trash', 640, 386, 18, PALETTE.chalk, 'center', 600);
  text(ctx, 'Match the order on the board. A fast serve earns a bigger tip. Three lost orders end the night.', 640, 414, 18, PALETTE.chalk, 'center', 600);
  const button = LAYOUT.startButton;
  ctx.fillStyle = PALETTE.serve;
  roundRect(ctx, button.x, button.y, button.w, button.h, 16);
  ctx.fill();
  text(ctx, 'START COOKING', button.x + button.w / 2, button.y + 36, 28, '#ffffff', 'center');
  if (best > 0) text(ctx, `Best score: ${best}`, 640, 580, 20, PALETTE.gold, 'center', 600);
  text(ctx, 'An original game — no copied characters, art or music.', 640, 706, 14, PALETTE.muted, 'center', 600);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(16,12,28,0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'PAUSED', 640, 320, 56, PALETTE.text, 'center', 800);
  text(ctx, 'Press P or Space to keep cooking', 640, 380, 22, PALETTE.muted, 'center', 600);
}

function drawGameOver(ctx, state, best) {
  ctx.fillStyle = 'rgba(16,12,28,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, 340, 150, 600, 400, 20);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'THE STALL CLOSES', 640, 210, 40, PALETTE.text, 'center', 800);
  text(ctx, 'Three customers walked away hungry.', 640, 256, 20, PALETTE.muted, 'center', 600);
  text(ctx, `Final score: ${state.score}`, 640, 330, 30, PALETTE.gold, 'center');
  text(ctx, `Coins earned: ${state.coins}    Dishes served: ${state.served}    Level reached: ${state.level}`, 640, 380, 20, PALETTE.chalk, 'center', 600);
  if (best > 0) text(ctx, `Best score: ${best}`, 640, 420, 20, PALETTE.gold, 'center', 600);
  const button = LAYOUT.restartButton;
  ctx.fillStyle = PALETTE.serve;
  roundRect(ctx, button.x, button.y, button.w, button.h, 16);
  ctx.fill();
  text(ctx, 'COOK AGAIN', button.x + button.w / 2, button.y + 36, 26, '#ffffff', 'center');
}

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');

  return {
    /** Paint the whole scene for `screen` at animation time `time`. */
    draw(state, screen, best, time) {
      drawSkyAndLanterns(ctx, time);
      drawAwning(ctx);
      drawHud(ctx, state);
      drawOrderBoard(ctx, state, time);
      drawPlate(ctx, state, time);
      drawBins(ctx);
      drawFloats(ctx, state);
      if (screen === SCREEN_TITLE) drawTitle(ctx, state, best, time);
      else if (screen === SCREEN_PAUSED) drawPaused(ctx);
      else if (screen === SCREEN_OVER) drawGameOver(ctx, state, best);
    },
  };
}
