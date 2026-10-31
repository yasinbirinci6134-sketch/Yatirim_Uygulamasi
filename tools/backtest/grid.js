const fs=require('fs'); const R=JSON.parse(fs.readFileSync('rows.json')); const {sp}=require('./ana.js');
const MX={karlilik:30,deger:20,momentum:25,saglamlik:15}, K=Object.keys(MX);
const ERA=mo=>mo<"2022-01"?0:mo<"2024-04"?1:2; const byMo={}; R.forEach(r=>(byMo[r.mo]=byMo[r.mo]||[]).push(r));
function ev(w,F){ const e=[[],[],[]]; for(const mo in byMo){ const rs=byMo[mo].filter(r=>r[F]!=null&&K.every(k=>r[k]!=null)); if(rs.length<12) continue;
  const c=sp(rs.map(r=>K.reduce((s,k)=>s+w[k]*r[k]/MX[k],0)),rs.map(r=>r[F])); e[ERA(mo)].push(c); }
  return e.map(a=>a.reduce((s,v)=>s+v,0)/a.length*100); }
const res=[]; for(let a=0;a<=50;a+=5) for(let b=0;b<=50;b+=5) for(let c=0;c<=50;c+=5){ const d=90-a-b-c; if(d<0||d>40) continue; const w={karlilik:a,deger:b,momentum:c,saglamlik:d};
  const e6=ev(w,'e6'), e3=ev(w,'e3'); res.push({w,e6,e3,train:(e6[0]*5+e6[1]*2.25)/7.25+(e3[0]*5+e3[1]*2.25)/7.25, mn:Math.min(...e6.slice(0,2),...e3.slice(0,2))}); }
const f=x=>`k${x.w.karlilik} d${x.w.deger} m${x.w.momentum} s${x.w.saglamlik} | e6 ${x.e6.map(v=>v.toFixed(1)).join('/')} | e3 ${x.e3.map(v=>v.toFixed(1)).join('/')}`;
console.log('ŞİMDİKİ ', f(res.find(x=>x.w.karlilik===30&&x.w.deger===20&&x.w.momentum===25)));
console.log('— eğitim (2017–2024/3) ortalamasına göre en iyi 8:'); [...res].sort((a,b)=>b.train-a.train).slice(0,8).forEach(x=>console.log(f(x)));
console.log('— eğitimde en kötü dönemi en iyi olan 5:'); [...res].sort((a,b)=>b.mn-a.mn).slice(0,5).forEach(x=>console.log(f(x)));
