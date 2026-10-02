// One native CSS background; no resize/scroll listeners or per-tile elements.
window.ParchmentBackgrounds={create(element,catalog){
  let request=0;
  return {async set(id){
    const item=catalog.find(entry=>entry.id===id);
    if(!item)throw new Error('Unknown background: '+id);
    const version=++request;
    if(item.image){const image=new Image();image.src=item.image;await image.decode();}
    if(version!==request)return false;
    element.style.setProperty('--workspace-color',item.color);
    element.style.setProperty('--workspace-image',item.image?'url('+JSON.stringify(item.image)+')':'none');
    element.style.setProperty('--workspace-size',item.image?item.tileSize+'px '+item.tileSize+'px':'auto');
    element.dataset.workspace=item.id;
    return true;
  },destroy(){request++;}};
}};

// Standalone demo adapter. Application integrations use the factory above.
(() => {
  const data=document.getElementById('mr-background-data');
  const select=document.querySelector('#manuscript-realistic .mr-background');
  if(!data||!select)return;
  const catalog=JSON.parse(data.textContent);
  const backgrounds=ParchmentBackgrounds.create(document.documentElement,catalog);
  const status=document.querySelector('.mr-background-status');
  for(const item of catalog)select.append(new Option(item.label,item.id));
  const parameter=new URLSearchParams(location.search).get('background');
  select.value=catalog.some(item=>item.id===parameter)?parameter:'oak';
  async function apply(){
    const id=select.value;status.textContent='Loading surface…';
    try{if(await backgrounds.set(id))status.textContent='';}
    catch(error){if(select.value===id)status.textContent='The surface could not load. Keep assets beside the page, or rebuild with embedded artwork.';console.error(error);}
  }
  select.addEventListener('change',apply);apply();
})();
