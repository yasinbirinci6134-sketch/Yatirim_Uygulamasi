// Geçmiş veri indirici: Yahoo günlük fiyat (10 yıl) + İş Yatırım çeyreklik bilanço (2016+)
const fs=require('fs'), zlib=require('zlib');
const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const CODES=`AEFES AGHOL AGROT AKBNK AKFYE AKSA AKSEN ALARK ALBRK ALFAS ANSGR ARCLK ASELS ASTOR BIMAS BINHO BRSAN BRYAT BSOKE BTCIM CANTE CCOLA CIMSA CLEBI CWENE DOAS DOHOL DSTKF ECILC EFORC EGEEN EKGYO ENERY ENJSA ENKAI EREGL EUPWR FENER FROTO GARAN GESAN GLYHO GRSEL GSRAY GUBRF HALKB HEKTS IPEKE ISCTR ISGYO ISMEN IZENR KCAER KCHOL KLRHO KONTR KOZAA KOZAL KRDMD KTLEV LMKDC MAVI MGROS MIATK MPARK OBAMS ODAS OTKAR OYAKC PAPIL PASEU PETKM PGSUS QUAGR RALYH REEDR SAHOL SASA SELEC SISE SKBNK SMRTG SOKM TABGD TAVHL TCELL THYAO TKFEN TMSN TOASO TRALT TSKB TTKOM TTRAK TUKAS TUPRS TURSA ULKER VAKBN VESBE VESTL YEOTK YKBNK ZOREN DARDL`.split(/\s+/);
const KEEP=new Set(["2OA","3Z","2O","3C","3CE","2AA","2BA","1AA","1AB","3DF","4B","4C","4CBC"]);
const jar={}; const sl=ms=>new Promise(r=>setTimeout(r,ms));
async function get(u){ for(let k=0;k<3;k++){ try{ const h=new URL(u).host.split('.').slice(-2).join('.'); const ck=Object.entries(jar[h]||{}).map(([a,b])=>a+'='+b).join('; ');
  const r=await fetch(u,{headers:{'User-Agent':UA,...(ck?{Cookie:ck}:{})}}); (r.headers.getSetCookie?.()||[]).forEach(s=>{const kv=s.split(';')[0],i=kv.indexOf('=');(jar[h]=jar[h]||{})[kv.slice(0,i)]=kv.slice(i+1);});
  if(r.status===429){ await sl(5000*(k+1)); continue; } return {s:r.status,b:await r.text()}; }catch(e){ await sl(2000); } } return {s:0,b:''}; }
async function chart(sym){ const o=await get(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=10y&interval=1d&events=div,splits`);
  try{ const r=JSON.parse(o.b).chart.result[0], q=r.indicators.quote[0], a=r.indicators.adjclose?.[0]?.adjclose; return {t:r.timestamp,c:q.close,h:q.high,l:q.low,a}; }catch(_){ return null; } }
async function isy(code,grp,ps){ const q=ps.map((p,i)=>`year${i+1}=${p[0]}&period${i+1}=${p[1]}`).join('&');
  const o=await get(`https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/MaliTablo?companyCode=${code}&exchange=TRY&financialGroup=${grp}&${q}`);
  let v=[]; try{ v=JSON.parse(o.b).value||[]; }catch(_){} const out={}; ps.forEach((p,i)=>{ const m={}; v.forEach(r=>{ const x=r['value'+(i+1)]; if(KEEP.has(r.itemCode)&&x!=null&&x!=='') m[r.itemCode]=Number(x); }); if(Object.values(m).some(z=>z!==0)) out[p[0]+'/'+p[1]]=m; }); return {rows:v.length,out}; }
(async()=>{ await get('https://fc.yahoo.com'); const D={px:{},fin:{},grp:{}};
  D.px.XU100=await chart('XU100.IS');
  const per=[]; for(let y=2026;y>=2015;y--) for(const p of [12,9,6,3]) if(!(y===2026&&p===12)) per.push([y,p]);
  let i=0; await Promise.all([0,1,2].map(async w=>{ while(i<CODES.length){ const c=CODES[i++];
    D.px[c]=await chart(c+'.IS');
    let grp='XI_29', a=await isy(c,grp,per.slice(0,4)); if(!a.rows){ grp='UFRS'; a=await isy(c,grp,per.slice(0,4)); }
    if(a.rows){ D.grp[c]=grp; D.fin[c]={...a.out}; for(let j=4;j<per.length;j+=4){ const b=await isy(c,grp,per.slice(j,j+4)); Object.assign(D.fin[c],b.out); if(!Object.keys(b.out).length&&j>=12) break; await sl(200); } }
    console.log(c, D.px[c]?.t?.length||0, grp, Object.keys(D.fin[c]||{}).length); await sl(300); } }));
  fs.writeFileSync('bt/data.json.gz',zlib.gzipSync(JSON.stringify(D))); })();
