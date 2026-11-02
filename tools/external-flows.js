"use strict";
/* Construct external investor flows separately from buys, sells, dividends, fees.
   Dates validated strictly; all figures in TRY. Returns are withheld unless
   the portfolio explicitly carries a COMPLETE external-funding ledger. */
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function validDate(s){if(!DATE.test(s||""))return false;const d=new Date(s+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
function externalFlows(events,terminal,{complete=false}={}){
 const errors=[];
 if(!complete) errors.push("external funding ledger not marked complete");
 if(!terminal||!validDate(terminal.date)||!(Number.isFinite(terminal.value)&&terminal.value>=0))errors.push("invalid terminal valuation");
 const investor=[];
 if(!Array.isArray(events))return {ready:false,errors:["cash movements must be an array"],flows:[]};
 for(const e of events){
  if(!e||typeof e!=="object"){errors.push("invalid cash movement");continue;}
  if(!validDate(e.date)||!Number.isFinite(e.amount)||e.amount<=0){errors.push("invalid cash movement");continue;}
  if(e.type==="deposit")investor.push({date:e.date,amount:-e.amount});
  else if(e.type==="withdrawal")investor.push({date:e.date,amount:e.amount});
  else if(!["dividend","fee","buy","sell"].includes(e.type))errors.push("unknown event");
 }
 if(!investor.some(x=>x.amount<0))errors.push("no capital deposits");
 investor.sort((a,b)=>a.date.localeCompare(b.date));
 if(investor.length&&investor[0].amount>0)errors.push("withdrawal precedes first deposit");
 if(terminal&&validDate(terminal.date)&&investor.some(x=>x.date===terminal.date))errors.push("terminal date has external flows; intraday sequence unknown");
 if(terminal&&validDate(terminal.date)&&investor.some(x=>x.date>terminal.date))errors.push("cashflow after terminal valuation");
 if(investor.some(x=>x.amount<0)&&terminal&&validDate(terminal.date)&&!investor.some(x=>x.amount<0&&x.date<terminal.date))errors.push("no deposit prior to valuation");
 if(errors.length)return {ready:false,errors,flows:[]};
 return {ready:true,errors:[],flows:[...investor,{date:terminal.date,amount:terminal.value}]};
}
module.exports={externalFlows};
