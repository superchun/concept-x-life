import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Console } from '../lib/Text';
import { p } from '../lib/math';
import { BAR, BG, DIM, FONT, GREEN, LINE, RED, TEXT, rgba } from '../lib/theme';
import { CAPTIONS, SCENES, STAGES } from './script';
import { SceneA, SceneB, SceneC, SceneD, SceneE, SceneF, SceneG } from './scenes';

// 把 BGM 放到 public/ 下并在这里填文件名（例如 'ep01.mp3'），留 null 则输出无声版
const BGM: string | null = null;

// C→D 是同一张地形接着讲，不做淡入淡出；其余段落之间短暂淡出再淡入
const Fade: React.FC<{ len: number; fadeIn?: boolean; fadeOut?: boolean; children: React.ReactNode }> = ({
  len,
  fadeIn = true,
  fadeOut = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const a = (fadeIn ? p(frame, 0, 8) : 1) * (fadeOut ? 1 - p(frame, len - 8, len) : 1);
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

// 顶栏：系列名、条目编号、当前讲到哪个阶段
const TopBar: React.FC = () => {
  const frame = useCurrentFrame();
  const bar = frame / BAR;
  let cur = 0;
  STAGES.forEach(([, from], i) => {
    if (bar >= from) cur = i;
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 76,
        borderBottom: `2px solid ${LINE}`,
        background: '#0e0e11',
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        fontFamily: FONT.sans,
        fontWeight: 600,
        fontSize: 32,
        color: rgba(TEXT),
      }}
    >
      <span style={{ width: 16, height: 16, borderRadius: 8, background: rgba(RED), marginRight: 16 }} />
      人生 bug 图鉴
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 26,
          color: rgba(DIM),
          marginLeft: 28,
          opacity: p(frame, SCENES.B.bar * BAR, SCENES.B.bar * BAR + 12),
        }}
      >
        BUG-001 · 局部最优
      </span>
      <span style={{ flex: 1 }} />
      {STAGES.map(([name], i) => (
        <span
          key={name}
          style={{
            marginLeft: 12,
            padding: '6px 20px',
            borderRadius: 8,
            fontSize: 28,
            color: i === cur ? '#131316' : rgba(i < cur ? TEXT : DIM, i < cur ? 0.8 : 0.6),
            background: i === cur ? rgba(i === STAGES.length - 1 || i === 3 ? GREEN : RED) : 'transparent',
            border: `2px solid ${i === cur ? 'transparent' : LINE}`,
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
};

export const Ep01: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    {scene('A', <SceneA />, { fadeIn: false })}
    {scene('B', <SceneB />)}
    {scene('C', <SceneC />, { fadeOut: false })}
    {scene('D', <SceneD />, { fadeIn: false })}
    {scene('E', <SceneE />)}
    {scene('F', <SceneF />)}
    {scene('G', <SceneG />, { fadeOut: false })}
    <TopBar />
    <Console lines={CAPTIONS} />
    {BGM && <Audio src={staticFile(BGM)} />}
  </AbsoluteFill>
);
