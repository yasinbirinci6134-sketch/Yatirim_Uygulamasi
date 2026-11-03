"use strict";
const assert=require("node:assert/strict");
const {validateShortScan}=require("./data-quality");
const baseDate="2026-11-02";
const items=Array.from({length:50},(_,i)=>({code:"X"+String(i).padStart(3,"0"),price:50+i,d1:i%2?1.5:-1.2,score:50,date:baseDate,f:{momentum:0.5}}));
const make=()=>({at:"2026-11-02T18:15:00.000Z",asOf:baseDate,n:50,xu:{price:10961.67,date:baseDate},items:structuredClone(items)});
const now=new Date("2026-11-03T07:00:00Z");
const check=(edit)=>{const a=make();edit(a);return validateShortScan(a,now)};
assert.equal(validateShortScan(make(),now).ok,true,"valid BIST daily scan should pass");
for(const [name,mutate] of [
 ["missing price change",x=>delete x.items[0].d1],
 ["duplicate ticker",x=>x.items[1].code=x.items[0].code],
 ["zero stock price",x=>x.items[3].price=0],
 ["missing benchmark",x=>delete x.xu],
 ["benchmark date mismatch",x=>x.xu.date="2026-10-30"],
 ["future stock date",x=>x.items[0].date="2026-11-03"],
 ["invalid calendar date",x=>x.items[0].date="2026-11-31"],
 ["future scan date",x=>x.asOf="2026-11-04"],
 ["stale generated scan",x=>x.at="2026-11-12T18:15:00.000Z"],
 ["old quote over seven days",x=>x.items[0].date="2026-10-01"],
 ["mostly stale stocks",x=>x.items.slice(0,12).forEach(a=>a.date="2026-10-31")],
 ["missing features",x=>x.items[0].f={} ],
 ["non-integer score",x=>x.items[0].score=85.5],
 ["count mismatch",x=>x.n=60],
 ["stale index",x=>x.xu.date="2026-10-30"]
])assert.equal(check(mutate).ok,false,name+" must fail");
assert.equal(validateShortScan(make(),new Date("2026-11-16T00:00:00Z")).ok,false,"stale mobile cache must be flagged");
const allowed=make();allowed.items.slice(0,9).forEach(x=>x.date="2026-10-30");
assert.equal(validateShortScan(allowed,now).ok,true,"limited older quotes may coexist with the main trading date");
console.log("data-quality tests passed");
