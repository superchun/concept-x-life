import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { PixelWipe } from '../lib/PixelWipe';
import { Captions } from '../lib/Text';
import { clamp01 } from '../lib/math';
import { BAR, FONT, P, S } from '../lib/theme';
import { Action, End } from './ending';
import { Hook, Level } from './level';
import { AT, LINES, STAGES, TOTAL_BARS } from './script';
import { Symptoms, Title } from './symptoms';

// 把 BGM 放到 public/ 下并在这里填文件名（例如 'ep01.mp3'），留 null 则输出无声版
const BGM: string | null = null;

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

// 症状前后和结尾两屏用像素块转场；关卡内部只靠镜头移动，不切画面
const CUTS = [AT.symptoms * BAR, AT.level * BAR, AT.action * BAR, AT.end * BAR];

export const Ep01: React.FC = () => (
  <AbsoluteFill style={{ background: P.ink }}>
    {seq(AT.hook, AT.symptoms, <Hook />)}
    {seq(AT.symptoms, AT.title, <Symptoms />)}
    {seq(AT.title, AT.level, <Title />)}
    {seq(AT.level, AT.action, <Level />)}
    {seq(AT.action, AT.end, <Action />)}
    {seq(AT.end, TOTAL_BARS, <End />)}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
    <Captions lines={LINES} />
    <PixelWipe cuts={CUTS} />
    <Progress />
    {BGM && <Audio src={staticFile(BGM)} />}
  </AbsoluteFill>
);
