"use strict";
/* Construct external investor flows separately from buys, sells, dividends, fees.
   Dates validated strictly; all figures in TRY. Returns are withheld unless
   the portfolio explicitly carries a COMPLETE external-funding ledger. */
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function externalFlows(events,terminal,{complete=false}={}){
 const errors=[];
 if(!complete) errors.push("external funding ledger not marked complete");
 if(!terminal||!DATE.test(terminal.date||"")||!(Number.isFinite(terminal.value)&&terminal.value>=0))errors.push("invalid terminal valuation");
 const investor=[];
 for(const e of events||[]){
  if(!DATE.test(e.date||"")||!Number.isFinite(e.amount)||e.amount<=0){errors.push("invalid cash movement");continue;}
  if(e.type==="deposit")investor.push({date:e.date,amount:-e.amount});
  else if(e.type==="withdrawal")investor.push({date:e.date,amount:e.amount});
  else if(!["dividend","fee","buy","sell"].includes(e.type))errors.push("unknown event");
 }
 if(!investor.some(x=>x.amount<0))errors.push("no capital deposits");
 if(errors.length)return {ready:false,errors,flows:[]};
 return {ready:true,errors:[],flows:[...investor,{date:terminal.date,amount:terminal.value}]};
}
module.exports={externalFlows};
