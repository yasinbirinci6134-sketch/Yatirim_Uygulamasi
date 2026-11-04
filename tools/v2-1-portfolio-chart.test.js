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
assert.match(layout,/manager&&!manager\.classList\.contains\("closed"\)/,"visible portfolio chooser stays below overview");
const binderStart=html.indexOf("function bindPf(pf){");
const binderEnd=html.indexOf("\nfunction ",binderStart+10);
const binder=html.slice(binderStart,binderEnd);
assert.match(binder,/if\(S\.pfOpen\)summary\?\.after\(manager\)/,"opening portfolio picker moves chooser into view");
assert.match(binder,/else positions\?\.after\(manager\)/,"closing chooser restores holdings-first view");
console.log("2.1 portfolio overview -> positions ordering passed");


// Optional portfolio tools: collapsed by default, with readable descriptions.
// All buttons and calculations remain in the DOM after collapsing the extras.
const extrasBegin=render.indexOf('<details class="pf-extras" id="pfExtras"');
const closedTrades=render.indexOf('<h2>Kapanan işlemler</h2>');
const extrasEnd=render.indexOf('</details>',extrasBegin);
const plan=render.indexOf('id="planBox"',extrasBegin);
assert.ok(positions>=0&&closedTrades>positions&&extrasBegin>closedTrades&&extrasEnd>extrasBegin,
  "holdings and closed trades come before advanced features");
assert.ok(plan>extrasBegin&&plan<extrasEnd,"optional action plan lives inside extras");
assert.match(render,/id="pfExtras"\$\{S\.pfExtrasOpen\?" open":""\}/,
  "advanced features remember expanded state during rerender and start closed");
assert.match(render,/addEventListener\("toggle", e=>\{ S\.pfExtrasOpen=e\.currentTarget\.open; \}\)/,
  "expansion state tracks native details toggle");
for(const id of ["pfCashAdd","pfReturnImport","pfAuditShare","pfNoteAdd","planBox"]){
  assert.ok(render.includes(id),"existing advanced control preserved: "+id);
}
for(const label of ["Diğer araçlar","Elindeki varlıkların zaman içindeki değeri",
  "Para yatırma, çekme, temettü ve komisyon","Eski işlemlerde eksik",
  "Alım veya satış yaparken nedenini","Ekstren varsa yatırım getirini",
  "Tek bir varlığa fazla para"]){
  assert.ok(render.includes(label),"plain-language description preserved: "+label);
}
assert.match(layout,/if\(extras\) extras\.hidden=false/,
  "saved card visibility preferences do not hide optional tools entry");
console.log("2.1 optional portfolio tools and descriptions passed");
