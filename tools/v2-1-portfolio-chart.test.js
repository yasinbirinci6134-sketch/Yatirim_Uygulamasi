"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const a=html.indexOf("function fpPortChartRows("),b=html.indexOf("function fpPortChart(id)",a);
assert.ok(a>=0&&b>a,"portfolio chart row validation must exist");
const clean=new Function(html.slice(a,b)+";return fpPortChartRows;")();
const rows=[
 {day:"2026-10-02",value:200,cost:150,priced:true},
 {day:"2026-10-01",value:100,cost:90,priced:true},
 {day:"2026-10-02",value:205,cost:150,priced:true},
 {day:"2026-02-30",value:1,priced:true},
 {day:"2032-01-01",value:1,priced:true},
 {day:"2026-10-03",value:-3,priced:true},
 {day:"2026-10-04",value:5,priced:false}
];
assert.deepEqual(clean(rows).map(x=>[x.day,x.value]),[["2026-10-01",100],["2026-10-02",205]]);
assert.deepEqual(clean(null),[]);
console.log("2.1 portfolio chart snapshots: ordered, deduplicated, valid and verified");


// Portfolio usability: summary -> holdings -> advanced tools.
const renderStart=html.indexOf("function renderSanal(){");
const renderEnd=html.indexOf("\nfunction ",renderStart+10);
const render=html.slice(renderStart,renderEnd);
const summary=render.indexOf('<section class="card pfhero">');
const positions=render.indexOf('<section class="card pf-positions">');
const audit=render.indexOf('\u0024{closedAudit.missing?',summary);
const chart=render.indexOf('<h2>Portföy değer geçmişi</h2>');
const cash=render.indexOf('\u0024{cashCard}',summary);
const advanced=render.indexOf('\u0024{legacyAuditCard}',summary);
assert.ok(renderStart>0&&renderEnd>renderStart,"portfolio renderer found");
assert.ok(summary>=0&&positions>summary&&audit>positions&&chart>audit&&cash>positions&&advanced>positions,
  "portfolio summary -> positions -> advanced features");
assert.equal(render.split('<section class="card pf-positions">').length-1,1,"one holdings card");
assert.match(render,/id="goAdd"/,"add holding button retained");
assert.match(render,/rows\.length \? groupRows\(rows\)\.map/,"existing holdings and lots retained");
assert.match(render,/closed\.length \?/,"closed trades remain available");
const layoutStart=html.indexOf("function applyLayout(tab){");
const layoutEnd=html.indexOf("function applyTabs(){",layoutStart);
const layout=html.slice(layoutStart,layoutEnd);
assert.match(layout,/if\(tab==="sanal"\)\{/,"portfolio layout override applies to saved orders");
assert.match(layout,/summary\.after\(positions\)/,"saved layout cannot push holdings below advanced tools");
assert.match(layout,/positions\.hidden=false/,"holdings visible despite previous hidden-card preference");
console.log("2.1 portfolio overview -> positions ordering passed");
