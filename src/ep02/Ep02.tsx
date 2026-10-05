import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { PixelWipe } from '../lib/PixelWipe';
import { Captions } from '../lib/Text';
import { clamp01 } from '../lib/math';
import { BAR, FONT, P, S } from '../lib/theme';
import { Action, End } from './ending';
import { Hook, Lab, Room } from './room';
import { AT, LINES, STAGES, TOTAL_BARS } from './script';
import { SFX } from './sfx';
import { Symptoms, Title } from './symptoms';

// 把 BGM 放到 public/ 下并在这里填文件名（例如 'ep02.mp3'），留 null 则输出无声版
const BGM: string | null = null;
// 音效是 scripts/sfx.ts 合成的，这里可以整体关掉
const SFX_ON = true;

// 顶部进度条：五个阶段按时长分段，随时间连续填充
const Progress: React.FC = () => {
  const bar = useCurrentFrame() / BAR;
  return (
    <div style={{ position: 'absolute', left: 16 * S, top: 6 * S, width: 448 * S, height: 12 * S, display: 'flex', gap: 2 * S }}>
      {STAGES.map(([name, from], i) => {
        const to = STAGES[i + 1]?.[1] ?? TOTAL_BARS;
        const fill = clamp01((bar - from) / (to - from));
        return (
          <div key={name} style={{ flex: to - from, position: 'relative', background: 'rgba(51,60,87,0.8)', overflow: 'hidden' }}>
            {/* 填充按 2% 一格前进，保持像素感 */}
            <div style={{ width: `${Math.floor(fill * 50) * 2}%`, height: '100%', background: fill >= 1 ? P.teal : P.green }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                fontFamily: FONT,
                fontSize: 36,
                lineHeight: `${12 * S}px`,
                textAlign: 'center',
                color: fill > 0 ? P.white : P.grey,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const seq = (from: number, to: number, node: React.ReactNode) => (
  <Sequence from={from * BAR} durationInFrames={(to - from) * BAR}>
    {node}
  </Sequence>
);

// 症状前后、进出实验、回到开场时用像素块转场；命名到词条卡、整段卧室都是连续镜头
const CUTS = [AT.symptoms * BAR, AT.lab * BAR, AT.room * BAR, AT.action * BAR];

export const Ep02: React.FC = () => (
  <AbsoluteFill style={{ background: P.ink }}>
    {seq(AT.hook, AT.symptoms, <Hook />)}
    {seq(AT.symptoms, AT.title, <Symptoms />)}
    {seq(AT.title, AT.lab, <Title />)}
    {seq(AT.lab, AT.room, <Lab />)}
    {seq(AT.room, AT.action, <Room />)}
    {seq(AT.action, AT.end, <Action />)}
    {seq(AT.end, TOTAL_BARS, <End />)}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(17,18,29,0.9) 0%, rgba(17,18,29,0.6) 12%, rgba(17,18,29,0) 24%)' }} />
    <Captions lines={LINES} />
    <PixelWipe cuts={CUTS} />
    <Progress />
    {SFX_ON &&
      SFX.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={90}>
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.vol ?? 1} />
        </Sequence>
      ))}
    {BGM && <Audio src={staticFile(BGM)} />}
  </AbsoluteFill>
);
