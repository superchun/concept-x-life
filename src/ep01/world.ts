import { lerp } from '../lib/math';
import { BG, FONT, W, rgba, type Rgb, WHITE } from '../lib/theme';
import { f } from './sim';
import { BUMPS, FIELD, FIELD_SIM, f2 } from './sim2d';
import { HOT, COLD } from '../lib/theme';
import { mix } from '../lib/math';

// 一维地形的镜头：世界坐标 (cx, cy) 落在画面 (960, 620)，z 是放大倍数
export type Cam = { cx: number; cy: number; z: number };
export const FULL: Cam = { cx: 0.5, cy: 0.4, z: 1 };
const SX = 1660;
const SY = 560;

export const proj = (x: number, y: number, c: Cam): [number, number] => [
  W / 2 + (x - c.cx) * c.z * SX,
  620 - (y - c.cy) * c.z * SY,
];
// 曲线上一点的屏幕坐标
export const on = (x: number, c: Cam) => proj(x, f(x), c);

export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  z: lerp(a.z, b.z, t),
});

export const drawLandscape = (ctx: CanvasRenderingContext2D, cam: Cam, alpha = 1) => {
  // 曲线下方的剖面线，往下渐隐
  for (let sx = 7; sx < W; sx += 14) {
    const x = cam.cx + (sx - W / 2) / (cam.z * SX);
    if (x < -0.03 || x > 1.03) continue;
    const top = proj(x, f(x), cam)[1];
    const g = ctx.createLinearGradient(0, top, 0, top + 190);
    g.addColorStop(0, rgba(WHITE, 0.2 * alpha));
    g.addColorStop(1, rgba(WHITE, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, top + 5);
    ctx.lineTo(sx, top + 190);
    ctx.stroke();
  }
  // 横轴和刻度
  const [ax0, ay] = proj(-0.03, 0, cam);
  const [ax1] = proj(1.03, 0, cam);
  ctx.strokeStyle = rgba(WHITE, 0.3 * alpha);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ax0, ay);
  ctx.lineTo(ax1, ay);
  for (let i = 0; i <= 20; i++) {
    const [tx] = proj(i / 20, 0, cam);
    ctx.moveTo(tx, ay);
    ctx.lineTo(tx, ay + (i % 2 === 0 ? 14 : 7));
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= 520; i++) {
    const x = -0.03 + (i / 520) * 1.06;
    const [sx, sy] = proj(x, f(x), cam);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = rgba(WHITE, 0.95 * alpha);
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.stroke();
};

// 实心点加一圈细环，像图纸上的标记点
export const dot = (
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  r: number,
  c: Rgb,
  alpha = 1,
) => {
  if (alpha <= 0.01) return;
  ctx.fillStyle = rgba(c, alpha);
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(c, alpha * 0.4);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(sx, sy, r + 4.5, 0, Math.PI * 2);
  ctx.stroke();
};

export const label = (
  ctx: CanvasRenderingContext2D,
  str: string,
  sx: number,
  sy: number,
  o: { size?: number; c?: Rgb; alpha?: number; font?: string; align?: CanvasTextAlign; weight?: number } = {},
) => {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.01) return;
  ctx.font = `${o.weight ?? 600} ${o.size ?? 26}px ${o.font ?? FONT.sans}`;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(o.c ?? WHITE, alpha);
  ctx.fillText(str, sx, sy);
};

// ---- 二维地形（高潮段）----

// 伪透视：y 越大越靠近镜头，行距和横向宽度都更大
const proj2 = (x: number, y: number, h: number): [number, number] => {
  const k = 0.72 + 0.28 * y;
  return [W / 2 + (x - 0.5) * 1560 * k, 330 + y * 500 - h * 250 * k];
};

const ROWS = 54;

export const drawField = (ctx: CanvasRenderingContext2D, step: number, alpha = 1) => {
  // 山脊线从远到近画，每一行先用背景色盖住身后的线
  for (let r = 0; r <= ROWS; r++) {
    const y = r / ROWS;
    const ridge = () => {
      ctx.beginPath();
      for (let i = 0; i <= 150; i++) {
        const x = i / 150;
        const [sx, sy] = proj2(x, y, f2(x, y));
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
    };
    ridge();
    const [rx, ry] = proj2(1, y, 0);
    const [lx] = proj2(0, y, 0);
    ctx.lineTo(rx, ry + 40);
    ctx.lineTo(lx, ry + 40);
    ctx.closePath();
    ctx.fillStyle = BG;
    ctx.fill();
    ridge();
    ctx.strokeStyle = rgba(WHITE, alpha * (0.14 + 0.26 * y));
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const s = Math.max(0, Math.min(FIELD.steps, Math.floor(step)));
  const t = FIELD_SIM.temp[s];
  // 热的时候偏橙，冷下来接近白；开场还没加热时是冷蓝
  const warm = mix(WHITE, HOT, Math.min(1, t * 1.6));
  const c = s < 6 ? COLD : warm;
  const TRAIL = 16;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < FIELD.n; i++) {
    let px = 0;
    let py = 0;
    for (let k = Math.max(0, s - TRAIL); k <= s; k++) {
      const fr = FIELD_SIM.pos[k];
      const x = fr[i * 2];
      const y = fr[i * 2 + 1];
      const [sx, sy] = proj2(x, y, f2(x, y));
      if (k > Math.max(0, s - TRAIL)) {
        const a = ((k - (s - TRAIL)) / TRAIL) ** 2;
        ctx.strokeStyle = rgba(c, alpha * 0.55 * a);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      px = sx;
      py = sy;
    }
    ctx.fillStyle = rgba(c, alpha * 0.95);
    ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
  }
  // 冷却后最高峰上的光晕
  const glow = Math.max(0, (s / FIELD.steps - 0.72) / 0.28);
  if (glow > 0) {
    const [gx, gy] = proj2(BUMPS[0][0], BUMPS[0][1], BUMPS[0][2]);
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 300);
    g.addColorStop(0, rgba(HOT, alpha * 0.2 * glow));
    g.addColorStop(1, rgba(HOT, 0));
    ctx.fillStyle = g;
    ctx.fillRect(gx - 300, gy - 300, 600, 600);
  }
  ctx.restore();
};
