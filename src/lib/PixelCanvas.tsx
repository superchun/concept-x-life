import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { H, LH, LW, W } from './theme';

export type Draw = (ctx: CanvasRenderingContext2D, frame: number) => void;

// 低分辨率画布，每帧清空后整幅重画。draw 只能依赖帧号。
export const PixelCanvas: React.FC<{ draw: Draw }> = ({ draw }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LW, LH);
    ctx.save();
    draw(ctx, frame);
    ctx.restore();
  }, [frame, draw]);
  return (
    <canvas
      ref={ref}
      width={LW}
      height={LH}
      style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, imageRendering: 'pixelated' }}
    />
  );
};
