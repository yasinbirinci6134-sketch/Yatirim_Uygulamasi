"use strict";
/* Publish returns only after independent evidence and complete dated records.
   Evidence booleans must come from verification workflows, never legacy guesses. */
const {reconcileLedger}=require("./ledger-reconcile");
const {externalFlows}=require("./external-flows");
const {xirr}=require("./return-metrics");
const {timeWeightedReturn}=require("./twr");
function verifiedReturns({events=[],openingCash=0,terminalCash=null,terminal=null,positionsValue=null,ledgerEvidence={},valuations=[],navVerified=false}={}){
 const errors=[];
 if(!Array.isArray(events))return {ready:false,xirr:null,twr:null,errors:["transaction records must be an array"],ledgerReady:false};
 if(!ledgerEvidence||typeof ledgerEvidence!=="object"||Array.isArray(ledgerEvidence))return {ready:false,xirr:null,twr:null,errors:["independent ledger evidence missing"],ledgerReady:false};
 const ledger=reconcileLedger({events,openingCash,terminalCash,...ledgerEvidence});
 if(!ledger.ready)errors.push(...ledger.errors);
 if(!terminal||!Number.isFinite(terminal.value)||terminal.value<0||typeof terminal.date!=="string")errors.push("terminal portfolio valuation missing");
 if(!Number.isFinite(positionsValue)||positionsValue<0)errors.push("current positions valuation missing");
 if(ledger.ready&&terminal&&Number.isFinite(positionsValue)&&Math.abs(terminal.value-(positionsValue+terminalCash))>0.01)errors.push("portfolio NAV does not reconcile to holdings plus cash");
 const flows=externalFlows(events,terminal,{complete:ledger.ready});
 if(!flows.ready)errors.push(...flows.errors);
 let rate=null;
 if(!errors.length){rate=xirr(flows.flows);if(rate===null)errors.push("XIRR undefined or ambiguous");}
 let twr=null;
 if(navVerified&&errors.length===0&&Array.isArray(valuations)&&valuations.length>=2){
  const ordered=[...valuations].sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
  const first=ordered[0],last=ordered[ordered.length-1];
  if(first?.date!==events.filter(e=>e.type==="deposit").map(e=>e.date).sort()[0])errors.push("opening NAV must match first deposit date");
  if(ordered.some(p=>!p||!Number.isFinite(p.value)||p.value<0||!Number.isFinite(p.externalFlow)||typeof p.date!=="string"))errors.push("invalid NAV records");
  if(new Set(ordered.map(p=>p?.date)).size!==ordered.length)errors.push("duplicate NAV dates");
  if(!first||!last||last.date!==terminal.date||!Number.isFinite(last.value)||Math.abs(last.value-terminal.value)>0.01)errors.push("TWR ending valuation differs from verified terminal NAV");
  if(first&&!(Number.isFinite(first.value)&&first.value>0))errors.push("TWR opening NAV unverified");
  const navDates=new Set(ordered.map(p=>p?.date));
  for(const e of events)if((e.type==="deposit"||e.type==="withdrawal")&&!navDates.has(e.date))errors.push("external cashflow date lacks contemporaneous NAV");
  const movementByDay=new Map();
  for(const e of events){if(e.type==="deposit"||e.type==="withdrawal")movementByDay.set(e.date,(movementByDay.get(e.date)||0)+(e.type==="deposit"?e.amount:-e.amount));}
  for(let i=1;i<ordered.length;i++){
   const p=ordered[i],previous=ordered[i-1];
   if(!p||!previous||typeof p.date!=="string"||typeof previous.date!=="string")continue;
   let sum=0;for(const [date,amount] of movementByDay)if(date>previous.date&&date<=p.date)sum+=amount;
   if(!Number.isFinite(p.externalFlow)||Math.abs(p.externalFlow-sum)>0.01)errors.push("TWR external flows do not match dated cash movements");
  }
  if(!errors.length)twr=timeWeightedReturn(ordered);
  if(twr===null&&!errors.length)errors.push("TWR history invalid");
 }else errors.push("verified dated NAV history missing");
 return {ready:errors.length===0,xirr:rate,twr,errors,ledgerReady:ledger.ready};
}
module.exports={verifiedReturns};
