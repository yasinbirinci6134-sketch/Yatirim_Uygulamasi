"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const a=html.indexOf("function fpQuote("),b=html.indexOf("\nconst asset =",a);
assert.ok(a>0&&b>a,"fpQuote source is available");
const fn=new Function("S","LIVE",html.slice(a,b)+"\nreturn fpQuote;");
const S={live:{stocks:{ABC:{price:52,d1:1.1,at:"2026-11-02T12:00:00Z"}}}};
const LIVE={shortQuotes:{ABC:{price:53,d1:1.9,at:Date.parse("2026-11-02T12:01:00Z")}}};
const quote=fn(S,LIVE);
let q=quote("ABC",{price:50,d1:-0.5,priceDate:"2026-11-01"},{price:49,d1:0.4,date:"2026-10-31"});
assert.equal(q.price,53);assert.equal(q.d1,1.9);assert.equal(q.priceAt,"2026-11-02");assert.equal(q.source,"tick");
assert.equal(q.priceStamp,Date.parse("2026-11-02T12:01:00Z"),"winning tick timestamp is kept without truncation");
delete LIVE.shortQuotes.ABC;q=quote("ABC",{price:50,d1:-0.5,priceDate:"2026-11-01"},{price:49,date:"2026-10-31"});
assert.equal(q.price,52);assert.equal(q.d1,1.1);
q=quote("DEF",{price:0,d1:3,priceDate:"2026-11-01"},{price:18,d1:1.2,date:"2026-11-02"});
assert.equal(q.price,18);assert.equal(q.d1,1.2);
q=quote("NONE",null,null);assert.equal(q.price,null);assert.equal(q.d1,null);
const mixed=fn({live:{stocks:{ABC:{price:999,at:"2026-11-02"}},fx:{ABC:{price:43,at:"2026-11-02"}},funds:{FND:{price:5,at:"2026-11-02"}}}}, {shortQuotes:{ABC:{p:950,t:Date.parse("2026-11-02T12:00:00Z")}}});
assert.equal(mixed("ABC",{isFx:true,price:40,priceDate:"2026-11-01"},null).price,43);
assert.equal(mixed("FND",{cat:"altin",price:4,priceDate:"2026-11-01"},null).price,5);
assert.equal(mixed("ABC",{isStock:true,price:40,priceDate:"2026-11-01"},null).price,950);
const dated=fn({live:{stocks:{ABC:{price:110,d1:2,at:"2026-11-02T12:00:00Z"}}}}, {shortQuotes:{ABC:{p:111,t:Date.parse("2026-11-02T12:01:00Z")}}});
const oldDaily=dated("ABC",{isStock:true,price:100,d1:8,priceDate:"2026-10-01"},null);
assert.equal(oldDaily.price,111);
assert.equal(oldDaily.d1,2);
console.log("quote selection tests passed");


// Source timestamp is not the app refresh clock. Verify time precision and market alignment.
const stampStart=html.indexOf("/* Source price timestamp, distinct from application refresh time.");
const stampEnd=html.indexOf("/* ---------- Açılır satırlar ---------- */",stampStart);
assert.ok(stampStart>=0&&stampEnd>stampStart,"timestamp formatter is present");
const fmtSrc=html.slice(stampStart,stampEnd);
const env={live:{stocks:{ABC:{price:50,at:"2026-11-04T04:27:41Z"}}}},ticks={ABC:{price:51,at:"2026-11-04T04:30:00Z"}};
const stampFns=new Function("S","LIVE","esc",fmtSrc+";return {fpPriceStamp,fpPriceStampHtml,fpMarketPriceStamp};")(
  env,{shortQuotes:env.ticks},x=>String(x));
const now=Date.parse("2026-11-04T04:35:00Z");
assert.deepEqual(stampFns.fpPriceStamp("2026-11-04",now).precision,"date");
assert.match(stampFns.fpPriceStamp("2026-11-04",now).label,/Fiyat günü: 04\.11/);
assert.equal(stampFns.fpPriceStamp("2026-11-04T04:27:41Z",now).label,"Fiyat: 07:27:41");
assert.equal(stampFns.fpPriceStamp(Date.parse("2026-11-04T04:27:41Z"),now).precision,"time");
assert.equal(stampFns.fpPriceStamp("2026-11-03T12:00:00Z",now).label,"Fiyat: 03.11 15:00:00");
assert.equal(stampFns.fpPriceStamp("2026-11-04T04:27:41",now).precision,"date",
  "no clock without a trustworthy timezone");
assert.equal(stampFns.fpPriceStamp("2026-02-30",now),null,"invalid calendar date rejected");
assert.equal(stampFns.fpPriceStamp("2026-11-04T05:00:00Z",now),null,"future timestamp rejected");
assert.equal(stampFns.fpMarketPriceStamp("s",{code:"ABC",price:50,priceDate:"2026-11-03"}),"2026-11-04T04:27:41Z",
  "timestamp follows exact displayed price, not newer differing tick");
env.live.stocks.ABC.price=49;
assert.equal(stampFns.fpMarketPriceStamp("s",{code:"ABC",price:50,priceDate:"2026-11-03"}),"2026-11-03",
  "do not attach a mismatched live tick to a market price");
assert.match(html,/fpPriceStampHtml\(fpMarketPriceStamp\(t,x\)\)/,"ordinary asset lists show price source stamp");
assert.match(html,/fpPriceStampHtml\(q\.price!=null\?q\.priceStamp:it\.date\)/,"short-horizon assets use selected quote time");
assert.match(html,/fpPriceStampHtml\(g\.lots\[0\]\.quoteStamp\)/,"portfolio positions show their source quote time");
assert.match(html,/\.fp-quote-stamp\{/,"quiet timestamp text styling is present");
console.log("source price timestamps: full clock only when justified, valid list rendering");
