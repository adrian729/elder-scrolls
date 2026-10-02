(() => {
  const root=document.getElementById('manuscript-realistic');
  const themes=JSON.parse(document.getElementById('mr-theme-data').textContent);
  const papers=ParchmentPapers.create(themes);
  const sections=root.querySelector('.mr-sections');
  const originals=[...sections.children].map(section=>section.cloneNode(true));
  const themeSelect=root.querySelector('.mr-theme');
  const lengthSelect=root.querySelector('.mr-length');
  const widthSelect=root.querySelector('.mr-width');
  const endSelects={top:root.querySelector('.mr-top-style'),bottom:root.querySelector('.mr-bottom-style')};
  let activeTheme=null;
  const status=root.querySelector('#mr-description');
  const query=new URLSearchParams(location.search);
  const shadowToggle=root.querySelector('.mr-shadow-toggle');
  shadowToggle.checked=query.get('shadow')!=='off';
  const shadow=ParchmentShadow.create(root,{enabled:shadowToggle.checked});
  shadowToggle.addEventListener('change',()=>shadow.setEnabled(shadowToggle.checked));
  const systemMode=matchMedia('(prefers-color-scheme: dark)');
  const explicitTheme=themes.some(theme=>theme.id===query.get('theme'));
  let followSystem=query.get('mode')==='auto'&&!explicitTheme;
  let request=0;
  const decoded=new Map();
  function preload(source){
    if(!decoded.has(source)){
      const img=new Image();img.src=source;
      decoded.set(source,img.decode());
    }
    return decoded.get(source);
  }
  // Native SVG crops and patterns reuse one decoded bitmap. All dimensions below
  // are CSS pixels calculated once per theme; viewport size never enters them.
  function surface(theme){
    const s=theme.scale, W=theme.width, H=theme.height;
    const cap=theme.capHeight*s, overlap=theme.overlap*s;
    const end=theme.endWidth*s, edgeW=theme.edgeWidth*s;
    const edgeX=theme.edgeX*s, edgeH=theme.edgeHeight*s;
    const core=theme.coreInset*s;
    const [bx,by,bw,bh]=theme.bodyCrop;
    const [rx,rw]=theme.rollCrop;
    const crop=(x,y,w,h,cw=w*s,ch=h*s)=>`<svg width="${cw}" height="${ch}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden"><use href="#mr-atlas"/></svg>`;
    function pattern(id,x,y,w,h,flipX,flipY){
      const cw=w*s,ch=h*s;
      // One CSS pixel of overscan prevents fractional device-pixel clip seams.
      // The pattern period stays unchanged; neighboring samples overlap.
      const tile=crop(x,y,w+1/s,h+1/s,cw+1,ch+1);
      let parts=tile;
      if(flipX)parts+=`<g transform="translate(${cw*2} 0) scale(-1 1)">${tile}</g>`;
      if(flipY){const row=parts;parts+=`<g transform="translate(0 ${ch*2}) scale(1 -1)">${row}</g>`;}
      const mask=id==='left'||id==='right'?` mask="url(#mr-${id}-fade)"`:'';
      // Rolls repeat only horizontally in their visible area. Transparent room
      // below the cell prevents GPU sampling from wrapping its bottom into top.
      const periodH=ch*(flipY?2:1)+(['top','bottom'].includes(id)?2:0);
      return `<pattern id="mr-${id}" patternUnits="userSpaceOnUse" width="${cw*(flipX?2:1)}" height="${periodH}"><g${mask}>${parts}</g></pattern>`;
    }
    const fade=(id,reverse)=>`<linearGradient id="mr-${id}-gradient"><stop offset="0" stop-color="white" stop-opacity="${reverse?0:1}"/><stop offset="${reverse?'40%':'60%'}" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="${reverse?1:0}"/></linearGradient><mask id="mr-${id}-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${edgeW}" height="${edgeH*2}" style="mask-type:alpha"><rect width="${edgeW}" height="${edgeH*2}" fill="url(#mr-${id}-gradient)"/></mask>`;
    const defs=fade('left',false)+fade('right',true)
      +pattern('paper',bx,by,bw,bh,true,true)
      +pattern('left',theme.edgeX,theme.edgeY,theme.edgeWidth,theme.edgeHeight,false,true)
      +pattern('right',W-theme.edgeX-theme.edgeWidth,theme.edgeY,theme.edgeWidth,theme.edgeHeight,false,true)
      +pattern('top',rx,theme.topOffset,rw,theme.capHeight,true,false)
      +pattern('bottom',rx,H-theme.bottomOffset-theme.capHeight,rw,theme.capHeight,true,false);
    const ns='http://www.w3.org/2000/svg';
    const definition=root.querySelector('.mr-definitions defs');
    definition.innerHTML=defs;
    const image=document.createElementNS(ns,'image');
    image.id='mr-atlas';image.setAttribute('width',W);image.setAttribute('height',H);image.setAttribute('href',theme.atlas);
    definition.prepend(image);
    const svg=content=>`<svg xmlns="${ns}" aria-hidden="true" focusable="false">${content}</svg>`;
    root.querySelector('.mr-texture').innerHTML=svg(
      `<rect class="mr-field" x="${core}" height="100%" style="width:calc(100% - ${core*2}px)" fill="url(#mr-paper)"/>`
      +`<svg x="${edgeX}" width="${edgeW}" height="100%" overflow="hidden"><rect width="100%" height="100%" fill="url(#mr-left)"/></svg>`
      +`<g transform="translate(${-edgeX-edgeW} 0)"><svg x="100%" width="${edgeW}" height="100%" overflow="hidden"><rect width="100%" height="100%" fill="url(#mr-right)"/></svg></g>`);
    function roll(id,y){
      const left=crop(0,y,theme.endWidth,theme.capHeight,end,cap);
      return svg(`<rect x="${end-8}" height="100%" style="width:calc(100% - ${end*2-16}px)" fill="url(#mr-${id})"/>`
        +`<g class="mr-roll-left">${left}</g>`
        +`<g class="mr-roll-right" transform="translate(${-end} 0)"><svg x="100%" width="${end}" height="${cap}" viewBox="${W-theme.endWidth} ${y} ${theme.endWidth} ${theme.capHeight}" overflow="hidden"><use href="#mr-atlas"/></svg></g>`);
    }
    root.querySelector('.mr-top').innerHTML=roll('top',theme.topOffset);
    root.querySelector('.mr-bottom').innerHTML=roll('bottom',H-theme.bottomOffset-theme.capHeight);
    root.style.setProperty('--mr-cap-height',cap+'px');
    root.style.setProperty('--mr-overlap',overlap+'px');
    root.style.setProperty('--mr-paper-inset',theme.paperInset*s+'px');
    root.style.setProperty('--mr-grain-size',bw*s+'px');
    root.style.setProperty('--mr-end-width',end+'px');
    for(const key of ['surface','ink','muted','link'])root.style.setProperty('--mr-'+key,theme.palette[key]);
    root.style.setProperty('--mr-scheme',theme.mode);
    root.dataset.mode=theme.mode;root.dataset.tone=theme.tone;root.dataset.family=theme.family;
  }
  function updateDescription(){
    if(!activeTheme)return;
    const labels={default:'original roll',paper:'paper'};
    status.textContent=endSelects.top.value==='default'&&endSelects.bottom.value==='default'?activeTheme.description:
      activeTheme.label+' · Top: '+labels[endSelects.top.value]+' · Bottom: '+labels[endSelects.bottom.value]+'.';
  }
  for(const side of ['top','bottom']){
    if(['default','paper'].includes(query.get(side)))endSelects[side].value=query.get(side);
    endSelects[side].addEventListener('change',()=>{endings.setOptions({[side]:endSelects[side].value});updateDescription();});
  }
  const endings=ParchmentEndings.create(root,{top:endSelects.top.value,bottom:endSelects.bottom.value});
  for(const family of papers.families){
    const group=document.createElement('optgroup');group.label=family.label;
    for(const theme of papers.list({family:family.id}))group.append(new Option(theme.label,theme.id));
    themeSelect.append(group);
  }
  if(themes.some(theme=>theme.id==='ivory'))themeSelect.value='ivory';
  async function applyTheme(id){
    const theme=themes.find(theme=>theme.id===id);if(!theme)return;
    const version=++request;
    status.textContent='Loading '+theme.label+'…';
    root.querySelector('main').setAttribute('aria-busy','true');
    try{
      await preload(theme.atlas);if(version!==request)return;
      surface(theme);activeTheme=theme;endings.setPaper(theme);root.dataset.theme=theme.id;themeSelect.value=theme.id;updateDescription();
    }catch(error){
      if(version===request)status.textContent='The artwork could not load. Keep the assets folder beside index.html, or rebuild with embedded artwork.';
      console.error(error);
    }finally{if(version===request)root.querySelector('main').setAttribute('aria-busy','false');}
  }
  function appendSection(){
    const count=sections.childElementCount;
    const section=originals[count%originals.length].cloneNode(true);
    if(count>=originals.length)section.querySelector('h3').textContent='Additional section '+(count-originals.length+1);
    sections.appendChild(section);
  }
  function setLength(count){sections.replaceChildren();for(let i=0;i<count;i++)appendSection();}
  function applyWidth(){root.style.setProperty('--mr-width',widthSelect.value==='fluid'?'none':widthSelect.value+'px');}
  themeSelect.addEventListener('change',()=>{followSystem=false;applyTheme(themeSelect.value);});
  root.addEventListener('parchment-theme',event=>{
    const theme=themes.find(theme=>theme.id===event.detail);
    if(theme){followSystem=false;applyTheme(theme.id);}
  });
  systemMode.addEventListener('change',event=>{
    if(followSystem)applyTheme(papers.resolve({paper:themeSelect.value,mode:event.matches?'dark':'light'}).id);
  });
  widthSelect.addEventListener('change',applyWidth);
  lengthSelect.addEventListener('change',()=>{if(lengthSelect.value!=='custom')setLength(Number(lengthSelect.value));});
  root.querySelector('.mr-add').addEventListener('click',()=>{
    appendSection();lengthSelect.querySelector('[value="custom"]').hidden=false;lengthSelect.value='custom';
  });
  if(['fluid','640','900','1100'].includes(query.get('width')))widthSelect.value=query.get('width');applyWidth();
  if(['1','5','12'].includes(query.get('length')))lengthSelect.value=query.get('length');setLength(Number(lengthSelect.value));
  if(explicitTheme)themeSelect.value=query.get('theme');
  else if(['light','dark','auto'].includes(query.get('mode'))||['neutral','warm'].includes(query.get('tone'))){
    const mode=query.get('mode')==='auto'?(systemMode.matches?'dark':'light'):['light','dark'].includes(query.get('mode'))?query.get('mode'):'light';
    const tone=['neutral','warm'].includes(query.get('tone'))?query.get('tone'):'neutral';
    themeSelect.value=papers.resolve({mode,tone}).id;
  }
  applyTheme(themeSelect.value);
})();
