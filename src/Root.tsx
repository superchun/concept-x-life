import './lib/font';
import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover, CoverTall } from './ep01/Cover';
import { Ep01 } from './ep01/Ep01';
import { TOTAL_BARS } from './ep01/script';
import { Cast } from './ep02/Cast';
import { BAR, FPS, H, W } from './lib/theme';

export const Root: React.FC = () => (
  <>
    <Composition id="Ep01" component={Ep01} durationInFrames={TOTAL_BARS * BAR} fps={FPS} width={W} height={H} />
    <Still id="Ep01Cover" component={Cover} width={W} height={H} />
    <Still id="Ep01CoverTall" component={CoverTall} width={H} height={W} />
    <Still id="Ep02Cast" component={Cast} width={W} height={H} />
  </>
);
