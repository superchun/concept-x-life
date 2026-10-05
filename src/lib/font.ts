import { continueRender, delayRender, staticFile } from 'remotion';

// Fusion Pixel（OFL 许可），字体文件和许可证在 public/fonts
const handle = delayRender('加载像素字体');
const face = new FontFace(
  'Fusion Pixel',
  `url(${staticFile('fonts/fusion-pixel-12px-proportional-zh_hans.otf.woff2')})`,
);
face
  .load()
  .then(() => {
    document.fonts.add(face);
    continueRender(handle);
  })
  .catch((err) => {
    throw new Error(`像素字体加载失败：${err}`);
  });
