const fs=require('fs'),zlib=require('zlib'); const {features}=require('./feat.js');
const D=JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2]||'data.json.gz'))); const H=+(process.env.H||20);
const day=t=>new Date(t*1000+3*3600e3).toISOString().slice(0,10);
const clean=p=>{ const o={d:[],c:[],h:[],l:[],v:[],a:[]}; if(!p?.t) return o; p.t.forEach((t,i)=>{ if(p.c[i]>0){ o.d.push(day(t)); o.c.push(p.c[i]); o.h.push(p.h?.[i]||p.c[i]); o.l.push(p.l?.[i]||p.c[i]); o.v.push(p.v?.[i]||0); o.a.push(p.a?.[i]||p.c[i]); } }); return o; };
const X=clean(D.px.XU100), XI={}; X.d.forEach((d,i)=>XI[d]=i); const XF=features(X);
const S={}; for(const k in D.px){ if(k==='XU100'||k.startsWith('X:')) continue; const s=clean(D.px[k]); if(s.c.length<400) continue; s.F=features(s); s.I={}; s.d.forEach((d,i)=>s.I[d]=i); S[k]=s; }
const dates=X.d.filter((d,i)=>d>='2017-01-02'&&i%5===0&&i+H<X.d.length);
const K=Object.keys(Object.values(S)[0].F.find(x=>x));
const rel=new Set(['r5','r10','r21','r63','r126','r252x21']);
const rows=[]; // {d, code, f:{}, y}
for(const d of dates){ const xi=XI[d], xr=X.c[xi+H]/X.c[xi]-1, xf=XF[xi]; if(!xf) continue;
  for(const code in S){ const s=S[code], i=s.I[d]; if(i==null||!s.F[i]||i+H>=s.c.length) continue; if(s.d[i+H]!==X.d[xi+H]) { /* tarih kayması: yine de kabaca */ }
    const f={...s.F[i]}; for(const k of rel) f[k]=f[k]-xf[k]; const y=s.a[i+H]/s.a[i]-1-xr; if(!isFinite(y)||Math.abs(y)>3) continue; rows.push({d,code,f,y,up:xf.ma50>0}); } }
fs.writeFileSync('srows_'+H+'.json',JSON.stringify(rows)); console.log('rows',rows.length,'dates',dates.length,'features',K.join(','));
