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
const noteBefore=['# Navigation test','','## 2027-01-01 Start day','','- [Start](geo:35,139)','',...Array.from({length:150},(_,i)=>'Paragraph '+i+' before the target.\n'), '## 2027-01-02 Target day','','- [Target](geo:36,140)','',...Array.from({length:150},(_,i)=>'Paragraph '+i+' after the target.\n')].join('\n');
writeFileSync(base+'/vault/Trip.md',noteBefore);
writeFileSync(base+'/profile-pipe/obsidian.json',JSON.stringify({autoUpdate:false,vaults:{nativecheck:{path:base+'/vault',ts:Date.now(),open:true}}}));
const layout={main:{id:'main',type:'split',direction:'vertical',children:[{id:'tabs',type:'tabs',children:[{id:'note',type:'leaf',state:{type:'markdown',state:{file:'Trip.md',mode:'preview',source:false}}}]}]},right:{id:'right',type:'split',direction:'horizontal',width:350,children:[{id:'right-tabs',type:'tabs',children:[{id:'empty-right',type:'leaf',state:{type:'empty',state:{}}}]}]},active:'note',lastOpenFiles:['Trip.md']};
const checks=[],requests=[],pageErrors=[];let slow=false,offline=false,context,page,editorPage,touchMode=false;
const ok=(v,n)=>{assert(v,n);checks.push(n);console.log('PASS:',label,n);};
async function launch(touch=false){
 touchMode=touch;writeFileSync(base+'/vault/.obsidian/workspace.json',JSON.stringify(layout));
 context=await chromium.launchPersistentContext(base+'/profile-pipe',{executablePath:process.env.OBSIDIAN_BIN,headless:true,args:['--ozone-platform=headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],env:{...process.env,XDG_CONFIG_HOME:base+'/xdg'},viewport:null,hasTouch:touch,timeout:30000});
 await context.route(/https?:\/\/(tiles\.test|tiles\.internal)\//,async route=>{
  const u=new URL(route.request().url());requests.push(u.pathname);
  if(offline){await route.abort('internetdisconnected').catch(()=>{});return;}
  if(slow)await new Promise(r=>setTimeout(r,300));
  const code=Number(u.pathname.match(/\/status\/(\d+)/)?.[1]??200),name=u.pathname.split('/')[1];
  const color={legacy:'#dcebd4',satellite:'#526453',hybrid:'#63766a'}[name]??'#dcebd4';
  const body=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${color}"/><path d="M0 60L256 180 M30 0L200 256" stroke="#bbc7a5" stroke-width="6"/><path d="M0 128H256M128 0V256" stroke="#809080" stroke-width="1"/><text x="12" y="25" fill="#445544" font-size="15">${name} · test tiles</text></svg>`;
  await route.fulfill({status:code,contentType:'image/svg+xml',body:code===200?body:'Test tile failure'}).catch(()=>{});
 });
 page=context.pages()[0];await page.setViewportSize(touch?{width:412,height:915}:{width:1280,height:900});page.on('pageerror',e=>{pageErrors.push(e.stack??String(e));console.log('Native page error:',e.stack??String(e));});
 await page.waitForFunction(()=>!!window.app?.workspace?.layoutReady,null,{timeout:25000});
 const trust=page.getByRole('button',{name:'Trust author and enable plugins',exact:true});if(await trust.count())await trust.click();
 await page.waitForFunction(()=>!!app.plugins.plugins.wayfarer,null,{timeout:15000});
 await page.evaluate(async()=>{const file=app.vault.getAbstractFileByPath('Trip.md');await app.workspace.getLeaf(false).openFile(file,{state:{mode:'preview'}});const p=app.plugins.plugins.wayfarer;p.refresh();await p.openMap();});
 await page.waitForFunction(()=>app.workspace.getLeavesOfType('wayfarer').some(l=>l.view.isReady));
 await page.waitForTimeout(700);
 await page.waitForFunction(()=>!!app.plugins.plugins.wayfarer&&app.workspace.layoutReady);
 await page.evaluate(async()=>{const p=app.plugins.plugins.wayfarer;p.refresh();await p.openMap();});
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
 for(let i=0;i<50;i++){const owners=await Promise.all(context.pages().map(async p=>await p.getByRole('button',{name:'Manage map sources',exact:true}).count()?p:null)),settings=owners.find(Boolean);if(settings){await settings.setViewportSize(touchMode?{width:412,height:915}:{width:900,height:1100});await settings.getByRole('button',{name:'Manage map sources',exact:true}).click();break;}await page.waitForTimeout(100);}
 for(let i=0;i<50;i++){const owners=await Promise.all(context.pages().map(async p=>await p.getByRole('heading',{name:'Map sources',exact:true}).count()?p:null));editorPage=owners.find(Boolean);if(editorPage){if(touchMode)await editorPage.setViewportSize({width:412,height:915});return;}await page.waitForTimeout(100);}
 throw Error('Map-source settings did not open');
}
async function edit(name,url,max=19){await row('Name').getByRole('textbox').fill(name);await row('Tile URL').getByRole('textbox').fill(url);await modal().getByLabel('Maximum zoom',{exact:true}).fill(String(max));await row('Attribution').locator('textarea').fill('Local test tiles');}
const expectedCenter=label!=='baseline';
const navigationChecks=[];
const navOk=(condition,name,data={})=>{assert(condition,name+' '+JSON.stringify(data));navigationChecks.push({name,...data});console.log('NAV-CHECK',label,name,JSON.stringify(data));};
async function metrics(name='Target'){
 return page.evaluate(name=>{
  const md=app.workspace.getLeavesOfType('markdown')[0].view,p=md.previewMode,r=p.containerEl,s=r.matches('.markdown-preview-view')?r:r.querySelector('.markdown-preview-view')??r;
  const a=[...r.querySelectorAll('a')].find(a=>a.textContent===name),b=a?.getBoundingClientRect(),v=s.getBoundingClientRect();
  return{mode:md.getMode(),top:s.scrollTop,height:s.clientHeight,ratio:b&&b.height?((b.top+b.bottom)/2-v.top)/s.clientHeight:null,hiddenCursor:md.editor.getCursor()};
 },name);
}
async function waitTarget(){
 await page.waitForFunction(center=>{
  const md=app.workspace.getLeavesOfType('markdown')[0].view,r=md.previewMode.containerEl,s=r.matches('.markdown-preview-view')?r:r.querySelector('.markdown-preview-view')??r;
  const a=[...r.querySelectorAll('a')].find(a=>a.textContent==='Target'),b=a?.getBoundingClientRect(),v=s.getBoundingClientRect();
  if(!b?.height)return false;const ratio=((b.top+b.bottom)/2-v.top)/s.clientHeight;
  return md.getMode()==='preview'&&(center?ratio>.45&&ratio<.55:ratio>=0&&ratio<.2);
 },expectedCenter,{timeout:10000});
 await page.waitForTimeout(120);
}
async function reset(){
 await page.evaluate(()=>app.workspace.getLeavesOfType('markdown')[0].view.setEphemeralState({line:0}));await page.waitForTimeout(180);
}
async function showTarget(){
 await page.evaluate(()=>{const v=__basemapTest.first,stop=v.itinerary.stops.find(s=>s.name==='Target');v.chooseDay(v.itinerary.days.find(d=>d.index===stop.dayIndex));v.flyToStop(stop);});
 await page.waitForTimeout(700);
 await page.evaluate(()=>{const v=__basemapTest.first,stop=v.itinerary.stops.find(s=>s.name==='Target');v.markers.get(stop).openPopup();});
 await page.waitForTimeout(220);
}
async function go(){
 await showTarget();await page.locator('[data-basemap-test="first"]').getByText('Go to line',{exact:true}).click();await waitTarget();
}
try{
 await launch();
 await reset();await go();
 let m=await metrics();navOk(m.mode==='preview','Go to line reveals the expected Reading position',m);
 await page.screenshot({path:output+'/reading-navigation.png'});
 const headingLine=await page.evaluate(()=>__basemapTest.first.itinerary.days.find(d=>d.stops.some(s=>s.name==='Target')).headingLine);
 await page.evaluate(line=>app.workspace.getLeavesOfType('markdown')[0].view.setEphemeralState({line}),headingLine);await page.waitForTimeout(350);
 const heading=page.locator('.markdown-preview-view h2').filter({hasText:'2027-01-02 Target day'});
 await heading.hover();await heading.locator('..').locator('.collapse-indicator').click();
 await page.waitForTimeout(150);
 navOk(!await page.locator('.markdown-preview-view a').filter({hasText:/^Target$/}).isVisible(),'test section is actually folded');
 await go();m=await metrics();navOk(m.mode==='preview','folded section is revealed at the expected position',m);
 await reset();await showTarget();
 await page.evaluate(()=>{const v=__basemapTest.first;v.map.closePopup();app.workspace.setActiveLeaf(v.leaf,{focus:true});});
 await page.locator('[data-basemap-test="first"] .leaflet-marker-icon[title="Target"]').click();
 await waitTarget();m=await metrics();
 navOk(await page.evaluate(()=>app.workspace.activeLeaf===__basemapTest.first.leaf),'passive pin click reveals the note while retaining map focus',m);
 await page.evaluate(line=>__basemapTest.first.jumpTo({line,from:0,to:0},true,true),headingLine);await page.waitForTimeout(350);
 const headingMetric=await page.evaluate(()=>{const r=app.workspace.getLeavesOfType('markdown')[0].view.previewMode.containerEl,s=r.matches('.markdown-preview-view')?r:r.querySelector('.markdown-preview-view')??r,h=[...r.querySelectorAll('h2')].find(h=>h.textContent.includes('Target day')),b=h.getBoundingClientRect(),v=s.getBoundingClientRect();return{ratio:(b.top-v.top)/s.clientHeight};});
 navOk(headingMetric.ratio>=-.03&&headingMetric.ratio<.15,'heading navigation retains its top alignment',headingMetric);
 await page.evaluate(()=>{const v=__basemapTest.first;void v.jumpTo(v.itinerary.stops[0]);void v.jumpTo(v.itinerary.stops.find(s=>s.name==='Target'));});await waitTarget();
 navOk(true,'rapid source jumps finish at the latest stop',await metrics());
 await page.evaluate(()=>__basemapTest.first.jumpTo({line:0,from:0,to:0}));await page.waitForTimeout(350);m=await metrics();
 navOk(m.mode==='preview'&&m.top<2,'line zero stays visible without a negative scroll position',m);
 await context.close();context=null;
 await launch(true);
 await page.evaluate(async()=>{app.workspace.rightSplit.collapse();const v=__basemapTest.first;await v.jumpTo(v.itinerary.stops.find(s=>s.name==='Target'));});
 await waitTarget();await page.waitForTimeout(350);m=await metrics();
 navOk(m.mode==='preview','narrow touch Reading view uses the expected alignment',m);
 navOk(readFileSync(base+'/vault/Trip.md','utf8')===noteBefore,'navigation preserves Markdown byte for byte');
 navOk(pageErrors.length===0,'no renderer errors in the Reading scenarios');
 const result={version:'1.15.1',label,expectedCenter,checks:navigationChecks,pageErrors,scope:'Official unmodified desktop renderer; 412px touch emulation is not physical Android.'};
 writeFileSync(output+'/result.json',JSON.stringify(result,null,2)+'\n');console.log('NAV-RESULT',JSON.stringify(result));
}catch(e){console.error(e.stack??String(e));process.exitCode=1;try{console.log('READING-STATE',JSON.stringify(await metrics()));console.log(await page.locator('body').innerText());await page.screenshot({path:output+'/failure.png'});}catch{}}
finally{await context?.close();}
