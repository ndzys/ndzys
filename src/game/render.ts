import { GROUND, HEIGHT, PLAYER_SIZE, PLAYER_X, score, type Game, type GameEvent } from './engine';

type RGB = [number, number, number];

type Palette = {
  skyTop: RGB;
  skyBottom: RGB;
  ink: RGB;
  chipText: RGB;
  muted: RGB;
  floor: RGB;
  skyline: RGB;
};

const hex = (value: string): RGB => {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const DAY: Palette = {
  skyTop: hex('#F4F3F0'),
  skyBottom: hex('#E8E4DC'),
  ink: hex('#0B0B0C'),
  chipText: hex('#F4F3F0'),
  muted: hex('#55555B'),
  floor: hex('#E2DED6'),
  skyline: hex('#C9C4BA'),
};

const DUSK: Palette = {
  skyTop: hex('#F3DCC7'),
  skyBottom: hex('#D7BFD2'),
  ink: hex('#1C1524'),
  chipText: hex('#F7EEE6'),
  muted: hex('#6E5B6B'),
  floor: hex('#CDB5BF'),
  skyline: hex('#B497AE'),
};

const NIGHT: Palette = {
  skyTop: hex('#0B111C'),
  skyBottom: hex('#1A2335'),
  ink: hex('#EEF1F6'),
  chipText: hex('#0B111C'),
  muted: hex('#8E95A0'),
  floor: hex('#111827'),
  skyline: hex('#243049'),
};

const ACCENT = '#1F6F9F';
const GLOW = '#9FD4F5';
const DANGER = '#E5484D';
const WARN = '#F5A524';
const WINDOW_LIGHT = '#F5C46B';
const DAY_LENGTH = 24000;
const GLYPHS = ['</>', '{ }', '=>', 'npm i', 'git push', '&&', '[...]', 'async', '#fff', '200 OK', '<div>', '?.'];
const DANGEROUS = new Set(['prod bug', 'flaky test', 'merge conflict']);

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const rgba = ([r, g, b]: RGB, alpha = 1) => `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
const smooth = (t: number) => t * t * (3 - 2 * t);
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const blendPalettes = (a: Palette, b: Palette, t: number): Palette => ({
  skyTop: mix(a.skyTop, b.skyTop, t),
  skyBottom: mix(a.skyBottom, b.skyBottom, t),
  ink: mix(a.ink, b.ink, t),
  chipText: mix(a.chipText, b.chipText, t),
  muted: mix(a.muted, b.muted, t),
  floor: mix(a.floor, b.floor, t),
  skyline: mix(a.skyline, b.skyline, t),
});

/** Palette and how dark it is (0 = day, 1 = night) for a point in the run. */
export function atmosphere(distance: number): { palette: Palette; night: number } {
  const phase = (distance / DAY_LENGTH) % 1;
  const stops = [DAY, DUSK, NIGHT, DUSK, DAY];
  const scaled = phase * 4;
  const i = Math.min(3, Math.floor(scaled));
  const t = smooth(scaled - i);
  const nightAt = [0, 0.35, 1, 0.35, 0];
  return {
    palette: blendPalettes(stops[i], stops[i + 1], t),
    night: nightAt[i] + (nightAt[i + 1] - nightAt[i]) * t,
  };
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  gravity: number;
  square: boolean;
};

export type Fx = {
  particles: Particle[];
  trail: { x: number; y: number }[];
  shake: number;
  flash: number;
  squash: number;
  banner: { text: string; age: number } | null;
  streaks: { x: number; y: number; len: number }[];
};

export const createFx = (): Fx => ({
  particles: [],
  trail: [],
  shake: 0,
  flash: 0,
  squash: 0,
  banner: null,
  streaks: [],
});

function burst(fx: Fx, x: number, y: number, count: number, opts: Partial<Particle> & { spread: number; speed: number; angle?: number; colors: string[] }) {
  for (let i = 0; i < count; i++) {
    const angle = (opts.angle ?? 0) + (Math.random() - 0.5) * opts.spread;
    const speed = opts.speed * (0.4 + Math.random() * 0.8);
    fx.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: (opts.life ?? 0.6) * (0.6 + Math.random() * 0.6),
      size: (opts.size ?? 3) * (0.6 + Math.random() * 0.8),
      color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
      gravity: opts.gravity ?? 0,
      square: opts.square ?? false,
    });
  }
}

export function applyEvents(fx: Fx, game: Game, events: GameEvent[]) {
  const feetX = PLAYER_X + PLAYER_SIZE / 2;
  for (const event of events) {
    switch (event.type) {
      case 'jump':
        burst(fx, feetX, GROUND, 6, { spread: 1.2, speed: 90, angle: Math.PI * 0.85, colors: ['#B8B2A7'], life: 0.35, size: 3 });
        break;
      case 'land':
        fx.squash = 1;
        burst(fx, feetX, GROUND, 10, { spread: 0.9, speed: 140, angle: Math.PI, colors: ['#B8B2A7', '#CFC9BE'], life: 0.45, size: 3, gravity: 300 });
        break;
      case 'coffee':
        burst(fx, event.x, event.y, 18, { spread: Math.PI * 2, speed: 160, colors: [GLOW, ACCENT, '#FFFFFF'], life: 0.7, size: 3 });
        break;
      case 'crash':
        fx.shake = 12;
        fx.flash = 1;
        burst(fx, PLAYER_X + PLAYER_SIZE, game.player.y + PLAYER_SIZE / 2, 34, {
          spread: Math.PI * 1.4,
          speed: 320,
          angle: -Math.PI / 2,
          colors: [DANGER, '#0B0B0C', WARN, ACCENT],
          life: 1.1,
          size: 5,
          gravity: 900,
          square: true,
        });
        break;
      case 'milestone':
        fx.banner = { text: `🚀 v${event.version}.0 shipped`, age: 0 };
        break;
    }
  }
}

export function updateFx(fx: Fx, game: Game, dt: number) {
  for (const p of fx.particles) {
    p.age += dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt - (game.status === 'running' ? game.speed * dt * 0.6 : 0);
    p.y += p.vy * dt;
  }
  fx.particles = fx.particles.filter((p) => p.age < p.life);

  fx.shake = Math.max(0, fx.shake - dt * 40);
  fx.flash = Math.max(0, fx.flash - dt * 3);
  fx.squash = Math.max(0, fx.squash - dt * 6);
  if (fx.banner) {
    fx.banner.age += dt;
    if (fx.banner.age > 1.8) fx.banner = null;
  }

  const center = { x: PLAYER_X + PLAYER_SIZE / 2, y: game.player.y + PLAYER_SIZE / 2 };
  if (game.status === 'running' && !game.player.grounded) fx.trail.unshift(center);
  else fx.trail.pop();
  fx.trail.length = Math.min(fx.trail.length, 10);

  const fast = Math.max(0, (game.speed - 520) / 300);
  if (game.status === 'running' && Math.random() < fast * 0.6) {
    fx.streaks.push({ x: game.width + 10, y: 20 + Math.random() * (GROUND - 40), len: 40 + Math.random() * 80 });
  }
  for (const s of fx.streaks) s.x -= game.speed * dt * 2.2;
  fx.streaks = fx.streaks.filter((s) => s.x + s.len > 0);
}

function drawSky(ctx: CanvasRenderingContext2D, game: Game, palette: Palette, night: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, rgba(palette.skyTop));
  sky.addColorStop(1, rgba(palette.skyBottom));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, game.width, GROUND);

  if (night > 0.05) {
    for (let i = 0; i < 60; i++) {
      const x = hash(i) * game.width;
      const y = hash(i + 100) * GROUND * 0.7;
      const twinkle = 0.5 + 0.5 * Math.sin(game.time * (1 + hash(i + 200) * 3) + i);
      ctx.fillStyle = `rgba(255,255,255,${night * twinkle * 0.8})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  const orbX = game.width * 0.84 - ((game.distance * 0.02) % (game.width * 1.1));
  const orbY = 64;
  const halo = ctx.createRadialGradient(orbX, orbY, 4, orbX, orbY, 70);
  const orbColor = night > 0.5 ? '238,241,246' : '255,214,170';
  halo.addColorStop(0, `rgba(${orbColor},${0.55 + night * 0.2})`);
  halo.addColorStop(0.3, `rgba(${orbColor},0.18)`);
  halo.addColorStop(1, `rgba(${orbColor},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(orbX - 70, orbY - 70, 140, 140);
  ctx.fillStyle = `rgba(${orbColor},0.95)`;
  ctx.beginPath();
  ctx.arc(orbX, orbY, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyline(ctx: CanvasRenderingContext2D, game: Game, palette: Palette, night: number) {
  const slot = 58;
  const scroll = game.distance * 0.18;
  const first = Math.floor(scroll / slot) - 1;
  const count = Math.ceil(game.width / slot) + 2;

  for (let i = first; i < first + count; i++) {
    const w = 30 + hash(i) * 22;
    const h = 46 + hash(i + 7) * 92;
    const x = i * slot - scroll + (slot - w) / 2;
    const y = GROUND - h;
    const facade = ctx.createLinearGradient(0, y, 0, GROUND);
    facade.addColorStop(0, rgba(palette.skyline, 0.42));
    facade.addColorStop(1, rgba(palette.skyline, 0.12));
    ctx.fillStyle = facade;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [4, 4, 0, 0]);
    ctx.fill();

    if (night > 0.15) {
      ctx.fillStyle = WINDOW_LIGHT;
      for (let row = 0; row < Math.floor(h / 10) - 1; row++) {
        for (let col = 0; col < Math.floor(w / 8); col++) {
          if (hash(i * 31 + row * 7 + col) > 0.62) {
            ctx.globalAlpha = night * (0.45 + hash(i + row + col * 3) * 0.5);
            ctx.fillRect(x + 4 + col * 8, y + 6 + row * 10, 3, 4);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  }
}

function drawGlyphs(ctx: CanvasRenderingContext2D, game: Game, palette: Palette) {
  const slot = 150;
  const scroll = game.distance * 0.42;
  const first = Math.floor(scroll / slot) - 1;
  ctx.font = '500 12px "Geist Mono", ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  for (let i = first; i < first + Math.ceil(game.width / slot) + 2; i++) {
    const x = i * slot - scroll + hash(i + 50) * 60;
    const y = 30 + hash(i + 60) * (GROUND - 110) + Math.sin(game.time * 0.8 + i) * 4;
    ctx.fillStyle = rgba(palette.muted, 0.16 + hash(i + 70) * 0.12);
    ctx.fillText(GLYPHS[Math.floor(hash(i + 80) * GLYPHS.length)], x, y);
  }
}

function drawFloor(ctx: CanvasRenderingContext2D, game: Game, palette: Palette, night: number) {
  ctx.fillStyle = rgba(palette.floor);
  ctx.fillRect(0, GROUND, game.width, HEIGHT - GROUND);

  const lineColor = night > 0.5 ? `rgba(159,212,245,${0.12 + night * 0.18})` : rgba(palette.ink, 0.08);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;

  const depth = HEIGHT - GROUND;
  const z = (game.distance / 90) % 1;
  for (let k = 0; k < 6; k++) {
    const p = (k + 1 - z) / 6;
    const y = GROUND + depth * p * p;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(game.width, y);
    ctx.stroke();
  }

  const vanishX = game.width / 2;
  const spacing = 64;
  const offset = (game.distance * 1.4) % spacing;
  for (let x = -game.width; x < game.width * 2; x += spacing) {
    const bottomX = x - offset;
    ctx.beginPath();
    ctx.moveTo(vanishX + (bottomX - vanishX) * 0.18, GROUND);
    ctx.lineTo(bottomX, HEIGHT);
    ctx.stroke();
  }

  ctx.fillStyle = rgba(palette.ink, 0.85);
  ctx.fillRect(0, GROUND, game.width, 2);
}

function drawStreaks(ctx: CanvasRenderingContext2D, fx: Fx, palette: Palette) {
  ctx.strokeStyle = rgba(palette.muted, 0.35);
  ctx.lineWidth = 1;
  for (const s of fx.streaks) {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.len, s.y);
    ctx.stroke();
  }
}

function drawObstacles(ctx: CanvasRenderingContext2D, game: Game, palette: Palette, night: number) {
  ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  for (const o of game.obstacles) {
    const y = GROUND - o.h;
    ctx.save();
    ctx.shadowColor = night > 0.5 ? 'rgba(159,212,245,0.35)' : 'rgba(11,11,12,0.22)';
    ctx.shadowBlur = night > 0.5 ? 18 : 12;
    ctx.shadowOffsetY = night > 0.5 ? 0 : 5;
    ctx.fillStyle = rgba(palette.ink);
    ctx.beginPath();
    ctx.roundRect(o.x, y, o.w, o.h, 8);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = DANGEROUS.has(o.label) ? DANGER : WARN;
    ctx.beginPath();
    ctx.arc(o.x + 11, y + o.h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba(palette.chipText);
    ctx.fillText(o.label, o.x + 19, y + o.h / 2 + 0.5);
  }
}

function drawCoffees(ctx: CanvasRenderingContext2D, game: Game) {
  ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const c of game.coffees) {
    const y = c.y + Math.sin(game.time * 4 + c.x * 0.05) * 3;
    const pulse = 1 + Math.sin(game.time * 6) * 0.12;
    const halo = ctx.createRadialGradient(c.x, y, 2, c.x, y, 26 * pulse);
    halo.addColorStop(0, 'rgba(159,212,245,0.75)');
    halo.addColorStop(1, 'rgba(159,212,245,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(c.x - 30, y - 30, 60, 60);
    ctx.fillText('☕', c.x, y + 1);
  }
  ctx.textAlign = 'start';
}

function drawPlayer(ctx: CanvasRenderingContext2D, game: Game, fx: Fx, palette: Palette, image: HTMLImageElement | null) {
  const r = PLAYER_SIZE / 2;
  const { player } = game;
  const bob = game.status === 'running' && player.grounded ? Math.abs(Math.sin(game.time * 16)) * -2 : 0;
  const idle = game.status === 'ready' ? Math.sin(game.time * 3) * 3 : 0;
  const cx = PLAYER_X + r;
  const cy = player.y + r + bob + idle;

  fx.trail.forEach((point, i) => {
    const t = 1 - i / fx.trail.length;
    ctx.fillStyle = `rgba(31,111,159,${0.18 * t})`;
    ctx.beginPath();
    ctx.arc(point.x - i * 6, point.y, r * (0.5 + 0.45 * t), 0, Math.PI * 2);
    ctx.fill();
  });

  const lift = Math.min(1, (GROUND - (player.y + PLAYER_SIZE)) / 140);
  ctx.fillStyle = rgba(palette.ink, 0.18 * (1 - lift * 0.6));
  ctx.beginPath();
  ctx.ellipse(cx, GROUND + 4, r * (0.95 - lift * 0.45), 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const squash = fx.squash * 0.16;
  const crashed = game.status === 'over';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(crashed ? -0.5 : Math.max(-0.35, Math.min(0.35, player.vy * 0.00045)));
  ctx.scale(1 + squash, 1 - squash);

  if (!player.grounded && game.status === 'running') {
    ctx.shadowColor = GLOW;
    ctx.shadowBlur = 20;
  }
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
  ctx.clip();
  if (image?.complete && image.naturalWidth) {
    const size = image.naturalWidth * 0.5;
    ctx.drawImage(image, image.naturalWidth * 0.25, image.naturalHeight * 0.06, size, size, -r, -r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#F4F3F0';
    ctx.font = '600 14px Geist, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ND', 0, 1);
    ctx.textAlign = 'start';
  }
  if (crashed) {
    ctx.fillStyle = 'rgba(229,72,77,0.35)';
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  ctx.restore();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = crashed ? DANGER : rgba(palette.ink);
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, fx: Fx) {
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    if (p.square) {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawPopups(ctx: CanvasRenderingContext2D, game: Game) {
  ctx.font = '600 13px "Geist Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (const p of game.popups) {
    ctx.globalAlpha = 1 - p.age / 0.8;
    ctx.fillStyle = ACCENT;
    ctx.fillText(p.text, p.x, p.y - p.age * 40);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'start';
}

const pad = (n: number) => String(n).padStart(5, '0');

function drawHud(ctx: CanvasRenderingContext2D, game: Game, fx: Fx, palette: Palette, best: number) {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.font = '500 13px "Geist Mono", ui-monospace, monospace';
  ctx.fillStyle = rgba(palette.muted);
  ctx.fillText(`HI ${pad(best)}`, game.width - 92, 24);
  ctx.fillStyle = rgba(palette.ink);
  ctx.fillText(pad(score(game)), game.width - 20, 24);
  ctx.textAlign = 'start';

  if (fx.banner) {
    const t = fx.banner.age;
    const appear = Math.min(1, t / 0.25);
    const fade = t > 1.4 ? 1 - (t - 1.4) / 0.4 : 1;
    const scale = 0.85 + 0.15 * smooth(appear);
    ctx.save();
    ctx.globalAlpha = appear * fade;
    ctx.translate(game.width / 2, 56);
    ctx.scale(scale, scale);
    ctx.font = '600 15px Geist, ui-sans-serif, system-ui, sans-serif';
    const width = ctx.measureText(fx.banner.text).width + 32;
    ctx.fillStyle = '#0B0B0C';
    ctx.beginPath();
    ctx.roundRect(-width / 2, -17, width, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#F4F3F0';
    ctx.textAlign = 'center';
    ctx.fillText(fx.banner.text, 0, 1);
    ctx.restore();
  }
}

function drawMessage(ctx: CanvasRenderingContext2D, game: Game, palette: Palette, best: number, touch: boolean) {
  if (game.status === 'running') return;
  const cx = game.width / 2;
  const over = game.status === 'over';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = over ? DANGER : rgba(palette.ink);
  ctx.font = '600 34px Geist, ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(over ? 'Build failed' : 'Ship it!', cx, 92);

  ctx.font = '500 12.5px "Geist Mono", ui-monospace, monospace';
  ctx.fillStyle = rgba(palette.muted);
  if (over) {
    const record = score(game) >= best && score(game) > 0;
    ctx.fillText(record ? `new best · ${score(game)}` : `score ${score(game)} · best ${best}`, cx, 126);
    if (game.time - game.overAt > 0.5 && Math.sin(game.time * 5) > -0.3) {
      ctx.fillStyle = rgba(palette.ink);
      ctx.fillText(touch ? 'tap to redeploy' : 'space or tap to redeploy', cx, 150);
    }
  } else {
    ctx.fillText('jump over the blockers · grab the coffee', cx, 126);
    ctx.fillStyle = rgba(palette.ink);
    if (Math.sin(game.time * 4) > -0.3) ctx.fillText(touch ? 'tap to start' : 'space or tap to start', cx, 150);
  }
  ctx.restore();
}

export function draw(
  ctx: CanvasRenderingContext2D,
  game: Game,
  fx: Fx,
  opts: { scale: number; image: HTMLImageElement | null; best: number; touch: boolean },
) {
  const { palette, night } = atmosphere(game.distance);
  const shakeX = (Math.random() - 0.5) * fx.shake;
  const shakeY = (Math.random() - 0.5) * fx.shake;

  ctx.setTransform(opts.scale, 0, 0, opts.scale, shakeX * opts.scale, shakeY * opts.scale);
  ctx.clearRect(-20, -20, game.width + 40, HEIGHT + 40);

  drawSky(ctx, game, palette, night);
  drawSkyline(ctx, game, palette, night);
  drawGlyphs(ctx, game, palette);
  drawFloor(ctx, game, palette, night);
  drawStreaks(ctx, fx, palette);
  drawCoffees(ctx, game);
  drawObstacles(ctx, game, palette, night);
  drawPlayer(ctx, game, fx, palette, opts.image);
  drawParticles(ctx, fx);
  drawPopups(ctx, game);
  drawHud(ctx, game, fx, palette, opts.best);
  drawMessage(ctx, game, palette, opts.best, opts.touch);

  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(229,72,77,${fx.flash * 0.22})`;
    ctx.fillRect(-20, -20, game.width + 40, HEIGHT + 40);
  }
}
