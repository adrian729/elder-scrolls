// Real browser checks against npm-packed consumers. No test-only renderer mocks.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, symlink, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = await mkdtemp(path.join(tmpdir(), 'elder-scrolls-integration-'));
const app = path.join(folder, 'app');
const children = [];
const pause = (ms=60) => new Promise(resolve => setTimeout(resolve, ms));
const records = [];
let server, ws, chrome, viteServer;
try {
  await mkdir(app);
  const pack = JSON.parse((await exec('npm', ['pack', '--json', '--pack-destination', folder], {cwd:root})).stdout);
  assert.ok(pack[0].files.some(file => file.path === 'lib/index.d.ts'));
  assert.ok(pack[0].files.some(file => file.path === 'docs/INTEGRATION.md'));
  assert.ok(!pack[0].files.some(file => /^(demo-assets|examples|notes|src|tests)\//.test(file.path)));
  await writeFile(path.join(app, 'package.json'), '{"private":true,"type":"module"}');
  await exec('npm', ['install',path.join(folder,pack[0].filename),'--offline','--ignore-scripts','--no-audit','--no-fund'], {cwd:app});
  for (const name of ['react','react-dom']) await symlink(path.join(root,'node_modules',name),path.join(app,'node_modules',name),'dir');
  for (const name of ['main.jsx','index.html','style.css']) await cp(path.join(root,'examples/react',name),path.join(app,name));
  const vanilla = (await readFile(path.join(root,'examples/vanilla/index.html'),'utf8')).replaceAll('../../lib/','./app/node_modules/@ranx729/elder-scrolls/lib/');
  await writeFile(path.join(folder,'vanilla.html'),vanilla);
  const { Parchment } = await import(pathToFileURL(path.join(app,'node_modules/@ranx729/elder-scrolls/lib/react.js')));
  const ssr = renderToString(h(Parchment,{id:'hydrated'},h('input',{id:'hydrated-input',defaultValue:'Server value'}),h('p',null,'Readable server content')));
  await writeFile(path.join(app,'hydrate.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><div id="root">${ssr}</div><script type="module" src="/hydrate.jsx"></script></html>`);
  await writeFile(path.join(app,'hydrate.jsx'),`import React from 'react';import {hydrateRoot} from 'react-dom/client';import {Parchment} from '@ranx729/elder-scrolls/react';import '@ranx729/elder-scrolls/styles.css';const input=document.getElementById('hydrated-input');input.value='Typed before hydration';window.before=input;hydrateRoot(document.getElementById('root'),<Parchment id="hydrated"><input id="hydrated-input" defaultValue="Server value"/><p>Readable server content</p></Parchment>);`);
  // Use a nested production base to catch asset paths that only work at '/'.
  await exec(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build','--base=/app/dist/'],{cwd:app});
  const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'};
  server = createServer(async(req,res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      let filename=path.resolve(folder,'.'+pathname);
      if (!filename.startsWith(folder+path.sep)) throw Error('Outside fixture');
      if(pathname.endsWith('/'))filename=path.join(filename,'index.html');
      const body=await readFile(filename);res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(body);
    } catch {res.writeHead(404);res.end('Not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const profile=path.join(folder,'chrome');
  chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});children.push(chrome);
  let chromeLog='', chromeFailure='';
  chrome.on('error',error=>{chromeFailure=error.message;});
  chrome.on('exit',(code,signal)=>{chromeFailure='exit '+code+' signal '+signal;});
  chrome.stderr.on('data',data=>{chromeLog+=data.toString();});
  let endpoint='';
  for(let i=0;i<400&&!endpoint&&!chromeFailure;i++){
    try {
      const [port,route]= (await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).trim().split('\n');
      if(port&&route)endpoint='ws://127.0.0.1:'+port+route;
    } catch { await pause(); }
  }
  assert.ok(endpoint,'Chromium did not start; set CHROME_BIN. '+chromeFailure+' '+chromeLog.slice(-3000));
  const tabs=await(await fetch(endpoint.replace(/^ws:/,'http:').replace(/\/devtools\/browser\/.*/, '/json'))).json();
  ws=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let sequence=0;const pending=new Map(),errors=[],failed=[],requests=[];
  ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const task=pending.get(message.id);pending.delete(message.id);message.error?task.reject(message.error):task.resolve(message.result);}if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')errors.push(message.params.args);if(message.method==='Network.responseReceived'&&message.params.response.status>=400&&!message.params.response.url.endsWith('/favicon.ico'))failed.push(message.params.response);if(message.method==='Network.requestWillBeSent')requests.push(message.params.request.url);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,replMode:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
  async function until(expression){for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause();}throw Error('Timeout: '+expression+' '+JSON.stringify({errors,failed,page:await evaluate('({url:location.href,html:document.documentElement.outerHTML.slice(0,2200)})')}));}
  async function navigate(url,ready){await send('Page.navigate',{url});await until(ready);await pause(100);}
  async function viewport(width){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await pause(100);}
  async function geometry(){const result=await evaluate(`(()=>{const roots=[...document.querySelectorAll('.es-parchment')];const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,unique:ids.length===new Set(ids).size,sheets:roots.map(root=>{const box=s=>root.querySelector(s).getBoundingClientRect();const body=box('.mr-body'),top=box('.mr-top'),bottom=box('.mr-bottom'),content=box('.mr-content');const pad=getComputedStyle(root.querySelector('.mr-body'));return {width:body.width,topHeight:top.height,bottomHeight:bottom.height,aligned:Math.abs(body.width-top.width)<.1&&Math.abs(body.width-bottom.width)<.1,filled:Math.abs(content.width-(body.width-parseFloat(pad.paddingLeft)-parseFloat(pad.paddingRight)))<.1,internal:['.mr-scroll','.mr-body','.mr-content'].some(s=>{const e=root.querySelector(s);return ['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1;})};})};})()`);assert.ok(!result.overflow&&result.unique,JSON.stringify(result));for(const sheet of result.sheets)assert.ok(sheet.aligned&&sheet.filled&&!sheet.internal,JSON.stringify(sheet));return result;}
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  await viewport(997);
  await navigate(base+'/vanilla.html',`document.getElementById('page')?.dataset.theme==='ivory'&&document.getElementById('second')?.dataset.theme==='rag-dark'`);
  const initialImages=requests.filter(url=>url.endsWith('.webp'));
  assert.equal(new Set(initialImages).size,3,'Only two chosen papers and the selected table should load');
  await evaluate(`window.api=await import('./app/node_modules/@ranx729/elder-scrolls/lib/index.js');window.originalInput=document.getElementById('notes');window.originalInput.value='Persistent note';`);
  // Preloaded artwork applies within the mounting task (microtasks only, no frame); artwork that was
  // not preloaded is still waiting for its decode at that point.
  const preloadTiming=await evaluate(`await api.preloadArtwork({papers:['sage-dark'],surfaces:['oak']});const mount=paper=>{const e=document.createElement('article');document.body.append(e);return [e,api.createParchment(e,{paper})];};const [a,pa]=mount('sage-dark'),[b,pb]=mount('original-dark');for(let i=0;i<20;i++)await null;const result={preloaded:a.dataset.theme??null,cold:b.dataset.theme??null};await pb.ready;pa.destroy();pb.destroy();a.remove();b.remove();result`);
  assert.deepEqual(preloadTiming,{preloaded:'sage-dark',cold:null},'Preloaded artwork must apply before the next frame');
  // Each screen density gets the copy made for it, up to the artwork's own; denser screens get the original.
  const densityFiles={};
  for (const scale of [1,2,3]) {
    await send('Emulation.setDeviceMetricsOverride',{width:997,height:900,deviceScaleFactor:scale,mobile:false});await pause(100);
    densityFiles[scale]=await evaluate(`const e=document.createElement('article');document.body.append(e);const p=api.createParchment(e,{paper:'original'});await p.ready;const file=e.querySelector('image').getAttribute('href').split('/').at(-1);p.destroy();e.remove();file`);
  }
  await viewport(997);
  assert.deepEqual(densityFiles,{1:'original-material-atlas-1x.webp',2:'original-material-atlas-2x.webp',3:'original-material-atlas-3x.webp'},'Artwork must match the screen density');
  // A dedicated controller exercises the public lifecycle independently of UI.
  await evaluate(`window.extra=document.createElement('article');extra.innerHTML='<input value="keep"><p>Content</p>';document.body.append(extra);window.original=extra.firstChild;window.sheet=api.createParchment(extra,{paper:'sage',top:'paper',bottom:'roll',maxWidth:'fluid'});await sheet.ready;`);
  await geometry();
  for (const width of [320,375,768,1920]) {await viewport(width);const result=await geometry();records.push({kind:'vanilla',width,...result});}
  for (const paper of ['ivory','sage','original','rag','ivory-dark','sage-dark','original-dark','rag-dark']) {
    for (const top of ['roll','paper']) for (const bottom of ['roll','paper']) {
      await evaluate(`await sheet.update(${JSON.stringify({paper,top,bottom})})`);
      const result=await geometry();assert.equal(result.sheets.at(-1).topHeight,top==='roll'?100:56);assert.equal(result.sheets.at(-1).bottomHeight,bottom==='roll'?100:56);
    }
  }
  assert.deepEqual(await evaluate(`await Promise.all([sheet.update({paper:'ivory'}),sheet.update({paper:'rag-dark'})])`),[false,true]);
  assert.equal(await evaluate(`(()=>{const before=extra.dataset.theme;try{sheet.update({top:'pointy'});return false}catch{return extra.dataset.theme===before}})()`),true);
  await evaluate(`original.focus();original.value='Typed';await sheet.update({paper:'ivory',maxWidth:640});`);
  assert.equal(await evaluate(`original===extra.querySelector('input')&&original.value==='Typed'&&document.activeElement===original`),true);
  // Content growth must retain cap/shadow trees. Only the bottom paper phase
  // and shadow positions follow height; input identity and focus stay native.
  await pause(100);
  await evaluate(`window.artBefore=[...extra.querySelectorAll('.mr-cap > svg,.mr-shadow-piece')];window.phaseBefore=extra.querySelector('.mr-bottom pattern').getAttribute('y');`);
  const before=await evaluate(`extra.querySelector('.mr-bottom').getBoundingClientRect().top+scrollY`);
  await evaluate(`const block=document.createElement('div');block.style.height='50000px';sheet.content.append(block);`);await pause(160);
  assert.ok(await evaluate(`extra.querySelector('.mr-bottom').getBoundingClientRect().top+scrollY`)>before+49999);
  assert.equal(await evaluate(`artBefore.every((node,i)=>node===extra.querySelectorAll('.mr-cap > svg,.mr-shadow-piece')[i])`),true,'Height changes preserve paper caps and shadow pieces');
  assert.ok(Math.abs(await evaluate(`Number(extra.querySelector('.mr-bottom pattern').getAttribute('y'))-Number(phaseBefore)`)+50000)<.1,'Bottom paper phase follows content height');
  assert.equal(await evaluate(`(()=>{const cap=extra.querySelector('.mr-bottom').getBoundingClientRect(),shadow=extra.querySelector('.mr-shadow-bottom').getBoundingClientRect();return Math.abs(cap.top-shadow.top)<.1;})()`),true);
  const mutations=await evaluate(`await (async()=>{
    const layer=extra.querySelector('.mr-contact-shadow');let rebuilds=0;
    const observer=new MutationObserver(records=>{rebuilds+=records.filter(r=>r.target===layer).length;});observer.observe(layer,{childList:true});
    await sheet.update();await new Promise(r=>requestAnimationFrame(r));const noop=rebuilds;
    await sheet.update({top:'roll',bottom:'roll'});await new Promise(r=>requestAnimationFrame(r));const ending=rebuilds-noop;
    const caps=[...extra.querySelectorAll('.mr-cap > svg')];const block=document.createElement('div');block.style.height='100px';sheet.content.append(block);
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const retained=caps.every((node,i)=>node===extra.querySelectorAll('.mr-cap > svg')[i]);
    observer.disconnect();return {noop,ending,growth:rebuilds-noop-ending,retained};
  })()`);
  assert.deepEqual(mutations,{noop:0,ending:1,growth:0,retained:true});
  records.push({kind:'incremental-rendering',...mutations});
  const shadowUpdates=await evaluate(`await (async()=>{
    const caps=[...extra.querySelectorAll('.mr-cap > svg')];
    await sheet.update({top:'paper',bottom:'paper'});await sheet.update({top:'roll',bottom:'roll'});
    const restoredRolls=caps.every((node,i)=>node===extra.querySelectorAll('.mr-cap > svg')[i]);
    const pieces=[...extra.querySelectorAll('.mr-shadow-piece')];
    await sheet.update({shadow:false});
    const block=document.createElement('div');block.style.height='123px';sheet.content.append(block);
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await sheet.update({shadow:true});
    const retainedShadows=pieces.every((node,i)=>node===extra.querySelectorAll('.mr-shadow-piece')[i]);
    const aligned=()=>['top','bottom'].every(side=>{
      const cap=extra.querySelector('.mr-'+side),shadow=extra.querySelector('.mr-shadow-'+side);
      const a=cap.getBoundingClientRect(),b=shadow.getBoundingClientRect();
      const target=document.getElementById(shadow.querySelector('use').getAttribute('href').slice(1));
      return Math.abs(a.top-b.top)<.1&&Math.abs(a.height-b.height)<.1&&target===cap.firstElementChild
        &&Math.abs(Number(shadow.querySelector('filter').getAttribute('width'))-a.width-16)<.1;
    });
    const growthAligned=aligned();
    await sheet.update({shadow:false});
    await sheet.update({paper:'rag-dark',top:'paper',bottom:'roll',maxWidth:480});
    await sheet.update({shadow:true});
    const resizedAligned=aligned()&&extra.querySelector('.mr-body').getBoundingClientRect().width===480;
    return {restoredRolls,retainedShadows,growthAligned,resizedAligned};
  })()`);
  assert.deepEqual(shadowUpdates,{restoredRolls:true,retainedShadows:true,growthAligned:true,resizedAligned:true});
  records.push({kind:'shadow-update-recovery',...shadowUpdates});
  assert.deepEqual(await evaluate(`await Promise.all([sheet.update({paper:'ivory'}),sheet.update({paper:'rag-dark'})])`),[false,true],'An unchanged winning request must still cancel an older update');
  assert.equal(await evaluate(`extra.querySelector('.mr-scroll').getAttribute('aria-busy')`),'false');
  const pendingDestroy=await evaluate(`const pending=sheet.update({paper:'original-dark'});sheet.destroy();sheet.destroy();const result=await pending;({result,restored:extra.firstChild===original,value:original.value,decorations:extra.querySelectorAll('.mr-scroll').length});`);
  assert.deepEqual(pendingDestroy,{result:false,restored:true,value:'Typed',decorations:0});
  await evaluate(`sheet=api.createParchment(extra,{shadow:false});await sheet.ready;`);
  assert.equal(await evaluate(`extra.querySelectorAll('.mr-shadow-piece').length`),0);
  await evaluate(`await sheet.update({shadow:true});`);
  assert.equal(await evaluate(`extra.querySelectorAll('.mr-shadow-piece').length`),3,'Shadows can be enabled after mounting without them');
  await evaluate(`sheet.destroy();extra.remove();`);
  assert.deepEqual(failed,[], 'Unexpected requests before recovery check');
  // A missing asset yields a recoverable error.
  assert.equal(await evaluate(`const e=document.createElement('article');document.body.append(e);const p=api.createParchment(e,{assetsBase:'/missing/'});let failed=false;try{await p.ready}catch{failed=true}await p.update({assetsBase:undefined});p.destroy();e.remove();failed;`),true);
  failed.length=0; // The intentional missing-image request above is expected.
  await viewport(997);
  await navigate(base+'/app/dist/',`document.getElementById('primary')?.dataset.theme==='ivory'&&document.getElementById('secondary')?.dataset.theme==='rag-dark'`);
  await geometry();
  for(const width of [320,375,997,1920]){await viewport(width);records.push({kind:'react-production',width,...await geometry()});}
  await evaluate(`window.input=document.querySelector('#primary input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'Controlled note');input.dispatchEvent(new Event('input',{bubbles:true}));`);
  await evaluate(`document.querySelectorAll('nav button')[0].click()`);await until(`document.getElementById('primary').dataset.theme==='ivory-dark'`);
  assert.equal(await evaluate(`input===document.querySelector('#primary input')&&input.value==='Controlled note'`),true);
  await evaluate(`document.querySelectorAll('nav button')[1].click();document.querySelectorAll('nav button')[2].click()`);await until(`document.getElementById('primary').dataset.bottomEnding==='paper'&&document.getElementById('primary').dataset.shadow==='off'`);
  const oldBottom=await evaluate(`document.querySelector('#primary .mr-bottom').getBoundingClientRect().top`);
  await evaluate(`document.querySelectorAll('nav button')[3].click()`);await pause(150);
  assert.ok(await evaluate(`document.querySelector('#primary .mr-bottom').getBoundingClientRect().top`)>oldBottom);
  await evaluate(`document.querySelectorAll('nav button')[4].click()`);await until(`!document.getElementById('primary')`);
  await evaluate(`document.querySelectorAll('nav button')[4].click()`);await until(`document.getElementById('primary')?.dataset.theme==='ivory-dark'`);await geometry();
  assert.equal(await evaluate(`document.querySelector('#primary input').value`),'Controlled note');
  await evaluate(`document.querySelectorAll('nav button')[5].click()`);await until(`document.querySelector('.es-table').dataset.surface==='marble'`);
  // Development build actually performs Strict Mode's extra setup/cleanup cycle.
  const { createServer: createViteServer } = await import('vite');
  viteServer = await createViteServer({root:app,configFile:false,logLevel:'error',server:{host:'127.0.0.1',port:0}});
  await viteServer.listen();
  const dev='http://127.0.0.1:'+viteServer.httpServer.address().port+'/';
  await navigate(dev,`document.getElementById('primary')?.dataset.theme==='ivory'&&document.getElementById('secondary')?.dataset.theme==='rag-dark'`);
  await geometry();assert.equal(await evaluate(`document.querySelectorAll('.mr-contact-shadow').length`),2);
  assert.ok(await evaluate(`Number(document.querySelector('#primary .mr-definitions image').id.split('-')[1]) > 2`), 'Development Strict Mode must have remounted the renderer');
  await navigate(dev+'hydrate.html',`document.getElementById('hydrated')?.dataset.theme==='ivory'`);
  assert.equal(await evaluate(`before===document.getElementById('hydrated-input')&&before.value==='Typed before hydration'`),true);
  assert.deepEqual(errors,[],'Browser runtime errors');assert.deepEqual(failed,[],'Unexpected failed requests');
  const summary={package:pack[0].name,version:pack[0].version,initialSelectedImages:3,densityFiles,vanillaMatrix:32,responsive:records,contentHeight:50000,inputIdentity:true,latestRequestWins:true,cleanup:true,recovery:true,reactProduction:true,reactDevelopmentStrictMode:true,hydration:true,errors:[]};
  await writeFile(path.join(root,'notes/library-integration-verification.json'),JSON.stringify(summary,null,2)+'\n');
  console.log('PASS packed vanilla + React: 32 paper/end combinations, density-matched artwork, responsive widths, 50,000px growth, preserved inputs, async guards, cleanup, Strict Mode, hydration, nested production asset paths');
} finally {
  ws?.close();if(viteServer)await viteServer.close();for(const child of children)child.kill();if(server)await new Promise(resolve=>server.close(resolve));
}
