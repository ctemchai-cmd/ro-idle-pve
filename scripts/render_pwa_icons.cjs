// Rasterize our code-native SVG mark at exact app-icon sizes; no game-library images are modified.
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.RO_PLAYWRIGHT_MODULE || '/private/tmp/ro-idle-prep/tools/node_modules/playwright-core');
(async () => {
  const root = path.resolve(__dirname, '..'), svg = fs.readFileSync(path.join(root, 'pwa/pwa/icon.svg'), 'utf8');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.RO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    for (const [file, size, opaque, maskable] of [['icon-192.png', 192, false, false], ['icon-512.png', 512, false, false], ['icon-maskable-512.png', 512, true, true], ['apple-touch-icon.png', 180, true, false]]) {
      const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      const drawing = maskable ? svg.replace('viewBox="0 0 512 512"', 'viewBox="-64 -64 640 640"') : svg;
      await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:${opaque ? '#4b79d0' : 'transparent'}}svg{display:block;width:100%;height:100%}</style>${drawing}`);
      await page.screenshot({ path: path.join(root, 'pwa/pwa', file), omitBackground: !opaque }); await page.close();
    }
  } finally { await browser.close(); }
  console.log('Created 192/512/maskable512/Apple180 app icons from pwa/pwa/icon.svg');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
