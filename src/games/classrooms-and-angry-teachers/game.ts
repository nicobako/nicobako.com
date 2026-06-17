// ---------------------------------------------------------------------------
// "Classrooms & Angry Teachers" — a small Kaplay game.
//
// Vendored from the standalone project of the same name. The only change from
// the original entry point is how Kaplay is initialised: instead of taking over
// the whole <body>, it mounts its canvas into the page's #game-root container
// (sized to the 640x700 board's aspect ratio) and runs with global: false so it
// doesn't leak helpers onto the surrounding site.
// ---------------------------------------------------------------------------
import kaplay from "kaplay";
import {
  COLS,
  ROWS,
  TILE,
  Tile,
  buildGrid,
  ITEM_TYPES,
  ITEM_SPAWNS,
  TEACHER_SPAWNS,
  MONITOR_SPAWNS,
  PLAYER_START,
  MAX_HEALTH,
  START_LIVES,
  TOTAL_LEVELS,
  type Cell,
} from "./level";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const BOARD_X = 20;
const BOARD_Y = 90; // top HUD height
const GAME_W = BOARD_X * 2 + COLS * TILE; // 640
const BOARD_BOTTOM = BOARD_Y + ROWS * TILE; // 610
const HUD_BOTTOM_H = 90;
const GAME_H = BOARD_BOTTOM + HUD_BOTTOM_H; // 700

// Movement / timing knobs (seconds unless noted).
const MOVE_REPEAT = 0.12; // how fast the player walks while an arrow key is held
const TEACHER_STEP = 0.6; // time between teacher steps (levels 2+)
const MONITOR_STEP = 0.52; // hall monitors roam a bit slower now (gentler level 3)
const ATTACK_COOLDOWN = 1.8; // how often an adjacent enemy can land a hit
const ATTACK_GRACE = 1.2; // breathing room before the first hit
const FLASH_TIME = 0.35; // how long an enemy glows red after attacking
const HURT_TIME = 0.2; // how long an enemy flashes white when you hit it
const STUN_TIME = 2.5; // how long a hall monitor stays dizzy after you hit it
const PLAYER_GLIDE = 380; // px / sec the pawn visually slides between tiles
const ENEMY_GLIDE = 240; // px / sec enemies visually slide between tiles

const k = kaplay({
  width: GAME_W,
  height: GAME_H,
  background: [16, 18, 30],
  letterbox: true,
  global: false,
  // The board (640px wide) is letterboxed into a CSS box that's narrower than
  // that, so Kaplay would otherwise render its buffer below 1:1 and the 1px grid
  // lines wash out unevenly across the board. Render at >=2x so thin lines stay
  // crisp everywhere regardless of the display's own pixel ratio.
  pixelDensity: Math.max(2, window.devicePixelRatio || 1),
  root: document.getElementById("game-root") ?? undefined,
});

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const COL = {
  wall: k.rgb(34, 38, 58),
  floor: k.rgb(58, 62, 92),
  room: k.rgb(54, 76, 112),
  door: k.rgb(150, 110, 60),
  grid: k.rgb(40, 44, 66),
  hud: k.rgb(24, 26, 42),
  text: k.rgb(235, 238, 250),
  dim: k.rgb(150, 156, 180),
  heart: k.rgb(232, 70, 88),
  heartEmpty: k.rgb(70, 74, 100),
  player: k.rgb(90, 170, 240),
  teacher: k.rgb(245, 210, 60),
  monitor: k.rgb(196, 120, 232),
  attack: k.rgb(240, 70, 70), // flash colour while attacking
  stun: k.rgb(150, 215, 240), // pale blink while a monitor is dizzy
  black: k.rgb(20, 20, 28),
  white: k.rgb(245, 245, 250),
};

type Vec2 = ReturnType<typeof k.vec2>;
type Color = ReturnType<typeof k.rgb>;

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const tileCenter = (x: number, y: number) =>
  k.vec2(BOARD_X + x * TILE + TILE / 2, BOARD_Y + y * TILE + TILE / 2);

