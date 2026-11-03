"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length>=3);
for(const [i,s] of scripts.entries())new vm.Script(s[1],{filename:"ui/index.html:script"+i});
const start=html.indexOf("function fpSignalResults("),end=html.indexOf("\nfunction fpScoreDiary()",start);
assert.ok(start>0&&end>start);
const score=new Function(html.slice(start,end)+";return fpSignalResults;")();
const snaps=Array.from({length:6},(_,i)=>({at:"2026-11-"+String(i+1).padStart(2,"0"),xu:100+i*2,items:[{code:"ABC",score:90,price:100+i*4},{code:"DEF",score:40,price:50+i}]}));
const out=score(snaps,5);
assert.equal(out.count,1);assert.equal(out.positive,1);assert.ok(Math.abs(out.avg-20)<1e-7);
assert.ok(Math.abs(out.relativeAvg-10)<1e-7);
assert.equal(score(snaps.slice(0,5),5).count,0);
const repeated=[{...snaps[0],at:"2026-11-01T00:00:00Z",asOf:"2026-11-01"},
 {...snaps[0],at:"2026-11-01T12:00:00Z",asOf:"2026-11-01"},...snaps.slice(1).map(x=>({...x,asOf:x.at}))];
assert.equal(score(repeated,5).count,1,"same-day rescans must not advance a five-trading-day backtest");
assert.equal(score(snaps,0).count,0,"invalid hold durations must not produce a backtest");
assert.equal(score(snaps.map(x=>({...x,items:x.items.map(y=>({...y,score:NaN}))})),5).count,0,"non-finite score cannot count as a signal");
assert.equal(score(snaps.map(x=>({...x,asOf:x.at,items:x.items.map(y=>({...y,date:"2026-10-01"}))})),5).count,0,"stale stock prices are not valid entry or exit observations");
const historyStore=new Map();
const {validateShortScan}=require("./data-quality");
const historyApi=new Function("localStorage","validateShortScan",html.slice(html.indexOf('const FP_HIST_KEY='),html.indexOf('function fpSignalResults('))+";return {fpHistory,fpSaveScanHistory};")({getItem:k=>historyStore.get(k)||null,setItem:(k,v)=>historyStore.set(k,v)},validateShortScan);
const itemsForHistory=Array.from({length:50},(_,i)=>({code:"A"+String(i).padStart(3,"0"),score:81,price:10,d1:1,f:{momentum:0.5},date:"2026-11-01"}));
const scanFor=(date,at,prices=itemsForHistory)=>({at,asOf:date,n:prices.length,xu:{price:100,date},items:prices});
historyApi.fpSaveScanHistory(scanFor("2026-11-01","2026-11-01T18:00:00Z"));
historyApi.fpSaveScanHistory(scanFor("2026-11-01","2026-11-01T20:00:00Z"));
assert.equal(historyApi.fpHistory().length,1,"same market day must be stored once");
historyApi.fpSaveScanHistory(scanFor("2026-11-02","2026-11-02T18:00:00Z",itemsForHistory.map(x=>({...x,date:"2026-11-02",score:NaN}))));
assert.equal(historyApi.fpHistory().length,1,"invalid scan scores must not become audited history");
const qaSource=fs.readFileSync(path.join(__dirname,"data-quality.js"),"utf8").trim().replace("module.exports={validateShortScan};",'if(typeof module!=="undefined"&&module.exports)module.exports={validateShortScan};');
const embeddedStart=html.indexOf('/* Publication + mobile cache gate for BIST daily scans.');
const embeddedEnd=html.indexOf('const SH={',embeddedStart);
assert.ok(embeddedStart>0&&embeddedEnd>embeddedStart);
assert.equal(html.slice(embeddedStart-14,embeddedEnd).trim(),qaSource,"mobile and scan publisher must share quality gates");
assert.ok(html.includes("if(j&&validateShortScan(j).ok&&"),"unverified fetched scans must not enter mobile cache");

const shortContext=new Function("localStorage","validateShortScan",html.slice(html.indexOf('const SH={',html.indexOf('/* Publication + mobile cache gate for BIST daily scans.')),html.indexOf('async function lpool(',html.indexOf('/* Publication + mobile cache gate for BIST daily scans.')))+";return {SH,fpShortFresh,shortFor};");
const localCache={getItem:key=>key==="fp-short"?JSON.stringify({at:"2020-02-01T18:00:00Z",asOf:"2020-02-01",n:50,items:[]}):null};
const state=shortContext(localCache,validateShortScan);
assert.equal(state.fpShortFresh(),false,"stale initial cache must be explicitly invalidated");
assert.equal(state.shortFor("A000"),null,"stale cached data cannot emit an actionable score");
const localDay=new Date(Date.now()+3*3600000).toISOString().slice(0,10);
state.SH.d={at:new Date().toISOString(),asOf:localDay,n:50,xu:{price:100,date:localDay},
 items:itemsForHistory.map(x=>({...x,date:localDay}))};
