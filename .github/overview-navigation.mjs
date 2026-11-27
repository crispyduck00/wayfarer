import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(process.env.NATIVE_DEPS + '/package.json');
const { chromium } = require('playwright');
process.on('unhandledRejection', e => { if (!String(e).includes('No dialog is showing')) throw e; });
const [repo, label = 'overview'] = process.argv.slice(2);
const base = process.env.RUNNER_TEMP + '/overview-navigation-' + label;
const output = process.env.UI_OUTPUT + '/' + label;
mkdirSync(output, { recursive: true });
const note = `# Sri Lanka
## Colombo - 2026-12-27
- [Colombo](geo:6.9271,79.8612)
### 2026-12-27 Arrival
- [Airport](geo:7.1808,79.8841)
- [Colombo hotel](geo:6.9300,79.8600)
- [Colombo beach](geo:6.9200,79.8500)
## Negombo - 2026-12-28 - 2026-12-30
- [Negombo](geo:7.2083,79.8358)
### 2026-12-28 Beach day
- [Negombo beach](geo:7.2200,79.8300)
### 2026-12-29 Mangroves
- [Mangroves](geo:7.2300,79.8500)
- [Lagoon](geo:7.2000,79.8400)
## Kandy - 2026-12-31
- [Kandy](geo:7.2906,80.6337)
### 2026-12-31 Kandy day
- [Kandy temple](geo:7.2936,80.6413)
`;
const checks = [], errors = [];
let context, page;
const ok = (value, name, state) => { assert(value, name + ' ' + JSON.stringify(state ?? {})); checks.push({ name, ...(state ? { state } : {}) }); console.log('PASS', label, name); };
async function launch(touch = false) {
  const dir = base + (touch ? '-touch' : '-desktop');
  for (const sub of ['vault/.obsidian/plugins/wayfarer', 'profile', 'xdg']) mkdirSync(dir + '/' + sub, { recursive: true });
  for (const file of ['main.js', 'manifest.json', 'styles.css']) copyFileSync(repo + '/' + file, dir + '/vault/.obsidian/plugins/wayfarer/' + file);
  writeFileSync(dir + '/vault/Trip.md', note);
  writeFileSync(dir + '/vault/.obsidian/community-plugins.json', '["wayfarer"]');
  writeFileSync(dir + '/vault/.obsidian/app.json', '{"safeMode":false}');
  writeFileSync(dir + '/vault/.obsidian/plugins/wayfarer/data.json', JSON.stringify({ autoOpen: false, googleApiKey: '', tileUrl: 'https://tiles.test/{z}/{x}/{y}.png', tileAttribution: 'Local deterministic test tiles', dayHeadingLevel: 3, overviewHeadingLevel: 2, listOpen: true, followCursor: true, uiLanguage: 'en' }));
  writeFileSync(dir + '/profile/obsidian.json', JSON.stringify({ autoUpdate: false, vaults: { navigation: { path: dir + '/vault', ts: Date.now(), open: true } } }));
  const layout = { main: { id: 'main', type: 'split', direction: 'vertical', children: [{ id: 'tabs', type: 'tabs', children: [{ id: 'note', type: 'leaf', state: { type: 'markdown', state: { file: 'Trip.md', mode: 'source', source: true } } }] }] }, right: { id: 'right', type: 'split', direction: 'horizontal', width: touch ? 350 : 700, children: [{ id: 'right-tabs', type: 'tabs', children: [{ id: 'empty-right', type: 'leaf', state: { type: 'empty', state: {} } }] }] }, active: 'note', lastOpenFiles: ['Trip.md'] };
  writeFileSync(dir + '/vault/.obsidian/workspace.json', JSON.stringify(layout));
  context = await chromium.launchPersistentContext(dir + '/profile', { executablePath: process.env.OBSIDIAN_BIN, headless: true, args: ['--ozone-platform=headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'], env: { ...process.env, XDG_CONFIG_HOME: dir + '/xdg' }, viewport: null, hasTouch: touch, timeout: 30000 });
  await context.route('https://tiles.test/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8eee1"/><path d="M0 128H256M128 0V256" stroke="#bbc7ae"/></svg>' }));
  page = context.pages()[0];
  await page.setViewportSize(touch ? { width: 412, height: 915 } : { width: 1600, height: 1000 });
  page.on('pageerror', e => errors.push(String(e)));
  await page.waitForFunction(() => !!window.app?.workspace?.layoutReady);
  const trust = page.getByRole('button', { name: 'Trust author and enable plugins', exact: true });
  if (await trust.count()) await trust.click();
  await page.waitForFunction(() => !!app.plugins.plugins.wayfarer);
  await page.evaluate(async () => { app.workspace.leftSplit.collapse(); const md = app.workspace.getLeavesOfType('markdown')[0]; await md.openFile(app.vault.getAbstractFileByPath('Trip.md'), { state: { mode: 'source', source: true } }); const p = app.plugins.plugins.wayfarer; p.refresh(); await p.openMap(); });
  await page.waitForTimeout(800);
  await page.evaluate(async () => { const p = app.plugins.plugins.wayfarer; p.refresh(); await p.openMap(); });
  await page.waitForFunction(() => app.workspace.getLeavesOfType('wayfarer').some(l => l.view.isReady));
  await page.evaluate(() => { window.__nav = app.workspace.getLeavesOfType('wayfarer').find(l => l.view.isReady).view; __nav.contentEl.dataset.navigationTest = 'map'; });
  await page.waitForTimeout(400);
  return dir;
}
const root = () => page.locator('[data-navigation-test="map"]');
async function state() { return page.evaluate(() => { const v = __nav, all = v.legendEl.querySelector('.wf-chip-all:not(.wf-layer-toggle)'); return { overview: v.showOverview, pinned: v.pinnedDay, active: v.activeDay, focus: v.focused?.name ?? null, all: all?.getAttribute('aria-pressed') === 'true', selector: v.legendEl.querySelector('select')?.value, cards: v.stripEl.querySelectorAll('.wf-stop').length, markers: v.markers.size, cursor: app.workspace.getLeavesOfType('markdown')[0].view.editor.getCursor().line, center: v.map.getCenter(), zoom: v.map.getZoom(), revision: v.cameraRevision, narrow: v.isNarrow() }; }); }
async function at(needle) {
  await page.evaluate(needle => { const md = app.workspace.getLeavesOfType('markdown')[0].view; const line = md.editor.getValue().split('\n').findIndex(l => l.includes(needle)); if (line < 0) throw Error('Missing source line ' + needle); app.workspace.setActiveLeaf(md.leaf, { focus: true }); md.editor.scrollIntoView({ from: { line, ch: 0 }, to: { line, ch: 0 } }, true); }, needle);
  await page.locator('.markdown-source-view .cm-line').filter({ hasText: needle }).first().click({ position: { x: 6, y: 6 } });
  await page.waitForTimeout(250);
}
const settle = () => page.waitForTimeout(800);
try {
  const dir = await launch();
  ok(!(await state()).narrow, 'desktop fixture exposes the wide chip bar');
  await root().locator('.wf-chip[aria-label="2026-12-28 Beach day (1)"]').click();
  ok((await state()).pinned === 1, 'explicit day selection pins that day');
  await root().locator('.wf-layer-toggle').click();
  let s = await state(); ok(s.overview && s.pinned === -1 && s.all && s.cards === 3 && s.markers === 3, 'Trip overview opens the entire route after a fixed day', s);
  await at('[Colombo](geo:'); s = await state(); ok(s.overview && s.focus === 'Colombo' && s.all && s.cards === 3, 'actual source click focuses a parent city without leaving All', s);
  await at('[Negombo](geo:'); s = await state(); ok(s.overview && s.focus === 'Negombo' && s.all && s.selector === '-1', 'another parent city retains overview and All', s);
  await at('[Airport](geo:'); s = await state(); ok(!s.overview && s.focus === 'Airport' && s.pinned === -1 && s.all && s.markers === 7 && s.cards === 7, 'child stop opens daily All at its own stop', s);
  await at('[Mangroves](geo:'); s = await state(); ok(!s.overview && s.focus === 'Mangroves' && s.all && s.cards === 7, 'daily cursor follows across days without selecting a date tab', s);
  await root().locator('.wf-chip[aria-label="2026-12-27 Arrival (3)"]').click();
  await at('[Negombo beach](geo:'); s = await state(); ok(!s.overview && s.pinned === 0 && s.focus === null && s.cards === 3, 'an explicitly pinned day still ignores another day', s);
  await root().locator('.wf-layer-toggle').click(); s = await state(); ok(s.overview && s.all && s.cards === 3, 'returning to overview clears the day filter', s);
  await at('## Kandy -'); s = await state(); ok(s.overview && s.active === 2 && s.all && s.cards === 3, 'parent heading focuses its stage while keeping the overview list', s);
  await page.evaluate(() => __nav.fitAll(__nav.itinerary.stops)); await settle();
  await root().locator('.leaflet-marker-icon[title="Negombo"]').click();
  s = await state(); ok(s.overview && s.focus === 'Negombo' && s.active === 1 && s.all && s.cursor === note.split('\n').findIndex(l => l.includes('[Negombo](geo:')), 'map pin reveals its parent source without triggering daily drilldown', s);
  await root().locator('.wf-stop').filter({ hasText: 'Colombo' }).click();
  s = await state(); ok(s.overview && s.focus === 'Colombo' && s.active === 0 && s.all, 'overview card and source click use the same city selection', s);
  await root().locator('.wf-follow').click(); await settle(); const camera = await state();
  await at('[Lagoon](geo:'); await settle(); s = await state(); ok(!s.overview && s.focus === 'Lagoon' && s.all && s.revision === camera.revision && s.zoom === camera.zoom && Math.abs(s.center.lat - camera.center.lat) < 1e-8 && Math.abs(s.center.lng - camera.center.lng) < 1e-8, 'disabled Follow cursor changes layers without moving the camera', s);
  await root().locator('.wf-follow').click();
  await at('[Negombo](geo:'); await settle();
  await root().locator('.leaflet-marker-icon[title="Negombo"]').click();
  await root().getByRole('button', { name: '2026-12-29 Mangroves', exact: true }).click();
  s = await state(); ok(!s.overview && s.pinned === 2 && s.cursor === note.split('\n').findIndex(l => l === '### 2026-12-29 Mangroves') && s.cards === 2, 'explicit child-plan button selects its day and exact source heading', s);
  ok(readFileSync(dir + '/vault/Trip.md', 'utf8') === note, 'desktop navigation leaves Markdown byte-identical');
  await context.close(); context = null;
  const touchDir = await launch(true);
  ok((await state()).narrow, '412px touch fixture uses the narrow selector');
  await root().locator('.wf-day-select').selectOption('1');
  await root().locator('.wf-day-select').selectOption('layer');
  s = await state(); ok(s.overview && s.all && s.selector === '-1' && s.markers === 3, 'narrow selector opens overview All after a fixed day', s);
  await root().locator('.wf-list-toggle').tap();
  ok((await state()).cards === 3, 'narrow overview list contains all cities');
  await root().locator('.wf-stop').filter({ hasText: 'Negombo' }).tap();
  s = await state(); ok(s.overview && s.focus === 'Negombo' && s.all, 'touch city selection retains overview All', s);
  await root().locator('.wf-day-select').selectOption('layer');
  await root().locator('.wf-day-select').selectOption('layer');
  s = await state(); ok(s.overview && s.all && s.markers === 3, 'repeated touch layer switching does not restore a stale filter', s);
  await page.screenshot({ path: output + '/overview-navigation.png' });
  ok(readFileSync(touchDir + '/vault/Trip.md', 'utf8') === note, 'touch navigation leaves Markdown byte-identical');
  ok(errors.length === 0, 'no renderer errors during navigation', errors);
  writeFileSync(output + '/result.json', JSON.stringify({ label, obsidian: '1.15.1', checks, errors, scope: 'Official desktop renderer, actual source/tab/card/pin clicks and 412px touch emulation. Physical Android remains manual.' }, null, 2) + '\n');
} catch (error) {
  console.error(error.stack ?? String(error)); process.exitCode = 1;
  try { console.error('STATE', JSON.stringify(await state())); console.error(await page.locator('body').innerText()); await page.screenshot({ path: output + '/failure.png' }); } catch {}
} finally { await context?.close(); }
