"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
function extract(from,to){
  const a=html.indexOf(from),b=html.indexOf(to,a);
  assert.ok(a>=0&&b>a,"missing source: "+from);
  return html.slice(a,b);
}
const helpers=new Function(
  extract("function fpFundHistoryRows(","async function ltefas(")+
  extract("function fpFundArchiveEntries(","async function fhArchiveRefresh(")+
  ";return {fpFundHistoryRows,fpFundHistoryMerge,fpFundHistorySpan,fpFundArchiveEntries};")();
const ago=days=>new Date(Date.now()-days*86400000).toISOString().slice(0,10);
const full=[360,305,240,150,60,1].map((d,i)=>[ago(d),i+10]);
const archive={schema:1,source:"TEFAS",funds:{
  ALE:{source:"TEFAS",complete1y:true,h:full.slice(1)},
  TI1:{source:"TEFAS",complete1y:true,h:full.slice(3)},
  AFO:{source:"UNKNOWN",complete1y:true,h:full}
}};
assert.deepEqual(Object.keys(helpers.fpFundArchiveEntries(archive,["ALE","TI1","AFO"])),["ALE"],
 "only checked TEFAS data with a real 300+ day span may be marked complete");
assert.deepEqual(helpers.fpFundArchiveEntries({...archive,schema:9},["ALE"]),{},"reject unknown schema");
assert.deepEqual(helpers.fpFundArchiveEntries({...archive,source:"GUESS"},["ALE"]),{},"reject unverified data source");
let saves=0,renders=0,calls=0;
const FH={d:{ALE:{version:2,at:1,h:[full[0]]}},busy:false,archiveAt:0,archiveFailAt:0,
 archivePromise:null,archiveBusy:false,archiveErr:null};
const S={market:{funds:[{code:"ALE"},{code:"TI1"}]},det:{t:"f",c:"ALE"}};
const source=extract("async function fhArchiveRefresh(","async function fhRefresh(");
const fetcher=new Function("FH","LIVE","S","nget","fpFundArchiveEntries","fpFundHistoryRows",
 "fpFundHistoryMerge","fhSave","drawDetail",source+";return fhArchiveRefresh;")(
 FH,{ok:()=>true},S,async()=>{
  calls++;return {ok:true,code:200,body:JSON.stringify(archive)};
 },helpers.fpFundArchiveEntries,helpers.fpFundHistoryRows,helpers.fpFundHistoryMerge,
 ()=>{saves++},()=>{renders++});
(async()=>{
  await Promise.all([fetcher(),fetcher()]);
  assert.equal(calls,1,"concurrent calls should share a single archive download");
  assert.equal(FH.d.ALE.h[0][0],full[0][0],"older real price before archive range must survive");
  assert.equal(FH.d.ALE.h.at(-1)[0],full.at(-1)[0],"newest source price must be added");
  assert.equal(FH.d.ALE.version,2);
  assert.ok(saves>=1&&renders>=1,"persist archive and refresh open detail");
  await fetcher();
  assert.equal(calls,1,"warm cache must avoid additional downloads");
  const saved=JSON.stringify(FH.d);
  const fail=new Function("FH","LIVE","S","nget","fpFundArchiveEntries","fpFundHistoryRows",
   "fpFundHistoryMerge","fhSave","drawDetail",source+";return fhArchiveRefresh;")(
   FH,{ok:()=>true},S,async()=>{throw Error("offline");},
   helpers.fpFundArchiveEntries,helpers.fpFundHistoryRows,helpers.fpFundHistoryMerge,
   ()=>{throw Error("offline must not save over good data")},()=>{});
  FH.archiveAt=0;
  await fail(true);
  assert.equal(JSON.stringify(FH.d),saved,"failed fetch must preserve all historical prices");
  assert.ok(FH.archiveErr&&FH.archiveFailAt>0,"failures should be visible and throttled");
  assert.ok(html.includes('fhArchiveRefresh(force).then(()=>fhRefresh(code))'),
   "opening a fund must prefer shared verified history before direct TEFAS fallback");
  assert.ok(html.includes('data-fh-retry'),"one-tap retry must remain available");
  console.log("Shared 12-month TEFAS archive, offline fallback, integrity and cache tests passed");
})().catch(e=>{console.error(e);process.exitCode=1});
