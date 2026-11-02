"use strict";
/* Reconcile a complete dated cash ledger against trades.
   This is a prerequisite checker, not evidence legacy records are complete. */
function reconcileLedger({events=[],openingCash=0,terminalCash=null,complete=false,verifiedOpening=false,verifiedEnding=false,tradeCoverage=false}={}){
 const errors=[];
 if(!complete)errors.push("ledger completeness not verified");
 if(!verifiedOpening)errors.push("opening cash source unverified");
 if(!verifiedEnding)errors.push("terminal cash source unverified");
 if(!tradeCoverage)errors.push("buy/sell coverage unverified");
 if(!Number.isFinite(openingCash)||openingCash<0)errors.push("invalid opening cash");
 if(!Number.isFinite(terminalCash)||terminalCash<0)errors.push("invalid terminal cash");
 const validDay=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s||""))return false;const d=new Date(s+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;};
 if(!Array.isArray(events))return {ready:false,errors:["events must be an array"],calculatedCash:null};
 if(events.length===0)errors.push("cash ledger has no events");
 const eventsSorted=[...events].sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
 let cash=openingCash;
 const seenIds=new Set();
 const signs={deposit:1,withdrawal:-1,buy:-1,sell:1,dividend:1,fee:-1};
 for(const e of eventsSorted){
  if(!e||typeof e!=="object"){errors.push("invalid ledger event");continue;}
  if(!validDay(e.date)||!(Number.isFinite(e.amount)&&e.amount>0)||!Object.hasOwn(signs,e.type)){errors.push("invalid ledger event");continue;}
  if(e.id!==undefined){if(typeof e.id!=="string"||!e.id.trim()||seenIds.has(e.id)){errors.push("invalid or duplicate ledger event id");continue;}seenIds.add(e.id);}
  if(e.amount>Number.MAX_SAFE_INTEGER/100){errors.push("ledger amount exceeds safe precision");continue;}
  cash=Math.round((cash+signs[e.type]*e.amount)*100)/100;
  if(cash< -0.005)errors.push("negative running cash balance");
 }
 if(Number.isFinite(terminalCash)&&Math.abs(cash-terminalCash)>0.01)errors.push("cash balance does not reconcile");
 return {ready:errors.length===0,errors,calculatedCash:Number.isFinite(cash)?cash:null};
}
module.exports={reconcileLedger};
