// Screenshot scenes for ?shot=start|play|end. Each one builds a real world
// through the game's own state (fresh reset, real orders, real plates, real
// cooking slots), then returns the screen to draw over it. The same seed
// always gives the same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, resetWorld, spawnOrder } from './world.js';

function setOrderPatience(world, index, fraction) {
  const order = world.orders[index];
  if (order) order.patience = order.maxPatience * fraction;
}

// Title: the kitchen behind the title card, two tickets already waiting.
function stageStart(world) {
  resetWorld(world);
  world.screen = SCREEN_TITLE;
  world.time = 5;
  spawnOrder(world, 'burger');
  spawnOrder(world, 'miekuah');
  setOrderPatience(world, 0, 0.9);
  setOrderPatience(world, 1, 0.75);
  return { screen: SCREEN_TITLE, best: 0 };
}

// Mid-game: two tickets on the board, a burger half-built on the assembly
// table, the chef carrying a plate, a patty sizzling on the grill, and the
// day timer already running into the rush.
function stagePlay(world) {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  world.time = 65;
  world.timeLeft = 115;
  world.rushLevel = 1;
  world.score = 480;
  world.coins = 54;
  world.combo = 2;
  world.served = 4;
  spawnOrder(world, 'burger');
  spawnOrder(world, 'nasiayam');
  setOrderPatience(world, 0, 0.65);
  setOrderPatience(world, 1, 0.4);
  // Burger on the assembly table: bun + patty, still needs chopped lettuce.
  world.tablePlate = { items: ['bun', 'patty'] };
  // The chef carries a plate with rice for the nasi ayam ticket.
  world.chef.carrying = { kind: 'plate', items: ['rice'] };
  world.chef.x = 690;
  world.chef.y = 545;
  // A patty halfway through its 6 seconds on the grill, lettuce on the board.
  world.cookers.grill.push({ item: 'patty', progress: 3, done: false, burnt: false, cookTime: 6, burnTime: 6 });
  world.board = { item: 'lettuce', progress: 0.8 };
  world.hint = 'E: taruh di piring';
  world.message = 'Burger hampir lengkap, butuh selada potong!';
  world.messageTime = 10;
  return { screen: SCREEN_PLAY, best: world.score };
}

// End of the rush: the shift is over with three tickets still waiting, one
// heart left, and a score worth showing.
function stageEnd(world) {
  resetWorld(world);
  world.screen = SCREEN_OVER;
  world.time = 180;
  world.timeLeft = 0;
  world.rushLevel = 2;
  world.score = 1240;
  world.coins = 186;
  world.combo = 3;
  world.served = 9;
  world.failed = 2;
  world.hearts = 1;
  spawnOrder(world, 'burger');
  spawnOrder(world, 'nasiayam');
  spawnOrder(world, 'miekuah');
  setOrderPatience(world, 0, 0.15);
  setOrderPatience(world, 1, 0.3);
  setOrderPatience(world, 2, 0.5);
  world.chef.x = 700;
  world.chef.y = 470;
  return { screen: SCREEN_OVER, best: world.score };
}

export function stageShot(name, world) {
  if (name === 'play') return stagePlay(world);
  if (name === 'end') return stageEnd(world);
  return stageStart(world);
}
