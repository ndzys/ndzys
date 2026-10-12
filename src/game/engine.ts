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
const COFFEE_BONUS = 25;
const COFFEE_HEIGHT = 96;
const COFFEE_LEAD = 0.8;
const COFFEE_GAP = 1.75;
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

export type Obstacle = { x: number; w: number; h: number; label: string };
export type Coffee = { x: number; y: number; taken: boolean };
export type Popup = { x: number; y: number; text: string; age: number };
export type Status = 'ready' | 'running' | 'over';
export type GameEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'coffee'; x: number; y: number }
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
  coffees: Coffee[];
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
    coffees: [],
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

  if (random() < 0.35) {
    game.coffees.push({ x: width + 20 + w + speed * COFFEE_LEAD, y: GROUND - COFFEE_HEIGHT, taken: false });
    game.untilSpawn = w + speed * (COFFEE_GAP + random() * 0.4);
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
  for (const c of game.coffees) c.x -= dx;
  game.obstacles = game.obstacles.filter((o) => o.x + o.w > -20);

  game.untilSpawn -= dx;
  if (game.untilSpawn <= 0) spawn(game);

  const r = PLAYER_SIZE / 2;
  const cx = PLAYER_X + r;
  const cy = player.y + r;

  for (const c of game.coffees) {
    if ((cx - c.x) ** 2 + (cy - c.y) ** 2 < (r + 10) ** 2) {
      c.taken = true;
      game.bonus += COFFEE_BONUS;
      game.popups.push({ x: c.x, y: c.y - 16, text: `+${COFFEE_BONUS}`, age: 0 });
      game.events.push({ type: 'coffee', x: c.x, y: c.y });
    }
  }
  game.coffees = game.coffees.filter((c) => c.x > -20 && !c.taken);

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
