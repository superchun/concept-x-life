import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { H, W } from './theme';

export type Draw = (ctx: CanvasRenderingContext2D, frame: number) => void;

// 每帧清空后整幅重画。draw 只能依赖帧号，不能依赖上一帧留下的像素。
export const Canvas: React.FC<{ draw: Draw; opacity?: number }> = ({ draw, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    draw(ctx, frame);
    ctx.restore();
  }, [frame, draw]);
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, opacity }} />;
};
