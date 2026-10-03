// Paper endings reuse the selected photographic atlas; no new raster assets.
export function createEndings(root, options = {}, prefix) {
  const scope = markup => markup.replaceAll('id="mr-', 'id="' + prefix).replaceAll('#mr-', '#' + prefix);
  let activeTheme=null,originalEnds=null,endingFrame=0,endingSignature='';
  const shapes={top:'',bottom:''};
  const styles={top:'default',bottom:'default'};
  // Only the outline responds to layout. The photographic patterns remain in
  // CSS-pixel coordinates, including their phase across the body/cap boundary.
  function renderEndings(){
    if(!activeTheme)return false;
    const theme=activeTheme,s=theme.scale;
    const {width,height:bodyHeight}=root.querySelector('.mr-body').getBoundingClientRect();
    const signature=[theme.id,width,bodyHeight,styles.top,styles.bottom].join(':');
    if(signature===endingSignature)return false;endingSignature=signature;
    const core=theme.coreInset*s,ex=theme.edgeX*s,ew=theme.edgeWidth*s;
    for(const side of ['top','bottom']){
      const cap=root.querySelector('.mr-'+side),style=styles[side];
      if(cap.dataset.style!==style){cap.dataset.style=style;root.dataset[side+'Ending']=style;}
      const height=style==='default'?theme.capHeight*s:56;
      const heightProperty='--mr-'+side+'-height';
      if(root.style.getPropertyValue(heightProperty)!==height+'px')root.style.setProperty(heightProperty,height+'px');
      // A two-pixel overlap covers fractional device-pixel antialiasing at the
      // cap/body boundary. Pattern phase accounts for that exact overlap.
      const overlap=style==='default'?theme.overlap*s:2;
      const overlapProperty='--mr-'+side+'-overlap';
      if(root.style.getPropertyValue(overlapProperty)!==overlap+'px')root.style.setProperty(overlapProperty,overlap+'px');
      if(style==='default'){
        // Keep the original SVG alive across content growth and ending changes.
        if(cap.firstElementChild!==originalEnds[side])cap.replaceChildren(originalEnds[side]);
        shapes[side]='';
        continue;
      }
      const phase=side==='top'?height-overlap:overlap-bodyHeight;
      const shapeSignature=[width,style].join(':');
      if(shapes[side]===shapeSignature){
        // Only the bottom texture phase follows body height. The outline and
        // its shadow reference stay intact; no SVG parsing is needed.
        for(const pattern of cap.querySelectorAll('pattern')){
          if(pattern.getAttribute('y')!==String(phase))pattern.setAttribute('y',phase);
        }
        continue;
      }
      shapes[side]=shapeSignature;
      const top=side==='top',left=ex+5,right=width-ex-5;
      const wear=theme.mode==='dark'?'#11100e':theme.palette.ink;
      const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
      const noise=(d,step)=>{const n=Math.floor(d/step),t=d/step-n,k=t*t*(3-2*t);return (hash(n)*(1-k)+hash(n+1)*k-.5)*2;};
      const rough=d=>noise(d,17)*1.3+noise(d,5)*.65+noise(d,2)*.25;
      const count=Math.ceil((right-left)/3),boundary=[];
      for(let i=0;i<=count;i++){
        const t=i/count,x=left+(right-left)*t;
        const depth=height-13+rough(x);
        boundary.push([x,top?height-depth:depth]);
      }
      const shoulder=top?height:0;
      const line=boundary.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join(' ');
      const path=`M ${ex} ${shoulder} L ${left} ${shoulder} ${line.replace(/^M/,'L')} L ${width-ex} ${shoulder} Z`;
      const ns='http://www.w3.org/2000/svg';
      cap.innerHTML=scope(`<svg xmlns="${ns}" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="mr-${side}-shape"><path d="${path}"/></clipPath>
          <pattern id="mr-${side}-sheet" href="#mr-paper" x="0" y="${phase}"/>
          <pattern id="mr-${side}-edge-left" href="#mr-left" x="0" y="${phase}"/>
          <pattern id="mr-${side}-edge-right" href="#mr-right" x="0" y="${phase}"/>
        </defs>
        <g clip-path="url(#mr-${side}-shape)">
          <rect x="${core}" width="${Math.max(0,width-core*2)}" height="${height}" fill="url(#mr-${side}-sheet)"/>
          <svg x="${ex}" width="${ew}" height="${height}" overflow="hidden"><rect width="100%" height="100%" fill="url(#mr-${side}-edge-left)"/></svg>
          <svg x="${width-ex-ew}" width="${ew}" height="${height}" overflow="hidden"><rect width="100%" height="100%" fill="url(#mr-${side}-edge-right)"/></svg>
          ${[24,20,16,12,9,6,4,2].map((n,i)=>`<path d="${line}" fill="none" stroke="${wear}" stroke-opacity="${i<4?.016:.024}" stroke-width="${n}"/>`).join('')}
          <path d="${line}" fill="none" stroke="${wear}" stroke-opacity=".2" stroke-width="1"/>
        </g>
      </svg>`);
    }
    root.dispatchEvent(new CustomEvent('parchment-surface-layout',{detail:{theme:activeTheme}}));
    return true;
  }
  function scheduleEndings(){
    if(!endingFrame)endingFrame=requestAnimationFrame(()=>{endingFrame=0;renderEndings();});
  }
  const endingObserver=new ResizeObserver(scheduleEndings);
  endingObserver.observe(root.querySelector('.mr-body'));
  function setOptions(options){
    for(const side of ['top','bottom'])if(options[side]!==undefined&&!['default','paper'].includes(options[side]))throw new Error('Unknown '+side+' ending: '+options[side]);
    let changed=false;
    for(const side of ['top','bottom'])if(options[side]!==undefined&&styles[side]!==options[side]){styles[side]=options[side];changed=true;}
    if(changed)scheduleEndings();
  }
  setOptions(options);
  return {
    setPaper(theme){
      activeTheme=theme;
      originalEnds={top:root.querySelector('.mr-top').firstElementChild,bottom:root.querySelector('.mr-bottom').firstElementChild};
      shapes.top=shapes.bottom='';
      endingSignature='';return renderEndings();
    },
    setOptions,
    refresh: renderEndings,
    destroy(){endingObserver.disconnect();cancelAnimationFrame(endingFrame);}
  };
}
