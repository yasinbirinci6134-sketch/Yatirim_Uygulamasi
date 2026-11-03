"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const start=html.indexOf("function fpFundHistoryRows("),end=html.indexOf("async function ltefas(",start);
assert.ok(start>0&&end>start,"historical price cleaning and merging must be present");
const f=new Function(html.slice(start,end)+";return {fpFundHistoryRows,fpFundHistoryMerge,fpFundHistorySpan};")();
const older=[["2025-11-04",10],["2025-12-11",11],["2026-09-17",16]];
const current=[["2026-09-18",17],["2026-11-02",21],["2026-09-18",17.5]];
assert.deepEqual(f.fpFundHistoryMerge(older,current),[
 ["2025-11-04",10],["2025-12-11",11],["2026-09-17",16],["2026-09-18",17.5],["2026-11-02",21]],
 "18 September boundary must not truncate older verified fund prices");
assert.ok(f.fpFundHistorySpan(f.fpFundHistoryMerge(older,current))>=300,"one-year series should retain its range");
assert.deepEqual(f.fpFundHistoryMerge(older,[]),older,"empty downloads must preserve prior values");
assert.deepEqual(f.fpFundHistoryRows([["2026-02-30",3],["2026-09-18",19],["bad",12],["2026-09-20",-3],["2031-02-02",20]]),
 [["2026-09-18",19]],"invalid and future fund prices cannot be plotted");
assert.ok(html.includes('data-fh-retry'),"users need a history download retry");
assert.ok(html.includes('if(t==="f")fhEnsure(c);'),"opening a fund must request its history");
assert.ok(html.includes('version:2,at:Date.now(),h:fpFundHistoryMerge(previous,h)'),"history must be preserved on refresh");
console.log("TEFAS one-year fund price history integrity tests passed");