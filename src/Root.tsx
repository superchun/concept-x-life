import './lib/font';
import React from 'react';
import { Composition } from 'remotion';
import { Ep01 } from './ep01/Ep01';
import { TOTAL_BARS } from './ep01/script';
import { BAR, FPS, H, W } from './lib/theme';

export const Root: React.FC = () => (
  <Composition id="Ep01" component={Ep01} durationInFrames={TOTAL_BARS * BAR} fps={FPS} width={W} height={H} />
);