const randInt = (min: number, max: number) => Math.floor(k.rand(min, max + 1));
const manhattan = (ax: number, ay: number, bx: number, by: number) =>
  Math.abs(ax - bx) + Math.abs(ay - by);

type Phase = "playing" | "levelclear" | "died" | "won" | "lost";

interface Enemy {
  x: number;
  y: number;
  pix: Vec2;
  name: string;
  kind: "teacher" | "monitor";
  strength: number; // teachers: starting health (hits needed at +0 power)
  hp: number; // teachers: remaining health
  alive: boolean; // monitors are always alive
  moves: boolean; // does it roam the halls?
  stepEvery: number; // seconds between moves
  moveTimer: number; // countdown to the next move
  attackTimer: number; // countdown until it can hit you again
  flashTimer: number; // > 0 means draw it red (it just attacked you)
  hurtTimer: number; // > 0 means draw it white (you just hit it)
  stunTimer: number; // monitors only: > 0 means frozen & harmless (you stunned it)
}

interface Item {
  x: number;
  y: number;
  key: string;
  collected: boolean;
}

// ---------------------------------------------------------------------------
// Game scene. It takes the level number, so advancing or restarting is just a
// matter of re-running the scene with a different argument.
// ---------------------------------------------------------------------------
k.scene("game", (level: number = 1, lives: number = START_LIVES) => {
  const teachersMove = level >= 2;
  const hasMonitors = level >= 3;

  const grid = buildGrid();
  const player: Cell = { x: PLAYER_START.x, y: PLAYER_START.y };
  let playerPix = tileCenter(player.x, player.y);

  const enemies: Enemy[] = [];
  for (const t of TEACHER_SPAWNS) {
    enemies.push({
      x: t.x,
      y: t.y,
      pix: tileCenter(t.x, t.y),
      name: t.name,
      kind: "teacher",
      strength: t.strength,
      hp: t.strength,
      alive: true,
      moves: teachersMove,
      stepEvery: TEACHER_STEP,
      moveTimer: k.rand(0, TEACHER_STEP),
      attackTimer: ATTACK_GRACE,
      flashTimer: 0,
      hurtTimer: 0,
      stunTimer: 0,
    });
  }
  if (hasMonitors) {
    for (const m of MONITOR_SPAWNS) {
      enemies.push({
        x: m.x,
        y: m.y,
        pix: tileCenter(m.x, m.y),
        name: m.name,
        kind: "monitor",
        strength: 99, // can never be defeated
        hp: 99,
        alive: true,
        moves: true,
        stepEvery: MONITOR_STEP,
        moveTimer: k.rand(0, MONITOR_STEP),
        attackTimer: ATTACK_GRACE,
        flashTimer: 0,
        hurtTimer: 0,
        stunTimer: 0,
      });
    }
  }

  const items: Item[] = ITEM_SPAWNS.map((s) => ({ x: s.x, y: s.y, key: s.key, collected: false }));
  const inventory: string[] = [];

  let health = MAX_HEALTH;
  let phase: Phase = "playing";
  let moveCd = 0;
  let clearTimer = 0;
  let diedTimer = 0;
  const introByLevel: Record<number, string> = {
    1: "Level 1: the teachers stand still. Grab tools, then defeat them!",
    2: "Level 2: the teachers are roaming the halls — be careful!",
    3: "Level 3: teachers AND hall monitors! You can't beat monitors, but Space stuns them — slip past!",
  };
  let message = introByLevel[level] ?? "Defeat every angry teacher!";

  // ----- helpers -----
  const power = () => inventory.reduce((s, key) => s + ITEM_TYPES[key].power, 0);
  const enemyAt = (x: number, y: number) =>
    enemies.find((e) => e.alive && e.x === x && e.y === y);
  // Fighting is forgiving: any of the 8 surrounding squares counts as "next to".
  const isAdjacent = (e: Enemy) =>
    Math.max(Math.abs(e.x - player.x), Math.abs(e.y - player.y)) === 1;
  const adjacentTeacher = () =>
    enemies.find((e) => e.alive && e.kind === "teacher" && isAdjacent(e));
  const adjacentMonitor = () =>
    enemies.find((e) => e.alive && e.kind === "monitor" && isAdjacent(e));
  const teachersLeft = () =>
    enemies.filter((e) => e.kind === "teacher" && e.alive).length;

  function passable(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    if (grid[y][x] === Tile.Wall) return false;
    if (enemyAt(x, y)) return false; // can't walk into an enemy
    return true;
  }

  // Where an enemy is allowed to step: open tile, not onto the player and not
  // onto another enemy (so they crowd around you and attack instead).
  function enemyCanStep(x: number, y: number, self: Enemy): boolean {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    if (grid[y][x] === Tile.Wall) return false;
    if (x === player.x && y === player.y) return false;
    const occ = enemyAt(x, y);
    if (occ && occ !== self) return false;
    return true;
  }

  function collectAt(x: number, y: number): void {
    const item = items.find((i) => !i.collected && i.x === x && i.y === y);
    if (!item) return;
    item.collected = true;
    const type = ITEM_TYPES[item.key];
    if (type.heal > 0) {
      health = Math.min(MAX_HEALTH, health + type.heal);
      message = `Picked up an ${type.name}! +${type.heal} health.`;
    } else {
      inventory.push(item.key);
      message = `Picked up the ${type.name}! Attack +${type.power}.`;
    }
  }

  function fight(): void {
    if (phase !== "playing") return;
    const t = adjacentTeacher();
    if (!t) {
      // No teacher in reach — but you can still stun a monitor to slip past it.
      const mon = adjacentMonitor();
      if (mon) {
        mon.stunTimer = STUN_TIME;
        mon.flashTimer = 0; // cancel any attack-glow; it's dizzy now
        mon.attackTimer = STUN_TIME + 0.5; // small grace so it can't hit you the instant it wakes
        message = `You stunned the ${mon.name}! Quick — slip past while it's dizzy.`;
        return;
      }
      message = "Get next to a teacher to fight (or a monitor to stun it) and press Space.";
      return;
    }
    // Every hit lands. Your tools make each hit stronger, so a well-armed
    // player knocks a teacher out in one press.
    const damage = 1 + power();
    t.hp -= damage;
    t.hurtTimer = HURT_TIME;
    if (t.hp <= 0) {
      t.alive = false;
      message = `You defeated ${t.name}!`;
      if (teachersLeft() === 0) {
        if (level < TOTAL_LEVELS) {
          phase = "levelclear";
          clearTimer = 1.8;
          message = `Level ${level} cleared! Get ready...`;
        } else {
          phase = "won";
          message = "You defeated every angry teacher in the whole school!";
        }
      }
    } else {
      message = `You hit ${t.name}! ${t.hp} health left — keep going!`;
    }
  }

  // An adjacent enemy hits the player (and glows red) once its cooldown elapses.
  function enemyAttack(e: Enemy): void {
    e.flashTimer = FLASH_TIME;
    e.attackTimer = ATTACK_COOLDOWN;
    health -= 1;
    message = `${e.name} attacks you!`;
    if (health <= 0) {
      health = 0;
      lives -= 1;
      if (lives > 0) {
        phase = "died";
        diedTimer = 1.8;
        message = `Ouch! You lost a life — ${lives} ${lives === 1 ? "life" : "lives"} left.`;
      } else {
        phase = "lost";
        message = "Out of lives — it's detention! Press R to try again.";
      }
    }
  }

  // Move one enemy a single tile: mostly chase the player, sometimes wander so
  // they don't get permanently stuck against a wall.
  function stepEnemy(e: Enemy): void {
    const opts = DIRS.map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy })).filter((c) =>
      enemyCanStep(c.x, c.y, e),
    );
    if (opts.length === 0) return;
    const chaseChance = e.kind === "monitor" ? 0.7 : 0.6;
    let choice: Cell;
    if (Math.random() < chaseChance) {
      choice = opts.reduce((best, c) =>
        manhattan(c.x, c.y, player.x, player.y) < manhattan(best.x, best.y, player.x, player.y)
          ? c
          : best,
      );
    } else {
      choice = opts[randInt(0, opts.length - 1)];
    }
    e.x = choice.x;
    e.y = choice.y;
  }

  function hint(): string {
    if (phase === "won") return "You beat the whole school! Press R to play again.";
    if (phase === "lost") return "Press R to start over from Level 1.";
    if (phase === "levelclear") return "Level complete — here comes the next one!";
    const t = adjacentTeacher();
    if (t) {
      return 1 + power() >= t.hp
        ? `Press Space to defeat ${t.name}!`
        : `Press Space to hit ${t.name} (${t.hp} health left). Tools hit harder!`;
    }
    const mon = adjacentMonitor();
    if (mon) {
      return mon.stunTimer > 0
        ? `The ${mon.name} is dizzy — run past it now!`
        : `Press Space to stun the ${mon.name} and slip past it.`;
    }
    return "Arrow keys / WASD to move. Collect tools, then fight the teachers.";
  }

  // ----- input -----
  k.onKeyPress("f", () => fight());
  k.onKeyPress("space", () => fight());
  k.onKeyPress("r", () => {
    if (phase === "won" || phase === "lost") k.go("game", 1, START_LIVES);
  });
  k.onMousePress(() => {
    if (phase === "won" || phase === "lost") {
      k.go("game", 1, START_LIVES);
      return;
    }
    // clicking an adjacent enemy is the same as pressing Space (fight teacher / stun monitor)
    const m = k.mousePos();
    const gx = Math.floor((m.x - BOARD_X) / TILE);
    const gy = Math.floor((m.y - BOARD_Y) / TILE);
    const clicked = enemyAt(gx, gy);
    if (clicked && isAdjacent(clicked)) fight();
  });

  // ----- per-frame update -----
  k.onUpdate(() => {
    const dt = k.dt();

    if (phase === "levelclear") {
      clearTimer -= dt;
      if (clearTimer <= 0) k.go("game", level + 1, lives);
      return;
    }

    if (phase === "died") {
      diedTimer -= dt;
      if (diedTimer <= 0) k.go("game", level, lives); // retry this level, fresh health
      return;
    }

    if (phase === "playing") {
      // player walking (held arrow keys move at a steady pace)
      moveCd -= dt;
      if (moveCd <= 0) {
        let dx = 0;
        let dy = 0;
        if (k.isKeyDown("left") || k.isKeyDown("a")) dx = -1;
        else if (k.isKeyDown("right") || k.isKeyDown("d")) dx = 1;
        else if (k.isKeyDown("up") || k.isKeyDown("w")) dy = -1;
        else if (k.isKeyDown("down") || k.isKeyDown("s")) dy = 1;
        if (dx !== 0 || dy !== 0) {
          const nx = player.x + dx;
          const ny = player.y + dy;
          if (passable(nx, ny)) {
            player.x = nx;
            player.y = ny;
            collectAt(nx, ny);
            moveCd = MOVE_REPEAT;
          }
        }
      }

      // enemies move + attack
      for (const e of enemies) {
        if (!e.alive) continue;
        if (e.flashTimer > 0) e.flashTimer -= dt;
        if (e.hurtTimer > 0) e.hurtTimer -= dt;
        if (e.attackTimer > 0) e.attackTimer -= dt;
        if (e.stunTimer > 0) e.stunTimer -= dt;

        // A dizzy monitor is frozen: it can't roam and it can't hit you.
        if (e.stunTimer > 0) continue;

        if (e.moves) {
          e.moveTimer -= dt;
          if (e.moveTimer <= 0) {
            e.moveTimer = e.stepEvery;
            stepEnemy(e);
          }
        }

        if (manhattan(e.x, e.y, player.x, player.y) === 1 && e.attackTimer <= 0) {
          enemyAttack(e);
          if (phase !== "playing") break;
        }
      }
    }

    // visual easing toward each pawn's logical tile (runs in every phase so
    // movement looks smooth right up to the win/lose moment)
    const easeTo = (cur: Vec2, target: Vec2, speed: number): Vec2 => {
      const d = target.sub(cur);
      const s = speed * dt;
      return d.len() <= s ? target : cur.add(d.unit().scale(s));
    };
    playerPix = easeTo(playerPix, tileCenter(player.x, player.y), PLAYER_GLIDE);
    for (const e of enemies) {
      if (e.alive) e.pix = easeTo(e.pix, tileCenter(e.x, e.y), ENEMY_GLIDE);
    }
  });

  // ----- rendering (immediate mode) -----
  function drawFace(center: Vec2, mood: "happy" | "angry" | "stunned", fill: Color): void {
    const r = 15;
    const p = (dx: number, dy: number) => center.add(k.vec2(dx, dy));
    k.drawCircle({ pos: center, radius: r, color: fill, outline: { color: COL.black, width: 2 } });

    if (mood === "stunned") {
      // dizzy: X eyes and a little "o" mouth
      k.drawLines({ pts: [p(-9, -6), p(-3, 0)], width: 2.2, color: COL.black, cap: "round" });
      k.drawLines({ pts: [p(-9, 0), p(-3, -6)], width: 2.2, color: COL.black, cap: "round" });
      k.drawLines({ pts: [p(3, -6), p(9, 0)], width: 2.2, color: COL.black, cap: "round" });
      k.drawLines({ pts: [p(3, 0), p(9, -6)], width: 2.2, color: COL.black, cap: "round" });
      k.drawCircle({ pos: p(0, 7), radius: 2.6, color: COL.black });
      return;
    }

    k.drawCircle({ pos: p(-6, -3), radius: 2.4, color: COL.black });
    k.drawCircle({ pos: p(6, -3), radius: 2.4, color: COL.black });
    if (mood === "angry") {
      k.drawLines({ pts: [p(-10, -9), p(-3, -5)], width: 2.5, color: COL.black });
      k.drawLines({ pts: [p(10, -9), p(3, -5)], width: 2.5, color: COL.black });
      k.drawLines({ pts: [p(-6, 9), p(0, 4), p(6, 9)], width: 2.5, color: COL.black, cap: "round" });
    } else {
      k.drawLines({ pts: [p(-6, 3), p(0, 8), p(6, 3)], width: 2.5, color: COL.black, cap: "round" });
    }
  }

  function drawEnemy(e: Enemy): void {
    const base = e.kind === "monitor" ? COL.monitor : COL.teacher;
    const stunned = e.stunTimer > 0;
    // dizzy monitors blink pale; otherwise white when you just hit it,
    // red when it's attacking you, normal the rest of the time.
    const fill = stunned
      ? Math.floor(e.stunTimer * 6) % 2 === 0
        ? COL.stun
        : COL.white
      : e.hurtTimer > 0
        ? COL.white
        : e.flashTimer > 0
          ? COL.attack
          : base;
    drawFace(e.pix, stunned ? "stunned" : "angry", fill);
    if (e.kind === "monitor") {
      // a little cap so monitors read as different from teachers
      k.drawRect({
        pos: e.pix.add(k.vec2(-10, -22)),
        width: 20,
        height: 6,
        radius: 2,
        color: COL.white,
        outline: { color: COL.black, width: 1 },
      });
    }
    if (stunned) {
      // two little stars circling the dizzy monitor's head
      const t = e.stunTimer * 6;
      for (const a of [0, Math.PI]) {
        const sp = e.pix.add(k.vec2(Math.cos(t + a) * 13, -24 + Math.sin(t + a) * 3));
        k.drawText({ text: "*", pos: sp, size: 16, color: COL.stun, anchor: "center" });
      }
    }
  }

  function drawHeart(center: Vec2, s: number, filled: boolean): void {
    const c = filled ? COL.heart : COL.heartEmpty;
    const p = (dx: number, dy: number) => center.add(k.vec2(dx, dy));
    k.drawCircle({ pos: p(-s * 0.35, -s * 0.12), radius: s * 0.42, color: c });
    k.drawCircle({ pos: p(s * 0.35, -s * 0.12), radius: s * 0.42, color: c });
    k.drawPolygon({ pts: [p(-s * 0.72, 0.05), p(s * 0.72, 0.05), p(0, s * 0.95)], color: c });
  }

  k.onDraw(() => {
    // board tiles — fills first, then the grid as a single overlay pass. Drawing
    // the lines per-tile (as rect outlines) made each shared edge get half
    // over-painted by the neighbouring tile drawn next; under Kaplay's letterbox
    // scaling that washed the lines out unevenly (whole columns vanished on one
    // side). A dedicated pass on top of every fill keeps the grid uniform.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = grid[y][x];
        const color =
          t === Tile.Wall ? COL.wall : t === Tile.Room ? COL.room : t === Tile.Door ? COL.door : COL.floor;
        k.drawRect({
          pos: k.vec2(BOARD_X + x * TILE, BOARD_Y + y * TILE),
          width: TILE,
          height: TILE,
          color,
        });
      }
    }
    for (let x = 0; x <= COLS; x++) {
      const px = BOARD_X + x * TILE;
      k.drawLine({ p1: k.vec2(px, BOARD_Y), p2: k.vec2(px, BOARD_BOTTOM), width: 1, color: COL.grid });
    }
    for (let y = 0; y <= ROWS; y++) {
      const py = BOARD_Y + y * TILE;
      k.drawLine({ p1: k.vec2(BOARD_X, py), p2: k.vec2(BOARD_X + COLS * TILE, py), width: 1, color: COL.grid });
    }

    // items
    for (const item of items) {
      if (item.collected) continue;
      const type = ITEM_TYPES[item.key];
      const ctr = tileCenter(item.x, item.y);
      k.drawRect({
        pos: ctr.sub(k.vec2(14, 14)),
        width: 28,
        height: 28,
        radius: 6,
        color: k.rgb(type.color[0], type.color[1], type.color[2]),
        outline: { color: COL.white, width: 2 },
      });
      k.drawText({ text: type.label, pos: ctr, size: 18, color: COL.black, anchor: "center" });
    }

    // enemies + player
    for (const e of enemies) if (e.alive) drawEnemy(e);
    drawFace(playerPix, "happy", COL.player);

    // ----- top HUD -----
    k.drawRect({ pos: k.vec2(0, 0), width: GAME_W, height: BOARD_Y, color: COL.hud });
    k.drawText({ text: "Classrooms & Angry Teachers", pos: k.vec2(16, 8), size: 18, color: COL.text });
    k.drawText({
      text: `Level ${level} / ${TOTAL_LEVELS}`,
      pos: k.vec2(GAME_W - 16, 12),
      size: 16,
      color: COL.text,
      anchor: "topright",
    });
    k.drawText({ text: "Health", pos: k.vec2(16, 34), size: 13, color: COL.dim });
    for (let i = 0; i < MAX_HEALTH; i++) {
      drawHeart(k.vec2(92 + i * 20, 40), 9, i < health);
    }
    k.drawText({ text: "Lives", pos: k.vec2(214, 34), size: 13, color: COL.dim });
    for (let i = 0; i < lives; i++) {
      k.drawCircle({
        pos: k.vec2(262 + i * 16, 40),
        radius: 6,
        color: COL.player,
        outline: { color: COL.black, width: 1.5 },
      });
    }
    k.drawText({ text: message, pos: k.vec2(16, 54), size: 13, color: COL.dim, width: GAME_W - 32 });
    k.drawText({ text: hint(), pos: k.vec2(16, 72), size: 13, color: COL.text, width: GAME_W - 32 });

    // ----- bottom HUD -----
    k.drawRect({ pos: k.vec2(0, BOARD_BOTTOM), width: GAME_W, height: HUD_BOTTOM_H, color: COL.hud });
    const tools = inventory.length
      ? inventory.map((key) => `${ITEM_TYPES[key].name} +${ITEM_TYPES[key].power}`).join("   ")
      : "none yet — grab weapons in the classrooms!";
    k.drawText({
      text: `Attack power +${power()}     Tools: ${tools}`,
      pos: k.vec2(16, BOARD_BOTTOM + 12),
      size: 13,
      color: COL.text,
      width: GAME_W - 32,
    });
    const monitorNote = hasMonitors
      ? "   •   Hall monitors can't be beaten — Space stuns them so you can slip past!"
      : "";
    k.drawText({
      text: `Angry teachers left: ${teachersLeft()} / ${TEACHER_SPAWNS.length}${monitorNote}`,
      pos: k.vec2(16, BOARD_BOTTOM + 40),
      size: 13,
      color: COL.dim,
      width: GAME_W - 32,
    });
    k.drawText({
      text: "Arrow keys / WASD: move   •   Space (or F): fight a nearby teacher   •   R: restart",
      pos: k.vec2(16, BOARD_BOTTOM + 64),
      size: 12,
      color: COL.dim,
      width: GAME_W - 32,
    });

    // ----- overlays -----
    if (phase === "levelclear") {
      k.drawRect({ pos: k.vec2(0, 0), width: GAME_W, height: GAME_H, color: COL.black, opacity: 0.55 });
      k.drawText({
        text: "LEVEL COMPLETE!",
        pos: k.vec2(GAME_W / 2, GAME_H / 2 - 16),
        size: 40,
        color: k.rgb(120, 230, 140),
        anchor: "center",
      });
      k.drawText({
        text: message,
        pos: k.vec2(GAME_W / 2, GAME_H / 2 + 28),
        size: 18,
        color: COL.text,
        anchor: "center",
      });
    } else if (phase === "died") {
      k.drawRect({ pos: k.vec2(0, 0), width: GAME_W, height: GAME_H, color: COL.black, opacity: 0.55 });
      k.drawText({
        text: "OUCH!",
        pos: k.vec2(GAME_W / 2, GAME_H / 2 - 16),
        size: 44,
        color: k.rgb(240, 170, 90),
        anchor: "center",
      });
      k.drawText({
        text: message,
        pos: k.vec2(GAME_W / 2, GAME_H / 2 + 28),
        size: 18,
        color: COL.text,
        anchor: "center",
      });
    } else if (phase === "won" || phase === "lost") {
      k.drawRect({ pos: k.vec2(0, 0), width: GAME_W, height: GAME_H, color: COL.black, opacity: 0.62 });
      k.drawText({
        text: phase === "won" ? "YOU WIN!" : "DETENTION!",
        pos: k.vec2(GAME_W / 2, GAME_H / 2 - 28),
        size: 48,
        color: phase === "won" ? k.rgb(120, 230, 140) : k.rgb(240, 110, 110),
        anchor: "center",
      });
      k.drawText({
        text: message,
        pos: k.vec2(GAME_W / 2, GAME_H / 2 + 30),
        size: 18,
        color: COL.text,
        anchor: "center",
        width: GAME_W - 100,
        align: "center",
      });
    }
  });
});

k.go("game", 1, START_LIVES);
