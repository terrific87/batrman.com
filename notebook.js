/* Homepage highlights stay in step with Pages CMS publishing. */
(async () => {
  const grid = document.querySelector('#notebook-grid');
  if (!grid) return;
  const root = new URL('./',document.currentScript.src);
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = value => {
    if (!value || /^(javascript|data|vbscript):|^\/\//i.test(String(value).trim())) return '';
    try { const u=new URL(String(value).replace(/^\/?assets\//,'assets/'),root);return ['http:','https:'].includes(u.protocol)?u.href:''; } catch {return '';}
  };
  const latest = items => items.filter(i=>i.published===true && i.title).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const names=['journal','travel','work'];
  const results=await Promise.allSettled(names.map(async section=>{
    const r=await fetch(new URL(`content/${section}.json`,root),{cache:'no-cache'});
    if(!r.ok)throw Error('Content unavailable');const data=await r.json();if(!Array.isArray(data))throw Error('Invalid content');
    return latest(data).map(i=>({...i,section}));
  }));
  // Retain useful static links if any content source cannot be loaded.
  if(results.some(r=>r.status==='rejected'))return;
  const [journal,travel,work]=results.map(r=>r.value);
  const destination=i=>i.section==='work'?url(i.url):i.id?new URL(`${i.section==='journal'?'blogs':'travel'}/post.html?id=${encodeURIComponent(i.id)}`,root).href:'';
  const eligible=work.filter(i=>['Writing','Podcast'].includes(i.category)&&destination(i));
  const picks=[journal.find(destination),travel.find(destination),eligible.find(i=>i.category==='Podcast')].filter(Boolean);
  for(const i of eligible)if(picks.length<3&&!picks.includes(i))picks.push(i);
  if(!picks.length){grid.closest('.latest-notebook').hidden=true;return;}
  grid.innerHTML=picks.map(i=>{
    const external=i.section==='work';
    const label=external?(i.label||i.category):(i.section==='journal'?'JOURNAL':'TRAVEL')+(i.date?' · '+String(i.date).slice(0,10):'');
    const action=external?(i.category==='Podcast'?'Listen to the conversation':'Read the article'):'Read the story';
    const image=url(i.image);
    return `<a class="notebook-card" href="${esc(destination(i))}"${external?' target="_blank" rel="noopener"':''}>${image?`<img src="${esc(image)}" alt="${esc(i.alt||'')}" loading="lazy">`:''}<span class="card-label">${esc(label)}</span><h3>${esc(i.title)}</h3><p>${esc(i.excerpt)}</p><span class="notebook-action">${esc(action)} ${external?'↗':'→'}</span></a>`;
  }).join('');
})();
