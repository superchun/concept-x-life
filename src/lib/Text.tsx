import React from 'react';
import { useCurrentFrame } from 'remotion';
import { p } from './math';
import { FONT, P, S } from './theme';

// bug = 橙色，fix = 绿色
export type Tone = 'bug' | 'fix';
const toneColor = (tone: Tone) => (tone === 'fix' ? P.lime : P.orange);

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

export type DialogLine = { at: number; dur: number; text: string; tone?: Tone };

// 底部的游戏对话框：旁白一句一句打出来，打完后右下角的箭头闪烁
export const Dialog: React.FC<{ lines: DialogLine[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const l = lines.find((x) => frame >= x.at && frame < x.at + x.dur);
  if (!l) return null;
  const done = frame - l.at - 2 >= textLength(l.text);
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        top: 872,
        width: 1792,
        height: 176,
        boxSizing: 'border-box',
        border: `8px solid ${P.white}`,
        outline: `8px solid ${P.ink}`,
        background: P.ink,
        padding: '22px 44px',
        fontFamily: FONT,
        fontSize: 48,
        lineHeight: '60px',
        color: P.white,
        opacity: p(frame, l.at, l.at + 2),
      }}
    >
      <Typed key={l.at} text={l.text} start={l.at + 2} tone={l.tone} />
      {done && frame % 24 < 14 && (
        <span style={{ position: 'absolute', right: 30, bottom: 12, fontSize: 36, color: P.yellow }}>▼</span>
      )}
    </div>
  );
};
