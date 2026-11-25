// Midnight Sizzle rendering: every pixel is drawn with canvas shapes, no
// images, no fonts from the network. Warm diner-at-night palette, big HUD
// text that stays readable when a screenshot is shrunk.
import { FIELD, INGREDIENTS, STATIONS, recipeById, starsFor } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, plateIsComplete } from './world.js';

const NIGHT = '#241a2e';
const WALL = '#3a2b4a';
const FLOOR = '#7a5230';
const FLOOR_DARK = '#6b4527';
const CREAM = '#f2d8a7';
const INK = '#241a2e';
const ORANGE = '#ff8c42';
const RED = '#e63946';
const GREEN = '#7bc043';
const GOLD = '#ffd166';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, fraction, fill, back) {
  ctx.fillStyle = back || '#00000055';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (fraction > 0) {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, Math.max(h, w * Math.min(1, fraction)), h, h / 2);
    ctx.fill();
  }
}

// One ingredient, drawn small enough to sit on a plate or over the chef's
// head, but with a shape that reads at a glance.
export function drawIngredient(ctx, id, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#e8a54b';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.55, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f7c873'; ctx.fillRect(-s * 0.55, -s * 0.08, s * 1.1, s * 0.16);
    ctx.fillStyle = '#fff3d6';
    for (const dx of [-0.25, 0, 0.25]) { ctx.beginPath(); ctx.arc(dx * s, -s * 0.32, s * 0.05, 0, Math.PI * 2); ctx.fill(); }
  } else if (id === 'patty' || id === 'pattyRaw') {
    ctx.fillStyle = id === 'patty' ? '#7c3a26' : '#a14d3a';
    roundRect(ctx, -s * 0.6, -s * 0.22, s * 1.2, s * 0.44, s * 0.2); ctx.fill();
    ctx.fillStyle = '#00000033';
    for (const dx of [-0.3, 0.1, 0.35]) { ctx.beginPath(); ctx.arc(dx * s, 0, s * 0.06, 0, Math.PI * 2); ctx.fill(); }
  } else if (id === 'lettuce' || id === 'lettuceChopped') {
    ctx.fillStyle = id === 'lettuce' ? '#5da32e' : '#8fd14f';
    ctx.beginPath();
    for (let i = 0; i <= 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const r = s * (0.5 + (i % 2) * 0.14);
      const px = Math.cos(a) * r; const py = Math.sin(a) * r * 0.7;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a7d24'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, s * 0.3); ctx.stroke();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fdf3d0';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath(); ctx.arc(s * 0.08, 0, s * 0.24, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'rice') {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.55, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    for (const [dx, dy] of [[-0.25, -0.15], [0.05, -0.3], [0.3, -0.1]]) {
      ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'chicken' || id === 'chickenRaw') {
    ctx.fillStyle = id === 'chicken' ? '#d97b29' : '#f2b8a0';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.4, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = id === 'chicken' ? '#b45a12' : '#e08a6d';
    for (const [dx, dy] of [[-0.25, -0.1], [0.1, 0.12], [0.3, -0.15]]) {
      ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.1, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'tomato' || id === 'tomatoChopped') {
    ctx.fillStyle = id === 'tomato' ? '#e63946' : '#f2545b';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a7d24';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(-s * 0.18, -s * 0.72); ctx.lineTo(s * 0.18, -s * 0.72); ctx.closePath(); ctx.fill();
  } else if (id === 'noodle' || id === 'noodleRaw') {
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const yy = (i - 1) * s * 0.28;
      ctx.moveTo(-s * 0.5, yy);
      ctx.quadraticCurveTo(-s * 0.2, yy - s * 0.22, 0, yy);
      ctx.quadraticCurveTo(s * 0.2, yy + s * 0.22, s * 0.5, yy);
    }
    ctx.stroke();
    if (id === 'noodle') {
      ctx.fillStyle = '#ffb703';
      ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.35, s * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3);
    ctx.moveTo(s * 0.3, -s * 0.3); ctx.lineTo(-s * 0.3, s * 0.3); ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, size) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y, size, size * 0.72, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, size * 0.8, size * 0.56, 0, 0, Math.PI * 2); ctx.stroke();
  items.forEach((item, i) => {
    const angle = (i / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2;
    drawIngredient(ctx, item, x + Math.cos(angle) * size * 0.32, y + Math.sin(angle) * size * 0.2, size * 0.5);
  });
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = recipeById(order.recipeId);
  const fraction = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = recipe.color;
  roundRect(ctx, x, y, w, 26, 10); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, x, y + 18, w, 8, 0); ctx.fill();
  text(ctx, recipe.name, x + 10, y + 13, 15, '#ffffff', 'left');
  recipe.parts.forEach((part, i) => {
    drawIngredient(ctx, part, x + 24 + i * 52, y + 48, 26);
  });
  text(ctx, recipe.parts.map((part) => INGREDIENTS[part].short).join(' + '), x + 10, y + 72, 11, '#5b4a35', 'left');
  const barColor = fraction > 0.5 ? GREEN : fraction > 0.25 ? '#ffb703' : RED;
  bar(ctx, x + 10, y + h - 12, w - 20, 7, fraction, barColor);
}

function drawOrderBoard(ctx, world) {
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, FIELD.width, 108);
  // HUD: score, coins, hearts, combo, day timer.
  text(ctx, `SKOR ${world.score}`, 16, 22, 22, GOLD, 'left');
  text(ctx, `KOIN ${world.coins}`, 16, 48, 16, CREAM, 'left');
  let hearts = '';
  for (let i = 0; i < 3; i += 1) hearts += i < world.hearts ? '♥ ' : '♡ ';
  text(ctx, hearts, 16, 76, 20, RED, 'left');
  const minutes = Math.floor(world.timeLeft / 60);
  const seconds = Math.floor(world.timeLeft % 60);
  const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  text(ctx, timeText, 150, 22, 24, world.timeLeft < 30 ? RED : '#ffffff', 'left');
  text(ctx, world.rushLevel > 0 ? `RUSH x${world.rushLevel + 1}` : 'SHIFT MALAM', 150, 48, 13, ORANGE, 'left');
  text(ctx, world.combo > 1 ? `COMBO x${world.combo}` : '', 150, 76, 16, '#ffd166', 'left');
  // Tickets, up to three, right of the HUD.
  for (let i = 0; i < 3; i += 1) {
    const x = 268 + i * 232;
    const order = world.orders[i];
    if (order) {
      drawOrderTicket(ctx, order, x, 8, 222, 92);
    } else {
      ctx.fillStyle = '#ffffff14';
      roundRect(ctx, x, 8, 222, 92, 10); ctx.fill();
      ctx.strokeStyle = '#ffffff33'; ctx.setLineDash([6, 6]);
      roundRect(ctx, x, 8, 222, 92, 10); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, 'menunggu order...', x + 111, 54, 14, '#ffffff88', 'center');
    }
  }
}

