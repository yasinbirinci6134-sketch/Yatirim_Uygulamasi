const fs=require('fs'),zlib=require('zlib'); const D=JSON.parse(zlib.gunzipSync(fs.readFileSync('data2.json.gz'))); const {features}=require('./feat.js');
const day=t=>new Date(t*1000+3*3600e3).toISOString().slice(0,10);
const S=k=>{ const p=D.px[k], m={}; p.t.forEach((t,i)=>{ if(p.c[i]>0) m[day(t)]=p.c[i]; }); return m; };
const gc=S('X:GC=F'), si=S('X:SI=F'), usd=S('X:USDTRY=X'), eur=S('X:EURTRY=X');
const mk=(f)=>{ const d=Object.keys(usd).sort(), o={d:[],c:[]}; let last={}; for(const x of d){ const v=f(x); if(v>0){ o.d.push(x); o.c.push(v); } } return o; };
const assets={ 'Gram altın':mk(x=>gc[x]&&usd[x]?gc[x]*usd[x]/31.1035:null), 'Gram gümüş':mk(x=>si[x]&&usd[x]?si[x]*usd[x]/31.1035:null), 'Dolar/TL':mk(x=>usd[x]), 'Euro/TL':mk(x=>eur[x]) };
const H=20;
for(const name in assets){ const s=assets[name]; s.h=s.c; s.l=s.c; s.v=[]; const F=features(s); const g={up:[],dn:[]}; const by={A:{up:[],dn:[]},B:{up:[],dn:[]},C:{up:[],dn:[]}};
  for(let i=260;i+H<s.c.length;i+=5){ const f=F[i]; if(!f) continue; const r=s.c[i+H]/s.c[i]-1; const up=f.trend>=2&&f.r63>0; (up?g.up:g.dn).push(r); const e=s.d[i]<'2023-01-01'?'A':s.d[i]<'2024-04-01'?'B':'C'; by[e][up?'up':'dn'].push(r); }
  const m=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length*100).toFixed(2):'-';
  console.log(name.padEnd(11),`trend yukarı: 1 ay sonra ort %${m(g.up)} (n${g.up.length}) | değil: %${m(g.dn)} (n${g.dn.length}) ||`, ['A','B','C'].map(e=>`${e}: %${m(by[e].up)} / %${m(by[e].dn)}`).join('  ')); }
