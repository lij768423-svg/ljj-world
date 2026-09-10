import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const destination = 'tmp/service-art-gallery';
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('portfolio-language', 'zh');
    localStorage.setItem('portfolio-color-mode', 'light');
    localStorage.setItem('portfolio-pointer-trail', 'off');
  });
  await page.goto('http://127.0.0.1:4176/systems', { waitUntil: 'networkidle' });
  const cards = [];
  for (const trigger of ['聚焦网络与入口模块', '聚焦 GPU 与 AI 模块', '聚焦 CPU 与内存模块', '聚焦 NVMe 数据模块', '聚焦 Docker 容器模块']) {
    await page.locator('.server-story').getByRole('button', { name: trigger }).locator('.machine-module-action').click();
    for (let index = 0; index < 5; index += 1) {
      await page.locator('.server-story-module-list button').nth(index).click();
      const artwork = page.locator('.server-story-service-page .service-art');
      await artwork.waitFor({ state: 'visible' });
      const service = await artwork.getAttribute('data-service-art');
      const title = await artwork.locator('title').textContent();
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.service-art image')).every(image => {
        const probe = new Image();
        probe.src = image.getAttribute('href');
        return probe.complete;
      }));
      const file = `${destination}/${service}.png`;
      await artwork.screenshot({ path: file });
      cards.push({ title, data: (await readFile(file)).toString('base64') });
      await page.locator('.server-story-service-back').click();
    }
    await page.locator('.server-story-stage').click({ position: { x: 720, y: 24 } });
  }
  await page.setViewportSize({ width: 1500, height: 1600 });
  await page.setContent(`<html><style>body{margin:0;padding:30px;background:#f3f4f1;color:#171915;font-family:Arial,sans-serif}h1{font-size:25px;margin:0 0 10px}p{font-size:13px;color:#666;margin:0 0 22px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{border:1px solid #d7d9d2;padding:9px}img{width:100%;display:block}h2{font-size:15px;margin:8px 0 0}h2:before{content:'— ';color:#c63d2a}</style><h1>SERVICE ILLUSTRATIONS / 25</h1><p>Technical line drawings · Monochrome · Red annotations · Intranet preview</p><div class="grid">${cards.map(card => `<article><img src="data:image/png;base64,${card.data}"><h2>${card.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</h2></article>`).join('')}</div></html>`);
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.screenshot({ path: `${destination}/service-art-gallery.png`, fullPage: true });
  console.log(`Captured ${cards.length} service illustrations from intranet :4176`);
} finally {
  await browser.close();
}
