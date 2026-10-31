const fs=require('fs'); const R=JSON.parse(fs.readFileSync('rows.json'));
const ERA=mo=>mo<"2022-01"?"A":mo<"2024-04"?"B":"C"; const byMo={}; R.forEach(r=>(byMo[r.mo]=byMo[r.mo]||[]).push(r));
const W=process.argv[2]==='new'?[20,25,30,15]:[30,20,25,15];
function run(rule){ const b={}; for(const mo in byMo){ const rs=byMo[mo]; rs.forEach(r=>{ r.s=W[0]*r.karlilik/30+W[1]*r.deger/20+W[2]*r.momentum/25+W[3]*r.saglamlik/15+5; r.kn=r.karlilik/30*W[0]; });
  const top=new Set([...rs].sort((a,b)=>b.s-a.s).slice(0,Math.ceil(rs.length*0.3)).map(r=>r.c));
  rs.forEach(r=>{ if(r.e6==null) return; const sig=rule(r,top); const k=ERA(mo)+sig; (b[k]=b[k]||[]).push(r.e6); }); }
  return ['A','B','C'].map(e=>['al','izle','uzak'].map(s=>{ const a=b[e+s]||[]; if(!a.length) return s+' -'; a.sort((x,y)=>x-y); return `${s} ${(a[a.length>>1]*100).toFixed(1)}[${a.length}]`; }).join(' ')).join(' || '); }
const R1=(t,lo,kf)=>(r,top)=>(r.s<lo)?'uzak':(r.s>=t&&top.has(r.c)&&(!kf||r.kn>=10*W[0]/30)&&!(r.m3<0&&r.y1<0))?'al':'izle';
console.log('ağırlık',W.join('/'),' 6 ay fazla getiri MEDYANI % [adet]');
for(const [n,f] of [['şimdiki 60/42 +kâr şartı',R1(60,42,1)],['60/42 kâr şartsız',R1(60,42,0)],['55/42 +kâr',R1(55,42,1)],['65/42 +kâr',R1(65,42,1)],['60/45 +kâr',R1(60,45,1)],['60/38 +kâr',R1(60,38,1)]]) console.log(n.padEnd(24),run(f));
