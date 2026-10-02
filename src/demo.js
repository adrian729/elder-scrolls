(() => {
  const root = document.getElementById('manuscript-realistic');
  const page = document.getElementById('mr-start');
  const sections = root.querySelector('.mr-sections');
  const originals = [...sections.children].map(section => section.cloneNode(true));
  const themeSelect = root.querySelector('.mr-theme');
  const lengthSelect = root.querySelector('.mr-length');
  const widthSelect = root.querySelector('.mr-width');
  const topSelect = root.querySelector('.mr-top-style');
  const bottomSelect = root.querySelector('.mr-bottom-style');
  const backgroundSelect = root.querySelector('.mr-background');
  const shadowToggle = root.querySelector('.mr-shadow-toggle');
  const status = root.querySelector('#mr-description');
  const backgroundStatus = root.querySelector('.mr-background-status');
  const query = new URLSearchParams(location.search);
  const systemMode = matchMedia('(prefers-color-scheme: dark)');
  const explicitTheme = ElderScrolls.papers.list().some(theme => theme.id === query.get('theme'));
  let followSystem = query.get('mode') === 'auto' && !explicitTheme;
  for (const family of ElderScrolls.families) {
    const group = document.createElement('optgroup'); group.label = family.label;
    for (const theme of ElderScrolls.papers.list({family: family.id})) group.append(new Option(theme.label, theme.id));
    themeSelect.append(group);
  }
  for (const item of ElderScrolls.backgrounds) backgroundSelect.append(new Option(item.label, item.id));
  themeSelect.value = explicitTheme ? query.get('theme') : 'ivory';
  if (!explicitTheme && (['light','dark','auto'].includes(query.get('mode')) || ['neutral','warm'].includes(query.get('tone')))) {
    themeSelect.value = ElderScrolls.papers.resolve({mode: query.get('mode') === 'auto' ? (systemMode.matches ? 'dark' : 'light') : query.get('mode') === 'dark' ? 'dark' : 'light', tone: query.get('tone') === 'warm' ? 'warm' : 'neutral'}).id;
  }
  backgroundSelect.value = ElderScrolls.backgrounds.some(item => item.id === query.get('background')) ? query.get('background') : 'walnut';
  if (['fluid','640','900','1100'].includes(query.get('width'))) widthSelect.value = query.get('width');
  if (['1','5','12'].includes(query.get('length'))) lengthSelect.value = query.get('length');
  for (const [side, select] of [['top',topSelect],['bottom',bottomSelect]]) if (['default','paper'].includes(query.get(side))) select.value = query.get(side);
  shadowToggle.checked = query.get('shadow') !== 'off';
  function appendSection() {
    const count = sections.childElementCount;
    const section = originals[count % originals.length].cloneNode(true);
    if (count >= originals.length) {
      section.querySelector('h2').textContent = 'Additional section ' + (count - originals.length + 1);
      section.querySelectorAll('.mr-illustration').forEach(image => image.remove());
    }
    sections.append(section);
  }
  function setLength(count) { sections.replaceChildren(); for (let i=0;i<count;i++) appendSection(); }
  setLength(Number(lengthSelect.value));
  function options() { return {paper:themeSelect.value, top:topSelect.value === 'default' ? 'roll' : 'paper', bottom:bottomSelect.value === 'default' ? 'roll' : 'paper', maxWidth:widthSelect.value === 'fluid' ? 'fluid' : Number(widthSelect.value), shadow:shadowToggle.checked}; }
  const parchment = ElderScrolls.createParchment(page, options());
  const table = ElderScrolls.createTableSurface(document.documentElement, {surface:backgroundSelect.value});
  let revision = 0;
  async function apply(promise = parchment.update(options())) {
    const version = ++revision;
    status.textContent = 'Loading parchment…'; page.setAttribute('aria-busy','true');
    try {
      if (!await promise || version !== revision) return;
      const theme = ElderScrolls.papers.get(themeSelect.value);
      for (const key of ['mode','tone','family']) root.dataset[key] = theme[key];
      root.dataset.theme = theme.id;
      status.textContent = topSelect.value === 'default' && bottomSelect.value === 'default' ? theme.description : theme.label + ' · Top: ' + (topSelect.value === 'default' ? 'original roll' : 'paper') + ' · Bottom: ' + (bottomSelect.value === 'default' ? 'original roll' : 'paper') + '.';
    } catch (error) { if(version === revision) status.textContent = 'The artwork could not load.'; console.error(error); }
    finally { if(version === revision) page.setAttribute('aria-busy','false'); }
  }
  async function applyBackground(promise = table.update({surface:backgroundSelect.value})) {
    backgroundStatus.textContent = 'Loading surface…';
    try { if (await promise) { document.documentElement.dataset.workspace = backgroundSelect.value; backgroundStatus.textContent = ''; } }
    catch (error) { backgroundStatus.textContent = 'The surface could not load.'; console.error(error); }
  }
  themeSelect.addEventListener('change', () => { followSystem=false; apply(); });
  for (const select of [widthSelect,topSelect,bottomSelect,shadowToggle]) select.addEventListener('change', () => apply());
  backgroundSelect.addEventListener('change', () => applyBackground());
  lengthSelect.addEventListener('change', () => { if(lengthSelect.value !== 'custom') setLength(Number(lengthSelect.value)); });
  root.querySelector('.mr-add').addEventListener('click', () => { appendSection(); lengthSelect.querySelector('[value="custom"]').hidden=false; lengthSelect.value='custom'; });
  root.addEventListener('parchment-theme', event => { themeSelect.value = ElderScrolls.papers.get(event.detail).id; followSystem=false; apply(); });
  systemMode.addEventListener('change', event => { if(followSystem) { themeSelect.value = ElderScrolls.papers.resolve({paper:themeSelect.value,mode:event.matches?'dark':'light'}).id; apply(); } });
  apply(parchment.ready); applyBackground(table.ready);
})();
