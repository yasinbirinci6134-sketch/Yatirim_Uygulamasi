// Kısa vadeli fırsat sinyalleri geri testi (BIST 100 bugünkü üyeleri, 2017–2026, günlük kapanış)
const fs=require('fs'),zlib=require('zlib'); const D=JSON.parse(zlib.gunzipSync(fs.readFileSync('data.json.gz')));
const day=t=>new Date(t*1000+3*3600e3).toISOString().slice(0,10);
const X=D.px.XU100, XI={}; X.t.forEach((t,i)=>{ if(X.c[i]>0) XI[day(t)]=X.c[i]; });
const H=[5,10,20], COST=0.003, ERA=d=>d<"2022-01"?"A":d<"2024-04"?"B":"C";
const S={}; const add=(k,era,h,v)=>{ const key=k+'|'+era+'|'+h; (S[key]=S[key]||[]).push(v); };
for(const code in D.px){ if(code==='XU100') continue; const p=D.px[code]; if(!p?.t) continue;
  const n=p.t.length, c=p.c, a=p.a||p.c, hi=p.h, lo=p.l, d=p.t.map(day);
  // RSI(14) Wilder
  const rsi=new Array(n).fill(null); let ag=0,al=0; for(let i=1;i<n;i++){ const ch=(c[i]??c[i-1])-(c[i-1]??c[i]); const g=Math.max(0,ch), l=Math.max(0,-ch);
    if(i<=14){ ag+=g/14; al+=l/14; if(i===14) rsi[i]=al?100-100/(1+ag/al):100; } else { ag=(ag*13+g)/14; al=(al*13+l)/14; rsi[i]=al?100-100/(1+ag/al):100; } }
  const rng=new Array(n).fill(null); for(let i=20;i<n;i++){ let mx=-1e18,mn=1e18; for(let j=i-20;j<i;j++){ if(!(c[j]>0)) continue; mx=Math.max(mx,hi[j]??c[j]); mn=Math.min(mn,lo[j]??c[j]); } rng[i]=mn>0?mx/mn-1:null; }
  for(let i=270;i<n-21;i++){ if(!(c[i]>0)||!(a[i]>0)) continue; const di=d[i]; if(di<"2017-01-01") continue; const xb=XI[di]; if(!xb) continue;
    // sinyaller
    let prevMax=-1e18; for(let j=i-20;j<i;j++) if(c[j]>0) prevMax=Math.max(prevMax,c[j]);
    const hist=rng.slice(i-250,i).filter(v=>v!=null).sort((x,y)=>x-y), q20=hist[Math.floor(hist.length*0.2)];
    const squeeze=rng[i]!=null&&q20!=null&&rng[i-1]!=null&&rng[i-1]<=q20&&c[i]>prevMax;
    const oversold=rsi[i]!=null&&rsi[i]<30;
    let mx60=-1e18; for(let j=i-60;j<=i;j++) if(c[j]>0) mx60=Math.max(mx60,c[j]); let mx5=-1e18; for(let j=i-5;j<i;j++) if(c[j]>0) mx5=Math.max(mx5,c[j]);
    const turn=c[i]<=mx60*0.75&&c[i]>mx5;
    const big1m=c[i-21]>0&&c[i]/c[i-21]-1>0.25;
    const sig={tum:true,sikisma_kirilim:squeeze,asiri_satim_RSI30:oversold,sert_dusus_donus:turn,ayda_25_yukselmis:big1m};
    for(const h of H){ const j=i+h; if(!(a[j]>0)) continue; const xe=XI[d[j]]; if(!xe) continue; const ex=(a[j]/a[i]-1)-(xe/xb-1);
      for(const k in sig) if(sig[k]){ add(k,ERA(di),h,ex); add(k,'TÜM',h,ex); } } } }
const st=v=>{ if(!v||v.length<30) return '   (az)              '; const m=v.reduce((s,x)=>s+x,0)/v.length, s2=[...v].sort((x,y)=>x-y), med=s2[v.length>>1], pos=v.filter(x=>x>COST).length/v.length; return `${(m*100).toFixed(2).padStart(6)}% med ${(med*100).toFixed(2).padStart(6)}% kâr%${(pos*100).toFixed(0).padStart(3)} n${String(v.length).padStart(6)}`; };
for(const h of H){ console.log(`\n=== ${h} işlem günü sonra, BIST100'e göre fazla getiri (maliyet öncesi; "kâr%" = maliyet %0,3 sonrası artıda kalan işlem oranı) ===`);
  for(const k of ['tum','sikisma_kirilim','asiri_satim_RSI30','sert_dusus_donus','ayda_25_yukselmis']){ console.log(k.padEnd(20), ['TÜM','A','B','C'].map(e=>e+': '+st(S[k+'|'+e+'|'+h])).join(' | ')); } }
