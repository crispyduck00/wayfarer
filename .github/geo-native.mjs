import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(process.env.NATIVE_DEPS + '/package.json');
const { chromium } = require('playwright');
process.on('unhandledRejection', e => { if (!String(e).includes('No dialog is showing')) throw e; });
const [repo, label = 'standalone'] = process.argv.slice(2);
const output = process.env.UI_OUTPUT + '/' + label;
mkdirSync(output, { recursive: true });
const note = `# Test trip
## 2027-01-01
- [Hotel](geo:7.1,79.8) [🗺️](https://www.google.com/maps?q=7.1,79.8)
- [Beach](geo:7.2,79.9)
## 2027-01-02
- [Hotel](geo:7.1,79.8)
- [Temple](geo:7.3,80.1)
`;
const checks = [], errors = [];
let context, page, dir;
const ok = (value, name, state) => { assert(value, name + ' ' + JSON.stringify(state ?? {})); checks.push({ name, ...(state ? { state } : {}) }); console.log('PASS', label, name); };
const pause = () => page.waitForTimeout(750);
async function launch(touch = false) {
  dir = process.env.RUNNER_TEMP + '/geo-' + label + (touch ? '-touch' : '-desktop');
  for (const sub of ['vault/.obsidian/plugins/wayfarer', 'profile', 'xdg']) mkdirSync(dir + '/' + sub, { recursive: true });
  for (const file of ['main.js', 'manifest.json', 'styles.css']) copyFileSync(repo + '/' + file, dir + '/vault/.obsidian/plugins/wayfarer/' + file);
  writeFileSync(dir + '/vault/Trip.md', note);
  writeFileSync(dir + '/vault/.obsidian/community-plugins.json', '["wayfarer"]');
  writeFileSync(dir + '/vault/.obsidian/app.json', '{"safeMode":false}');
  const sources = [{ id: 'one', name: 'Street', url: 'https://tiles.test/{z}/{x}/{y}.png', attribution: 'Test street', maxZoom: 19 }, { id: 'two', name: 'Hybrid', url: 'https://tiles.test/hybrid/{z}/{x}/{y}.png', attribution: 'Test imagery', maxZoom: 19 }];
  writeFileSync(dir + '/vault/.obsidian/plugins/wayfarer/data.json', JSON.stringify({ autoOpen: false, googleApiKey: '', tileUrl: sources[0].url, tileAttribution: 'Test tiles', mapSources: sources, defaultMapSource: 'one', dayHeadingLevel: 2, overviewHeadingLevel: 0, listOpen: true, followCursor: false, uiLanguage: 'en' }));
  writeFileSync(dir + '/profile/obsidian.json', JSON.stringify({ autoUpdate: false, vaults: { geo: { path: dir + '/vault', ts: Date.now(), open: true } } }));
  const layout = { main: { id: 'main', type: 'split', direction: 'vertical', children: [{ id: 'tabs', type: 'tabs', children: [{ id: 'note', type: 'leaf', state: { type: 'markdown', state: { file: 'Trip.md', mode: 'preview', source: false } } }] }] }, right: { id: 'right', type: 'split', direction: 'horizontal', width: touch ? 350 : 700, children: [{ id: 'right-tabs', type: 'tabs', children: [{ id: 'empty-right', type: 'leaf', state: { type: 'empty', state: {} } }] }] }, active: 'note', lastOpenFiles: ['Trip.md'] };
  writeFileSync(dir + '/vault/.obsidian/workspace.json', JSON.stringify(layout));
  context = await chromium.launchPersistentContext(dir + '/profile', { executablePath: process.env.OBSIDIAN_BIN, headless: true, args: ['--ozone-platform=headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'], env: { ...process.env, XDG_CONFIG_HOME: dir + '/xdg' }, viewport: null, hasTouch: touch, timeout: 30000 });
  await context.route('https://tiles.test/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8eee1"/></svg>' }));
  page = context.pages()[0];
  await page.setViewportSize(touch ? { width: 412, height: 915 } : { width: 1600, height: 1000 });
  page.on('pageerror', e => errors.push(String(e)));
  await page.waitForFunction(() => !!window.app?.workspace?.layoutReady);
  const trust = page.getByRole('button', { name: 'Trust author and enable plugins', exact: true });
  if (await trust.count()) await trust.click();
  await page.waitForFunction(() => !!app.plugins.plugins.wayfarer);
  await page.evaluate(async () => {
    app.workspace.leftSplit.collapse();
    window.__md = app.workspace.getLeavesOfType('markdown')[0].view;
    await __md.leaf.openFile(app.vault.getAbstractFileByPath('Trip.md'), { state: { mode: 'preview' } });
    const p = app.plugins.plugins.wayfarer; p.refresh(); await p.openMap();
  });
  await pause();
  await page.evaluate(async () => { const p = app.plugins.plugins.wayfarer; p.refresh(); await p.openMap(); });
  await page.waitForFunction(() => app.workspace.getLeavesOfType('wayfarer').some(l => l.view.isReady));
  await page.evaluate(() => {
    window.__v = app.workspace.getLeavesOfType('wayfarer').find(l => l.view.isReady).view;
    window.__external = [];
    document.addEventListener('click', e => {
      const a = e.target.closest?.('a, .cm-link, .cm-url');
      if (!a || !a.closest('.markdown-reading-view, .markdown-source-view')) return;
      __external.push({ text: a.textContent, href: a.getAttribute('href'), prevented: e.defaultPrevented, ctrl: e.ctrlKey, button: e.button });
      // Stop OS/browser launch only after observing what the plugin left intact.
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);
  });
  await pause();
}
const reading = (name, index = 0) => page.locator('.markdown-reading-view a').filter({ hasText: new RegExp('^' + name + '$') }).nth(index);
async function state() { return page.evaluate(() => ({ focus: __v.focused?.name, line: __v.focused?.line, pinned: __v.pinnedDay, active: __v.activeDay, markers: __v.markers.size, maps: app.workspace.getLeavesOfType('wayfarer').length, mode: __md.getMode(), external: __external.length, popup: !!__v.map?._popup, narrow: __v.isNarrow() })); }
async function clickReading(name, index = 0, touch = false) { if (touch) await reading(name, index).tap(); else await reading(name, index).click(); await pause(); }
async function editMode(source) {
  await page.evaluate(async source => { app.workspace.setActiveLeaf(__md.leaf, { focus: true }); await __md.setState({ ...__md.getState(), mode: 'source', source }, {}); __md.editor.setCursor({ line: 0, ch: 0 }); }, source);
  await page.waitForTimeout(300);
}
try {
  await launch();
  ok(await page.evaluate(() => !app.plugins.plugins.wayfarer.settings.followGeoLinks), 'existing installation defaults to external geo links');
  await clickReading('Hotel', 1);
  let s = await state(); ok(s.external === 1 && s.focus == null, 'disabled Reading click retains external activation', s);
  const href = await reading('Hotel', 1).getAttribute('href');
  ok(href?.startsWith('https://'), 'Reading anchor retains its real external destination', { href });
  await page.evaluate(() => { app.plugins.plugins.wayfarer.settings.followGeoLinks = true; });
  await clickReading('Hotel', 1); s = await state();
  ok(s.focus === 'Hotel' && s.line === 5 && s.maps === 1 && s.popup && s.external === 1 && s.pinned === -1, 'Reading click selects the exact repeated visit in the existing All map', s);
  await page.evaluate(() => document.dispatchEvent(new Event('selectionchange'))); await pause(); s = await state();
  ok(s.line === 5, 'hidden Reading editor cursor does not replace the clicked visit', s);
  ok(await reading('Hotel', 1).getAttribute('href') === href, 'following does not replace the external href');
  for (const patch of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { button: 2 }]) {
    const before = (await state()).external;
    await reading('Hotel', 1).dispatchEvent('click', { bubbles: true, cancelable: true, ...patch });
    ok((await state()).external === before + 1, 'modified/middle/right activation reaches the host: ' + JSON.stringify(patch));
  }
  const beforeMenu = (await state()).external;
  const menu = await reading('Hotel', 1).evaluate(a => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); a.dispatchEvent(e); return { href: a.href, prevented: e.defaultPrevented }; });
  await page.keyboard.press('Escape');
  ok(menu.href === href && (await state()).external === beforeMenu, 'native contextmenu keeps the external target without a geo jump', menu);
  await clickReading('🗺️');
  ok((await state()).external === beforeMenu + 1, 'Google companion remains external');
  await editMode(false);
  const beach = page.locator('.markdown-source-view .cm-link').filter({ hasText: /^Beach$/ }).first();
  await beach.click(); await pause(); s = await state();
  ok(s.focus === 'Beach' && s.line === 3 && s.maps === 1, 'actual Live Preview label click follows its source stop', s);
  await editMode(true);
  const temple = page.locator('.markdown-source-view .cm-link').filter({ hasText: /^Temple$/ }).first();
  await temple.click(); await pause(); s = await state();
  ok(s.focus === 'Temple' && s.line === 6, 'actual Source mode label click follows its source stop', s);
  await page.evaluate(async () => { const p = app.plugins.plugins.wayfarer; p.settings.followGeoLinks = true; await p.saveSettings(); await __md.setState({ ...__md.getState(), mode: 'preview' }, {}); });
  await pause();
  if (label === 'combined') {
    const wide = await page.evaluate(() => ({ zoom: getComputedStyle(__v.contentEl.querySelector('.leaflet-control-zoom')).visibility, layers: getComputedStyle(__v.contentEl.querySelector('.leaflet-control-layers')).visibility }));
    ok(wide.layers === 'visible', 'wide popup retains the normal basemap control', wide);
  }
  ok(readFileSync(dir + '/vault/Trip.md', 'utf8') === note, 'desktop clicks leave the note byte-identical');
  await page.screenshot({ path: output + '/desktop.png' });
  await context.close(); context = null;
  await launch(true);
  await page.evaluate(async () => {
    window.require('obsidian').Platform.isMobile = true;
    const p = app.plugins.plugins.wayfarer; p.settings.followGeoLinks = true;
    __v.leaf.detach(); app.workspace.setActiveLeaf(__md.leaf, { focus: true });
  });
  await pause();
  await clickReading('Hotel', 1, true);
  await page.evaluate(() => { window.__v = app.workspace.getLeavesOfType('wayfarer').find(l => l.view.isReady)?.view; });
  s = await state();
  ok(s.maps === 1 && s.line === 5 && s.pinned === -1 && s.narrow && s.popup, 'touch/mobile branch opens one map on All at the tapped visit', s);
  ok(await page.evaluate(() => app.workspace.activeLeaf === __v.leaf), 'mobile geo tap reveals the map tab');
  if (label === 'combined') {
    const controls = async () => page.evaluate(() => ({ zoom: getComputedStyle(__v.contentEl.querySelector('.leaflet-control-zoom')).visibility, layers: getComputedStyle(__v.contentEl.querySelector('.leaflet-control-layers')).visibility }));
    let c = await controls(); ok(c.zoom === 'hidden' && c.layers === 'hidden', 'narrow popup hides basemap and zoom controls together', c);
    await page.screenshot({ path: output + '/mobile-popup.png' });
    await page.evaluate(() => __v.map.closePopup()); await pause();
    c = await controls(); ok(c.zoom === 'visible' && c.layers === 'visible', 'closing the popup restores both controls', c);
    await page.locator('.wf-list-toggle').tap(); c = await controls();
    ok(c.zoom === 'hidden' && c.layers === 'hidden', 'narrow stop list hides both controls', c);
    await page.locator('.wf-map-toggle').tap(); c = await controls();
    ok(c.zoom === 'visible' && c.layers === 'visible', 'returning to map restores both controls', c);
  }
  await page.evaluate(() => app.workspace.setActiveLeaf(__md.leaf, { focus: true })); await pause();
  await clickReading('Temple', 0, true); s = await state();
  ok(s.maps === 1 && s.line === 6 && s.popup, 'a second mobile tap reuses the map tab', s);
  await page.evaluate(() => { app.workspace.setActiveLeaf(__md.leaf, { focus: true }); window.__mobileLink = document.querySelector('.markdown-reading-view a.wf-geo-link'); }); await pause();
  const longPress = await page.evaluate(() => { let untouched; const listener = e => { untouched = !e.defaultPrevented; e.preventDefault(); }; document.addEventListener('contextmenu', listener, { once: true, capture: true }); const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); __mobileLink.dispatchEvent(e); return untouched; });
  ok(longPress, 'mobile contextmenu/long-press event is not consumed by the feature');
  ok(readFileSync(dir + '/vault/Trip.md', 'utf8') === note, 'touch clicks leave the note byte-identical');
  ok(errors.length === 0, 'no renderer errors during geo navigation', errors);
  writeFileSync(output + '/result.json', JSON.stringify({ label, obsidian: '1.15.1', checks, errors, scope: 'Official desktop renderer with actual Reading/Live Preview/Source clicks and 412px touch emulation. Mobile Platform flag exercises map-tab behavior; contextmenu events test non-interception, not physical Android menus. No physical Android test.' }, null, 2) + '\n');
} catch (error) {
  console.error(error.stack ?? String(error)); process.exitCode = 1;
  try { console.error('STATE', JSON.stringify(await state())); console.error((await page.locator('body').innerText()).slice(-12000)); console.error(await page.locator('.markdown-source-view').evaluate(el => el.outerHTML.slice(0,25000))); await page.screenshot({ path: output + '/failure.png' }); } catch {}
} finally { await context?.close(); }
