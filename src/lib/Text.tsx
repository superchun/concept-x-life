import React from 'react';
import { useCurrentFrame } from 'remotion';
import { p } from './math';
import { FONT, P, S } from './theme';

// bug = 蓝色（和怪物同色），fix = 绿色
export type Tone = 'bug' | 'fix';
const toneColor = (tone: Tone) => (tone === 'fix' ? P.lime : P.sky);

type Seg = { chars: string[]; hi: boolean; idx: number };

// 文案里用 [方括号] 标出重点词
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

export const textLength = (text: string) => text.replace(/[[\]]/g, '').length;

// shown：只显示前多少个字，用来做打字效果
export const Rich: React.FC<{ text: string; tone?: Tone; shown?: number }> = ({
  text,
  tone = 'bug',
  shown = Infinity,
}) => (
  <>
    {parse(text).map((seg) => {
      const str = seg.chars.slice(0, Math.max(0, Math.floor(shown) - seg.idx)).join('');
      if (!str) return null;
      return (
        <span key={seg.idx} style={{ color: seg.hi ? toneColor(tone) : undefined }}>
          {str}
        </span>
      );
    })}
  </>
);

export const Typed: React.FC<{ text: string; start: number; tone?: Tone; perChar?: number }> = ({
  text,
  start,
  tone,
  perChar = 1,
}) => {
  const frame = useCurrentFrame();
  return <Rich text={text} tone={tone} shown={(frame - start) / perChar} />;
};

// 按小画布坐标摆一行字。size 是实际像素，用 12 的倍数。
export const Txt: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
  scale?: number;
  children: React.ReactNode;
}> = ({ x, y, size = 48, color = P.white, align = 'left', opacity = 1, scale = 1, children }) => (
  <div
    style={{
      position: 'absolute',
      left: x * S,
      top: y * S,
      fontFamily: FONT,
      fontSize: size,
      lineHeight: 1,
      color,
      whiteSpace: 'nowrap',
      opacity,
      transform: `translateX(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}) scale(${scale})`,
      transformOrigin: align === 'left' ? 'left center' : align === 'right' ? 'right center' : 'center',
    }}
  >
    {children}
  </div>
);

export type CaptionLine = { at: number; dur: number; text: string; tone?: Tone; big?: boolean };

const OUTLINE = [-1, 0, 1]
  .flatMap((x) => [-1, 0, 1].map((y) => `${x * 4}px ${y * 4}px 0 ${P.ink}`))
  .join(',');

// 屏幕文字：普通句叠在画面下方；big 是金句，压暗画面后居中放大，用 \n 分行
export const Captions: React.FC<{ lines: CaptionLine[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const l = lines.find((x) => frame >= x.at && frame < x.at + x.dur);
  if (!l) return null;
  const fade = p(frame, l.at, l.at + 4) * (1 - p(frame, l.at + l.dur - 6, l.at + l.dur));
  if (l.big) {
    let start = l.at + 10;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26,28,44,0.8)',
          opacity: fade,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: FONT,
          fontSize: 120,
          lineHeight: '192px',
          color: P.white,
        }}
      >
        {l.text.split('\n').map((row) => {
          const node = <Typed key={row} text={row} start={start} tone={l.tone} perChar={2.2} />;
          start += textLength(row) * 2.2 + 16;
          return <div key={row} style={{ minHeight: 192 }}>{node}</div>;
        })}
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 936,
        textAlign: 'center',
        fontFamily: FONT,
        fontSize: 60,
        lineHeight: '72px',
        color: P.white,
        textShadow: OUTLINE,
        opacity: fade,
      }}
    >
      <Typed key={l.at} text={l.text} start={l.at + 2} tone={l.tone} />
    </div>
  );
};
