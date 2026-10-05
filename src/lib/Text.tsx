import React from 'react';
import { useCurrentFrame } from 'remotion';
import { p } from './math';
import { BAR, FONT, GREEN, RED, TEXT, rgba } from './theme';

// bug = 红色波浪线（像编辑器里的报错），fix = 绿色
export type Tone = 'bug' | 'fix';
const toneRgb = (tone: Tone) => (tone === 'fix' ? GREEN : RED);

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
}) => {
  const c = toneRgb(tone);
  return (
    <>
      {parse(text).map((seg) => {
        const str = seg.chars.slice(0, Math.max(0, Math.floor(shown) - seg.idx)).join('');
        if (!str) return null;
        if (!seg.hi) return <span key={seg.idx}>{str}</span>;
        return (
          <span
            key={seg.idx}
            style={{
              color: rgba(c),
              textDecoration: `underline wavy ${rgba(c)}`,
              textDecorationThickness: '0.06em',
              textUnderlineOffset: '0.22em',
            }}
          >
            {str}
          </span>
        );
      })}
    </>
  );
};

// 逐字打出的一行，末尾带光标
export const Typed: React.FC<{ text: string; start: number; tone?: Tone; perChar?: number; cursor?: boolean }> = ({
  text,
  start,
  tone,
  perChar = 1.1,
  cursor = true,
}) => {
  const frame = useCurrentFrame();
  const shown = (frame - start) / perChar;
  const done = shown >= textLength(text);
  return (
    <>
      <Rich text={text} tone={tone} shown={shown} />
      {cursor && frame >= start && (
        <span
          style={{
            display: 'inline-block',
            width: '0.5em',
            height: '1em',
            marginLeft: '0.12em',
            verticalAlign: '-0.12em',
            background: rgba(TEXT, done && frame % 30 >= 16 ? 0 : 0.85),
          }}
        />
      )}
    </>
  );
};

export type CaptionLine = { bar: number; len?: number; text: string; tone?: Tone };

// 底部的命令行：旁白一句一句打出来
export const Console: React.FC<{ lines: CaptionLine[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const l = lines.find((x) => frame >= x.bar * BAR + 3 && frame < (x.bar + (x.len ?? 1)) * BAR - 4);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 918,
        height: 162,
        borderTop: '2px solid #32323c',
        background: '#0e0e11',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 120,
        fontFamily: FONT.sans,
        fontWeight: 600,
        fontSize: 50,
        letterSpacing: 2,
        color: rgba(TEXT),
      }}
    >
      <span style={{ fontFamily: FONT.mono, color: rgba(GREEN), marginRight: 28 }}>›</span>
      {l && (
        <span style={{ opacity: 1 - p(frame, (l.bar + (l.len ?? 1)) * BAR - 10, (l.bar + (l.len ?? 1)) * BAR - 4) }}>
          <Typed key={l.bar} text={l.text} start={l.bar * BAR + 3} tone={l.tone} />
        </span>
      )}
    </div>
  );
};
