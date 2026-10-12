export const HEIGHT = 260;
export const GROUND = 220;
export const PLAYER_X = 64;
export const PLAYER_SIZE = 44;

const GRAVITY = 2600;
const JUMP_VELOCITY = -820;
const SHORT_HOP_VELOCITY = -320;
const START_SPEED = 340;
const ACCELERATION = 12;
const MAX_SPEED = 820;
const PICKUP_CHANCE = 0.35;
const PICKUP_HEIGHT = 96;
const PICKUP_LEAD = 0.8;
const PICKUP_GAP = 1.75;
const HITBOX_INSET = 5;
export const MILESTONE = 250;

export const OBSTACLE_LABELS = [
  'merge conflict',
  'legacy code',
  'flaky test',
  'prod bug',
  '17:55 meeting',
  'scope creep',
  'IE11',
  'TODO',
] as const;

export const PICKUPS = [
  { kind: 'coffee', points: 25, weight: 5 },
  { kind: 'smoothie', points: 40, weight: 3 },
  { kind: 'bubble tea', points: 50, weight: 2 },
  { kind: 'matcha', points: 60, weight: 2 },
  { kind: 'avocado toast', points: 75, weight: 1 },
  { kind: 'React', points: 100, weight: 1 },
] as const;

export type PickupKind = (typeof PICKUPS)[number]['kind'];
export type Obstacle = { x: number; w: number; h: number; label: string };
export type Pickup = { x: number; y: number; kind: PickupKind; points: number; taken: boolean };

const TOTAL_WEIGHT = PICKUPS.reduce((sum, p) => sum + p.weight, 0);

export function pickupFor(roll: number) {
  let threshold = roll * TOTAL_WEIGHT;
  for (const pickup of PICKUPS) {
    threshold -= pickup.weight;
    if (threshold < 0) return pickup;
  }
  return PICKUPS[PICKUPS.length - 1];
}
export type Popup = { x: number; y: number; text: string; age: number };
export type Status = 'ready' | 'running' | 'over';
export type GameEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'pickup'; kind: PickupKind; x: number; y: number }
  | { type: 'crash' }
  | { type: 'milestone'; version: number };

export type Game = {
  status: Status;
  width: number;
  speed: number;
  distance: number;
  bonus: number;
  overAt: number;
  time: number;
  player: { y: number; vy: number; grounded: boolean };
  obstacles: Obstacle[];
  pickups: Pickup[];
  popups: Popup[];
  untilSpawn: number;
  nextMilestone: number;
  events: GameEvent[];
  random: () => number;
};

export const obstacleWidth = (label: string) => Math.round(label.length * 6.6 + 26);

export function createGame(width: number, random: () => number = Math.random): Game {
  return {
    status: 'ready',
    width,
    speed: START_SPEED,
    distance: 0,
    bonus: 0,
    overAt: 0,
    time: 0,
    player: { y: GROUND - PLAYER_SIZE, vy: 0, grounded: true },
    obstacles: [],
    pickups: [],
    popups: [],
    untilSpawn: width * 0.6,
    nextMilestone: MILESTONE,
    events: [],
    random,
  };
}

export const score = (game: Game) => Math.floor(game.distance / 20) + game.bonus;

export function start(game: Game) {
  if (game.status === 'ready') game.status = 'running';
}

export function restart(game: Game) {
  Object.assign(game, createGame(game.width, game.random), { status: 'running' });
}

export function jump(game: Game) {
  if (game.status !== 'running' || !game.player.grounded) return;
  game.player.vy = JUMP_VELOCITY;
  game.player.grounded = false;
  game.events.push({ type: 'jump' });
}

export function releaseJump(game: Game) {
  if (game.player.vy < SHORT_HOP_VELOCITY) game.player.vy = SHORT_HOP_VELOCITY;
}

function spawn(game: Game) {
  const { random, width, speed } = game;
  const label = OBSTACLE_LABELS[Math.floor(random() * OBSTACLE_LABELS.length)];
  const h = Math.round(24 + random() * 16);
  const w = obstacleWidth(label);
  game.obstacles.push({ x: width + 20, w, h, label });

  if (random() < PICKUP_CHANCE) {
    const { kind, points } = pickupFor(random());
    game.pickups.push({ x: width + 20 + w + speed * PICKUP_LEAD, y: GROUND - PICKUP_HEIGHT, kind, points, taken: false });
    game.untilSpawn = w + speed * (PICKUP_GAP + random() * 0.4);
  } else {
    game.untilSpawn = w + speed * (0.9 + random() * 0.9);
  }
}

const overlaps = (cx: number, cy: number, r: number, o: Obstacle) => {
  const nearestX = Math.max(o.x, Math.min(cx, o.x + o.w));
  const nearestY = Math.max(GROUND - o.h, Math.min(cy, GROUND));
  return (cx - nearestX) ** 2 + (cy - nearestY) ** 2 < r * r;
};

export function step(game: Game, dt: number) {
  game.time += dt;
  for (const popup of game.popups) popup.age += dt;
  game.popups = game.popups.filter((p) => p.age < 0.8);
  if (game.status !== 'running') return;

  const { player } = game;
  game.speed = Math.min(MAX_SPEED, game.speed + ACCELERATION * dt);
  const dx = game.speed * dt;
  game.distance += dx;

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  if (player.y >= GROUND - PLAYER_SIZE) {
    if (!player.grounded) game.events.push({ type: 'land' });
    player.y = GROUND - PLAYER_SIZE;
    player.vy = 0;
    player.grounded = true;
  }

  for (const o of game.obstacles) o.x -= dx;
  for (const p of game.pickups) p.x -= dx;
  game.obstacles = game.obstacles.filter((o) => o.x + o.w > -20);

  game.untilSpawn -= dx;
  if (game.untilSpawn <= 0) spawn(game);

  const r = PLAYER_SIZE / 2;
  const cx = PLAYER_X + r;
  const cy = player.y + r;

  for (const p of game.pickups) {
    if ((cx - p.x) ** 2 + (cy - p.y) ** 2 < (r + 10) ** 2) {
      p.taken = true;
      game.bonus += p.points;
      game.popups.push({ x: p.x, y: p.y - 16, text: `+${p.points} ${p.kind}`, age: 0 });
      game.events.push({ type: 'pickup', kind: p.kind, x: p.x, y: p.y });
    }
  }
  game.pickups = game.pickups.filter((p) => p.x > -20 && !p.taken);

  if (score(game) >= game.nextMilestone) {
    game.events.push({ type: 'milestone', version: game.nextMilestone / MILESTONE });
    game.nextMilestone += MILESTONE;
  }

  if (game.obstacles.some((o) => overlaps(cx, cy, r - HITBOX_INSET, o))) {
    game.status = 'over';
    game.overAt = game.time;
    game.events.push({ type: 'crash' });
  }
}
