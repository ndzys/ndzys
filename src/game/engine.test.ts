import { describe, expect, it } from 'vitest';
import {
  GROUND,
  MILESTONE,
  PLAYER_SIZE,
  PLAYER_X,
  createGame,
  jump,
  obstacleWidth,
  releaseJump,
  restart,
  score,
  start,
  step,
  type Game,
} from './engine';

const FRAME = 1 / 60;
const run = (game: Game, seconds: number) => {
  for (let t = 0; t < seconds; t += FRAME) step(game, FRAME);
};
const types = (game: Game) => game.events.map((e) => e.type);
const fixedRandom = () => 0.5;

describe('game engine', () => {
  it('waits on the start screen until started', () => {
    const game = createGame(720, fixedRandom);
    run(game, 1);
    expect(game.status).toBe('ready');
    expect(game.distance).toBe(0);

    start(game);
    run(game, 0.5);
    expect(game.status).toBe('running');
    expect(game.distance).toBeGreaterThan(0);
  });

  it('only jumps from the ground and lands back', () => {
    const game = createGame(720, fixedRandom);
    jump(game);
    expect(game.player.grounded).toBe(true);

    start(game);
    jump(game);
    expect(game.player.vy).toBeLessThan(0);
    expect(game.player.grounded).toBe(false);

    const vy = game.player.vy;
    jump(game);
    expect(game.player.vy).toBe(vy);

    game.untilSpawn = Infinity;
    run(game, 1);
    expect(game.player.grounded).toBe(true);
    expect(game.player.y).toBe(GROUND - PLAYER_SIZE);
    expect(types(game)).toEqual(['jump', 'land']);
  });

  it('cuts the jump short when released early', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    jump(game);
    releaseJump(game);
    expect(game.player.vy).toBeGreaterThan(-400);
  });

  it('accelerates up to a speed cap', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    game.untilSpawn = Infinity;
    const initial = game.speed;
    run(game, 2);
    expect(game.speed).toBeGreaterThan(initial);
    run(game, 120);
    expect(game.speed).toBe(820);
  });

  it('spawns obstacles that fit their label', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    run(game, 2);
    expect(game.obstacles.length).toBeGreaterThan(0);
    for (const o of game.obstacles) expect(o.w).toBe(obstacleWidth(o.label));
  });

  it('ends the run on collision', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    game.untilSpawn = Infinity;
    game.obstacles.push({ x: PLAYER_X + 10, w: 60, h: 30, label: 'TODO' });
    step(game, FRAME);
    expect(game.status).toBe('over');
    expect(types(game)).toContain('crash');

    const distance = game.distance;
    run(game, 1);
    expect(game.distance).toBe(distance);
  });

  it('clears an obstacle when jumping over it', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    game.untilSpawn = Infinity;
    game.obstacles.push({ x: PLAYER_X + 140, w: obstacleWidth('merge conflict'), h: 40, label: 'merge conflict' });
    run(game, 0.2);
    jump(game);
    run(game, 1.2);
    expect(game.status).toBe('running');
  });

  it('adds a bonus for coffee and counts distance', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    game.untilSpawn = Infinity;
    game.coffees.push({ x: PLAYER_X + PLAYER_SIZE / 2, y: GROUND - PLAYER_SIZE / 2, taken: false });
    step(game, FRAME);
    expect(game.bonus).toBe(25);
    expect(game.coffees).toHaveLength(0);
    expect(score(game)).toBe(Math.floor(game.distance / 20) + 25);
  });

  it('leaves room to land, grab the coffee and clear the next blocker', () => {
    const rolls = [0.5, 0.5, 0.1, 0.5];
    let calls = 0;
    const game = createGame(720, () => rolls[calls++ % rolls.length]);
    start(game);
    game.untilSpawn = 0;
    step(game, FRAME);
    const [first] = game.obstacles;
    const [coffee] = game.coffees;
    expect(coffee.x).toBeGreaterThan(first.x + first.w);

    const jumpWhen = (isClose: () => boolean) => {
      while (!isClose() && game.status === 'running') step(game, FRAME);
      jump(game);
      run(game, 0.7);
    };

    jumpWhen(() => game.obstacles[0].x < PLAYER_X + PLAYER_SIZE + 40);
    jumpWhen(() => game.coffees[0].x < PLAYER_X + PLAYER_SIZE + 60);
    expect(game.bonus).toBe(25);

    const next = game.obstacles.find((o) => o.x > PLAYER_X);
    expect(next).toBeDefined();
    jumpWhen(() => next!.x < PLAYER_X + PLAYER_SIZE + 40);
    expect(game.status).toBe('running');
  });

  it('announces milestones once each', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    game.untilSpawn = Infinity;
    game.distance = MILESTONE * 20;
    step(game, FRAME);
    step(game, FRAME);
    expect(game.events.filter((e) => e.type === 'milestone')).toEqual([{ type: 'milestone', version: 1 }]);
  });

  it('restarts into a fresh running game', () => {
    const game = createGame(720, fixedRandom);
    start(game);
    run(game, 3);
    restart(game);
    expect(game.status).toBe('running');
    expect(game.distance).toBe(0);
    expect(game.obstacles).toHaveLength(0);
    expect(game.width).toBe(720);
  });
});
