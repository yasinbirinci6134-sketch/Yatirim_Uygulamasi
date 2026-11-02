"use strict";
/* Publish returns only after independent evidence and complete dated records.
   Evidence booleans must come from verification workflows, never legacy guesses. */
const {reconcileLedger}=require("./ledger-reconcile");
const {externalFlows}=require("./external-flows");
const {xirr}=require("./return-metrics");
const {timeWeightedReturn}=require("./twr");
function verifiedReturns({events=[],openingCash=0,terminalCash=null,terminal=null,positionsValue=null,ledgerEvidence={},valuations=[],navVerified=false}={}){
 const errors=[];
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
  twr=timeWeightedReturn(valuations);
  if(twr===null)errors.push("TWR history invalid");
 }else errors.push("verified dated NAV history missing");
 return {ready:errors.length===0,xirr:rate,twr,errors,ledgerReady:ledger.ready};
}
module.exports={verifiedReturns};