function drawStation(ctx, world, station) {
  const { x, y, w, h } = station;
  ctx.fillStyle = station.color;
  roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = '#00000022';
  roundRect(ctx, x, y + h - 26, w, 26, 10); ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y + h - 26, w, 8, 0); ctx.fill();
  text(ctx, station.name, x + w / 2, y + h - 13, 13, '#ffffff', 'center');

  const cx = x + w / 2;
  const cy = y + h / 2 - 10;
  if (station.id === 'fridge') {
    ctx.fillStyle = '#dfe9f5';
    roundRect(ctx, cx - 34, cy - 24, 68, 48, 6); ctx.fill();
    ctx.strokeStyle = '#7a9cc0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24); ctx.stroke();
    drawIngredient(ctx, 'lettuce', cx - 17, cy, 18);
    drawIngredient(ctx, 'egg', cx + 17, cy, 18);
  } else if (station.kind === 'cooker') {
    const slots = world.cookers[station.cooker];
    ctx.fillStyle = '#2e2e3a';
    roundRect(ctx, cx - 44, cy - 20, 88, 40, 8); ctx.fill();
    ctx.fillStyle = '#ff6b35';
    for (const gx of [-24, 0, 24]) {
      ctx.beginPath(); ctx.moveTo(cx + gx - 8, cy + 16); ctx.lineTo(cx + gx, cy - 4); ctx.lineTo(cx + gx + 8, cy + 16); ctx.closePath(); ctx.fill();
    }
    slots.forEach((slot, i) => {
      const sx = cx + (i === 0 ? -26 : 26);
      if (slot.burnt) {
        drawIngredient(ctx, 'burnt', sx, cy - 6, 22);
        text(ctx, 'GOSONG', sx, cy + 30, 10, RED, 'center');
      } else {
        drawIngredient(ctx, slot.item, sx, cy - 6, 22);
        const fraction = slot.progress / slot.cookTime;
        bar(ctx, sx - 20, cy + 18, 40, 6, Math.min(1, fraction), slot.done ? GREEN : '#ffb703');
        if (slot.done) text(ctx, 'MATANG!', sx, cy - 30, 10, GREEN, 'center');
      }
    });
  } else if (station.id === 'pantry') {
    drawIngredient(ctx, 'bun', cx - 28, cy, 20);
    drawIngredient(ctx, 'rice', cx, cy, 20);
    drawIngredient(ctx, 'tomato', cx + 28, cy, 20);
  } else if (station.id === 'board') {
    ctx.fillStyle = '#b07a45';
    roundRect(ctx, cx - 56, cy - 26, 112, 52, 8); ctx.fill();
    if (world.board) {
      drawIngredient(ctx, world.board.item, cx, cy - 4, 26);
      bar(ctx, cx - 40, cy + 24, 80, 7, world.board.progress / 1.5, ORANGE);
      text(ctx, 'TAHAN E...', cx, cy - 34, 11, '#ffffff', 'center');
    } else {
      text(ctx, 'potong di sini', cx, cy, 12, '#ffffffaa', 'center');
    }
  } else if (station.id === 'assembly') {
    if (world.tablePlate) {
      drawPlate(ctx, world.tablePlate.items, cx, cy, 34);
      if (plateIsComplete(world.tablePlate)) {
        text(ctx, 'LENGKAP!', cx, cy - 40, 13, GREEN, 'center');
      }
    } else {
      ctx.strokeStyle = '#ffffff88'; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.ellipse(cx, cy, 34, 24, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, 'rakit piring di sini', cx, cy, 12, '#ffffffaa', 'center');
    }
  } else if (station.id === 'window') {
    ctx.fillStyle = '#ffe9b8';
    roundRect(ctx, cx - 48, cy - 26, 96, 52, 8); ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(cx, cy - 8, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(cx - 12, cy + 4, 24, 4);
    text(ctx, 'ANTAR', cx, cy + 20, 11, '#8a6d3b', 'center');
  } else if (station.id === 'trash') {
    ctx.fillStyle = '#33333d';
    roundRect(ctx, cx - 26, cy - 22, 52, 44, 6); ctx.fill();
    ctx.fillStyle = '#55555f';
    ctx.fillRect(cx - 30, cy - 28, 60, 8);
    text(ctx, 'BUANG', cx, cy + 8, 11, '#ffffffaa', 'center');
  }
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(world.time * 14) * 2 : Math.sin(world.time * 3) * 1;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = '#00000044';
  ctx.beginPath(); ctx.ellipse(0, 18, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white chef coat.
  ctx.fillStyle = '#f8f4ec';
  roundRect(ctx, -16, -6, 32, 26, 10); ctx.fill();
  ctx.fillStyle = RED;
  ctx.fillRect(-16, 6, 32, 4);
  // Head and toque.
  ctx.fillStyle = '#ffcf9e';
  ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-7, -28, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -31, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -28, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -30, 22, 8);
  // Eyes look the way the chef walks.
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(-4 + chef.dir * 2, -17, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 + chef.dir * 2, -17, 1.8, 0, Math.PI * 2); ctx.fill();
  // Carried item or plate floats over the toque.
  const carrying = chef.carrying;
  if (carrying) {
    if (carrying.kind === 'plate') {
      drawPlate(ctx, carrying.items, 0, -52, 22);
    } else {
      drawIngredient(ctx, carrying.id, 0, -50, 22);
    }
  }
  ctx.restore();
}

