const fs=require('fs'); const H=+(process.env.H||20); const R=JSON.parse(fs.readFileSync('srows_'+H+'.json'));
const rank=a=>{ const o=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]), r=new Array(a.length); let i=0; while(i<o.length){ let j=i; while(j+1<o.length&&o[j+1][0]===o[i][0]) j++; for(let k=i;k<=j;k++) r[o[k][1]]=(i+j)/2; i=j+1; } return r; };
const corr=(a,b)=>{ const n=a.length, ma=a.reduce((s,v)=>s+v,0)/n, mb=b.reduce((s,v)=>s+v,0)/n; let sab=0,sa=0,sb=0; for(let i=0;i<n;i++){ sab+=(a[i]-ma)*(b[i]-mb); sa+=(a[i]-ma)**2; sb+=(b[i]-mb)**2; } return sa&&sb?sab/Math.sqrt(sa*sb):null; };
const by={}; R.forEach(r=>(by[r.d]=by[r.d]||[]).push(r));
const P=d=>d<'2023-01-01'?'tr':d<'2024-04-01'?'te1':'te2';
const K=Object.keys(R[0].f), ov=Math.sqrt(H/5);
function ic(fn,filt){ const o={tr:[],te1:[],te2:[]}; for(const d in by){ const rs=by[d].filter(r=>!filt||filt(r)).map(r=>[fn(r),r.y]).filter(z=>z[0]!=null&&isFinite(z[0])); if(rs.length<25) continue; const c=corr(rank(rs.map(z=>z[0])),rank(rs.map(z=>z[1]))); if(c!=null) o[P(d)].push(c); }
  const f=a=>{ if(a.length<8) return '     -     '; const m=a.reduce((s,v)=>s+v,0)/a.length, sd=Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)); return `${(m*100).toFixed(1).padStart(5)}(${(m/sd*Math.sqrt(a.length)/ov).toFixed(1).padStart(4)})`; };
  return {s:`${f(o.tr)} ${f(o.te1)} ${f(o.te2)}`, m:o.tr.length?o.tr.reduce((s,v)=>s+v,0)/o.tr.length:0, t:(()=>{const a=o.tr; if(a.length<8) return 0; const m=a.reduce((s,v)=>s+v,0)/a.length, sd=Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)); return m/sd*Math.sqrt(a.length)/ov; })()}; }
console.log(`ufuk ${H} işlem günü — günlük kesit Spearman IC×100 (t)   eğitim 2017–22 | test 2023–24/3 | test 2024/4+`);
const res={}; for(const k of K){ res[k]=ic(r=>r.f[k]); console.log(k.padEnd(8), res[k].s); }
fs.writeFileSync('ic_'+H+'.json',JSON.stringify(Object.fromEntries(K.map(k=>[k,{m:res[k].m,t:res[k].t}]))));
