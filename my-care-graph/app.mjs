import {calculate,compare,rules,domains,defaults,VERSION} from './scoring.mjs';
import {records,NOW,BEFORE,findings} from './data.mjs';
const $=id=>document.getElementById(id); let weights={...defaults}, active=[];
const fmt=n=>n===null?'—':Math.round(n).toString();
const icons={metabolic:'◈',cardiovascular:'♡',recovery:'☾',activity:'↗'};
function scenario(){
  let result=structuredClone(records); const mode=$('scenario').value;
  if(mode==='missing')result=result.filter(r=>!['hba1c','glucose','waist'].includes(r.metric));
  if(mode==='stale')result=result.filter(r=>!['bp','nonhdl'].includes(r.metric)||r.date<NOW.slice(0,7));
  if(mode==='switch')result.forEach(r=>{if(r.device&&r.date>BEFORE)r.device='Watch B · firmware 2.0';});
  if(mode==='new')result=result.filter(r=>!['steps','minutes'].includes(r.metric)||r.date>BEFORE);
  if(mode==='empty')result=[];
  return result;
}
function showRecord(id){
  const r=active.find(r=>r.id===id);const finding=findings.find(f=>f.id===id);
  if(finding){$('record-title').textContent=finding.title;$('record-body').innerHTML=`<p>${finding.text}</p><p>${finding.source}</p><p>Separate from scoring · Fictional demonstration record</p>`;}
  else if(r){const rule=rules.find(x=>x.id===r.metric),result=calculate(active,NOW,weights),row=result.rows.find(x=>x.rule.id===r.metric),domain=result.breakdown.find(d=>d.id===rule.domain),baseline=active.filter(x=>x.metric===r.metric&&x.date<=BEFORE).sort((a,b)=>b.date.localeCompare(a.date))[0];$('record-title').textContent=rule.label;$('record-body').innerHTML=`<dl><dt>Record ID</dt><dd>${r.id}</dd><dt>Value</dt><dd>${r.value} ${rule.unit}</dd><dt>Recorded</dt><dd>${r.date}</dd><dt>Source</dt><dd>${r.source}</dd><dt>Device</dt><dd>${r.device||'Not a wearable measurement'}</dd></dl><h3>Why this contribution?</h3><p>Provisional rule v${VERSION}: 100 at ${rule.good} ${rule.unit}, 0 at ${rule.poor} ${rule.unit}, linear mapping clipped to 0–100. Freshness window: ${rule.days} days.</p><p>${row.selected?`Rule score ${fmt(row.score)}. This group shares the ${domain.label} domain equally with ${domain.selected.length-1} other available groups. Domain weight: ${domain.weight}. Overall contribution: ${(row.contribution||0).toFixed(1)} points.`:row.status==='available'?`Excluded from the overall score: a higher-priority indicator in the ${rule.group} group already represents this evidence.`:`Excluded from the overall score: ${row.status} evidence.`}</p><h3>Six-month source comparison</h3><p>${baseline?`Baseline record ${baseline.id} · ${baseline.date}: ${baseline.value} ${rule.unit}. Source: ${baseline.source}. Device: ${baseline.device||'Not wearable'}. ${rule.device&&baseline.device!==r.device?'Different devices: excluded from matched change.':'Matched change also requires the same indicator to be selected at both dates.'}`:'No baseline record available. This indicator cannot contribute to six-month change.'}</p><p>${r.note}</p>`;}
  else return;
  $('record-dialog').showModal();
}
function render(){
  active=scenario();const result=calculate(active,NOW,weights),trend=compare(active,NOW,BEFORE,weights);
  $('score').textContent=fmt(result.score);$('ring').style.setProperty('--progress',`${result.score||0}%`);
  $('change').textContent=trend.delta===null?'Not comparable':`${trend.delta>=0?'+':''}${trend.delta.toFixed(1)} pts`;
  $('matched').textContent=`${trend.count} matched indicators · ${trend.excluded} current indicators excluded`;
  $('coverage').textContent=`${Math.round(result.coverage*100)}%`;$('coverage-bar').style.width=`${result.coverage*100}%`;
  $('coverage-note').textContent=`${result.breakdown.reduce((s,d)=>s+d.selected.length,0)} of ${result.breakdown.reduce((s,d)=>s+d.groups,0)} evidence groups available. ${Object.values(weights).some(x=>x>0)?'':'Set at least one weight above zero to calculate a score.'}`;
  $('domains').innerHTML=result.breakdown.map(d=>`<article class="domain"><div class="domain-head"><span class="icon">${icons[d.id]}</span><span>${d.weight} weight</span></div><h3>${d.label}</h3><div class="domain-number">${fmt(d.score)}<small>${d.score===null?'No current evidence':'/ 100'}</small></div><div class="bar"><i style="width:${d.score||0}%"></i></div><p>${d.selected.length} / ${d.groups} groups available · ${Math.round(d.coverage*100)}% coverage</p><small>${d.weight===0?'Excluded by weight setting':d.score===null?'Not included in overall score':'Based on provisional rules'}</small></article>`).join('');
  $('evidence-rows').innerHTML=result.rows.map(r=>{
    const status=r.status==='available'?(r.selected?'Included':'Correlated · excluded'):r.status==='stale'?'Stale · excluded':r.status==='missing'?'Missing':'Invalid · excluded';
    return `<tr><td><strong>${r.rule.label}</strong><small>${domains[r.rule.domain]} · ${r.rule.group}</small></td><td>${r.record?`${r.record.value} ${r.rule.unit}<small>${r.record.date}${r.record.device?` · ${r.record.device}`:''}</small>`:'No record'}</td><td><span class="tag ${r.selected?'included':''}">${status}</span></td><td>${fmt(r.score)}</td><td>${r.selected&&weights[r.rule.domain]>0?`${r.contribution.toFixed(1)} points`:'—'}</td><td>${r.record?`<button class="record-link" data-record="${r.record.id}">${r.record.source} ↗</button>`:'—'}</td></tr>`;
  }).join('');
  document.querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>showRecord(b.dataset.record));
}
$('findings').innerHTML=findings.map(f=>`<article class="finding"><span class="tag">${f.kind}</span><h3>${f.title}</h3><p>${f.text}</p><button class="record-link" data-record="${f.id}">${f.source} ↗</button></article>`).join('');
$('weights').innerHTML=Object.entries(domains).map(([id,label])=>`<label class="weight">${label}<input type="number" id="weight-${id}" aria-label="${label} weight" min="0" max="100" step="1" value="${weights[id]}"></label>`).join('');
Object.keys(domains).forEach(id=>$(`weight-${id}`).oninput=e=>{weights[id]=Math.min(100,Math.max(0,Number(e.target.value)||0));render();});
$('rules').innerHTML=`<p>Version ${VERSION}. Changing rules requires a new algorithm version.</p>`+rules.map(r=>`<p><strong>${r.label}</strong>: 100 at ${r.good} ${r.unit}; 0 at ${r.poor} ${r.unit}. Fresh ≤ ${r.days} days. Group: ${r.group}.</p>`).join('');
$('reset').onclick=()=>{weights={...defaults};Object.keys(domains).forEach(id=>$(`weight-${id}`).value=weights[id]);render();};
$('scenario').onchange=render;$('close-dialog').onclick=()=>$('record-dialog').close();render();
