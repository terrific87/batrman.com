/* Pages CMS content, shared by the section lists and post pages. */
(async () => {
  const section = document.body.dataset.section;
  if (!['journal','travel','work','shop'].includes(section)) return;
  const root = new URL('./', new URL(document.currentScript.src));
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const address = value => {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^(javascript|data|vbscript):/i.test(raw) || raw.startsWith('//')) return '';
    try {
      const u = new URL(raw.replace(/^\/?assets\//,'assets/'), root);
      return ['http:','https:'].includes(u.protocol) ? u.href : '';
    } catch { return ''; }
  };
  const rich = value => {
    const template = document.createElement('div'); template.innerHTML = String(value || '');
    const allowed = new Set('P BR H2 H3 H4 STRONG B EM I U S UL OL LI BLOCKQUOTE A IMG HR TABLE THEAD TBODY TR TH TD PRE CODE FIGURE FIGCAPTION'.split(' '));
    for (const el of [...template.querySelectorAll('*')]) {
      if (!allowed.has(el.tagName)) { el.remove(); continue; }
      for (const attr of [...el.attributes]) {
        if (el.tagName === 'A' && attr.name === 'href' || el.tagName === 'IMG' && attr.name === 'src') {
          const url = address(attr.value); if (url) el.setAttribute(attr.name,url); else el.removeAttribute(attr.name);
        } else if (!(el.tagName === 'IMG' && attr.name === 'alt')) el.removeAttribute(attr.name);
      }
      if (el.tagName === 'A') el.setAttribute('rel','noopener');
      if (el.tagName === 'IMG') el.setAttribute('loading','lazy');
    }
    return template.innerHTML;
  };
  const photo = item => address(item.image) ? `<img class="cms-cover" src="${escape(address(item.image))}" alt="${escape(item.alt || '')}" loading="lazy">` : '';
  const link = (url,label,cls='text-link') => address(url) ? `<a class="${cls}" href="${escape(address(url))}" target="_blank" rel="noopener">${escape(label)} ↗</a>` : '';
  try {
    const response = await fetch(new URL(`content/${section}.json`, root), {cache:'no-cache'});
    if (!response.ok) throw new Error('Content unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid content');
    const entries = data.filter(i => i.published === true).sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    const post = document.querySelector('#cms-post');
    if (post) {
      const id = new URLSearchParams(location.search).get('id');
      const item = entries.find(i => i.id === id);
      if (!item) { post.innerHTML = '<h1>Post not found</h1><p>This post is not currently available. Use the link above to browse the section.</p>'; return; }
      document.title = `${item.title} — Amandeep Batra`;
      document.querySelector('meta[name="description"]')?.setAttribute('content',item.excerpt || item.title);
      post.innerHTML = `<p class="eyebrow">${escape(item.category || section)}${item.date ? ' · '+escape(String(item.date).slice(0,10)) : ''}</p><h1>${escape(item.title)}</h1><p class="lede">${escape(item.excerpt)}</p>${photo(item)}<div class="cms-body">${rich(item.body)}</div>`;
      return;
    }
    if (section === 'journal' || section === 'travel') {
      if (!entries.length) return;
      const cards = entries.map(i => `<article class="post travel-card" data-categories="${escape(i.category || 'Life')}">${photo(i)}<span class="tag">${escape(i.category || 'Travel')}${i.date ? ' · '+escape(String(i.date).slice(0,10)) : ''}</span><h3><a href="post.html?id=${encodeURIComponent(i.id)}">${escape(i.title)}</a></h3><p>${escape(i.excerpt)}</p><a class="text-link" href="post.html?id=${encodeURIComponent(i.id)}">Read the post →</a></article>`).join('');
      if (section === 'journal') {
        document.querySelector('.post-grid').innerHTML = cards;
        const note = document.querySelector('.publication-note'); if (note) note.hidden = true;
      } else {
        const grid = document.querySelector('.travel-grid');
        const feed = document.createElement('section'); feed.className='cms-travel-posts';
        feed.innerHTML=`<h2>From the travel journal.</h2><div class="post-grid">${cards}</div>`;
        grid.before(feed);
      }
    }
    if (section === 'work') {
      const card = i => `<article class="publication">${photo(i)}<span class="work-meta">${escape(i.label || i.category)}</span><h3>${escape(i.title)}</h3><p>${escape(i.excerpt)}</p>${i.credit ? `<p class="credit">${escape(i.credit)}</p>` : ''}<div class="cms-body">${rich(i.body)}</div>${link(i.url,i.category === 'Podcast' ? 'Listen & read the transcript' : i.category === 'Patent' ? 'View the patent record' : 'Read more')}</article>`;
      document.querySelector('.publication-grid').innerHTML=entries.filter(i=>i.category==='Writing').map(card).join('');
      document.querySelector('.podcast-grid').innerHTML=entries.filter(i=>i.category==='Podcast').map(i=>`<article class="podcast-card"><span class="episode-number">${escape(i.episode)}</span><div>${card(i)}</div></article>`).join('');
      document.querySelector('.related-guide').innerHTML=entries.filter(i=>i.category==='Related reading').map(card).join('');
      const patent=document.querySelector('.patent-feature');
      patent.lastElementChild.innerHTML=entries.filter(i=>i.category==='Patent').map(card).join('');
      document.querySelector('#patent').hidden=!entries.some(i=>i.category==='Patent');
    }
    if (section === 'shop') {
      document.querySelector('.shop-grid').innerHTML=entries.map(i=>`<article class="product-card">${photo(i) || `<div class="product-art"><div class="quote">${escape(i.quote || i.title)}</div></div>`}<div class="product-info"><h3>${escape(i.title)}</h3><p>${escape(i.excerpt)}</p><div class="cms-body">${rich(i.body)}</div><div class="product-bottom"><span class="price">${escape(i.price || (i.status==='Concept'?'Coming soon':''))}</span><span class="coming">${escape(i.status)}</span></div>${i.status==='Available'?link(i.url,'Order'):''}</div></article>`).join('');
      if (entries.some(i=>i.status==='Available' && address(i.url))) {
        document.querySelector('.shop-note').textContent='Choose a product to see its ordering and delivery details.';
        document.querySelector('.page-hero .lede').textContent='Payment jokes, simple designs and things I’d enjoy wearing myself.';
        document.querySelector('.shop-intro p').textContent='T-shirts, caps and a little shared humour from life in payments.';
      }
    }
  } catch (error) {
    console.warn('The latest website content could not be loaded.', error);
    const post=document.querySelector('#cms-post');
    if(post) post.innerHTML='<h1>Unable to load this post</h1><p>Please refresh the page or return to the section.</p>';
  }
})();
