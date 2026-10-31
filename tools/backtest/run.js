const fs=require('fs'), zlib=require('zlib'); const {E,S,lr}=require('./eng.js');
const D=JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2]||'data.json.gz')));
const DAY=864e5;
// yaklaşık tarihsel göstergeler (TCMB politika faizi; 12 ay beklenen enflasyon, Piyasa Katılımcıları Anketi) — ay başı değerleri
const RATE=[["2017-01",12],["2018-06",17.75],["2018-09",24],["2019-07",19.75],["2019-09",16.5],["2019-10",14],["2019-12",12],["2020-02",10.75],["2020-05",8.25],["2020-11",15],["2020-12",17],["2021-03",19],["2021-09",18],["2021-10",16],["2021-11",15],["2021-12",14],["2022-08",13],["2022-09",12],["2022-10",10.5],["2022-11",9],["2023-02",8.5],["2023-06",15],["2023-07",17.5],["2023-08",25],["2023-09",30],["2023-10",35],["2023-11",40],["2023-12",42.5],["2024-01",45],["2024-03",50],["2024-12",47.5],["2025-01",45],["2025-03",42.5],["2025-04",46],["2025-07",43],["2025-09",40.5],["2025-10",39.5],["2025-12",38],["2026-03",36],["2026-06",34]];
const INFL=[["2017-01",8.5],["2018-01",9],["2018-06",12],["2018-09",17],["2019-01",15],["2019-07",13],["2020-01",10],["2020-07",10],["2021-01",11],["2021-07",13],["2021-11",16],["2022-01",23],["2022-07",30],["2023-01",31],["2023-07",30],["2024-01",33],["2024-07",29],["2025-01",25],["2025-07",22],["2026-01",19],["2026-07",17]];
const at=(T,d)=>{ let v=T[0][1]; for(const [k,x] of T) if(k<=d) v=x; return v; };
// expectation is "12 ay sonrası beklenen politika faizi"; yaklaşık olarak mevcut faiz − 3 (indirim döngüsü) kullanılır, alt sınır mevcut×0.75
const ser=p=>p&&p.t?p.t.map((t,i)=>({t:t*1000,c:p.c[i],h:p.h[i],l:p.l[i],a:(p.a&&p.a[i])||p.c[i]})).filter(z=>z.c>0):[];
const P={}; for(const k in D.px){ P[k]=ser(D.px[k]); }
const idx=(s,ms)=>{ let lo=0,hi=s.length-1,r=-1; while(lo<=hi){ const m=(lo+hi)>>1; if(s[m].t<=ms){ r=m; lo=m+1; } else hi=m-1; } return r; };
const IND={paid:"2OA",np:"3Z",eq:"2O",rev:"3C",bankRev:"3CE",stDebt:"2AA",ltDebt:"2BA",cash:"1AA",stInv:"1AB",opInc:"3DF",dep:"4B",ocf:"4C",capInc:"4CBC"};
const LAG={3:50,6:65,9:50,12:85};
function finAt(c,ms){ const F=D.fin[c]; if(!F) return null; const bank=D.grp[c]==="UFRS";
  const ks=Object.keys(F).filter(k=>{ const [y,p]=k.split('/').map(Number); return Date.UTC(y,p,0)+LAG[p]*DAY<=ms; }).sort((a,b)=>{const [ay,ap]=a.split('/').map(Number),[by,bp]=b.split('/').map(Number);return by-ay||bp-ap;});
  if(!ks.length) return null; const L=ks[0], [ly,lp]=L.split('/').map(Number); if(ms-Date.UTC(ly,lp,0)>220*DAY) return null;
  const cur=F[L], prevSame=F[(ly-1)+'/'+lp], prevFY=F[(ly-1)+'/12'];
  const g=(m,k)=>m&&typeof m[IND[k]]==="number"?m[IND[k]]:null;
  const ttm=k=>{ const x=g(cur,k); if(x==null) return null; if(lp===12) return x; const f=g(prevFY,k), s=g(prevSame,k); return f!=null&&s!=null?x+f-s:null; };
  const yoy=k=>{ const x=g(cur,k), s=g(prevSame,k); return x!=null&&s>0?(x/s-1)*100:null; };
  const np=ttm("np"), eq=g(cur,"eq"), ebitda=bank?null:(()=>{ const o=ttm("opInc"), d=ttm("dep"); return o!=null&&d!=null?o+Math.abs(d):null; })();
  const debt=bank?null:((g(cur,"stDebt")||0)+(g(cur,"ltDebt")||0)), cash=bank?null:((g(cur,"cash")||0)+(g(cur,"stInv")||0));
  return {period:L,bank,np,eq,shares:g(cur,"paid"),npG:yoy("np"),revG:yoy(bank?"bankRev":"rev"),ocf:bank?null:ttm("ocf"),ebitda,netDebt:debt!=null?debt-cash:null,capInc:bank?null:(ttm("capInc")||0)}; }
