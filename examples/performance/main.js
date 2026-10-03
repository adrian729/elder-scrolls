import { createParchment, createTableSurface, papers, backgrounds } from '../../lib/index.js';

const params = new URLSearchParams(location.search);
const controls = document.getElementById('controls');
const status = document.getElementById('status');
const sections = document.getElementById('sections');
const fields = Object.fromEntries(['paper', 'top', 'bottom', 'shadow', 'width', 'length', 'surface']
  .map(name => [name, document.getElementById(name)]));
const catalog = papers.list();
for (const paper of catalog) fields.paper.add(new Option(paper.label, paper.id));
for (const background of backgrounds) fields.surface.add(new Option(background.label, background.id));

const allowed = {
  paper: catalog.map(paper => paper.id), top: ['roll', 'paper'], bottom: ['roll', 'paper'],
  shadow: ['on', 'off'], width: ['900', '320', '480', '640', '1200', 'fluid'],
  surface: ['none', ...backgrounds.map(background => background.id)]
};
for (const [key, values] of Object.entries(allowed)) {
  fields[key].value = values.includes(params.get(key)) ? params.get(key) : values[0];
}
function sectionCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.min(100, Math.max(1, Math.floor(number))) : 4;
}
fields.length.value = sectionCount(params.get('length'));
controls.hidden = params.get('controls') === 'off';

function resizeContent(count) {
  while (sections.children.length > count) sections.lastElementChild.remove();
  while (sections.children.length < count) {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = `Section ${sections.children.length + 1}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = 'The texture should keep the same grain as this sheet grows. Its edges and shadows should stay joined at every width. The content remains regular HTML with native selection, scrolling, and keyboard navigation. '.repeat(3);
    section.append(heading, paragraph);
    sections.append(section);
  }
  sections.querySelector('#last-section')?.removeAttribute('id');
  sections.lastElementChild.id = 'last-section';
}
resizeContent(Number(fields.length.value));

function options() {
  return {
    paper: fields.paper.value, top: fields.top.value, bottom: fields.bottom.value,
    shadow: fields.shadow.value === 'on',
    maxWidth: fields.width.value === 'fluid' ? 'fluid' : Number(fields.width.value)
  };
}
function saveURL() {
  const url = new URL(location.href);
  url.searchParams.delete('renderer');
  for (const [key, field] of Object.entries(fields)) url.searchParams.set(key, field.value);
  history.replaceState(null, '', url);
}
let table = null;
function updateBackground() {
  if (fields.surface.value === 'none') {
    table?.destroy();
    table = null;
  } else if (table) {
    table.update({ surface: fields.surface.value });
  } else {
    table = createTableSurface(document.body, { surface: fields.surface.value });
  }
}
function currentReady(parchment = controller.ready) {
  return Promise.all([parchment, table?.ready ?? true]).then(results => results.every(Boolean));
}
let revision = 0;
async function report(promise) {
  const current = ++revision;
  document.documentElement.dataset.fixtureReady = 'false';
  status.textContent = 'Updating parchment…';
  try {
    const applied = await promise;
    if (current !== revision || applied === false) return;
    status.textContent = 'Ready';
    document.documentElement.dataset.fixtureReady = 'true';
  } catch (error) {
    if (current !== revision) return;
    status.textContent = error.message;
    document.documentElement.dataset.fixtureReady = 'error';
    console.error(error);
  }
}

performance.mark('fixture:mount-start');
const controller = createParchment(document.getElementById('page'), options());
const parchmentReady = controller.ready.then(applied => {
  performance.mark('fixture:controller-ready');
  performance.measure('fixture:mount-to-controller-ready', 'fixture:mount-start', 'fixture:controller-ready');
  return applied;
});
updateBackground();
const ready = report(currentReady(parchmentReady));

for (const key of Object.keys(allowed)) fields[key].addEventListener('change', () => {
  saveURL();
  if (key === 'surface') updateBackground();
  else controller.update(options());
  report(currentReady());
});
function changeLength(value) {
  fields.length.value = sectionCount(value);
  resizeContent(Number(fields.length.value));
  saveURL();
}
fields.length.addEventListener('change', () => changeLength(fields.length.value));
document.getElementById('add').addEventListener('click', () => changeLength(Number(fields.length.value) + 1));

// Automation hook; ready means controller completion, not a paint/GPU fence.
// No polling, animation loop, or measurement observer runs while the page is idle.
window.fixture = { controller, ready, changeLength };