assert.equal(state.fpShortFresh(),true,"new valid feed should replace stale cached status");
assert.equal(state.shortFor("A000").score,81,"fresh score should remain available");
assert.ok(html.includes("Kısa vade taraması güncel değil"),"mobile UI must warn about stale scans");
assert.ok(html.includes("!fpShortFresh()||String(j.at)>="),"bad cached timestamps must not block valid new feeds");
assert.ok(html.includes("&&fpShortFresh()&&Array.isArray(SH.d?.items)"),"stale scans must not trigger strong/weak prefetch");
const auditStart=html.indexOf("function fpLegacyAudit("),auditEnd=html.indexOf("function renderSanal()",auditStart);
assert.ok(auditStart>0&&auditEnd>auditStart);
const audit=new Function(html.slice(auditStart,auditEnd)+";return fpLegacyAudit;")();
const review=audit([{id:"one",code:"ABC",amount:100,price:10,buyDate:"2026-01-01",status:"closed",sellPrice:12,sellDate:"2026-02-01"}]);
assert.deepEqual(review.candidates.map(x=>x.amount),[100,120]);
assert.equal(review.verified,false);
assert.equal(audit([{id:"bad",amount:20,buyDate:"2026-02-30"}]).issues.length,1);
assert.ok(html.includes("${legacyAuditCard}"));
assert.ok(html.includes("const returnRequirements=["),"return readiness checklist should render");
assert.ok(html.includes("Ekstre nakit mutabakatı"),"external statement reconciliation must be visible");
assert.ok(html.includes("Pozisyon grafiği nakit içermiyor"),"do not mislabel position-only chart as verified NAV");
const repStart=html.indexOf("function fpAuditReport("),repEnd=html.indexOf("function renderSanal()",repStart);
assert.ok(repStart>0&&repEnd>repStart);
const report=new Function(html.slice(repStart,repEnd)+";return fpAuditReport;")();
const txt=report("Örnek",{candidates:[{id:"x",type:"buy",date:"2026-01-01",amount:100}],issues:["Kontrol bekliyor"]},[]);
assert.ok(txt.includes("BANKA DOĞRULAMASI YOK"));
assert.ok(txt.includes("100.00"));
assert.ok(html.includes('id="pfAuditShare"'));
const {auditLegacyTrades}=require("./legacy-trade-audit");
for(const tradeSet of [
 [{id:"a",amount:100,price:10,buyDate:"2026-01-01",status:"closed",sellPrice:12,sellDate:"2026-02-01"}],
 [{id:"a",amount:100,buyDate:"2026-02-30"}],
 [{id:"a",amount:100,price:10,buyDate:"2026-02-02",status:"closed",sellPrice:12,sellDate:"2026-02-01"}],
 [{id:"a",amount:100,buyDate:"2026-01-01"},{id:"a",amount:120,buyDate:"2026-01-02"}]
]){
 const uiAudit=audit(tradeSet),engineAudit=auditLegacyTrades(tradeSet);
 assert.deepEqual(uiAudit.candidates.map(x=>[x.type,x.date,Math.round(x.amount*100)]),
  engineAudit.candidates.map(x=>[x.type,x.date,Math.round(x.amount*100)]),
  "UI and reconciliation engine candidate totals must agree");
 assert.equal(uiAudit.verified,false);
}
const sourceReturns=fs.readFileSync(path.join(__dirname,"ui-returns.js"),"utf8").trim();
const inlineStart=html.indexOf("/* Browser and Node shared audit");
const inlineEnd=html.indexOf('"use strict";'+String.fromCharCode(10)+'/* Strict, all-or-nothing conversion',inlineStart);
assert.ok(inlineStart>0&&inlineEnd>inlineStart);
assert.equal(html.slice(inlineStart,inlineEnd).trim(),sourceReturns,"WebView and test engine must use identical return calculator");
assert.ok(html.includes('id="pfReturnImport"'),"evidence import control must be visible");
assert.ok(html.includes('id="pfEvidenceSave"'),"statement importer must permit explicit save");
assert.ok(html.includes("fpComputeImportedReturns(statementData"),"portfolio screen must call return engine");
const draftStart=html.indexOf("function fpStatementDraft(");
const draftEnd=html.indexOf("function fpReturnEvidenceSheet(",draftStart);
assert.ok(draftStart>0&&draftEnd>draftStart);
const makeDraft=new Function(html.slice(draftStart,draftEnd)+";return fpStatementDraft;")();
const sampleTrades={candidates:[{type:"buy",date:"2025-01-02",amount:120}],issues:[]};
const sampleFlows=[{type:"deposit",date:"2025-01-01",amount:200}];
const draft=makeDraft(sampleTrades,sampleFlows);
assert.deepEqual(draft.events.map(e=>e.type),["deposit","buy"]);
assert.deepEqual(draft.events.map(e=>e.amount),[200,120]);
assert.ok(draft.events.every(e=>e.reference===""),"draft event references cannot be fabricated");
assert.equal(draft.source.institution,"");
assert.equal(draft.openingCash,null);
assert.equal(draft.positionsValue,null);
assert.equal(draft.valuations.length,0);
assert.ok(html.includes('id="pfEvidenceDraft"'));
assert.deepEqual(sampleTrades.candidates,[{type:"buy",date:"2025-01-02",amount:120}],"draft must not mutate trades");
assert.ok(html.includes("statementIsHistorical"),"returns must identify historical valuations");
assert.ok(html.includes("Bu geçmiş tarihli getiri hesabıdır"),"stale returns cannot look current");
assert.ok(html.includes("İşlem eşleştirmesi"),"legacy trades must be presented as matched when reconciled");
assert.ok(html.includes("TWR verisi değildir"),"position-only historical chart is not total NAV");
const trustedStart=html.indexOf("function fpTrustedHoldingsValue(");
const trustedEnd=html.indexOf("function fpReturnEvidenceSheet(",trustedStart);
assert.ok(trustedStart>0&&trustedEnd>trustedStart);
const trusted=new Function(html.slice(trustedStart,trustedEnd)+";return fpTrustedHoldingsValue;")();
const dated={value:300,quoteSource:"live",curDate:"2026-11-03"};
assert.equal(trusted([dated],"2026-11-03"),300);
assert.ok(Number.isNaN(trusted([{...dated,quoteSource:"none"}],"2026-11-03")));
assert.ok(Number.isNaN(trusted([{...dated,curDate:null}],"2026-11-03")));
assert.ok(Number.isNaN(trusted([{...dated,curDate:"2026-10-25"}],"2026-11-03")));
assert.equal(trusted([{...dated,curDate:"2026-10-27"}],"2026-11-03"),300);
assert.ok(Number.isNaN(trusted([{...dated,curDate:"2026-11-04"}],"2026-11-03")));
assert.equal(trusted([],"2026-11-03"),0);
assert.ok(html.includes("fpComputeImportedReturns(statementData,legacyAudit,cashflows,trustedHoldings"));
assert.ok(html.includes("x.priced===true"),"legacy position snapshots must not pose as verified quotes");
assert.ok(html.includes("if(Number.isFinite(snapshotVal))fpPortSnapshot"),"only externally priced holdings should be recorded");
assert.ok(html.includes("Bu bir TWR/NAV grafiği değildir"),"position charts must distinguish from return metrics");
const chartStart=html.indexOf('const FP_PFV_KEY=');
const chartEnd=html.indexOf('/* Browser and Node shared audit',chartStart);
assert.ok(chartStart>0&&chartEnd>chartStart);
const db=new Map(),localStorage={getItem:key=>db.get(key)||null,setItem:(key,val)=>db.set(key,val)};
const chart=new Function("localStorage","esc",html.slice(chartStart,chartEnd)+";return {fpPortSeries,fpPortSnapshot,fpPortChart};")(localStorage,x=>String(x));
const yday=new Date(Date.now()+3*3600e3-86400000).toISOString().slice(0,10);
const today=new Date(Date.now()+3*3600e3).toISOString().slice(0,10);
db.set("fp-v2-portfolio-values",JSON.stringify({p:[
 {day:"2026-01-01",value:999999,cost:30}, // old values are retained, never certified
 {day:yday,value:100,cost:80,priced:true}
]}));
chart.fpPortSnapshot("p",120,80);
const history=chart.fpPortSeries().p;
assert.ok(history.some(x=>x.day==="2026-01-01"),"legacy history must be preserved");
assert.ok(history.some(x=>x.day===today&&x.priced===true),"new snapshots must record pricing evidence");
const svg=chart.fpPortChart("p");
assert.ok(svg.includes("<svg"),"two priced points should render the position chart");
assert.ok(!svg.includes("2026-01-01"),"unverified historical price must be excluded");
assert.ok(svg.includes(yday)&&svg.includes(today),"graph must show trusted price dates");
const csvSource=fs.readFileSync(path.join(__dirname,"statement-csv.js"),"utf8").trim();
const csvInline=csvSource.replace("module.exports={fpParseStatementCsv,fpParseNavCsv};",'if(typeof module!=="undefined"&&module.exports)module.exports={fpParseStatementCsv,fpParseNavCsv};');
const csvStart=html.indexOf('/* Strict, all-or-nothing conversion');
const csvEnd=html.indexOf('const FP_IMPORT_KEY=',csvStart);
assert.ok(csvStart>0&&csvEnd>csvStart,"CSV import code must be bundled in WebView");
assert.equal(html.slice(csvStart-14,csvEnd).trim(),csvInline,"bundled CSV engine must match tested source");
assert.ok(html.includes('id="pfCsvApply"'));
assert.ok(html.includes('id="pfNavApply"'));
assert.ok(html.includes('id="pfNavCsvFile"'));
assert.ok(html.includes("fpParseNavCsv(get("));

assert.ok(html.includes('id="pfCsvFile"'));
assert.ok(html.includes('get("pfCsvFile").onchange=async()=>'));
assert.ok(html.includes('file.size>250000'));
assert.ok(html.includes('get("pfCsvText").value=raw'));

console.log("UI scripts and score-history tests passed");
