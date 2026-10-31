const fs=require('fs'); const R=JSON.parse(fs.readFileSync('rows.json'));
const rank=a=>{ const o=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]), r=new Array(a.length); let i=0; while(i<o.length){ let j=i; while(j+1<o.length&&o[j+1][0]===o[i][0]) j++; for(let k=i;k<=j;k++) r[o[k][1]]=(i+j)/2; i=j+1; } return r; };
const corr=(a,b)=>{ const n=a.length, ma=a.reduce((s,v)=>s+v,0)/n, mb=b.reduce((s,v)=>s+v,0)/n; let sab=0,sa=0,sb=0; for(let i=0;i<n;i++){ sab+=(a[i]-ma)*(b[i]-mb); sa+=(a[i]-ma)**2; sb+=(b[i]-mb)**2; } return sa&&sb?sab/Math.sqrt(sa*sb):null; };
const sp=(a,b)=>corr(rank(a),rank(b));
const ERA=mo=>mo<"2022-01"?"A 2017-21":mo<"2024-04"?"B 2022-24/3":"C 2024/4+";
const byMo={}; R.forEach(r=>(byMo[r.mo]=byMo[r.mo]||[]).push(r));
const F=process.env.F||'e6';
function ic(fn,filt=()=>true){ const out={}; for(const mo in byMo){ const rs=byMo[mo].filter(r=>r[F]!=null&&filt(r)).map(r=>[fn(r),r[F]]).filter(z=>z[0]!=null&&isFinite(z[0])); if(rs.length<12) continue; const c=sp(rs.map(z=>z[0]),rs.map(z=>z[1])); if(c==null) continue; (out[ERA(mo)]=out[ERA(mo)]||[]).push(c); (out.ALL=out.ALL||[]).push(c); }
  const f=a=>{ if(!a) return '   -   '; const m=a.reduce((s,v)=>s+v,0)/a.length, sd=Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)); return `${(m*100).toFixed(1).padStart(5)}(${(m/sd*Math.sqrt(a.length/ (F==='e3'?3:F==='e6'?6:12))).toFixed(1)})`; };
  return ['ALL','A 2017-21','B 2022-24/3','C 2024/4+'].map(k=>f(out[k])).join(' '); }
const FAC={score:r=>r.score,karlilik:r=>r.hasFin?r.karlilik:null,deger:r=>r.hasFin?r.deger:null,momentum:r=>r.momentum,saglamlik:r=>r.saglamlik,
  roe:r=>r.roe, ep:r=>r.fk!=null?1/r.fk:null, bp:r=>r.pb>0?1/r.pb:null, mom121:r=>(1+r.y1/100)/(1+r.m1/100), m3:r=>r.m3, rev1:r=>-r.m1, lowvol:r=>r.vol!=null?-r.vol:null, size:r=>r.mcap};
console.log(`hedef ${F} (BIST100'e göre fazla getiri) — aylık Spearman IC ×100 (t, örtüşme düzeltmeli)`);
console.log('faktör      TÜMÜ        2017-21     2022-24/3   2024/4+');
for(const k in FAC) console.log(k.padEnd(10), ic(FAC[k]));
console.log('bankasız karlilik', ic(FAC.karlilik,r=>!r.bank), ' deger', ic(FAC.deger,r=>!r.bank));
console.log('banka karlilik', ic(FAC.karlilik,r=>r.bank), ' deger', ic(FAC.deger,r=>r.bank));
// sinyal sepetleri
const bs={}; R.filter(r=>r[F]!=null).forEach(r=>{ const k=ERA(r.mo)+' '+r.signal; (bs[k]=bs[k]||[]).push(r[F]); });
console.log('\nsinyal sepeti ortalama fazla getiri (%) [adet]'); Object.keys(bs).sort().forEach(k=>{ const a=bs[k]; console.log(k.padEnd(18), (a.reduce((s,v)=>s+v,0)/a.length*100).toFixed(1).padStart(6), `[${a.length}]`, 'medyan', (a.sort((x,y)=>x-y)[a.length>>1]*100).toFixed(1)); });
// puan beşlileri
const q={}; for(const mo in byMo){ const rs=byMo[mo].filter(r=>r[F]!=null).sort((a,b)=>a.score-b.score); rs.forEach((r,i)=>{ const k=Math.min(4,Math.floor(i*5/rs.length)); (q[k]=q[k]||[]).push(r[F]); }); }
console.log('\npuan beşlisi (1=en düşük) ort. fazla getiri %:', Object.keys(q).map(k=>(+k+1)+': '+(q[k].reduce((s,v)=>s+v,0)/q[k].length*100).toFixed(1)).join('  '));
module.exports={sp,byMo,ERA};
