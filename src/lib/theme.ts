export const W = 1920;
export const H = 1080;
export const FPS = 30;
// 80 BPM, 4/4：一小节 3 秒 = 90 帧。所有字幕和段落都按小节对齐。
export const BAR = 90;

export type Rgb = [number, number, number];
// 《人生 bug 图鉴》配色：深灰界面底，红 = bug / 卡住，绿 = 修复 / 通过，黄 = 运行中
export const TEXT: Rgb = [236, 233, 226];
export const DIM: Rgb = [139, 139, 150];
export const RED: Rgb = [255, 92, 96];
export const GREEN: Rgb = [53, 211, 154];
export const YELLOW: Rgb = [255, 207, 74];
export const BLOCK: Rgb = [44, 44, 54];
export const BG = '#131316';
export const PANEL = '#1c1c21';
export const LINE = '#32323c';

export const rgba = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export const FONT = {
  sans: '"PingFang SC","Hiragino Sans GB","STHeiti",sans-serif',
  mono: '"SF Mono",Menlo,"PingFang SC",monospace',
};
