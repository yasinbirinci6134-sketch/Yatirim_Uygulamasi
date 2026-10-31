// Fiyat + hacim geçmişi (10 yıl, günlük): tarama evrenindeki BIST hisseleri, XU100, altın/gümüş/kur → bt/data2.json.gz
const fs=require('fs'), zlib=require('zlib'), path=require('path');
const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const CODES=fs.readFileSync(path.join(__dirname,'..','..','short-universe.txt'),'utf8').split(/\s+/).filter(Boolean);
const jar={}; const sl=ms=>new Promise(r=>setTimeout(r,ms));
async function get(u){ for(let k=0;k<4;k++){ try{ const ck=Object.entries(jar).map(([a,b])=>a+'='+b).join('; ');
  const r=await fetch(u,{headers:{'User-Agent':UA,...(ck?{Cookie:ck}:{})}}); (r.headers.getSetCookie?.()||[]).forEach(s=>{const kv=s.split(';')[0],i=kv.indexOf('=');jar[kv.slice(0,i)]=kv.slice(i+1);});
  if(r.status===429){ await sl(5000*(k+1)); continue; } return {s:r.status,b:await r.text()}; }catch(e){ await sl(2000); } } return {s:0,b:''}; }
async function chart(sym){ const o=await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=10y&interval=1d&events=div,splits`);
  try{ const r=JSON.parse(o.b).chart.result[0], q=r.indicators.quote[0], a=r.indicators.adjclose?.[0]?.adjclose; return {t:r.timestamp,c:q.close,h:q.high,l:q.low,v:q.volume,a}; }catch(_){ return null; } }
(async()=>{ await get('https://fc.yahoo.com'); const D={px:{}};
  const list=[['XU100','XU100.IS'],...CODES.map(c=>[c,c+'.IS']),['X:GC=F','GC=F'],['X:SI=F','SI=F'],['X:USDTRY=X','USDTRY=X'],['X:EURTRY=X','EURTRY=X']];
  let i=0; await Promise.all([0,1,2].map(async()=>{ while(i<list.length){ const [k,s]=list[i++]; D.px[k]=await chart(s); console.log(k, D.px[k]?.t?.length||0); await sl(300); } }));
  fs.mkdirSync('bt',{recursive:true}); fs.writeFileSync('bt/data2.json.gz',zlib.gzipSync(JSON.stringify(D))); })();
