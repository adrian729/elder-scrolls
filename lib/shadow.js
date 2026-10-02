// Shadow-only alpha rendering. Side blur is confined to a small repeating
// pattern cell; caps are filtered separately. The long body is never filtered.
export function createShadow(root, {enabled = true} = {}, prefix) {
  const scope = markup => markup.replaceAll('id="mr-', 'id="' + prefix).replaceAll('#mr-', '#' + prefix);
  const main=root.querySelector('.mr-scroll'),layer=document.createElement('div');
  layer.className='mr-contact-shadow';layer.setAttribute('aria-hidden','true');
  main.prepend(layer);
  let theme=null;
  const ns='http://www.w3.org/2000/svg';
  // A close, slightly downward contact shadow, not a floating card shadow.
  function filter(id,x,y,width,height){return `<filter id="${id}" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${height}" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="soft"/>
    <feOffset in="soft" dx="1" dy="2" result="offset"/>
    <feFlood flood-color="#100d08" flood-opacity=".26"/>
    <feComposite in2="offset" operator="in"/>
  </filter>`;}
  function render(){
    if(!enabled||!theme)return;
    const mainBox=main.getBoundingClientRect(),body=root.querySelector('.mr-body').getBoundingClientRect();
    const s=theme.scale,ex=theme.edgeX*s,ew=theme.edgeWidth*s,period=theme.edgeHeight*s*2,pad=8;
    const cell=ew+pad*2;
    const svg=content=>scope(`<svg xmlns="${ns}" aria-hidden="true" focusable="false">${content}</svg>`);
    function edge(side){return filter('mr-shadow-'+side+'-blur',-pad,-pad,cell,period+pad*2)
      +`<pattern id="mr-shadow-${side}" patternUnits="userSpaceOnUse" width="${cell}" height="${period}"><g transform="translate(${pad} 0)">
        <rect x="0" y="${-pad}" width="${ew}" height="${period+pad*2}" fill="url(#mr-${side})" filter="url(#mr-shadow-${side}-blur)"/>
      </g></pattern>`;}
    const pieces=[`<div class="mr-shadow-piece mr-shadow-sides" style="top:${body.top-mainBox.top}px;height:${body.height}px">${svg(
      `<defs>${edge('left')}${edge('right')}</defs>`
      +`<svg x="${ex-pad}" width="${cell}" height="100%" overflow="visible"><rect width="100%" height="100%" fill="url(#mr-shadow-left)"/></svg>`
      +`<svg x="${body.width-ex-ew-pad}" width="${cell}" height="100%" overflow="visible"><rect width="100%" height="100%" fill="url(#mr-shadow-right)"/></svg>`
    )}</div>`];
    for(const side of ['top','bottom']){
      const cap=root.querySelector('.mr-'+side),art=cap.querySelector(':scope>svg'),box=cap.getBoundingClientRect();
      if(!art)continue;art.id=prefix+side+'-art';
      const id='mr-shadow-'+side,overlap=theme.overlap*s;
      const gradient=side==='top'?`<stop offset="0" stop-color="white"/><stop offset="${100-overlap/box.height*100}%" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/>`:
        `<stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="${overlap/box.height*100}%" stop-color="white"/><stop offset="1" stop-color="white"/>`;
      const isRoll=cap.dataset.style==='default';
      const mask=isRoll?`<linearGradient id="${id}-gradient" x2="0" y2="1">${gradient}</linearGradient><mask id="${id}-join" style="mask-type:alpha"><rect width="${box.width}" height="${box.height}" fill="url(#${id}-gradient)"/></mask>`:'';
      pieces.push(`<div class="mr-shadow-piece mr-shadow-${side}" style="top:${box.top-mainBox.top}px;height:${box.height}px">${svg(
        `<defs>${filter(id+'-blur',-pad,-pad,box.width+pad*2,box.height+pad*2)}${mask}</defs>`
        +`<g filter="url(#${id}-blur)"><g${isRoll?` mask="url(#${id}-join)"`:''}><use href="#mr-${side}-art" width="${box.width}" height="${box.height}"/></g></g>`
      )}</div>`);
    }
    layer.innerHTML=pieces.join('');
  }
  function layout(event){theme=event.detail.theme;render();}
  root.addEventListener('parchment-surface-layout',layout);
  root.dataset.shadow=enabled?'on':'off';
  return {
    setEnabled(value){enabled=Boolean(value);root.dataset.shadow=enabled?'on':'off';render();},
    destroy(){root.removeEventListener('parchment-surface-layout',layout);layer.remove();delete root.dataset.shadow;}
  };
}
