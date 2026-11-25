// Midnight Sizzle: every number that tunes the kitchen lives here.
// Field size, stations, recipes, cook times, scoring and the day clock.
export const FIELD = { width: 960, height: 600 };

export const DAY_LENGTH = 180; // seconds per shift
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 45; // seconds before a waiting customer walks out
export const FIRST_ORDER_DELAY = 4; // seconds until the first ticket arrives
export const SPAWN_BASE = 18; // seconds between tickets at the start
export const SPAWN_MIN = 9; // fastest ticket interval, deep in the rush
export const SPAWN_STEP = 2; // seconds shaved off the interval each minute
export const RUSH_EVERY = 60; // seconds between rush step-ups

export const CHOP_TIME = 1.5; // seconds holding E on the cutting board
export const CHEF_SPEED = 260; // pixels per second
export const CHEF_RADIUS = 20;

export const SCORE_BASE = 100;
export const TIP_MAX = 50;
export const COMBO_BONUS = 10; // extra points per combo step, percent
export const COIN_BASE = 12;

// One ingredient: id, display name, short label, colour, and how it is prepared.
export const INGREDIENTS = {
  bun: { name: 'Roti Bun', short: 'Bun', color: '#e8a54b', prep: 'ready' },
  pattyRaw: { name: 'Patty Mentah', short: 'Patty', color: '#a14d3a', prep: 'grill' },
  patty: { name: 'Patty Panggang', short: 'Patty', color: '#7c3a26', prep: 'cooked' },
  lettuce: { name: 'Selada', short: 'Selada', color: '#7bc043', prep: 'chop' },
  lettuceChopped: { name: 'Selada Potong', short: 'Selada', color: '#8fd14f', prep: 'ready' },
  egg: { name: 'Telur', short: 'Telur', color: '#fdf3d0', prep: 'ready' },
  rice: { name: 'Nasi', short: 'Nasi', color: '#fff8e7', prep: 'ready' },
  chickenRaw: { name: 'Ayam Mentah', short: 'Ayam', color: '#f2b8a0', prep: 'fry' },
  chicken: { name: 'Ayam Krispi', short: 'Ayam', color: '#d97b29', prep: 'cooked' },
  tomato: { name: 'Tomat', short: 'Tomat', color: '#e63946', prep: 'chop' },
  tomatoChopped: { name: 'Tomat Potong', short: 'Tomat', color: '#f2545b', prep: 'ready' },
  noodleRaw: { name: 'Mie Mentah', short: 'Mie', color: '#f4d58d', prep: 'pot' },
  noodle: { name: 'Mie Kuah', short: 'Mie', color: '#f2c14e', prep: 'cooked' },
  burnt: { name: 'Gosong!', short: 'Gosong', color: '#2b2b2b', prep: 'burnt' },
};

// What chopping turns an ingredient into.
export const CHOP_RESULT = { lettuce: 'lettuceChopped', tomato: 'tomatoChopped' };

// Three dishes, three parts each, assembled in any order.
export const RECIPES = [
  {
    id: 'burger',
    name: 'Burger Klasik',
    short: 'Burger',
    color: '#e8a54b',
    parts: ['bun', 'patty', 'lettuceChopped'],
    price: 100,
  },
  {
    id: 'nasiayam',
    name: 'Nasi Ayam Krispi',
    short: 'Nasi Ayam',
    color: '#d97b29',
    parts: ['rice', 'chicken', 'tomatoChopped'],
    price: 110,
  },
  {
    id: 'miekuah',
    name: 'Mie Kuah',
    short: 'Mie Kuah',
    color: '#f2c14e',
    parts: ['noodle', 'egg', 'lettuceChopped'],
    price: 120,
  },
];

// Cooking stations: what raw ingredient they cook, how long, and how long
// before a finished piece burns if nobody picks it up.
export const COOKERS = {
  grill: { raw: 'pattyRaw', cooked: 'patty', cookTime: 6, burnTime: 6, label: 'Panggangan' },
  fryer: { raw: 'chickenRaw', cooked: 'chicken', cookTime: 4, burnTime: 4, label: 'Penggorengan' },
  pot: { raw: 'noodleRaw', cooked: 'noodle', cookTime: 5, burnTime: 5, label: 'Panci Mie' },
};

// Kitchen stations on the floor plan. `gives` lists raw ingredients the
// chef can pick up here; `cooker` names a cooking slot; `kind` drives the
// interaction in world.js.
export const STATIONS = [
  { id: 'fridge', name: 'Kulkas', kind: 'pickup', gives: ['lettuce', 'egg'], x: 24, y: 118, w: 116, h: 92, color: '#9fc5e8' },
  { id: 'grill', name: 'Panggangan', kind: 'cooker', cooker: 'grill', gives: ['pattyRaw'], x: 156, y: 118, w: 124, h: 92, color: '#5b5b6e' },
  { id: 'fryer', name: 'Penggorengan', kind: 'cooker', cooker: 'fryer', gives: ['chickenRaw'], x: 296, y: 118, w: 124, h: 92, color: '#8a6d3b' },
  { id: 'pot', name: 'Panci', kind: 'cooker', cooker: 'pot', gives: ['noodleRaw'], x: 436, y: 118, w: 124, h: 92, color: '#6e7f80' },
  { id: 'pantry', name: 'Pantry', kind: 'pickup', gives: ['bun', 'rice', 'tomato'], x: 576, y: 118, w: 116, h: 92, color: '#c98f5f' },
  { id: 'board', name: 'Talenan', kind: 'board', gives: [], x: 300, y: 330, w: 150, h: 96, color: '#d9a066' },
  { id: 'assembly', name: 'Meja Racik', kind: 'assembly', gives: [], x: 490, y: 330, w: 190, h: 96, color: '#f2d8a7' },
  { id: 'window', name: 'Jendela Saji', kind: 'window', gives: [], x: 800, y: 118, w: 136, h: 96, color: '#ff8c42' },
  { id: 'trash', name: 'Tempat Sampah', kind: 'trash', gives: [], x: 836, y: 440, w: 100, h: 84, color: '#4a4a55' },
];

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

export function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

// Stars on the end screen: how many served dishes each star needs.
export function starsFor(served) {
  if (served >= 10) return 3;
  if (served >= 7) return 2;
  if (served >= 4) return 1;
  return 0;
}
