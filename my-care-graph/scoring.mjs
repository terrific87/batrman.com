export const VERSION = '0.1.0';
export const rules = [
  {id:'hba1c',domain:'metabolic',label:'HbA1c',unit:'mmol/mol',good:35,poor:55,lower:true,days:180,group:'glycaemia'},
  {id:'glucose',domain:'metabolic',label:'Fasting glucose',unit:'mmol/L',good:4.8,poor:7,lower:true,days:180,group:'glycaemia'},
  {id:'waist',domain:'metabolic',label:'Waist-to-height ratio',unit:'ratio',good:.45,poor:.65,lower:true,days:180,group:'adiposity'},
  {id:'bp',domain:'cardiovascular',label:'Systolic blood pressure',unit:'mmHg',good:115,poor:160,lower:true,days:90,group:'pressure'},
  {id:'nonhdl',domain:'cardiovascular',label:'Non-HDL cholesterol',unit:'mmol/L',good:2.5,poor:5.5,lower:true,days:180,group:'lipids'},
  {id:'sleep',domain:'recovery',label:'Average sleep duration',unit:'hours',good:8,poor:5,days:30,group:'sleep',device:true},
  {id:'efficiency',domain:'recovery',label:'Sleep efficiency',unit:'%',good:90,poor:65,days:30,group:'sleep',device:true},
  {id:'steps',domain:'activity',label:'Daily steps · 14-day mean',unit:'steps',good:9000,poor:2000,days:30,group:'movement',device:true},
  {id:'minutes',domain:'activity',label:'Weekly active minutes',unit:'min',good:150,poor:0,days:30,group:'movement',device:true}
];
export const domains = {metabolic:'Metabolic',cardiovascular:'Cardiovascular',recovery:'Sleep & recovery',activity:'Activity'};
export const defaults = {metabolic:30,cardiovascular:30,recovery:20,activity:20};
export function calculate(records,at,weights=defaults,customRules=rules){
  const date=new Date(at); const rows=customRules.map(rule=>{
    const record=records.filter(r=>r.metric===rule.id && new Date(r.date)<=date).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
    const age=record ? (date-new Date(record.date))/86400000 : null;
    const status=!record?'missing':!Number.isFinite(record.value)?'invalid':age>rule.days?'stale':'available';
    const raw=status==='available'?(rule.lower?(rule.poor-record.value)/(rule.poor-rule.good):(record.value-rule.poor)/(rule.good-rule.poor))*100:null;
    return {rule,record,age,status,score:raw===null?null:Math.max(0,Math.min(100,raw)),selected:false};
  });
  const breakdown=Object.keys(domains).map(id=>{
    const candidates=rows.filter(r=>r.rule.domain===id); const groups=[...new Set(candidates.map(r=>r.rule.group))];
    const selected=groups.map(group=>candidates.find(r=>r.rule.group===group&&r.status==='available')).filter(Boolean);
    selected.forEach(r=>r.selected=true);
    return {id,label:domains[id],score:selected.length?selected.reduce((s,r)=>s+r.score,0)/selected.length:null,coverage:groups.length?selected.length/groups.length:0,selected,groups:groups.length,weight:Math.max(0,Number(weights[id])||0)};
  });
  const total=breakdown.reduce((s,d)=>s+d.weight,0); const observed=breakdown.filter(d=>d.score!==null&&d.weight>0); const denominator=observed.reduce((s,d)=>s+d.weight,0);
  for(const d of breakdown) for(const row of d.selected) row.contribution=denominator?row.score*d.weight/denominator/d.selected.length:0;
  return {version:VERSION,at,rows,breakdown,score:denominator?observed.reduce((s,d)=>s+d.score*d.weight,0)/denominator:null,coverage:total?breakdown.reduce((s,d)=>s+d.coverage*d.weight,0)/total:0};
}
export function compare(records,now,before,weights=defaults){
  const current=calculate(records,now,weights), baseline=calculate(records,before,weights);
  const pairs=current.rows.filter(r=>r.selected&&weights[r.rule.domain]>0).map(r=>({now:r,then:baseline.rows.find(b=>b.rule.id===r.rule.id)})).filter(p=>p.then?.selected&&(!p.now.rule.device||p.now.record.device===p.then.record.device));
  if(!pairs.length) return {delta:null,count:0,excluded:current.rows.filter(r=>r.selected).length};
  const ids=new Set(pairs.map(p=>p.now.rule.id));
  const narrowed=rules.filter(r=>ids.has(r.id));
  const a=calculate(records,now,weights,narrowed),b=calculate(records,before,weights,narrowed);
  return {delta:a.score-b.score,count:pairs.length,excluded:current.rows.filter(r=>r.selected&&weights[r.rule.domain]>0).length-pairs.length};
}
