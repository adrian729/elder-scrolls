import '@ranx729/elder-scrolls/styles.css';
import '@ranx729/elder-scrolls/typography.css';
import { createParchment, createTableSurface, papers } from '@ranx729/elder-scrolls';
import { Parchment, TableSurface } from '@ranx729/elder-scrolls/react';
const page = createParchment(document.createElement('article'), { paper:'ivory', top:'roll', bottom:'paper', maxWidth:'fluid' });
page.content.append(document.createElement('section'));
page.update({paper:papers.resolve({paper:'ivory',mode:'dark'}).id,shadow:false});
createTableSurface(document.body,{surface:'walnut'}).destroy();
const example=<TableSurface surface="marble"><Parchment paper="rag-dark" maxWidth={900} aria-label="Reading page" onError={(error:Error)=>console.error(error)}><h1>Content</h1></Parchment></TableSurface>;
// @ts-expect-error Unknown material should not pass type checking.
page.update({paper:'plastic'});
// @ts-expect-error Endings have a fixed public vocabulary.
const wrong=<Parchment top="pointy" />;
void example; void wrong;
