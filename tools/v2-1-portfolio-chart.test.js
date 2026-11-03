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
