export const W = 1920;
export const H = 1080;
export const FPS = 30;
// 80 BPM, 4/4：一小节 3 秒 = 90 帧。所有字幕和段落都按小节对齐。
export const BAR = 90;

export type Rgb = [number, number, number];
export const WHITE: Rgb = [242, 240, 234];
export const COLD: Rgb = [124, 199, 255];
export const HOT: Rgb = [255, 122, 61];
export const BG = '#07080b';

export const rgba = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export const FONT = {
  serif: '"Songti SC","Noto Serif SC","Source Han Serif SC",serif',
  mono: '"SF Mono",Menlo,monospace',
  latin: '"Times New Roman",Georgia,serif',
};
