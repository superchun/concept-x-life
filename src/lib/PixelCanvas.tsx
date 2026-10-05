import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { LH, LW, S } from './theme';

export type Draw = (ctx: CanvasRenderingContext2D, frame: number) => void;


// 低分辨率画布，每帧清空后整幅重画。draw 只能依赖帧号。
// bloom：把同一帧再复制到一层模糊的画布上叠加，亮的像素会晕出光。
// lw / lh：画布的逻辑尺寸，默认是横屏的 480×270，竖版封面会传别的值。
export const PixelCanvas: React.FC<{ draw: Draw; bloom?: boolean; lw?: number; lh?: number }> = ({
  draw,
  bloom,
  lw = LW,
  lh = LH,
}) => {
  const style: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: lw * S, height: lh * S };
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx || !ref.current) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, lw, lh);
    ctx.save();
    draw(ctx, frame);
    ctx.restore();
    const g = glow.current?.getContext('2d');
    if (g) {
      g.clearRect(0, 0, lw, lh);
      g.drawImage(ref.current, 0, 0);
    }
  }, [frame, draw, lw, lh]);
  return (
    <>
      <canvas ref={ref} width={lw} height={lh} style={{ ...style, imageRendering: 'pixelated' }} />
      {bloom && (
        <canvas
          ref={glow}
          width={lw}
          height={lh}
          style={{ ...style, filter: 'brightness(0.8) contrast(1.9) blur(14px)', mixBlendMode: 'screen', opacity: 0.6 }}
        />
      )}
    </>
  );
};
