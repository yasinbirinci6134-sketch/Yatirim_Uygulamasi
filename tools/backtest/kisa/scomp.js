const fs=require('fs'); const H=+(process.env.H||20); const R=JSON.parse(fs.readFileSync('srows_'+H+'.json'));
const SEL=(process.env.SEL||'r252x21,ma200,trend,rsi,pos52,dd60').split(','), NEG=new Set((process.env.NEG||'vol20').split(',').filter(Boolean));
const rank=a=>{ const o=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]), r=new Array(a.length); let i=0; while(i<o.length){ let j=i; while(j+1<o.length&&o[j+1][0]===o[i][0]) j++; for(let k=i;k<=j;k++) r[o[k][1]]=(i+j)/2; i=j+1; } return r; };
const corr=(a,b)=>{ const n=a.length, ma=a.reduce((s,v)=>s+v,0)/n, mb=b.reduce((s,v)=>s+v,0)/n; let sab=0,sa=0,sb=0; for(let i=0;i<n;i++){ sab+=(a[i]-ma)*(b[i]-mb); sa+=(a[i]-ma)**2; sb+=(b[i]-mb)**2; } return sa&&sb?sab/Math.sqrt(sa*sb):null; };
const by={}; R.forEach(r=>(by[r.d]=by[r.d]||[]).push(r)); const P=d=>d<'2023-01-01'?'2017–22':d<'2024-04-01'?'2023–24/3':'2024/4+';
const COST=0.003, out={};
for(const d in by){ const rs=by[d].filter(r=>[...SEL,...NEG].every(k=>r.f[k]!=null&&isFinite(r.f[k]))); if(rs.length<25) continue; const n=rs.length;
  const sc=new Array(n).fill(0); for(const k of SEL){ const rk=rank(rs.map(r=>r.f[k])); rk.forEach((v,i)=>sc[i]+=v/(n-1)); } for(const k of NEG){ const rk=rank(rs.map(r=>r.f[k])); rk.forEach((v,i)=>sc[i]+=1-v/(n-1)); }
  const m=SEL.length+NEG.size; rs.forEach((r,i)=>r.s=sc[i]/m);
  const p=P(d), o=out[p]=out[p]||{ic:[],q:[[],[],[],[],[]],top:[],all:[],up:{top:[],all:[]},dn:{top:[],all:[]}};
  o.ic.push(corr(rank(rs.map(r=>r.s)),rank(rs.map(r=>r.y))));
  const srt=[...rs].sort((a,b)=>a.s-b.s); srt.forEach((r,i)=>o.q[Math.min(4,Math.floor(i*5/n))].push(r.y));
  const top=srt.slice(-5); top.forEach(r=>o.top.push(r.y-COST)); rs.forEach(r=>o.all.push(r.y-COST));
  const g=rs[0].up?o.up:o.dn; top.forEach(r=>g.top.push(r.y-COST)); rs.forEach(r=>g.all.push(r.y-COST)); }
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length, win=a=>a.filter(x=>x>0).length/a.length, med=a=>[...a].sort((x,y)=>x-y)[a.length>>1];
console.log(`ufuk ${H} gün | seçili: ${SEL.join('+')}${NEG.size?' − '+[...NEG].join(','):''}`);
for(const p of ['2017–22','2023–24/3','2024/4+']){ const o=out[p]; if(!o) continue;
  console.log(`${p.padEnd(10)} IC ${(mean(o.ic)*100).toFixed(1)} | beşli ort.% ${o.q.map(a=>(mean(a)*100).toFixed(2)).join(' ')} | EN İYİ 5: ort ${(mean(o.top)*100).toFixed(2)}% medyan ${(med(o.top)*100).toFixed(2)}% kâr %${(win(o.top)*100).toFixed(0)} — tüm hisseler: ort ${(mean(o.all)*100).toFixed(2)}% kâr %${(win(o.all)*100).toFixed(0)}`);
  console.log(`           piyasa yükselişte (XU100>50g ort.): en iyi 5 ${(mean(o.up.top)*100).toFixed(2)}% (kâr %${(win(o.up.top)*100).toFixed(0)}) vs tümü ${(mean(o.up.all)*100).toFixed(2)}% | düşüşte: en iyi 5 ${o.dn.top.length?(mean(o.dn.top)*100).toFixed(2):'-'}% (kâr %${o.dn.top.length?(win(o.dn.top)*100).toFixed(0):'-'}) vs tümü ${o.dn.all.length?(mean(o.dn.all)*100).toFixed(2):'-'}%`); }
