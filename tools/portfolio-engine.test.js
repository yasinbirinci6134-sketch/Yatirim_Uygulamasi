"use strict";
const assert=require("node:assert/strict");
const {summarizePortfolio}=require("./portfolio-engine");
const events=[
{id:"1",type:"deposit",amount:10000,date:"2026-01-01"},
{id:"2",type:"buy",amount:6000,date:"2026-01-02"},
{id:"3",type:"dividend",amount:125.25,date:"2026-02-01"},
{id:"4",type:"fee",amount:5.25,date:"2026-02-01"}
];
const p=summarizePortfolio({positions:[{code:"AAA",units:100,currentPrice:70,cost:6000}],events});
assert.equal(p.holdingsValue,7000);
assert.equal(p.cash,4120);
assert.equal(p.totalValue,11120);
assert.equal(p.equityGain,1120);
assert.equal(p.unrealizedPnL,1000);
assert.equal(p.dividends,125.25);
const w=summarizePortfolio({events:[{type:"deposit",amount:1000,date:"2026-02-01"},{type:"withdrawal",amount:300,date:"2026-02-02"}]});
assert.equal(w.netDeposits,700);assert.equal(w.equityGain,0);
const bad=summarizePortfolio({events:[{type:"deposit",amount:-5,date:"2026-02-01"}]});
assert.equal(bad.errors.length,1);
assert.deepEqual(events.map(x=>x.amount),[10000,6000,125.25,5.25]);
assert.ok(summarizePortfolio({events:[{type:"deposit",amount:5,date:"2026-02-30"}]}).errors.length>0,"invalid calendar date");
assert.ok(summarizePortfolio({events:[{id:"x",type:"deposit",amount:50,date:"2026-01-01"},{id:"x",type:"deposit",amount:50,date:"2026-01-02"}]}).errors.length>0,"duplicate event identifiers");
assert.ok(summarizePortfolio({events:[{type:"buy",amount:50,date:"2026-01-01"}]}).errors.length>0,"insufficient funding");
console.log("portfolio-engine tests passed");
