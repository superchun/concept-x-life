import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Captions } from '../lib/Text';
import { p } from '../lib/math';
import { BAR, BG, FONT, HOT, WHITE, rgba } from '../lib/theme';
import { CAPTIONS, SCENES, TOTAL_BARS } from './script';
import { SceneA, SceneB, SceneC, SceneD, SceneE, SceneF, SceneG } from './scenes';

// 把 BGM 放到 public/ 下并在这里填文件名（例如 'ep01.mp3'），留 null 则输出无声版
const BGM: string | null = null;

// C→D 是同一张地形图接着讲，不做淡入淡出；其余段落之间过一下黑
const Fade: React.FC<{ len: number; fadeIn?: boolean; fadeOut?: boolean; children: React.ReactNode }> = ({
  len,
  fadeIn = true,
  fadeOut = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const a = (fadeIn ? p(frame, 0, 10) : 1) * (fadeOut ? 1 - p(frame, len - 10, len) : 1);
  return <AbsoluteFill style={{ opacity: a }}>{children}</AbsoluteFill>;
};

const scene = (
  key: keyof typeof SCENES,
  node: React.ReactNode,
  fade: { fadeIn?: boolean; fadeOut?: boolean } = {},
) => {
  const { bar, len } = SCENES[key];
  return (
    <Sequence key={key} from={bar * BAR} durationInFrames={len * BAR}>
      <Fade len={len * BAR} {...fade}>
        {node}
      </Fade>
    </Sequence>
  );
};

const GRID = (step: number, a: number) =>
  `linear-gradient(rgba(238,232,216,${a}) 1px, transparent 1px) 0 0 / ${step}px ${step}px, ` +
  `linear-gradient(90deg, rgba(238,232,216,${a}) 1px, transparent 1px) 0 0 / ${step}px ${step}px`;

// 底部进度尺：每段一个刻度，走过的部分涂成黄色
const Ruler: React.FC = () => {
  const frame = useCurrentFrame();
  const total = TOTAL_BARS * BAR;
  const label: React.CSSProperties = {
    position: 'absolute',
    top: 1026,
    fontFamily: FONT.mono,
    fontSize: 20,
    letterSpacing: 3,
    color: rgba(WHITE, 0.5),
  };
  return (
    <>
      <div style={{ ...label, left: 60 }}>概念 × 人生</div>
      <div style={{ ...label, right: 60 }}>No.01</div>
      <div style={{ position: 'absolute', left: 240, right: 160, top: 1039, height: 2, background: rgba(WHITE, 0.18) }}>
        <div style={{ width: `${(frame / total) * 100}%`, height: 2, background: rgba(HOT) }} />
        {Object.values(SCENES).map((s) => (
          <div
            key={s.bar}
            style={{
              position: 'absolute',
              left: `${(s.bar / TOTAL_BARS) * 100}%`,
              top: -6,
              width: 2,
              height: 14,
              background: rgba(WHITE, frame >= s.bar * BAR ? 0.9 : 0.3),
            }}
          />
        ))}
      </div>
    </>
  );
};

export const Ep01: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <AbsoluteFill style={{ background: `${GRID(48, 0.035)}, ${GRID(240, 0.07)}` }} />
    {scene('A', <SceneA />, { fadeIn: false })}
    {scene('B', <SceneB />)}
    {scene('C', <SceneC />, { fadeOut: false })}
    {scene('D', <SceneD />, { fadeIn: false })}
    {scene('E', <SceneE />)}
    {scene('F', <SceneF />, { fadeOut: false })}
    {scene('G', <SceneG />, { fadeIn: false, fadeOut: false })}
    <Captions lines={CAPTIONS} />
    <Ruler />
    <AbsoluteFill
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }}
    />
    {BGM && <Audio src={staticFile(BGM)} />}
  </AbsoluteFill>
);
