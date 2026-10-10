import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,compare,defaults,VERSION} from './scoring.mjs';
import {records,NOW,BEFORE} from './data.mjs';
test('versioned score has traceable contributions summing to the total',()=>{
  const s=calculate(records,NOW);assert.equal(s.version,VERSION);assert.equal(s.coverage,1);
  assert.equal(s.rows.filter(r=>r.selected).length,6);
  assert.ok(Math.abs(s.rows.filter(r=>r.selected).reduce((a,r)=>a+r.contribution,0)-s.score)<1e-9);
  assert.ok(s.rows.filter(r=>r.selected).every(r=>r.record.id));
});
test('missing evidence is not scored as zero',()=>{
  const s=calculate(records.filter(r=>!['hba1c','glucose','waist'].includes(r.metric)),NOW);
  assert.equal(s.breakdown[0].score,null);assert.equal(s.coverage,.7);assert.ok(s.score>0);
  const empty=calculate([],NOW);assert.equal(empty.score,null);assert.equal(empty.coverage,0);
});
test('stale records are retained but excluded; newer future records are ignored',()=>{
  const s=calculate(records.filter(r=>r.date<BEFORE),NOW);assert.equal(s.score,null);assert.ok(s.rows.every(r=>r.status==='stale'));
  const future={...records.find(r=>r.metric==='bp'),id:'future',date:'2027-01-01',value:200};
  assert.equal(calculate([...records,future],NOW).score,calculate(records,NOW).score);
});
test('correlated indicators cannot double-count; a fallback can supply a missing group',()=>{
  const altered=records.map(r=>r.metric==='glucose'?{...r,value:50}:r);
  assert.equal(calculate(altered,NOW).score,calculate(records,NOW).score);
  const fallback=calculate(records.filter(r=>r.metric!=='hba1c'),NOW);
  assert.ok(fallback.rows.find(r=>r.rule.id==='glucose').selected);assert.equal(fallback.coverage,1);
});
test('device switch excludes cross-device comparisons without losing current coverage',()=>{
  const switched=records.map(r=>r.device&&r.date>BEFORE?{...r,device:'Watch B'}:r);
  assert.equal(calculate(switched,NOW).coverage,1);assert.equal(compare(switched,NOW,BEFORE).count,4);
  assert.equal(compare(switched,NOW,BEFORE).excluded,2);
});
test('newly available evidence is excluded from matched change',()=>{
  const added=records.filter(r=>!['steps','minutes'].includes(r.metric)||r.date>BEFORE);
  const withChange=compare(added,NOW,BEFORE);assert.equal(withChange.count,5);
  const noActivity=records.filter(r=>!['steps','minutes'].includes(r.metric));
  assert.equal(withChange.delta,compare(noActivity,NOW,BEFORE).delta);
});
test('changing selected correlated indicator excludes that group from change',()=>{
  const fallback=records.filter(r=>r.metric!=='hba1c'||r.date<BEFORE);
  assert.equal(compare(fallback,NOW,BEFORE).count,5);
});
test('zero weights, invalid measurements and empty comparisons are explicit',()=>{
  assert.equal(calculate(records,NOW,{metabolic:0,cardiovascular:0,recovery:0,activity:0}).score,null);
  assert.equal(compare([],NOW,BEFORE).delta,null);
  const s=calculate([{id:'bad',metric:'bp',value:null,date:NOW}],NOW);
  assert.equal(s.rows.find(r=>r.rule.id==='bp').status,'invalid');assert.equal(s.score,null);
});
test('same weights apply to both comparison dates',()=>{
  const w={...defaults,metabolic:100,cardiovascular:0,recovery:0,activity:0};
  assert.equal(compare(records,NOW,BEFORE,w).count,2);
  assert.ok(Math.abs(compare(records,NOW,BEFORE,w).delta-(calculate(records,NOW,w).score-calculate(records,BEFORE,w).score))<1e-9);
});
