import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, p } from './math';
import { BAR, COLD, FONT, HOT, INK, WHITE, rgba, type Rgb } from './theme';

export type Tone = 'cold' | 'hot';
const toneRgb = (tone: Tone): Rgb => (tone === 'hot' ? HOT : COLD);

type Seg = { chars: string[]; hi: boolean; idx: number };

// 文案里用 [方括号] 标出要划重点的词
const parse = (text: string): Seg[] => {
  const segs: Seg[] = [];
  let hi = false;
  let idx = 0;
  let cur: Seg = { chars: [], hi, idx };
  const flush = () => {
    if (cur.chars.length) segs.push(cur);
    cur = { chars: [], hi, idx };
  };
  for (const ch of text) {
    if (ch === '[' || ch === ']') {
      hi = ch === '[';
      flush();
    } else {
      cur.chars.push(ch);
      idx++;
    }
  }
  flush();
  return segs;
};

// 逐字淡入的一行字；重点词出现后，一道荧光笔从左划到右，字变成深色。
// start 是这一行开始出现的帧（相对当前 Sequence）。
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
      {parse(text).map((seg) => {
        const t0 = start + seg.idx * perChar;
        const n = seg.chars.length;
        const swipe = seg.hi ? ease(p(frame, t0 + n * perChar * 0.5, t0 + n * perChar * 0.5 + 12)) : 0;
        const chars = seg.chars.map((ch, i) => (
          <span
            key={i}
            style={{
              position: 'relative',
              opacity: p(frame, t0 + i * perChar, t0 + i * perChar + 9),
              color: swipe > (i + 0.5) / n ? rgba(INK) : undefined,
            }}
          >
            {ch}
          </span>
        ));
        if (!seg.hi) return <React.Fragment key={seg.idx}>{chars}</React.Fragment>;
        return (
          <span
            key={seg.idx}
            style={{ position: 'relative', display: 'inline-block', padding: '0 0.14em', margin: '0 0.05em' }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '10%',
                bottom: '4%',
                width: `${swipe * 100}%`,
                background: rgba(c),
                borderRadius: 5,
                transform: 'skewX(-7deg)',
              }}
            />
            {chars}
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
              top: 912,
              textAlign: 'center',
              fontFamily: FONT.sans,
              fontWeight: 600,
              fontSize: 48,
              letterSpacing: 3,
              color: rgba(WHITE),
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
}> = ({ lines, out, top = 360 }) => {
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
        <div key={i} style={{ fontSize: l.size ?? 92, lineHeight: 1.6, letterSpacing: 4 }}>
          <Reveal text={l.text} start={l.at} tone={l.tone} perChar={2.2} />
        </div>
      ))}
    </div>
  );
};
