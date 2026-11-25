// Midnight Sizzle world: the chef, the stations, the tickets, the plates,
// the timers, the score. Pure state plus one step function; rendering and
// sound live elsewhere, so a screenshot scene can drive this directly.
import {
  CHEF_RADIUS,
  CHEF_SPEED,
  CHOP_RESULT,
  CHOP_TIME,
  COOKERS,
  DAY_LENGTH,
  FIELD,
  FIRST_ORDER_DELAY,
  INGREDIENTS,
  MAX_HEARTS,
  MAX_ORDERS,
  ORDER_PATIENCE,
  RUSH_EVERY,
  SCORE_BASE,
  SPAWN_BASE,
  SPAWN_MIN,
  SPAWN_STEP,
  STATIONS,
  COMBO_BONUS,
  COIN_BASE,
  TIP_MAX,
  recipeById,
  stationById,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

// Small deterministic RNG so a seed always replays the same tickets.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let orderCounter = 0;

export function createWorld(seed) {
  const world = {
    seed: seed || 1,
    rng: mulberry32(seed || 1),
    screen: SCREEN_TITLE,
    time: 0, // seconds since the shift started
    timeLeft: DAY_LENGTH,
    hearts: MAX_HEARTS,
    score: 0,
    coins: 0,
    combo: 0,
    served: 0,
    failed: 0,
    orders: [],
    spawnTimer: FIRST_ORDER_DELAY,
    rushLevel: 0,
    chef: { x: FIELD.width / 2, y: 480, dir: 1, moving: false, carrying: null },
    // One cooking slot list per cooker id: { item, progress, done, burnt }.
    cookers: { grill: [], fryer: [], pot: [] },
    // Cutting board: { item, progress } or null.
    board: null,
    // Plate waiting on the assembly table: { items: [] } or null.
    tablePlate: null,
    hint: '',
    message: '',
    messageTime: 0,
    chopHeld: 0,
    muted: false,
    sizzle: false, // true while anything is cooking (for the sound loop)
    events: [], // one-frame sound cues the loop drains: 'chop','ding','serve','fail','burn','pickup','place','click'
  };
  return world;
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  fresh.muted = world.muted;
  Object.keys(fresh).forEach((key) => { world[key] = fresh[key]; });
  world.rng = mulberry32(world.seed);
}

function stationCentre(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function nearestStation(world, maxDistance) {
  const chef = world.chef;
  let best = null;
  let bestDistance = maxDistance;
  for (const station of STATIONS) {
    const centre = stationCentre(station);
    const dx = Math.max(Math.abs(chef.x - centre.x) - station.w / 2, 0);
    const dy = Math.max(Math.abs(chef.y - centre.y) - station.h / 2, 0);
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return best;
}

export function spawnOrder(world, recipeId) {
  if (world.orders.length >= MAX_ORDERS) return null;
  const id = recipeId || ['burger', 'nasiayam', 'miekuah'][Math.floor(world.rng() * 3)];
  const order = {
    id: ++orderCounter,
    recipeId: id,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  };
  world.orders.push(order);
  return order;
}

function spawnInterval(world) {
  return Math.max(SPAWN_MIN, SPAWN_BASE - world.rushLevel * SPAWN_STEP);
}

function carriedPlate(world) {
  const carrying = world.chef.carrying;
  return carrying && carrying.kind === 'plate' ? carrying : null;
}

function carriedItem(world) {
  const carrying = world.chef.carrying;
  return carrying && carrying.kind === 'item' ? carrying.id : null;
}

function plateRecipeId(plate) {
  if (!plate || plate.items.length !== 3) return null;
  for (const id of ['burger', 'nasiayam', 'miekuah']) {
    const wanted = recipeById(id).parts;
    if (wanted.every((part) => plate.items.includes(part))) return id;
  }
  return null;
}

export function plateIsComplete(plate) {
  return plateRecipeId(plate) !== null;
}

function flash(world, text, seconds) {
  world.message = text;
  world.messageTime = seconds || 2;
}

function takeCooked(world, cookerId) {
  const slots = world.cookers[cookerId];
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (slot.done) {
      slots.splice(i, 1);
      world.chef.carrying = { kind: 'item', id: slot.burnt ? 'burnt' : slot.item };
      world.events.push('pickup');
      flash(world, slot.burnt ? 'Gosong! Buang ke tempat sampah.' : `${INGREDIENTS[slot.item].name} siap!`, 1.6);
      return true;
    }
  }
  return false;
}

// The context hint shown under the chef: what E does right here, right now.
export function contextHint(world) {
  const station = nearestStation(world, 78);
  const item = carriedItem(world);
  const plate = carriedPlate(world);
  if (!station) return 'WASD jalan, E interaksi, Spasi sajikan';
  if (station.kind === 'pickup') {
    if (item || plate) return 'Tangan penuh';
    return `E: ambil ${station.gives.map((g) => INGREDIENTS[g].short).join(' / ')}`;
  }
  if (station.kind === 'cooker') {
    const cooker = COOKERS[station.cooker];
    if (item === cooker.raw) return `E: masak ${INGREDIENTS[item].short} (${cooker.cookTime} dtk)`;
    if (item) return 'Bahan ini tidak dimasak di sini';
    if (world.cookers[station.cooker].some((slot) => slot.done)) return 'E: ambil hasil masakan';
    if (world.cookers[station.cooker].length > 0) return 'Sedang dimasak...';
    return `E: ambil ${INGREDIENTS[cooker.raw].short}`;
  }
  if (station.kind === 'board') {
    if (world.board) return 'Tahan E: potong 1,5 dtk';
    if (item && CHOP_RESULT[item]) return 'E: taruh di talenan';
    if (item) return 'Bahan ini tidak dipotong';
    return 'Talenan: potong selada / tomat';
  }
  if (station.kind === 'assembly') {
    if (item && ['ready', 'cooked'].includes(INGREDIENTS[item].prep)) return 'E: taruh di piring';
    if (item) return 'Masak / potong dulu bahan ini';
    if (world.tablePlate) return plateIsComplete(world.tablePlate) ? 'E: angkat piring lengkap' : 'E: angkat piring';
    if (plate) return 'E: letakkan piring';
    return 'Meja racik: rakit 3 bahan jadi hidangan';
  }
  if (station.kind === 'window') {
    if (plate && plateIsComplete(plate)) return 'Spasi: sajikan!';
    if (plate) return 'Piring belum lengkap';
    return 'Jendela saji: antar piring lengkap';
  }
  if (station.kind === 'trash') {
    if (item || plate) return 'E: buang';
    return 'Tempat sampah';
  }
  return '';
}

function pickupCycle(world, station) {
  // Cycle through the station's ingredients on repeated presses.
  const gives = station.gives;
  const last = world.chef.lastPickup && world.chef.lastPickup[station.id];
  const next = last === undefined ? 0 : (last + 1) % gives.length;
  world.chef.lastPickup = world.chef.lastPickup || {};
  world.chef.lastPickup[station.id] = next;
  const id = gives[next];
  world.chef.carrying = { kind: 'item', id };
  world.events.push('pickup');
  flash(world, `Ambil ${INGREDIENTS[id].name}. Tekan E lagi untuk ${INGREDIENTS[gives[(next + 1) % gives.length]].name}.`, 1.6);
}

// One E press at the nearest station.
export function interact(world) {
  const station = nearestStation(world, 78);
  if (!station) return;
  const item = carriedItem(world);
  const plate = carriedPlate(world);

  if (station.kind === 'pickup') {
    // Carrying this station's own ingredient cycles to the next one, so the
    // second item on a shelf is reachable without emptying the hand first.
    if (item && station.gives.includes(item)) { pickupCycle(world, station); return; }
    if (item || plate) { flash(world, 'Tangan sudah penuh!', 1.2); return; }
    pickupCycle(world, station);
    return;
  }

  if (station.kind === 'cooker') {
    const cooker = COOKERS[station.cooker];
    const slots = world.cookers[station.cooker];
    if (item === cooker.raw) {
      if (slots.length >= 2) { flash(world, 'Panggangan penuh (maks 2)!', 1.4); return; }
      slots.push({ item: cooker.cooked, progress: 0, done: false, burnt: false, cookTime: cooker.cookTime, burnTime: cooker.burnTime });
      world.chef.carrying = null;
      world.events.push('place');
      flash(world, `Memasak ${INGREDIENTS[cooker.cooked].name}...`, 1.4);
      return;
    }
    if (item) { flash(world, 'Bahan ini tidak dimasak di sini.', 1.4); return; }
    if (plate) { flash(world, 'Letakkan piring dulu di meja racik.', 1.4); return; }
    if (takeCooked(world, station.cooker)) return;
    if (slots.length === 0) pickupCycle(world, station);
    return;
  }

  if (station.kind === 'board') {
    if (world.board) return; // chopping is hold-to-chop, handled in step()
    if (item && CHOP_RESULT[item]) {
      world.board = { item, progress: 0 };
      world.chef.carrying = null;
      world.events.push('place');
      flash(world, 'Tahan E untuk memotong...', 1.6);
      return;
    }
    if (item) { flash(world, 'Bahan ini tidak perlu dipotong.', 1.4); return; }
    flash(world, 'Bawa selada atau tomat ke talenan.', 1.4);
    return;
  }

  if (station.kind === 'assembly') {
    if (plate) {
      world.tablePlate = plate;
      world.chef.carrying = null;
      world.events.push('place');
      return;
    }
    if (item) {
      if (!['ready', 'cooked'].includes(INGREDIENTS[item].prep)) { flash(world, 'Masak atau potong dulu bahan ini!', 1.6); return; }
      if (!world.tablePlate) world.tablePlate = { items: [] };
      if (world.tablePlate.items.includes(item)) { flash(world, 'Bahan itu sudah di piring.', 1.4); return; }
      if (world.tablePlate.items.length >= 3) { flash(world, 'Piring sudah penuh 3 bahan.', 1.4); return; }
      world.tablePlate.items.push(item);
      world.chef.carrying = null;
      world.events.push('place');
      if (plateIsComplete(world.tablePlate)) {
        flash(world, `${recipeById(plateRecipeId(world.tablePlate)).name} lengkap! Angkat dan sajikan.`, 2);
        world.events.push('ding');
      }
      return;
    }
    if (world.tablePlate) {
      world.chef.carrying = { kind: 'plate', items: world.tablePlate.items.slice() };
      world.tablePlate = null;
      world.events.push('pickup');
    }
    return;
  }

  if (station.kind === 'window') {
    serveDish(world);
    return;
  }

  if (station.kind === 'trash') {
    if (item || plate) {
      world.chef.carrying = null;
      world.events.push('trash');
      flash(world, 'Dibuang.', 1.2);
      if (plate) world.combo = 0;
    }
    return;
  }
}

export function serveDish(world) {
  const plate = carriedPlate(world);
  if (!plate) { flash(world, 'Bawa piring lengkap dulu!', 1.4); return false; }
  const recipeId = plateRecipeId(plate);
  if (!recipeId) { flash(world, 'Piring belum lengkap (butuh 3 bahan).', 1.6); return false; }
  const orderIndex = world.orders.findIndex((order) => order.recipeId === recipeId);
  if (orderIndex === -1) {
    flash(world, 'Tidak ada order untuk hidangan ini!', 1.8);
    world.combo = 0;
    return false;
  }
  const order = world.orders[orderIndex];
  world.orders.splice(orderIndex, 1);
  const left = order.patience / order.maxPatience;
  const tip = Math.round(TIP_MAX * left);
  const comboBonus = Math.round((SCORE_BASE + tip) * (world.combo * COMBO_BONUS) / 100);
  const gained = SCORE_BASE + tip + comboBonus;
  world.score += gained;
  world.coins += COIN_BASE + Math.round(tip / 2);
  world.combo += 1;
  world.served += 1;
  world.chef.carrying = null;
  world.events.push('serve');
  flash(world, `Tersaji! +${gained} poin (tip +${tip})`, 2.2);
  return true;
}

function failOrder(world, order) {
  world.orders.splice(world.orders.indexOf(order), 1);
  world.hearts -= 1;
  world.failed += 1;
  world.combo = 0;
  world.events.push('fail');
  flash(world, 'Order gagal! Pelanggan pergi. -1 hati', 2.2);
  if (world.hearts <= 0) {
    world.screen = SCREEN_OVER;
    world.events.push('over');
  }
}

function stepCookers(world, dt) {
  world.sizzle = false;
  for (const id of Object.keys(world.cookers)) {
    for (const slot of world.cookers[id]) {
      if (slot.burnt) continue;
      slot.progress += dt;
      world.sizzle = true;
      if (!slot.done && slot.progress >= slot.cookTime) {
        slot.done = true;
        world.events.push('ding');
        flash(world, `${INGREDIENTS[slot.item].name} matang! Ambil sebelum gosong.`, 1.8);
      } else if (slot.done && slot.progress >= slot.cookTime + slot.burnTime) {
        slot.burnt = true;
        world.events.push('burn');
        flash(world, 'Gosong! Buang ke tempat sampah.', 2);
      }
    }
  }
}

function stepChopping(world, input, dt) {
  if (!world.board) return;
  const station = stationById('board');
  const centre = stationCentre(station);
  const near = Math.hypot(world.chef.x - centre.x, world.chef.y - centre.y) < 120;
  if (input.interactHeld && near) {
    world.board.progress += dt;
    if (world.board.progress >= CHOP_TIME) {
      const done = CHOP_RESULT[world.board.item];
      world.chef.carrying = { kind: 'item', id: done };
      world.board = null;
      world.events.push('chop');
      flash(world, `${INGREDIENTS[done].name} siap!`, 1.6);
    }
  }
}

export function step(world, dt, input) {
  if (world.screen !== SCREEN_PLAY) return;
  world.time += dt;
  world.timeLeft = Math.max(0, DAY_LENGTH - world.time);
  world.rushLevel = Math.floor(world.time / RUSH_EVERY);

  // Day over: the shift ends, whatever the hearts say.
  if (world.timeLeft <= 0) {
    world.screen = SCREEN_OVER;
    world.events.push('over');
    return;
  }

  // Tickets arrive faster as the rush builds.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    world.spawnTimer = spawnInterval(world);
  }

  // Patience drains; a ticket that runs out costs a heart.
  for (const order of world.orders.slice()) {
    order.patience -= dt;
    if (order.patience <= 0) failOrder(world, order);
    if (world.screen !== SCREEN_PLAY) return;
  }

  // Chef movement: keyboard, or walk toward a mouse click target.
  const chef = world.chef;
  let mx = 0;
  let my = 0;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (mx === 0 && my === 0 && input.clickTarget) {
    const dx = input.clickTarget.x - chef.x;
    const dy = input.clickTarget.y - chef.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 8) {
      mx = dx / distance;
      my = dy / distance;
    } else {
      input.clickTarget = null;
    }
  }
  if (mx !== 0 || my !== 0) {
    const length = Math.hypot(mx, my);
    chef.x += (mx / length) * CHEF_SPEED * dt;
    chef.y += (my / length) * CHEF_SPEED * dt;
    chef.dir = mx < 0 ? -1 : mx > 0 ? 1 : chef.dir;
    chef.moving = true;
  } else {
    chef.moving = false;
  }
  chef.x = Math.max(20, Math.min(FIELD.width - 20, chef.x));
  chef.y = Math.max(226, Math.min(FIELD.height - 24, chef.y));

  // A mouse click in range of a station interacts with it.
  if (input.clicked) {
    const station = nearestStation(world, 78);
    if (station) interact(world);
  }
  if (input.interactPressed) interact(world);
  if (input.servePressed) serveDish(world);

  stepCookers(world, dt);
  stepChopping(world, input, dt);

  world.hint = contextHint(world);
  if (world.messageTime > 0) world.messageTime -= dt;
  if (world.messageTime <= 0) world.message = '';
}