function drawTitle(ctx, world) {
  ctx.fillStyle = '#241a2ecc';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'MIDNIGHT SIZZLE', FIELD.width / 2, 180, 56, GOLD, 'center');
  text(ctx, 'dapur kecil di jam malam', FIELD.width / 2, 222, 20, CREAM, 'center');
  text(ctx, 'Sajikan 3 resep sebelum pelanggan kehabisan sabar.', FIELD.width / 2, 268, 17, '#ffffff', 'center');
  text(ctx, 'Burger Klasik  •  Nasi Ayam Krispi  •  Mie Kuah', FIELD.width / 2, 296, 17, ORANGE, 'center');
  text(ctx, 'WASD / panah: jalan    E: ambil, masak, potong, rakit    Spasi: sajikan', FIELD.width / 2, 340, 16, '#ffffff', 'center');
  text(ctx, 'Klik juga bisa: klik stasiun untuk jalan ke sana.  R: ulang  •  M: bisu', FIELD.width / 2, 366, 15, CREAM, 'center');
  const pulse = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan tombol apa saja untuk mulai masak', FIELD.width / 2, 420, 20, GOLD, 'center');
  ctx.globalAlpha = 1;
}

function drawEnd(ctx, world) {
  ctx.fillStyle = '#241a2ef2';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const stars = starsFor(world.served);
  text(ctx, world.hearts <= 0 ? 'DAPUR TUTUP!' : 'SHIFT SELESAI!', FIELD.width / 2, 130, 44, GOLD, 'center');
  text(ctx, world.hearts <= 0 ? 'Semua hati habis, pelanggan pergi.' : 'Jam malam berakhir, kompor dimatikan.', FIELD.width / 2, 170, 17, CREAM, 'center');
  let starText = '';
  for (let i = 0; i < 3; i += 1) starText += i < stars ? '★' : '☆';
  text(ctx, starText, FIELD.width / 2, 220, 44, GOLD, 'center');
  text(ctx, `SKOR  ${world.score}`, FIELD.width / 2, 290, 30, '#ffffff', 'center');
  text(ctx, `Koin ${world.coins}    •    Order tersaji ${world.served}    •    Gagal ${world.failed}`, FIELD.width / 2, 330, 18, CREAM, 'center');
  text(ctx, `Combo terbaik dicapai lewat sajian beruntun tepat waktu.`, FIELD.width / 2, 360, 15, '#ffffffaa', 'center');
  const pulse = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Tekan R untuk masak lagi', FIELD.width / 2, 420, 20, GOLD, 'center');
  ctx.globalAlpha = 1;
}

