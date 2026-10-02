// Fixed-scale renderer extracted from the original demo; geometry unchanged.
export function renderSurface(root, theme, prefix) {
    const scope = markup => markup.replaceAll('id="mr-', 'id="' + prefix).replaceAll('#mr-', '#' + prefix);
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
    definition.innerHTML=scope(defs);
    const image=document.createElementNS(ns,'image');
    image.id=prefix+'atlas';image.setAttribute('width',W);image.setAttribute('height',H);image.setAttribute('href',theme.atlas);
    definition.prepend(image);
    const svg=content=>scope(`<svg xmlns="${ns}" aria-hidden="true" focusable="false">${content}</svg>`);
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
