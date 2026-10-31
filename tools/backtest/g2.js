const fs=require('fs'); const R=JSON.parse(fs.readFileSync('rows.json')); const {sp}=require('./ana.js');
const ERA=mo=>mo<"2022-01"?0:mo<"2024-04"?1:2; const byMo={}; R.forEach(r=>(byMo[r.mo]=byMo[r.mo]||[]).push(r));
const C=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function ev(fn){ const out=[]; for(const F of ['e3','e6','e12']){ const e=[[],[],[]]; for(const mo in byMo){ const rs=byMo[mo].filter(r=>r[F]!=null).map(r=>[fn(r),r[F]]).filter(z=>z[0]!=null); if(rs.length<12) continue; e[ERA(mo)].push(sp(rs.map(z=>z[0]),rs.map(z=>z[1]))); }
  out.push(F+' '+e.map(a=>(a.reduce((s,v)=>s+v,0)/a.length*100).toFixed(1)).join('/')); } return out.join(' | '); }
const mom=(r,o)=>{ const r121=(1+r.y1/100)/(1+r.m1/100)-(1+r.by1/100)/(1+r.bm1/100), r3=(r.m3-r.bm3)/100; const s1=C(0.5+r121/o.k1), s2=C(0.5+r3/o.k3); let pos=r.pos; if(r.m1>25) pos=Math.min(pos,0.5);
  let v=(o.a*s1+o.b*s2+o.c*pos)*25; if(o.f&&r.m3<0&&r.y1<0) v=Math.min(v,5); if(o.f&&r.m3<-20) v=Math.min(v,12); return v; };
const MV={'şimdiki (.45/.40/.15)':{k1:.6,k3:.3,a:.45,b:.40,c:.15,f:1},'yer yok (.55/.45/0)':{k1:.6,k3:.3,a:.55,b:.45,c:0,f:1},'yer ters (.45/.40/−.15)':{k1:.6,k3:.3,a:.45,b:.40,c:-.15,f:1},
 'filtresiz':{k1:.6,k3:.3,a:.45,b:.40,c:.15,f:0},'12-1 ağır (.65/.35/0)':{k1:.6,k3:.3,a:.65,b:.35,c:0,f:1},'3 ay ağır (.35/.65/0)':{k1:.6,k3:.3,a:.35,b:.65,c:0,f:1},'dar ölçek k1 .4 k3 .2':{k1:.4,k3:.2,a:.45,b:.40,c:.15,f:1}};
console.log('MOMENTUM SÜRÜMLERİ (IC×100, 2017-21/2022-24.3/2024.4+)'); for(const k in MV) console.log(k.padEnd(26), ev(r=>mom(r,MV[k])));
console.log('\nAĞIRLIKLAR'); const W={'şimdiki k30 d20 m25 s15':[30,20,25,15],'k25 d25 m25 s15':[25,25,25,15],'k25 d20 m30 s15':[25,20,30,15],'k20 d25 m30 s15':[20,25,30,15],'k25 d25 m30 s10':[25,25,30,10],'k20 d30 m30 s10':[20,30,30,10]};
const MX={karlilik:30,deger:20,momentum:25,saglamlik:15};
for(const k in W){ const [a,b,c,d]=W[k]; console.log(k.padEnd(26), ev(r=>a*r.karlilik/30+b*r.deger/20+c*r.momentum/25+d*r.saglamlik/15)); }
