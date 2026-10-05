export const W = 1920;
export const H = 1080;
export const FPS = 30;
// 80 BPM, 4/4：一小节 3 秒 = 90 帧。所有字幕和段落都按小节对齐。
export const BAR = 90;

export type Rgb = [number, number, number];
// 系列配色：墨蓝坐标纸底、米白线稿，青色和黄色两支荧光笔
export const WHITE: Rgb = [238, 232, 216];
export const COLD: Rgb = [92, 214, 200];
export const HOT: Rgb = [255, 208, 60];
export const INK: Rgb = [12, 22, 28];
export const BG = '#0c161c';

export const rgba = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export const FONT = {
  serif: '"Songti SC","Noto Serif SC","Source Han Serif SC",serif',
  sans: '"PingFang SC","Hiragino Sans GB","STHeiti",sans-serif',
  mono: '"SF Mono",Menlo,monospace',
  latin: '"Times New Roman",Georgia,serif',
};
