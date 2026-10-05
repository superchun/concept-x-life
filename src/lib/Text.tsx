import React from 'react';
import { useCurrentFrame } from 'remotion';
import { p } from './math';
import { BAR, COLD, FONT, HOT, WHITE, rgba, type Rgb } from './theme';

export type Tone = 'cold' | 'hot';
const toneRgb = (tone: Tone): Rgb => (tone === 'hot' ? HOT : COLD);

type Char = { ch: string; hi: boolean };

// 文案里用 [方括号] 标出要高亮的词
const parse = (text: string): Char[] => {
  const out: Char[] = [];
  let hi = false;
  for (const ch of text) {
    if (ch === '[') hi = true;
    else if (ch === ']') hi = false;
    else out.push({ ch, hi });
  }
  return out;
};

// 逐字淡入的一行字。start 是这一行开始出现的帧（相对当前 Sequence）。
export const Reveal: React.FC<{
  text: string;
  start: number;
  tone?: Tone;
  perChar?: number;
  style?: React.CSSProperties;
}> = ({ text, start, tone = 'cold', perChar = 1.3, style }) => {
  const frame = useCurrentFrame();
  const c = toneRgb(tone);
  return (
    <span style={style}>
      {parse(text).map((k, i) => {
        const a = p(frame, start + i * perChar, start + i * perChar + 9);
        return (
          <span
            key={i}
            style={{
              opacity: a,
              color: k.hi ? rgba(c) : undefined,
              textShadow: k.hi ? `0 0 22px ${rgba(c, 0.75)}` : undefined,
            }}
          >
            {k.ch}
          </span>
        );
      })}
    </span>
  );
};

export type CaptionLine = { bar: number; len?: number; text: string; tone?: Tone };

export const Captions: React.FC<{ lines: CaptionLine[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {lines.map((l) => {
        const start = l.bar * BAR + 4;
        const end = (l.bar + (l.len ?? 1)) * BAR - 6;
        if (frame < start || frame >= end) return null;
        return (
          <div
            key={l.bar}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 930,
              textAlign: 'center',
              fontFamily: FONT.serif,
              fontWeight: 700,
              fontSize: 50,
              letterSpacing: 2,
              color: rgba(WHITE),
              textShadow: '0 2px 18px rgba(0,0,0,0.9)',
              opacity: 1 - p(frame, end - 9, end),
            }}
          >
            <Reveal text={l.text} start={start} tone={l.tone} />
          </div>
        );
      })}
    </>
  );
};

// 居中的大字金句。每行各自的出现帧，整体在 out 帧前淡出。
export const BigText: React.FC<{
  lines: { text: string; at: number; size?: number; tone?: Tone }[];
  out: number;
  top?: number;
}> = ({ lines, out, top = 380 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        textAlign: 'center',
        fontFamily: FONT.serif,
        fontWeight: 900,
        color: rgba(WHITE),
        opacity: 1 - p(frame, out - 14, out),
      }}
    >
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontSize: l.size ?? 92,
            lineHeight: 1.5,
            letterSpacing: 4,
            textShadow: '0 0 34px rgba(255,255,255,0.28)',
          }}
        >
          <Reveal text={l.text} start={l.at} tone={l.tone} perChar={2.2} />
        </div>
      ))}
    </div>
  );
};
