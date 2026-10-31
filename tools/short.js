// Günlük kısa vade taraması: BIST 100 hisselerinin son 2 yıllık kapanışlarından kısa vade puanı (ui/index.html içindeki SHORT bloğu).
// Çıktı: short.json (GitHub Actions "scan" dalına yazar). Kişisel veri içermez.
// Kullanım: node tools/short.js [çıktı.json]
const fs=require('fs'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','ui','index.html'),'utf8');
const a=html.indexOf('/*SHORT:BEGIN'), b=html.indexOf('/*SHORT:END*/'); if(a<0||b<0){ console.error('SHORT bloğu yok'); process.exit(1); }
const SHORT=new Function(html.slice(a,b)+'\nreturn SHORT;')();
const UNIVERSE=fs.readFileSync(path.join(__dirname,'short-universe.txt'),'utf8').split(/\s+/).filter(Boolean);
const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const jar={}, sl=ms=>new Promise(r=>setTimeout(r,ms));
async function get(u){ for(let k=0;k<4;k++){ try{ const ck=Object.entries(jar).map(([x,y])=>x+'='+y).join('; ');
  const r=await fetch(u,{headers:{'User-Agent':UA,...(ck?{Cookie:ck}:{})}}); (r.headers.getSetCookie?.()||[]).forEach(s=>{ const kv=s.split(';')[0], i=kv.indexOf('='); jar[kv.slice(0,i)]=kv.slice(i+1); });
  if(r.status===429||r.status>=500){ await sl(4000*(k+1)); continue; } return {s:r.status,b:await r.text()}; }catch(e){ await sl(2000); } } return {s:0,b:''}; }
async function closes(sym){ const o=await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=2y&interval=1d`);
  try{ const r=JSON.parse(o.b).chart.result[0], q=r.indicators.quote[0], m=r.meta||{}, c=[], t=[]; r.timestamp.forEach((ts,i)=>{ if(q.close[i]>0){ c.push(q.close[i]); t.push(ts); } });
    if(m.regularMarketPrice>0&&t.length&&m.regularMarketTime>t[t.length-1]+3600&&new Date(m.regularMarketTime*1000).toISOString().slice(0,10)!==new Date(t[t.length-1]*1000).toISOString().slice(0,10)){ c.push(m.regularMarketPrice); t.push(m.regularMarketTime); }
    return {c,t,name:(m.longName||m.shortName||'').trim()}; }catch(_){ return null; } }
(async()=>{ await get('https://fc.yahoo.com');
  const xu=await closes('XU100.IS'); if(!xu||xu.c.length<60){ console.error('XU100 alınamadı'); process.exit(1); }
  const items=[]; let i=0;
  await Promise.all([0,1,2].map(async()=>{ while(i<UNIVERSE.length){ const code=UNIVERSE[i++]; const s=await closes(code+'.IS'); await sl(250);
    if(!s||s.c.length<210) continue; const f=SHORT.feat(s.c); if(!f) continue; const n=s.c.length;
    items.push({code,name:s.name,price:+s.c[n-1].toFixed(4),date:new Date(s.t[n-1]*1000+3*3600e3).toISOString().slice(0,10),f:Object.fromEntries(Object.entries(f).map(([k,v])=>[k,+(+v).toFixed(5)]))}); } }));
  if(items.length<50){ console.error('az hisse:',items.length); process.exit(1); }
  const F=items.map(x=>x.f); items.forEach(x=>x.cv=+SHORT.comp(x.f,F).toFixed(5)); const C=items.map(x=>x.cv); items.forEach(x=>{ x.score=SHORT.score(x.cv,C); x.tags=SHORT.tags(x.f,F); });
  items.sort((p,q)=>q.score-p.score);
  const out={ at:new Date().toISOString(), asOf:items[0]?.date, n:items.length, market:SHORT.market(xu.c), items };
  fs.writeFileSync(process.argv[2]||'short.json',JSON.stringify(out));
  console.log('tamam',items.length,'hisse; piyasa',JSON.stringify(out.market),'; ilk 5:',items.slice(0,5).map(x=>x.code+' '+x.score).join(', ')); })();
