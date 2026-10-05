import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Captions } from '../lib/Text';
import { p } from '../lib/math';
import { BAR, BG } from '../lib/theme';
import { CAPTIONS, SCENES } from './script';
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

export const Ep01: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <AbsoluteFill
      style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(40,46,62,0.5) 0%, rgba(7,8,11,0) 70%)' }}
    />
    {scene('A', <SceneA />, { fadeIn: false })}
    {scene('B', <SceneB />)}
    {scene('C', <SceneC />, { fadeOut: false })}
    {scene('D', <SceneD />, { fadeIn: false })}
    {scene('E', <SceneE />)}
    {scene('F', <SceneF />, { fadeOut: false })}
    {scene('G', <SceneG />, { fadeIn: false, fadeOut: false })}
    <Captions lines={CAPTIONS} />
    <AbsoluteFill
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }}
    />
    {BGM && <Audio src={staticFile(BGM)} />}
  </AbsoluteFill>
);
