const fs=require('fs'),zlib=require('zlib'); const H=+(process.env.H||10), STOP=+(process.env.STOP||0.07), COST=0.003;
const R=JSON.parse(fs.readFileSync('srows_'+H+'.json')); const D=JSON.parse(zlib.gunzipSync(fs.readFileSync('data2.json.gz')));
const day=t=>new Date(t*1000+3*3600e3).toISOString().slice(0,10);
const ser={}; for(const k in D.px){ const p=D.px[k]; if(!p?.t) continue; const d=[],c=[],a=[]; p.t.forEach((t,i)=>{ if(p.c[i]>0){ d.push(day(t)); c.push(p.c[i]); a.push(p.a?.[i]||p.c[i]); } }); const I={}; d.forEach((x,i)=>I[x]=i); ser[k]={d,c,a,I}; }
const X=ser.XU100; const SEL='r252x21,ma200,trend,rsi,pos52,dd60'.split(',');
const rank=a=>{ const o=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]), r=new Array(a.length); o.forEach(([v,i],k)=>r[i]=k); return r; };
const by={}; R.forEach(r=>(by[r.d]=by[r.d]||[]).push(r)); const P=d=>d<'2023-01-01'?'2017–22':d<'2024-04-01'?'2023–24/3':'2024/4+';
const res={};
for(const d in by){ const rs=by[d].filter(r=>[...SEL,'vol20'].every(k=>r.f[k]!=null&&isFinite(r.f[k]))); if(rs.length<25) continue; const n=rs.length, sc=new Array(n).fill(0);
  for(const k of SEL) rank(rs.map(r=>r.f[k])).forEach((v,i)=>sc[i]+=v); rank(rs.map(r=>r.f.vol20)).forEach((v,i)=>sc[i]+=n-1-v);
  const top=rs.map((r,i)=>[sc[i],r]).sort((a,b)=>b[0]-a[0]).slice(0,5).map(z=>z[1]); const xi=X.I[d];
  for(const r of top){ const s=ser[r.code], i=s.I[d]; if(i==null||i+H>=s.c.length) continue; let exit=i+H, stopped=false;
    for(let j=i+1;j<=i+H;j++){ if(s.c[j]<=s.c[i]*(1-STOP)){ exit=j; stopped=true; break; } }
    const xe=X.I[s.d[exit]]; if(xe==null) continue; const abs=s.a[exit]/s.a[i]-1, ex=abs-(X.c[xe]/X.c[xi]-1);
    const o=res[P(d)]=res[P(d)]||{ex:[],abs:[],exNo:[],absNo:[],st:0,n:0}; o.ex.push(ex-COST); o.abs.push(abs-COST); o.exNo.push(r.y-COST); o.n++; if(stopped) o.st++;
    const absNo=s.a[i+H]/s.a[i]-1; o.absNo.push(absNo-COST); } }
const m=a=>a.reduce((s,v)=>s+v,0)/a.length*100, w=a=>a.filter(x=>x>0).length/a.length*100, worst=a=>Math.min(...a)*100, p10=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length*0.1)]*100;
console.log(`EN İYİ 5, ${H} gün tut, zarar-kes %${STOP*100} (kapanışla) — mutlak getiri (maliyet sonrası)`);
for(const p in res){ const o=res[p]; console.log(`${p.padEnd(10)} zarar-kessiz: ort %${m(o.absNo).toFixed(2)} kâr %${w(o.absNo).toFixed(0)} en kötü %10 dilim %${p10(o.absNo).toFixed(1)} | zarar-kesli: ort %${m(o.abs).toFixed(2)} kâr %${w(o.abs).toFixed(0)} en kötü %10 dilim %${p10(o.abs).toFixed(1)} | durdurulan %${(o.st/o.n*100).toFixed(0)} | endekse göre (kessiz/kesli) %${m(o.exNo).toFixed(2)}/%${m(o.ex).toFixed(2)}`); }
