// SHORT bloğunun (uygulamadaki kod) geçmiş testini doğrula
const fs=require('fs'),zlib=require('zlib'); const Hh=fs.readFileSync(require('path').join(__dirname,'..','..','..','ui','index.html'),'utf8');
const SHORT=new Function(Hh.slice(Hh.indexOf('/*SHORT:BEGIN'),Hh.indexOf('/*SHORT:END*/'))+';return SHORT;')();
const D=JSON.parse(zlib.gunzipSync(fs.readFileSync('data2.json.gz'))); const day=t=>new Date(t*1000+3*3600e3).toISOString().slice(0,10);
const ser={}; for(const k in D.px){ if(k.startsWith('X:')) continue; const p=D.px[k]; if(!p?.t) continue; const d=[],c=[],a=[]; p.t.forEach((t,i)=>{ if(p.c[i]>0){ d.push(day(t)); c.push(p.c[i]); a.push(p.a?.[i]||p.c[i]); } }); const I={}; d.forEach((x,i)=>I[x]=i); ser[k]={d,c,a,I}; }
const X=ser.XU100, H=20, COST=0.003; const P=d=>d<'2023-01-01'?'2017–22':d<'2024-04-01'?'2023–24/3':'2024/4+'; const R={};
for(let xi=300; xi+H<X.d.length; xi+=10){ const d=X.d[xi]; if(d<'2017-01-02') continue; const xr=X.c[xi+H]/X.c[xi]-1, mk=SHORT.market(X.c.slice(0,xi+1));
  const U=[]; for(const k in ser){ if(k==='XU100') continue; const s=ser[k], i=s.I[d]; if(i==null||i+H>=s.c.length) continue; const f=SHORT.feat(s.c.slice(Math.max(0,i-300),i+1)); if(!f) continue; U.push({k,f,y:s.a[i+H]/s.a[i]-1-xr}); }
  if(U.length<25) continue; const F=U.map(u=>u.f); U.forEach(u=>u.cv=SHORT.comp(u.f,F)); const C=U.map(u=>u.cv); U.forEach(u=>u.sc=SHORT.score(u.cv,C));
  const o=R[P(d)]=R[P(d)]||{top:[],all:[],q80:[],q20:[],upTop:[],dnTop:[]}; const top=[...U].sort((a,b)=>b.cv-a.cv).slice(0,5);
  top.forEach(u=>{ o.top.push(u.y-COST); (mk.up?o.upTop:o.dnTop).push(u.y-COST); }); U.forEach(u=>{ o.all.push(u.y-COST); if(u.sc>=80) o.q80.push(u.y-COST); if(u.sc<20) o.q20.push(u.y-COST); }); }
const m=a=>a.length?(a.reduce((s,v)=>s+v,0)/a.length*100).toFixed(2):'-', w=a=>a.length?(a.filter(x=>x>0).length/a.length*100).toFixed(0):'-';
for(const p in R){ const o=R[p]; console.log(`${p.padEnd(10)} en iyi 5: %${m(o.top)} (kâr %${w(o.top)}) | puan≥80: %${m(o.q80)} | puan<20: %${m(o.q20)} | tümü: %${m(o.all)} || piyasa yukarıyken en iyi 5: %${m(o.upTop)} aşağıyken: %${m(o.dnTop)}`); }
