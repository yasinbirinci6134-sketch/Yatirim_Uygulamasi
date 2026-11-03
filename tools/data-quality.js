"use strict";
/* Publication + mobile cache gate for BIST daily scans.
   Istanbul has UTC+03:00 year-round; the scan's asOf is the exchange-local trading date.
   Reject stale/mixed feeds instead of creating fabricated historical evidence. */
function validateShortScan(scan, now=new Date()){
 const errors=[],bad=msg=>{if(errors.length<30)errors.push(msg)};
 const validDay=s=>{
  if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const t=Date.parse(s+"T00:00:00Z");
  return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s;
 };
 if(!scan||typeof scan!=="object"||!Array.isArray(scan.items))return {ok:false,errors:["items missing"]};
 const at=typeof scan.at==="string"?Date.parse(scan.at):NaN,nowMs=now instanceof Date?now.getTime():NaN;
 if(!Number.isFinite(at))bad("invalid generated time");
 if(!Number.isFinite(nowMs))bad("invalid current time");
 if(Number.isFinite(at)&&Number.isFinite(nowMs)&&at>nowMs+3600000)bad("generated in future");
 if(!validDay(scan.asOf))bad("invalid asOf trading date");
 if(scan.items.length<50||scan.items.length>120)bad("stock coverage outside supported range");
 if(scan.n!==scan.items.length)bad("count mismatch");
 if(!scan.xu||!Number.isFinite(scan.xu.price)||scan.xu.price<=0||!validDay(scan.xu.date))bad("invalid BIST 100 benchmark");
 if(validDay(scan.asOf)&&validDay(scan.xu?.date)&&scan.xu.date!==scan.asOf)bad("benchmark date differs from scan date");
 if(validDay(scan.asOf)&&Number.isFinite(at)&&Number.isFinite(nowMs)){
  const asOf=Date.parse(scan.asOf+"T00:00:00Z"),generatedDay=new Date(at+3*3600000).toISOString().slice(0,10),
        today=new Date(nowMs+3*3600000).toISOString().slice(0,10);
  const sourceLag=Math.round((Date.parse(generatedDay+"T00:00:00Z")-asOf)/86400000);
  const cacheLag=Math.round((Date.parse(today+"T00:00:00Z")-asOf)/86400000);
  if(sourceLag<0)bad("scan refers to a future trading date");
  if(sourceLag>7)bad("generated scan is too stale");
  if(cacheLag<0||cacheLag>7)bad("market scan is stale or in the future");
 }
 const symbols=new Set(),dates=new Set();let fresh=0;
 for(const x of scan.items){
  if(!x||typeof x!=="object"){bad("invalid stock row");continue}
  if(!/^[A-Z0-9]{3,7}$/.test(x.code||""))bad("bad code: "+x.code);
  if(symbols.has(x.code))bad("duplicate: "+x.code);symbols.add(x.code);
  if(!(Number.isFinite(x.price)&&x.price>0))bad("bad price: "+x.code);
  if(!Number.isFinite(x.d1)||Math.abs(x.d1)>70)bad("missing or implausible daily change: "+x.code);
  if(!Number.isInteger(x.score)||x.score<0||x.score>100)bad("bad score: "+x.code);
  if(!x.f||typeof x.f!=="object"||Array.isArray(x.f)||!Object.keys(x.f).length||Object.values(x.f).some(v=>!Number.isFinite(v)))bad("bad features: "+x.code);
  if(!validDay(x.date)){bad("bad date: "+x.code);continue}
  dates.add(x.date);
  if(validDay(scan.asOf)){
   if(x.date===scan.asOf)fresh++;
   if(x.date>scan.asOf)bad("stock dated after scan: "+x.code);
   const lag=Math.round((Date.parse(scan.asOf+"T00:00:00Z")-Date.parse(x.date+"T00:00:00Z"))/86400000);
   if(lag>7)bad("stock price too old: "+x.code);
  }
 }
 if(dates.size>3)bad("too many different price dates");
 if(validDay(scan.asOf)&&fresh<Math.ceil(scan.items.length*0.8))bad("too few prices from the scan trading date");
 return {ok:errors.length===0,errors};
}
module.exports={validateShortScan};
