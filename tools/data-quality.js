"use strict";
/* Fon Pusulasi v2: publication gate for daily market scans.
   Rejects missing/contradictory records before scan branch is overwritten. */
function validateShortScan(scan, now=new Date()){
  const errors=[];
  if(!scan||!Array.isArray(scan.items))return {ok:false,errors:["items missing"]};
  if(scan.items.length<50) errors.push("less than 50 stocks");
  if(scan.n!==scan.items.length)errors.push("count mismatch");
  if(!Number.isFinite(Date.parse(scan.at)))errors.push("invalid generated time");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(scan.asOf||""))errors.push("missing asOf date");
  const dates=new Set(), symbols=new Set();
  for(const x of scan.items){
    if(!/^[A-Z0-9]{3,7}$/.test(x.code||""))errors.push("bad code: "+x.code);
    if(symbols.has(x.code))errors.push("duplicate: "+x.code);
    symbols.add(x.code);
    if(!(Number.isFinite(x.price)&&x.price>0))errors.push("bad price: "+x.code);
    if(!Number.isFinite(x.d1)||Math.abs(x.d1)>70)errors.push("missing or implausible daily change: "+x.code);
    if(!Number.isInteger(x.score)||x.score<0||x.score>100)errors.push("bad score: "+x.code);
    if(!x.f||Object.values(x.f).some(v=>!Number.isFinite(v)))errors.push("bad features: "+x.code);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(x.date||""))errors.push("bad date: "+x.code);
    dates.add(x.date);
  }
  if(dates.size>3)errors.push("too many different price dates");
  if(Number.isFinite(Date.parse(scan.at))&&Date.parse(scan.at)>now.getTime()+3600000)errors.push("generated in future");
  return {ok:errors.length===0,errors};
}
module.exports={validateShortScan};
