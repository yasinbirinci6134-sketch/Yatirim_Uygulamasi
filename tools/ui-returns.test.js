"use strict";
const assert=require("node:assert/strict");
const {fpComputeImportedReturns:compute}=require("./ui-returns");
const data={source:{institution:"Örnek Aracı Kurum",reference:"Kurum-2025-01"},openingCash:0,terminalCash:200,positionsValue:900,
 terminal:{date:"2026-01-01",value:1100},events:[
 {id:"d",reference:"ekstre-deposit",date:"2025-01-01",type:"deposit",amount:1000},
 {id:"b",reference:"ekstre-buy",date:"2025-01-02",type:"buy",amount:800}],
 valuations:[{date:"2025-01-01",value:1000},{date:"2026-01-01",value:1100}]};
const audit={issues:[],candidates:[{id:"lot:buy",date:"2025-01-02",type:"buy",amount:800}]};
const cash=[{id:"cf",date:"2025-01-01",type:"deposit",amount:1000}];
const run=(d=data,a=audit,c=cash,holdings=900)=>compute(d,a,c,holdings,"2026-01-01");
const ok=run();
assert.equal(ok.ledgerReady,true);
assert.ok(Math.abs(ok.xirr-0.10006965697)<1e-7);
assert.ok(Math.abs(ok.twr-0.1)<1e-9);
assert.equal(run({...data,terminalCash:150}).ledgerReady,false);
assert.equal(run({...data,openingCash:100}).xirr,null,"opening capital is not part of XIRR flows");
assert.equal(run({...data,terminal:{date:"2026-12-01",value:1100}}).ledgerReady,false,"future terminal must be rejected");
assert.equal(run({...data,events:[...data.events,{id:"after",reference:"r4",type:"fee",date:"2026-02-01",amount:1}]}).ledgerReady,false,"events after terminal NAV must be rejected");
assert.equal(run({...data,source:null}).xirr,null);
assert.equal(run({...data,events:[...data.events,{id:"fee",reference:"r3",type:"fee",date:"2025-06-01",amount:1}]}).ledgerReady,false);
assert.equal(run(data,{...audit,issues:["incomplete trade"]}).xirr,null);
assert.equal(run(data,audit,cash,800).ledgerReady,false);
assert.equal(run({...data,valuations:[data.valuations[0],{date:"2026-01-01",value:1100,externalFlow:10}]}).twr,null);
assert.equal(run({...data,valuations:[]}).twr,null);
assert.ok(run({...data,valuations:[]}).xirr!==null);
assert.equal(run({...data,events:[...data.events,data.events[0]]}).ledgerReady,false);
assert.equal(run({...data,events:data.events.map(e=>({...e,reference:""}))}).ledgerReady,false);
console.log("imported statement returns tests passed");
