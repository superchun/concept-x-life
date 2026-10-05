import React, { useCallback } from 'react';
import { PixelCanvas, type Draw } from './PixelCanvas';
import { rng } from './math';
import { LH, LW, P } from './theme';

const CELL = 20;
const COLS = LW / CELL;
const ROWS = Math.ceil(LH / CELL);
const ORDER = (() => {
  const r = rng(99);
  return Array.from({ length: COLS * ROWS }, () => r());
})();
const HALF = 9;

// 像素块转场：在每个切换点前 9 帧把画面一块块盖住，后 9 帧再一块块揭开
export const PixelWipe: React.FC<{ cuts: number[] }> = ({ cuts }) => {
  const draw: Draw = useCallback(
    (ctx, fr) => {
      const cut = cuts.find((c) => Math.abs(fr - c) <= HALF);
      if (cut === undefined) return;
      const cover = 1 - Math.abs(fr - cut) / HALF;
      ctx.fillStyle = P.ink;
      for (let i = 0; i < ORDER.length; i++) {
        if (ORDER[i] <= cover * 1.15) ctx.fillRect((i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL, CELL);
      }
    },
    [cuts],
  );
  return <PixelCanvas draw={draw} />;
};
