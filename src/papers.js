// Catalog resolver source; also used to generate lib/catalog.js.
export const families = Object.freeze([
    Object.freeze({ id: 'light', label: 'Light paper', mode: 'light', tone: 'neutral' }),
    Object.freeze({ id: 'burnt', label: 'Warm / burnt paper', mode: 'light', tone: 'warm' }),
    Object.freeze({ id: 'dark', label: 'Dark neutral paper', mode: 'dark', tone: 'neutral' }),
    Object.freeze({ id: 'dark-burnt', label: 'Dark warm / burnt paper', mode: 'dark', tone: 'warm' })
  ]);

export function createCatalog(themes) {
    const entries = themes.map(theme => Object.freeze({
      ...theme, bodyCrop: Object.freeze([...theme.bodyCrop]), rollCrop: Object.freeze([...theme.rollCrop]), palette: Object.freeze({ ...theme.palette })
    }));
    const byId = new Map(entries.map(theme => [theme.id, theme]));
    function get(id) {
      const theme = byId.get(id);
      if (!theme) throw new Error('Unknown parchment paper: ' + id);
      return theme;
    }
    function list({ family, mode, tone } = {}) {
      return entries.filter(theme =>
        (family === undefined || theme.family === family) &&
        (mode === undefined || theme.mode === mode) &&
        (tone === undefined || theme.tone === tone));
    }
    function resolve({ paper, mode, tone } = {}) {
      const preferred = paper === undefined ? null : get(paper);
      mode = mode ?? preferred?.mode ?? 'light';
      tone = tone ?? preferred?.tone ?? 'neutral';
      if (!['light', 'dark'].includes(mode)) throw new Error('Unknown paper mode: ' + mode);
      if (!['neutral', 'warm'].includes(tone)) throw new Error('Unknown paper tone: ' + tone);
      const candidates = list({ mode, tone });
      const result = candidates.find(theme => theme.pair === preferred?.pair) || candidates[0];
      if (!result) throw new Error('No parchment paper for ' + mode + '/' + tone);
      return result;
    }
    return Object.freeze({ families, get, list, resolve });
  }