export function render(ctx, world) {
  // Night diner shell.
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Floor tiles.
  for (let y = 108; y < FIELD.height; y += 48) {
    for (let x = 0; x < FIELD.width; x += 48) {
      ctx.fillStyle = ((x + y) / 48) % 2 === 0 ? FLOOR : FLOOR_DARK;
      ctx.fillRect(x, y, 48, 48);
    }
  }
  // Warm window glow on the back wall.
  ctx.fillStyle = '#ffd16633';
  ctx.fillRect(720, 112, 220, 8);
  ctx.fillStyle = '#ffb70322';
  ctx.fillRect(20, 112, 220, 8);

  drawOrderBoard(ctx, world);
  for (const station of STATIONS) drawStation(ctx, world, station);
  drawChef(ctx, world);

  // Context hint bar at the bottom.
  if (world.screen === SCREEN_PLAY) {
    ctx.fillStyle = '#241a2ecc';
    roundRect(ctx, 16, FIELD.height - 40, FIELD.width - 32, 28, 8); ctx.fill();
    text(ctx, world.hint || 'WASD jalan, E interaksi, Spasi sajikan', FIELD.width / 2, FIELD.height - 26, 15, CREAM, 'center');
  }
  // Flash message above the hint bar.
  if (world.message) {
    ctx.fillStyle = '#241a2ecc';
    const width = Math.min(560, ctx.measureText(world.message).width + 32);
    roundRect(ctx, (FIELD.width - width) / 2, FIELD.height - 76, width, 28, 8); ctx.fill();
    text(ctx, world.message, FIELD.width / 2, FIELD.height - 62, 15, GOLD, 'center');
  }

  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_OVER) drawEnd(ctx, world);
}
