import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Parchment, TableSurface } from '@ranx729/elder-scrolls/react';
import '@ranx729/elder-scrolls/styles.css';
import './style.css';

function App() {
  const [dark, setDark] = useState(false);
  const [paperEnds, setPaperEnds] = useState(false);
  const [shadow, setShadow] = useState(true);
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('React owns this input');
  const [status, setStatus] = useState('Loading');
  const [surface, setSurface] = useState('walnut');
  return <TableSurface surface={surface} onError={error => setStatus(error.message)}>
    <nav>
      <button onClick={() => setDark(value => !value)}>Change paper</button>
      <button onClick={() => setPaperEnds(value => !value)}>Change ends</button>
      <button onClick={() => setShadow(value => !value)}>Toggle shadow</button>
      <button onClick={() => setCount(value => value+1)}>Add content</button>
      <button onClick={() => setVisible(value => !value)}>Unmount / mount</button>
      <button onClick={() => setSurface(value => value === 'walnut' ? 'marble' : 'walnut')}>Change table</button>
      <span role="status">{status}</span>
    </nav>
    {visible && <Parchment id="primary" paper={dark ? 'ivory-dark' : 'ivory'} top={paperEnds ? 'paper' : 'roll'} bottom={paperEnds ? 'paper' : 'roll'} shadow={shadow} onReady={() => setStatus('Ready')} onError={error => setStatus(error.message)}>
      <h1>React content on parchment</h1>
      <label>Your notes <input value={note} onChange={event => setNote(event.target.value)} /></label>
      {Array.from({length:count}, (_,index) => <p key={index}>This is ordinary React content. Adding it grows the paper and moves the bottom ending. {'Readable, selectable HTML. '.repeat(20)}</p>)}
    </Parchment>}
    <Parchment id="secondary" paper="rag-dark" top="paper" bottom="paper" shadow={false} onError={error => setStatus(error.message)}><h1>Independent second sheet</h1><p>Both sheets use the same renderer, with separate artwork IDs.</p></Parchment>
  </TableSurface>;
}
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
