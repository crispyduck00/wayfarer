import { createRequire } from 'node:module';
import { writeFileSync, copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(process.env.NATIVE_DEPS+'/package.json');
const {chromium}=require('playwright');
process.on('unhandledRejection',e=>{if(String(e).includes('Page.handleJavaScriptDialog')&&String(e).includes('No dialog is showing'))return;throw e;});
const repo=process.argv[2],label=process.argv[3]??'standalone',closing=label.endsWith('-close');
const base=process.env.RUNNER_TEMP+'/obsidian-native-'+label,output=process.env.UI_OUTPUT+'/'+label;
mkdirSync(output,{recursive:true});
for(const folder of ['vault/.obsidian/plugins/wayfarer','profile-pipe','xdg'])mkdirSync(base+'/'+folder,{recursive:true});
for(const f of ['main.js','manifest.json','styles.css'])copyFileSync(repo+'/'+f,base+'/vault/.obsidian/plugins/wayfarer/'+f);
writeFileSync(base+'/vault/.obsidian/plugins/wayfarer/data.json',JSON.stringify({autoOpen:false,googleApiKey:'',tileUrl:'https://tiles.test/legacy/{z}/{x}/{y}.png?key=TEST-SECRET',tileAttribution:'Legacy local tiles',dayHeadingLevel:2,overviewHeadingLevel:0}));
writeFileSync(base+'/vault/.obsidian/community-plugins.json','["wayfarer"]');
writeFileSync(base+'/vault/.obsidian/app.json','{"safeMode":false}');
const noteBefore='# Trip\n\n## 2027-01-01 Trip day\n\n- [Start](geo:35,139)\n  Departure point.\n\n- [Target](geo:36,140)\n  Destination.\n';
writeFileSync(base+'/vault/Trip.md',noteBefore);
writeFileSync(base+'/profile-pipe/obsidian.json',JSON.stringify({autoUpdate:false,vaults:{nativecheck:{path:base+'/vault',ts:Date.now(),open:true}}}));
const layout={main:{id:'main',type:'split',direction:'vertical',children:[{id:'tabs',type:'tabs',children:[{id:'note',type:'leaf',state:{type:'markdown',state:{file:'Trip.md',mode:'preview',source:false}}}]}]},right:{id:'right',type:'split',direction:'horizontal',width:350,children:[{id:'right-tabs',type:'tabs',children:[{id:'empty-right',type:'leaf',state:{type:'empty',state:{}}}]}]},active:'note',lastOpenFiles:['Trip.md']};
const checks=[],requests=[],pageErrors=[];let slow=false,offline=false,context,page,editorPage,touchMode=false;
const ok=(v,n)=>{assert(v,n);checks.push(n);console.log('PASS:',label,n);};
async function launch(touch=false){
 touchMode=touch;writeFileSync(base+'/vault/.obsidian/workspace.json',JSON.stringify(layout));
 context=await chromium.launchPersistentContext(base+'/profile-pipe',{executablePath:process.env.OBSIDIAN_BIN,headless:true,args:['--ozone-platform=headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],env:{...process.env,XDG_CONFIG_HOME:base+'/xdg'},viewport:touch?{width:412,height:915}:{width:1280,height:900},hasTouch:touch,timeout:30000});
 await context.route(/https?:\/\/(tiles\.test|tiles\.internal)\//,async route=>{
  const u=new URL(route.request().url());requests.push(u.pathname);
  if(offline){await route.abort('internetdisconnected').catch(()=>{});return;}
  if(slow)await new Promise(r=>setTimeout(r,300));
  const code=Number(u.pathname.match(/\/status\/(\d+)/)?.[1]??200),name=u.pathname.split('/')[1];
  const color={legacy:'#dcebd4',satellite:'#526453',hybrid:'#63766a'}[name]??'#dcebd4';
  const body=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${color}"/><path d="M0 60L256 180 M30 0L200 256" stroke="#bbc7a5" stroke-width="6"/><path d="M0 128H256M128 0V256" stroke="#809080" stroke-width="1"/><text x="12" y="25" fill="#445544" font-size="15">${name} · test tiles</text></svg>`;
  await route.fulfill({status:code,contentType:'image/svg+xml',body:code===200?body:'Test tile failure'}).catch(()=>{});
 });
 page=context.pages()[0];page.on('pageerror',e=>{pageErrors.push(e.stack??String(e));console.log('Native page error:',e.stack??String(e));});
 await page.waitForFunction(()=>!!window.app?.workspace?.layoutReady,null,{timeout:25000});
 const trust=page.getByRole('button',{name:'Trust author and enable plugins',exact:true});if(await trust.count())await trust.click();
 await page.waitForFunction(()=>!!app.plugins.plugins.wayfarer,null,{timeout:15000});
 await page.evaluate(async()=>{const file=app.vault.getAbstractFileByPath('Trip.md');await app.workspace.getLeaf(false).openFile(file,{state:{mode:'preview'}});const p=app.plugins.plugins.wayfarer;p.refresh();await p.openMap();});
 await page.waitForFunction(()=>app.workspace.getLeavesOfType('wayfarer').some(l=>l.view.isReady));
 await page.evaluate(()=>{const v=app.workspace.getLeavesOfType('wayfarer').find(l=>l.view.isReady).view;v.contentEl.dataset.basemapTest='first';window.__basemapTest={first:v};});
}
const state=()=>page.evaluate(()=>{const v=__basemapTest.first,m=v.map;let tiles=0;m.eachLayer(l=>{if(l._url)tiles++;});return{active:v.basemaps?.activeId,tiles,markers:v.markers.size,zoom:m.getZoom(),sources:app.plugins.plugins.wayfarer.settings.mapSources,remembered:app.loadLocalStorage('wayfarer:basemap')};});
async function choose(name,owner='first',settle=true){
 const root=page.locator(`[data-basemap-test="${owner}"]`),radio=root.getByRole('radio',{name,exact:true});
 if(touchMode){if(!await radio.isVisible())await root.getByRole('button',{name:'Map source',exact:true}).tap();await radio.tap();}
 else{await root.locator('.leaflet-control-layers').hover();await radio.check();}
 if(settle)await page.waitForFunction(o=>{const v=__basemapTest[o],m=v.map,s=app.plugins.plugins.wayfarer.settings.mapSources.find(s=>s.id===v.basemaps.activeId);return !m._animatingZoom&&!m._panAnim?._inProgress&&m.getZoom()>=(s?.minZoom??0)&&m.getZoom()<=(s?.maxZoom??30)},owner);
}
const modal=()=>editorPage.locator('.modal').filter({has:editorPage.getByRole('heading',{name:'Map sources',exact:true})});
const row=name=>modal().locator('.setting-item').filter({has:editorPage.locator('.setting-item-name').filter({hasText:new RegExp('^'+name+'$')})});
async function openEditor(){
 await page.evaluate(()=>{app.setting.open();app.setting.openTabById('wayfarer');});
 for(let i=0;i<50;i++){const owners=await Promise.all(context.pages().map(async p=>await p.getByRole('button',{name:'Manage map sources',exact:true}).count()?p:null)),settings=owners.find(Boolean);if(settings){await settings.getByRole('button',{name:'Manage map sources',exact:true}).click();break;}await page.waitForTimeout(100);}
 for(let i=0;i<50;i++){const owners=await Promise.all(context.pages().map(async p=>await p.getByRole('heading',{name:'Map sources',exact:true}).count()?p:null));editorPage=owners.find(Boolean);if(editorPage){if(touchMode)await editorPage.setViewportSize({width:412,height:915});return;}await page.waitForTimeout(100);}
 throw Error('Map-source settings did not open');
}
async function edit(name,url,max=19){await row('Name').getByRole('textbox').fill(name);await row('Tile URL').getByRole('textbox').fill(url);await modal().getByLabel('Maximum zoom',{exact:true}).fill(String(max));await row('Attribution').locator('textarea').fill('Local test tiles');}
try{
 await launch();
 if(closing){
  await page.waitForTimeout(600);pageErrors.length=0;
  await page.evaluate(()=>{const m=__basemapTest.first.map;m.setView([35,139],13,{animate:false});m.setZoom(14,{animate:true});});
  await page.waitForFunction(()=>__basemapTest.first.map._animatingZoom===true);
  await page.evaluate(()=>__basemapTest.first.leaf.detach());await page.waitForTimeout(650);
  const report={label,version:'1.15.1',animatedBeforeClose:true,pageErrors};writeFileSync(output+'/result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }else{
  await page.evaluate(()=>app.saveLocalStorage('wayfarer:basemap',null));
  let s=await state();ok(s.sources.length===1&&s.sources[0].url.includes('TEST-SECRET'),'legacy custom URL survives migration');
  ok(await page.getByRole('button',{name:'Map source',exact:true}).count()===0,'one source has no switcher');
  await openEditor();await modal().getByRole('button',{name:'Add',exact:true}).click();await edit('Discard me','https://tiles.test/{apikey}/{z}/{x}/{y}.png');
  await modal().getByRole('button',{name:'Save',exact:true}).click();ok(await modal().isVisible()&&(await state()).sources.length===1,'invalid template is rejected without saving');
  await modal().getByRole('button',{name:'Cancel',exact:true}).click();ok((await state()).sources.length===1,'cancel leaves settings unchanged');
  await openEditor();await edit('Street','https://tiles.test/legacy/{z}/{x}/{y}.png?key=TEST-SECRET');
  await modal().getByRole('button',{name:'Add',exact:true}).click();await edit('Satellite','https://tiles.test/satellite/{z}/{x}/{y}.png',16);
  await modal().getByRole('button',{name:'Add',exact:true}).click();await edit('Hybrid','https://tiles.test/hybrid/{z}/{x}/{y}.png');
  await modal().getByRole('button',{name:'Move source up',exact:true}).click();await row('Default map').getByRole('combobox').selectOption({label:'Hybrid'});
  ok((await state()).sources.length===1,'draft edits do not change the active configuration');
  await row('Edit source').getByRole('combobox').selectOption({label:'Satellite'});await editorPage.setViewportSize({width:900,height:1100});await modal().screenshot({path:output+'/map-sources-settings.png'});
  await modal().getByRole('button',{name:'Save',exact:true}).click();await page.evaluate(()=>app.setting.close());
  s=await state();ok(s.sources.map(s=>s.name).join(',')==='Street,Hybrid,Satellite','add/edit/reorder/default are saved');
  ok(!requests.some(p=>p.startsWith('/satellite/')||p.startsWith('/hybrid/')),'inactive backgrounds make no tile requests');
  await page.evaluate(()=>{const v=__basemapTest.first;app.workspace.setActiveLeaf(v.leaf,{focus:true});v.chooseDay(v.itinerary.days[0]);v.map.setView([35.6,139.6],19);const stop=v.itinerary.stops[0];v.setFocus(stop);v.openPopup(stop);app.plugins.plugins.wayfarer.refresh();});
  await page.waitForTimeout(150);await page.waitForFunction(()=>{const m=__basemapTest.first.map;return !m._animatingZoom&&!m._panAnim?._inProgress});
  await page.evaluate(()=>{const v=__basemapTest.first;__basemapTest.scene={map:v.map,layer:v.layer,markers:[...v.markers.values()],popup:v.map._popup,focused:v.focused,pinned:v.pinnedHeading,center:v.map.getCenter()};});
  await choose('Satellite');s=await state();ok(s.zoom===16&&s.tiles===1,'out-of-range source remains selectable and clamps zoom');
  ok(await page.evaluate(()=>{const v=__basemapTest.first,b=__basemapTest.scene;return v.map===b.map&&v.layer===b.layer&&[...v.markers.values()].every((m,i)=>m===b.markers[i])&&v.map._popup===b.popup&&v.focused===b.focused&&v.pinnedHeading===b.pinned&&v.map.getCenter().equals(b.center,1e-7)}),'switch preserves map, center, markers, routes, popup and filter');
  await choose('Hybrid');ok((await state()).zoom===16,'switching to a higher maximum does not zoom in');
  await page.locator('[data-basemap-test="first"] .leaflet-control-layers').hover();await page.locator('[data-basemap-test="first"]').screenshot({path:output+'/map-sources-switcher.png'});
  await page.evaluate(async()=>{const l=app.workspace.createLeafBySplit(app.workspace.getLeavesOfType('markdown')[0],'vertical');await l.setViewState({type:'wayfarer',active:true});await app.workspace.revealLeaf(l);});
  await page.waitForFunction(()=>app.workspace.getLeavesOfType('wayfarer').filter(l=>l.view.isReady).length===2);
  await page.evaluate(()=>{const v=app.workspace.getLeavesOfType('wayfarer').find(l=>l.view!==__basemapTest.first&&l.view.isReady).view;v.contentEl.dataset.basemapTest='second';__basemapTest.second=v;});
  ok(await page.evaluate(()=>__basemapTest.second.basemaps.activeId===app.loadLocalStorage('wayfarer:basemap')),'new view uses the device-local selection');
  const second=await page.evaluate(()=>__basemapTest.second.basemaps.activeId);await choose('Street');ok(await page.evaluate(id=>__basemapTest.second.basemaps.activeId===id,second),'open views choose backgrounds independently');
  await page.evaluate(async()=>{const p=app.plugins.plugins.wayfarer,first=p.settings.mapSources[0],errors=[401,403,404,429,500].map(n=>({...first,id:'status-'+n,name:'HTTP '+n,url:'https://tiles.test/status/'+n+'/{z}/{x}/{y}.png'}));await p.saveMapSources([...p.settings.mapSources,...errors,{...first,id:'private-http',name:'Private HTTP',url:'http://tiles.internal/private/{z}/{x}/{y}.png'},{...first,id:'zero',name:'World overview',minZoom:0,maxZoom:0},{...first,id:'zoomed',name:'Zoomed map',minZoom:18,maxZoom:20}],p.settings.defaultMapSource);__basemapTest.tileErrors=0;for(const group of __basemapTest.first.basemaps.layers.keys())group.eachLayer(tile=>tile.on('tileerror',()=>{__basemapTest.tileErrors++;}));});
  for(const code of [401,403,404,429,500]){const errors=await page.evaluate(()=>__basemapTest.tileErrors);await choose('HTTP '+code);await page.waitForFunction(n=>__basemapTest.tileErrors>n,errors);ok((await state()).tiles===1&&await page.evaluate(()=>__basemapTest.first.layer===__basemapTest.scene.layer),'HTTP '+code+' leaves itinerary layers intact');}
  await choose('World overview');ok((await state()).zoom===0,'maximum zoom zero is respected');await choose('Zoomed map');ok((await state()).zoom===18,'minimum zoom is respected');
  await choose('Satellite','first',false);await choose('World overview','first',false);await page.waitForTimeout(450);ok((await state()).zoom===0,'rapid disjoint zoom switches settle within final bounds');
  await choose('Private HTTP');ok(requests.some(p=>p.startsWith('/private/')),'private HTTP source is requested');
  const errors=await page.evaluate(()=>__basemapTest.tileErrors);offline=true;await context.setOffline(true);await choose('Satellite');await page.waitForFunction(n=>__basemapTest.tileErrors>n,errors);ok((await state()).markers>0,'offline background retains markers');await context.setOffline(false);offline=false;
  slow=true;for(const name of ['Street','Satellite','Hybrid','Street','Hybrid'])await choose(name,'first',false);await page.waitForTimeout(400);slow=false;s=await state();ok(s.tiles===1&&s.sources.find(x=>x.id===s.active).name==='Hybrid','slow replies and rapid switches keep only the final background');
  ok(await page.evaluate(()=>{const v=__basemapTest.first,m=v.map,count=t=>m._events[t]?.length??0,before=[count('click'),count('zoomend')],p=app.plugins.plugins.wayfarer;for(let i=0;i<8;i++){p.settings.mapSources=p.settings.mapSources.map((s,j)=>j?s:{...s,name:'Street '+i});v.applyTiles();}return before[0]===count('click')&&before[1]===count('zoomend');}),'control rebuilds do not accumulate listeners');
  await openEditor();await row('Edit source').getByRole('combobox').selectOption({label:'Hybrid'});await modal().getByRole('button',{name:'Remove',exact:true}).click();await modal().getByRole('button',{name:'Save',exact:true}).click();await page.evaluate(()=>app.setting.close());s=await state();ok(s.tiles===1&&s.sources.some(x=>x.id===s.active),'removing the active/default source selects a valid fallback');
  await choose('Satellite');const remembered=(await state()).remembered;await context.close();context=null;await launch();ok((await state()).active===remembered,'device selection survives full application restart');
  await context.close();context=null;await launch(true);await choose('Street 7');ok((await state()).tiles===1,'narrow touch layout switches backgrounds');
  await openEditor();await row('Edit source').getByRole('combobox').selectOption({label:'Satellite'});await modal().getByRole('button',{name:'Cancel',exact:true}).click();await page.evaluate(()=>app.setting.close());ok((await state()).markers>0,'narrow touch settings editor is usable');
  ok(readFileSync(base+'/vault/Trip.md','utf8')===noteBefore,'Markdown remains byte-identical');ok(pageErrors.length===0,'no renderer errors during source scenarios');
  const report={version:'1.15.1',label,checks,requests:requests.length,pageErrors,scope:'Unmodified official desktop application/renderer, headless; deterministic tiles/errors/offline, narrow desktop touch emulation, not physical Android.'};writeFileSync(output+'/result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }
}catch(e){console.error(e.stack??String(e));process.exitCode=1;try{await page.screenshot({path:output+'/failure.png'});console.log(await page.locator('body').innerText());}catch{}}
finally{await context?.close();}
