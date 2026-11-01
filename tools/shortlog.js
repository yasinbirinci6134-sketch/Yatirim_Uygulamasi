// Kısa vade modelinin GERÇEK ZAMANLI kaydı: her taramada en yüksek puanlı 5 hisse tarihiyle kaydedilir,
// sonuçları sonraki taramalarda doldurulur (geçmiş testten bağımsız, bugünden itibaren ölçüm).
// Kural uygulamadakiyle aynı: sinyal günü kapanışı → alış ertesi tarama günü kapanışı; 10 ve 20 işlem günü sonrası;
// kapanış alışın %8 altına inerse ertesi gün kapanışından çıkış. BIST 100 ve aynı hisse evreninin ortalaması da kaydedilir.
// Kullanım: node tools/shortlog.js <önceki shortlog.json|yok> <short.json> <çıktı shortlog.json>
const fs=require('fs'); const [,,prevP,curP,outP]=process.argv;
let L={days:[],entries:[]}; try{ const p=JSON.parse(fs.readFileSync(prevP,'utf8')); if(Array.isArray(p.days)&&Array.isArray(p.entries)) L=p; }catch(_){}
const S=JSON.parse(fs.readFileSync(curP,'utf8')), d=S.asOf; if(!d||!S.items?.length){ console.log('tarama yok'); process.exit(0); }
const px=Object.fromEntries(S.items.filter(x=>x.date===d).map(x=>[x.code,x.price])), codes=Object.keys(px);
if(L.days.length&&L.days[L.days.length-1].d===d){ console.log('bu gün zaten kayıtlı',d); fs.writeFileSync(outP,JSON.stringify(L)); process.exit(0); }
L.days.push({d,xu:S.xu?.price??null,up:!!S.market?.up,px});              // gün başına tüm evrenin kapanışı (ortalamaya göre karşılaştırma için)
L.days=L.days.slice(-80); const di=k=>L.days.findIndex(x=>x.d===k);
const avg=(a,b)=>{ const r=Object.keys(b.px).filter(c=>a.px[c]>0&&b.px[c]>0).map(c=>b.px[c]/a.px[c]-1); return r.length?r.reduce((s,v)=>s+v,0)/r.length:null; };
for(const e of L.entries){ const i0=di(e.d); if(i0<0) continue; const n=L.days.length-1-i0; const t=L.days[L.days.length-1], c=t.px[e.code];
  if(n===1&&e.buy==null&&c>0){ e.buy=c; e.buyD=t.d; }
  if(e.buy>0&&c>0&&!e.stopD&&n>=2&&n<=21){ if(e.trig){ e.stopD=t.d; e.stopP=c; } else if(n<=20&&c<=e.buy*0.92) e.trig=t.d; }
  for(const h of [10,20]) if(n===h+1&&e.buy>0&&c>0&&e['r'+h]==null){ const b=L.days[i0+1];                     // alış gününden h işlem günü sonra
    const out=(e.stopD&&e.stopD<=t.d)?e.stopP:c; e['r'+h]=+(out/e.buy-1).toFixed(4); e['x'+h]=b.xu&&t.xu?+(t.xu/b.xu-1).toFixed(4):null; const a=avg(b,t); e['u'+h]=a==null?null:+a.toFixed(4); } }
const top=[...S.items].filter(x=>x.date===d).sort((a,b)=>b.score-a.score).slice(0,5);
top.forEach(x=>L.entries.push({d,code:x.code,score:x.score,p0:x.price,up:!!S.market?.up}));
L.entries=L.entries.slice(-600); L.at=new Date().toISOString();
fs.writeFileSync(outP,JSON.stringify(L)); const done=L.entries.filter(e=>e.r20!=null);
console.log('kayıt',d,'| ilk 5:',top.map(x=>x.code).join(','),'| sonuçlanan (20 gün):',done.length);