function build(c,ms){ const s=P[c]; if(!s?.length) return null; const i=idx(s,ms); if(i<260) return null; const last=s[i]; if(ms-last.t>10*DAY) return null;
  const sub=s.slice(Math.max(0,i-300),i+1); return E.lbuild({ser:sub,price:last.c,pt:last.t},2); }
function fwd(c,ms,days){ const s=P[c]; const i=idx(s,ms), j=idx(s,ms+days*DAY); if(i<0||j<=i||s[j].t<ms+(days-10)*DAY) return null; return s[j].a/s[i].a-1; }
// ay sonları
const X=P.XU100; const ends=[]; for(let y=2017;y<=2026;y++) for(let m=0;m<12;m++){ const ms=Date.UTC(y,m+1,0,15); if(ms<X[X.length-1].t) ends.push(ms); }
const codes=Object.keys(D.px).filter(k=>k!=="XU100");
const rows=[];
for(const ms of ends){ const mo=new Date(ms).toISOString().slice(0,7); const B=build("XU100",ms); if(!B) continue;
  const infl=at(INFL,mo), r0=at(RATE,mo), rate=Math.max(r0*0.75,r0-3);
  const stocks=[]; S.live.fin={};
  for(const c of codes){ const b=build(c,ms); if(!b||b.m1==null||b.m3==null||b.y1==null) continue; const f=finAt(c,ms); if(f) S.live.fin[c]=f;
    stocks.push({code:c,name:"",...b,local:true}); }
  if(stocks.length<15) continue;
  const M={stocks,bist:B,...(process.env.NEW?{partsMax:{karlilik:20,deger:25,momentum:30,saglamlik:15,analist:10}}:{}),indicators:[{k:"Beklenen enflasyon (12 ay)",v:"%"+Math.round(infl)},{k:"Beklenen faiz (12 ay)",v:"%"+Math.round(rate)}]};
  E.formulaScore(M);
  const b3=fwd("XU100",ms,91), b6=fwd("XU100",ms,182), b12=fwd("XU100",ms,365);
  for(const x of stocks){ const f3=fwd(x.code,ms,91), f6=fwd(x.code,ms,182), f12=fwd(x.code,ms,365);
    rows.push({mo,c:x.code,hasFin:!!S.live.fin[x.code],bank:!!S.live.fin[x.code]?.bank,score:x.score,signal:x.signal,...x.parts,roe:x.roe,fk:x.fk,pb:x.pddd,vol:x._vol,m1:x.m1,m3:x.m3,y1:x.y1,mcap:x.mcapBn,pos:x.mHigh>x.mLow?(x.price-x.mLow)/(x.mHigh-x.mLow):0.5,bm1:B.m1,bm3:B.m3,by1:B.y1,ff:null,
      e3:f3!=null&&b3!=null?f3-b3:null,e6:f6!=null&&b6!=null?f6-b6:null,e12:f12!=null&&b12!=null?f12-b12:null}); } }
fs.writeFileSync('rows.json',JSON.stringify(rows)); console.log('satır',rows.length,'ay',new Set(rows.map(r=>r.mo)).size,'finli',rows.filter(r=>r.hasFin).length);
