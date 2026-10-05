export const W = 1920;
export const H = 1080;
export const FPS = 30;
// 80 BPM, 4/4：一小节 3 秒 = 90 帧
export const BAR = 90;

// 画面先画在 480×270 的小画布上，再整数放大 4 倍，保证每个像素都是方的
export const S = 4;
export const LW = W / S;
export const LH = H / S;

// Sweetie 16 调色板，全片只用这 16 个颜色
export const P = {
  ink: '#1a1c2c',
  plum: '#5d275d',
  red: '#b13e53',
  orange: '#ef7d57',
  yellow: '#ffcd75',
  lime: '#a7f070',
  green: '#38b764',
  teal: '#257179',
  navy: '#29366f',
  blue: '#3b5dc9',
  sky: '#41a6f6',
  cyan: '#73eff7',
  white: '#f4f4f4',
  grey: '#94b0c2',
  slate: '#566c86',
  dark: '#333c57',
} as const;

// 像素字体按 12px 网格设计，字号只用 12 的倍数
export const FONT = '"Fusion Pixel","PingFang SC",sans-serif';
