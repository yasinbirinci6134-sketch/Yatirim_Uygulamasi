"use strict";
/* Legacy transaction audit. Never fabricate bank movements or imply a complete ledger.
   Returns an immutable candidate event list and explicit verification gaps. */
const validDate=s=>{if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;};
function auditLegacyTrades(trades=[]){
 if(!Array.isArray(trades))return {ready:false,errors:["trades must be an array"],candidates:[]};
 const errors=[],candidates=[],ids=new Set();
 for(const t of trades){
  if(!t||typeof t!=="object"){errors.push("invalid trade");continue;}
  if(typeof t.id!=="string"||!t.id.trim()||ids.has(t.id)){errors.push("missing or duplicate trade id");continue;}ids.add(t.id);
  const day=t.buyDate||t.priceDate;
  if(!validDate(day)||!(Number.isFinite(t.amount)&&t.amount>0)){errors.push("invalid buy date or amount: "+t.id);continue;}
  candidates.push({id:"legacy-buy:"+t.id,type:"buy",date:day,amount:t.amount,source:"legacy",verified:false});
  if(t.status==="closed"){
   if(!validDate(t.sellDate)||!(Number.isFinite(t.price)&&t.price>0)||!(Number.isFinite(t.sellPrice)&&t.sellPrice>0)){
    errors.push("incomplete closed sale: "+t.id);continue;
   }
   const proceeds=t.amount*t.sellPrice/t.price;
   if(!Number.isFinite(proceeds)||proceeds<=0){errors.push("invalid proceeds: "+t.id);continue;}
   candidates.push({id:"legacy-sell:"+t.id,type:"sell",date:t.sellDate,amount:proceeds,source:"legacy",verified:false});
  }else if(t.status&&t.status!=="open"){errors.push("unknown trade status: "+t.id);}
 }
 errors.push("legacy cash settlement and complete trade coverage unverified");
 return {ready:false,errors,candidates};
}
module.exports={auditLegacyTrades};
